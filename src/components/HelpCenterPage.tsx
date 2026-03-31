import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface HelpCenterPageProps {
  onNavigateToContactSupport?: () => void;
}

export function HelpCenterPage({ onNavigateToContactSupport }: HelpCenterPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I create my first automated search?",
      answer: "To create an automated search: 1) Go to Search Listings and enter your criteria (location, property type, price range, etc.). 2) Click 'Save Search' at the bottom of the results. 3) In the modal, toggle 'Automated Search' to ON and select your preferred frequency (Daily, Weekly, or Monthly). 4) Your search will now run automatically and you'll receive email notifications when new properties match your criteria."
    },
    {
      question: "What happens if I reach my plan limits?",
      answer: "If you reach your monthly listing limit, new listings won't be synced until your next billing cycle. We'll notify you at 75% and 90% usage. To continue, you can upgrade your plan for more capacity or wait for your monthly limit to reset."
    },
    {
      question: "How is my usage calculated?",
      answer: "Usage is tracked based on two metrics: 1) Active Searches - Each saved search (automated or manual) counts toward your plan's search limit. 2) Listings Synced - Each property listing retrieved counts as one listing. Your plan includes a monthly allowance for both. You can monitor your usage anytime on your Billing page."
    },
    {
      question: "Can I export my search data?",
      answer: "Yes! All searches can be exported in multiple formats. Go to Listings > History, click on any saved search, then select the 'Download' tab. You can export as CSV (for Excel/Sheets), PDF (for presentations), or JSON (for developers). Historical data is also available for download from previous runs."
    },
    {
      question: "How do automated searches work?",
      answer: "Automated searches run on your chosen schedule (Daily, Weekly, or Monthly) and search for new properties matching your criteria. When new matches are found, you'll receive an email notification with a summary. The full results are available in your Saved Searches. You can pause or modify any automated search at any time."
    }
  ];

  const guides = [
    {
      title: "Creating Your First Search",
      description: "Search for new listings in your target market and get listing agent contact info in under 5 minutes.",
      steps: [
        "Click 'Listings' in the left navigation to open the Search Listings page",
        "Enter your target location — city, state, or ZIP code — in the location field",
        "Set your filters: property type, price range, bedrooms, bathrooms, and days on market",
        "Click 'Search' to run the search and see matching listings",
        "Review results — each row includes the property address, price, days on market, and listing agent contact info",
        "Click the save icon on any listing to bookmark it, or use 'Export CSV' to download all results",
        "To save your search criteria for later, click 'Save Search' and give it a name"
      ]
    },
    {
      title: "Setting Up Your First Automation",
      description: "Schedule a search to run automatically and push new listing data straight into your tools.",
      steps: [
        "Go to 'Automations' in the left navigation and click 'Create Automation'",
        "Name your automation and configure your search criteria — location, property type, price range, and any other filters",
        "Choose a schedule: Daily, Every 12 Hours, or Weekly",
        "Select a destination: choose your connected integration (HubSpot, Mailchimp, Google Sheets, Zapier, etc.) or CSV Download",
        "Click 'Save' — your automation is now active and will run on the schedule you chose",
        "View past runs any time under the 'History' tab in Automations",
        "Toggle an automation off at any time using the active/inactive switch on your automations list"
      ]
    },
    {
      title: "Connecting Your Workflow",
      description: "Push new listing data automatically into your CRM, email platform, or automation tools.",
      steps: [
        "Go to 'Account' → 'Integrations' tab to see all available integrations",
        "Click 'Connect' next to your preferred tool — HubSpot, Salesforce, Zoho CRM, Mailchimp, Constant Contact, SendGrid, Zapier, Make, n8n, or Webhook",
        "Follow the authorization flow — OAuth integrations (HubSpot, Salesforce, Mailchimp) will redirect you to authorize access; API key integrations (SendGrid, Zapier webhooks) will prompt you for your key or URL",
        "Once connected, the integration appears as 'Connected' in your integrations list",
        "Create or edit an automation and select your connected tool as the destination",
        "Each time the automation runs, new listing results — including agent contact info — are pushed directly to your chosen platform",
        "To disconnect or reconfigure an integration, click 'Manage' next to it in the Integrations tab"
      ]
    },
    {
      title: "Understanding Dashboard Metrics",
      description: "Make data-driven decisions with intelligent market insights.",
      steps: [
        "Navigate to your Dashboard after logging in",
        "Review the 6 key metric cards at the top",
        "Click any metric card to see detailed breakdowns and trends",
        "Market Temperature shows overall market health (Cold to Very Hot)",
        "Fresh Listings tracks new properties in the last 48 hours",
        "Price Movement indicates average price changes over 30 days",
        "Click the 'Expand' icon for charts and property lists"
      ]
    },
    {
      title: "Exporting and Sharing Reports",
      description: "Download your data in multiple formats for analysis or presentations.",
      steps: [
        "Go to Listings > History and select the search you want to export",
        "Click 'View/Edit' to open the search modal",
        "Switch to the 'Download' tab",
        "Choose your preferred format: CSV, PDF, or JSON",
        "For CSV: Open in Excel or Google Sheets for analysis",
        "For PDF: Perfect for client presentations or printing",
        "For JSON: Use with custom applications or integrations"
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="w-7 h-7 text-[#FFCE0A]" />
          <h1 className="font-bold text-[33px]">Help Center</h1>
        </div>
        <p className="text-gray-600 text-[15px]">
          Find answers and get support for your ListingBug account
        </p>
      </div>

      {/* FAQs Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-6 h-6 text-[#FFCE0A]" />
          <h2 className="font-bold text-[24px]">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <Collapsible
                open={openFaq === index}
                onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-bold text-[17px] text-left">
                        {faq.question}
                      </CardTitle>
                      {openFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 ml-4" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 leading-relaxed text-[15px]">
                      {faq.answer}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </section>

      {/* Getting Started Guides Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-[#FFCE0A]" />
          <h2 className="font-bold text-[24px]">Getting Started Guides</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {guides.map((guide, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="font-bold text-[17px]">
                  {guide.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 text-[15px]">
                  {guide.description}
                </p>
                <ol className="space-y-2 text-[14px] text-gray-700 dark:text-[#EBF2FA]/80">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3">
                      <span className="font-bold text-white bg-[#342e37] dark:bg-[#FFCE0A] dark:text-[#342e37] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[11px] mt-0.5">
                        {stepIndex + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-[#FFCE0A]" />
          <h2 className="font-bold text-[24px]">Need More Help?</h2>
        </div>
        <p className="text-gray-600 mb-6 text-[15px]">
          Can't find what you're looking for? Our support team is here to help you with any questions or issues.
        </p>
        <Button
          onClick={onNavigateToContactSupport}
          className="bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </section>
    </div>
  );
}