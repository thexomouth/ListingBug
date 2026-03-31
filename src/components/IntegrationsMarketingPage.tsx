import { 
  Zap,
  Mail,
  Database,
  FileSpreadsheet,
  MessageSquare,
  Webhook,
  CheckCircle2,
  Clock,
  Shield,
  Settings,
  RefreshCw,
  Link2,
  ArrowRight,
  Send,
  ListChecks,
  Sparkles
} from 'lucide-react';

interface IntegrationsMarketingPageProps {
  onNavigate?: (page: string) => void;
}

export function IntegrationsMarketingPage({ onNavigate }: IntegrationsMarketingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-[33px] px-[12px]">
        
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-7 h-7 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="mb-0 text-4xl font-bold text-[33px] dark:text-white">Integrations</h1>
          </div>
          <p className="text-gray-600 dark:text-[#EBF2FA] max-w-3xl leading-relaxed text-[14px] p-[0px]">
            Set it and forget it—Let ListingBug transfer data to the tools you use most, totally on autopilot.
            Connect your CRM, email marketing platform, spreadsheets, and more.
          </p>
          <p className="text-[14px] mt-2">
            <button
              onClick={() => onNavigate?.('integration-guide')}
              className="text-[#FFCE0A] hover:underline font-medium"
            >
              View our Setup &amp; Workflow Guide for step-by-step instructions to get started →
            </button>
          </p>
        </div>

        {/* Three-Step Process */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1: Connect Your Tools */}
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center mx-auto">
                  <Link2 className="w-8 h-8 text-[#342E37] dark:text-[#0F1115]" />
                </div>
              </div>
              <h2 className="mb-3 text-[21px] font-bold text-[#342E37] dark:text-white">
                Connect Your Tools
              </h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                Link your CRM, email platform, or spreadsheet with a few clicks—no coding required.
              </p>
            </div>

            {/* Step 2: Set Your Preferences */}
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center mx-auto">
                  <Settings className="w-8 h-8 text-[#342E37] dark:text-[#0F1115]" />
                </div>
              </div>
              <h2 className="mb-3 text-[21px] font-bold text-[#342E37] dark:text-white">
                Set Your Preferences
              </h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                Choose what data to sync, how often, and which fields to map—customize to your workflow.
              </p>
            </div>

            {/* Step 3: Automate Everything */}
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8 text-[#342E37] dark:text-[#0F1115]" />
                </div>
              </div>
              <h2 className="mb-3 text-[21px] font-bold text-[#342E37] dark:text-white">
                Automate Everything
              </h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                ListingBug handles the rest. Your data syncs automatically—no manual exports or imports.
              </p>
            </div>
          </div>
        </div>

        {/* Available Integrations */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-gray-900 dark:text-white mb-3 font-bold text-[27px]">
              Available Integrations
            </h2>
            <p className="text-gray-600 dark:text-[#EBF2FA] max-w-3xl mx-auto text-[15px]">
              Connect to these platforms today and start automating your workflow.
            </p>
          </div>

          {/* Desktop: 2-column layout with icons */}
          <div className="hidden md:grid md:grid-cols-2 gap-x-12 gap-y-8">
            
            {/* CRM Integrations */}
            {/* Salesforce */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Database className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Salesforce</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Push listing data directly to Salesforce as leads or contacts. Keep your CRM up-to-date with the latest property and agent information.
                </p>
              </div>
            </div>

            {/* HubSpot */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Database className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">HubSpot</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Create contacts, deals, and custom properties in HubSpot from your listing searches. Trigger workflows based on listing activity.
                </p>
              </div>
            </div>

            {/* Zoho CRM */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Database className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Zoho CRM</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Complete CRM solution with automated lead creation, contact management, and custom field mapping for your listing data.
                </p>
              </div>
            </div>

            {/* Email Marketing Integrations */}
            {/* Mailchimp */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Mailchimp</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Automatically sync new listing leads to Mailchimp audiences and trigger email campaigns when properties match your saved searches.
                </p>
              </div>
            </div>

            {/* SendGrid */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">SendGrid</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Powerful email delivery platform for sending automated listing notifications, alerts, and custom campaigns to your contacts.
                </p>
              </div>
            </div>

            {/* Constant Contact */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Send className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Constant Contact</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Add listing agents to contact lists and send automated email campaigns. Track engagement and nurture agent relationships.
                </p>
              </div>
            </div>

            {/* Automation Integrations */}
            {/* Zapier */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Zapier</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Connect ListingBug to 5,000+ apps through Zapier. Build custom workflows without writing a single line of code.
                </p>
              </div>
            </div>

            {/* Make.com */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Make.com</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Design advanced automation scenarios with Make's visual workflow builder. Perfect for complex multi-step integrations.
                </p>
              </div>
            </div>

            {/* n8n */}
            <div className="flex items-start gap-5 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">n8n</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                  Self-hosted automation platform for complete control. Build sophisticated workflows with custom logic and integrations.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Stacked layout */}
          <div className="block md:hidden space-y-6">
            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Mailchimp</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Automatically sync new listing leads to Mailchimp audiences and trigger email campaigns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Salesforce</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Push listing data directly to Salesforce as leads or contacts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">HubSpot</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Create contacts, deals, and custom properties in HubSpot from your searches.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Send className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Constant Contact</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Add listing agents to contact lists and send automated email campaigns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Google Sheets</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Export listing data to Google Sheets automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Airtable</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Sync listings to Airtable bases with custom views and fields.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Twilio</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Get instant SMS notifications when new listings match your criteria.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Zapier</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Connect ListingBug to 5,000+ apps through Zapier.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Make</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Design advanced automation scenarios with Make's visual workflow builder.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10 last:border-b-0 last:pb-0">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                <Webhook className="w-5 h-5 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Webhooks</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                  Send listing data to any custom endpoint. Perfect for developers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Use Integrations */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-gray-900 dark:text-white mb-3 font-bold text-[27px]">
              Why Use Integrations?
            </h2>
            <p className="text-gray-600 dark:text-[#EBF2FA] max-w-3xl mx-auto text-[15px]">
              Integrations eliminate manual data entry and keep your tools in perfect sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Benefit 1 */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <h3 className="font-bold text-[19px] text-[#342E37] dark:text-white mb-2">
                No Manual Work
              </h3>
              <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                Stop copying and pasting. Your data flows automatically between systems, saving hours every week.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <h3 className="font-bold text-[19px] text-[#342E37] dark:text-white mb-2">
                Always Up-to-Date
              </h3>
              <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                Your tools stay in sync with the latest listing data—in real-time. Never miss an opportunity.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <div className="w-12 h-12 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#342E37] dark:text-[#0F1115]" />
              </div>
              <h3 className="font-bold text-[19px] text-[#342E37] dark:text-white mb-2">
                Secure & Reliable
              </h3>
              <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                Bank-level encryption and 99.9% uptime. Your data is safe and always flowing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#FFD447] dark:bg-[#FFCE0A] rounded-lg p-8 md:p-12 text-center">
          <h2 className="font-bold text-[32px] text-[#342e37] mb-4">
            Ready to Automate Your Workflow?
          </h2>
          <p className="text-[16px] text-[#342e37]/80 mb-6 max-w-2xl mx-auto">
            Start your free trial today and connect to your favorite tools in minutes.
          </p>
          <button
            onClick={() => onNavigate?.('signup')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#252525] text-white rounded-lg font-bold text-[16px] hover:bg-[#252525]/90 transition-colors"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}