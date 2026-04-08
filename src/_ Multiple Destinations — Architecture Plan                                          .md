❯ we need to plan on this one... i'm thinking it would actually make more sense to     
allow users to choose multiple destinations for their automations... what does that    
look like? thee i know so far \- boolean selectors in the choose destination dropdown   
 in create automaiton subcomponent? updating tables to have room for up to ten         
destinations for each autoamtion (search and message, updating destination field in    
automation details modal to display multiple if there are, and the edit automation     
modal to allow multiple destination selections. but what about edge functions and      
other back end flows that i may not be thinking of?                                    
                                                                                       
⏺ Let me read the relevant files before planning.                                      
                                           
⏺ **Bash**(cd /Users/jake/ListingBug-main && cat supabase/migrations/\*.sql | grep \-A 30    
      "create table.\*automations")  
  ⎿  create table if not exists messaging\_automations (                                
       id uuid primary key default gen\_random\_uuid(),         
       user\_id uuid not null references auth.users(id) on delete cascade,              
     … \+36 lines (ctrl+o to expand)                           
                                                                                       
⏺ **Bash**(supabase db diff 2\>/dev/null || true && echo "---" && grep \-r "destination"  
      supabase/migrations/ | head \-30)                                                 
  ⎿  \---                                                                               
     supabase/migrations//002\_create\_suppression\_list.sql:-- Suppression list: e       
     mails that should never be synced to marketing destinations                       
                                                                                       
  Searched for **6** patterns, listed **1** directory (ctrl+o to expand)                       
                                                                                       
❯ continue                                                                             
                                                                                       
❯ please                                                                               
                                                                                       
  Read **1** file, listed **1** directory, queried Supabase (ctrl+o to expand)                 
                                                                                       
⏺ Good picture of the current state. Here's the full plan:                             
                                                                                       
  \---                                                                                  
  **Multiple Destinations — Architecture Plan**                                            
                                                                                       
  **The core problem with the current split**                                              
                                                                                       
  Right now you have two separate tables (automations for exports,                     
  campaign\_automations for messaging) and two separate run functions.                  
  Multi-destination is the natural forcing function to **unify these** — one automation    
  row, one run function, N destinations.                                               
                                                                                       
  \---                                                                                  
  **1\. Schema — Add destinations JSONB array to automations**                              
                                                           
  Rather than a junction table, a JSONB array is the right call here. Up to 10  
  destinations per automation is a trivially small array, no extra joins needed, and   
  RLS stays simple (inherited from the parent row).  
                                                                                       
  \-- New shape of each element:                               
  { "type": "mailchimp", "label": "Mailchimp", "config": { "list\_id": "..." } }        
  { "type": "campaign",  "label": "Send \\"Welcome\\"", "id":  
  "\<messaging\_automation\_id\>" }                                                        
                                                              
  Migration steps:                                                                     
  1\. Add destinations jsonb NOT NULL DEFAULT '\[\]' to automations  
  2\. Backfill existing rows: pack destination\_type/label/config into destinations\[0\]  
  3\. Migrate all campaign\_automations rows → new automations rows with                
  destinations\[0\].type \= 'campaign'                                                    
  4\. Drop campaign\_automations after validation                                        
  5\. Old single-destination columns can be removed in a follow-up migration            
                                                                                       
  \---                                                                                  
  **2\. Frontend — CreateAutomationPage**  
                                                                                       
  \- selectedDestination: string → selectedDestinations: DestinationEntry\[\]  
  \- Dropdown becomes a **checklist**: click an option to toggle it in/out; selected items  
   render as removable pills below the dropdown                                        
  \- canContinue requires selectedDestinations.length \>= 1  
  \- Auto-name: first destination name, or "N destinations" if multiple                 
  \- On save: one insert to automations with the full destinations array (no            
  campaign\_automations insert)  
                                                                                       
  \---                                                         
  **3\. Frontend — AutomationsManagementPage**  
                                                                                       
  \- Remove all isCampaign branching — everything lives in automations now  
  \- Icon column: render up to 3 small stacked icons (Search/Mail/Webhook) for each     
  destination type in the row                                                          
  \- handleRunNow always calls run-automation  
  \- handleToggleAutomation always targets automations                                  
                                                                                       
  \---  
  **4\. Automation Details Modal & Edit Modal**                                             
                                                              
  \- Destination field: list of \[icon\] Label badges, one per destination  
  \- Edit modal: same multi-select checklist UI as create, pre-populated from row's     
  destinations array                                                                   
                                                                                       
  \---                                                                                  
  **5\. Edge function — run-automation (the big one)**             
                                                                                       
  Current flow: read single destination\_type → handle one integration.  
                                                                                       
  New flow:                                                   
  load automation row                                                                  
  run RentCast search                                         
  write search\_run \+ search\_run\_listings  
  for each dest in automation.destinations:                                            
    if dest.type \=== 'campaign':                                                       
      fetch messaging\_automation(dest.id)                                              
      upsert contacts → add to list → if on\_sync, send via SendGrid                    
    else:                                                            
      existing export logic (Mailchimp, webhook, etc.)                                 
  update next\_run\_at                                          
                                                                                       
  The campaign logic from run-campaign-automation **moves into run-automation** as a       
  destination handler branch. Keep the separation clean with a                         
  handleCampaignDestination(dest, listings, userId) helper.                            
                                                                                       
  **Old columns fallback**: for rows that haven't been migrated yet, fall back to          
  destination\_type/config as a single-element destinations array — zero downtime  
  during rollout.                                                                      
                                                              
  \---  
  **6\. Deprecations (after validation)**  
                                      
  ┌────────────────────────────────────┬─────────────────────────────────────────┐  
  │                What                │                 Status                  │     
  ├────────────────────────────────────┼─────────────────────────────────────────┤  
  │ campaign\_automations table         │ Migrate data → drop                     │     
  ├────────────────────────────────────┼─────────────────────────────────────────┤  
  │ run-campaign-automation edge       │ Merge into run-automation → delete      │  
  │ function                           │                                         │     
  ├────────────────────────────────────┼─────────────────────────────────────────┤  
  │ run-due-campaign-automations edge  │ run-due-automations already covers all  │     
  │ function                           │ automations rows → delete               │  
  └────────────────────────────────────┴─────────────────────────────────────────┘     
                                                              
  \---  
  **What you'd have been missing without this plan**  
                                                                                       
  \- **The edge function unification** — without merging campaign logic into  
  run-automation, a multi-destination row that had both an export and a campaign       
  destination would need to call two separate functions       
  \- **The run-due cleanup** — run-due-campaign-automations becomes dead weight the moment  
   all rows live in automations                                                        
  \- **Backfill migration** — without it, existing single-destination rows would silently  
  have empty destinations arrays and stop running                                      
                                                              
  \---                                                                                  
  **Suggested implementation order**                              
                                  
  1\. DB migration (add column, backfill, migrate campaign\_automations)  
  2\. Update run-automation edge function (add destination loop \+ campaign branch)      
  3\. Update CreateAutomationPage (multi-select UI)  
  4\. Update AutomationsManagementPage (remove campaign branching, update icons)        
  5\. Update details/edit modals                                                        
  6\. Delete deprecated functions \+ table                                               
                                                                                       
  Does this match your thinking? Any concerns on the schema shape or the unification   
  approach before we start?  
