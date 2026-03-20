import { Zap, Clock, Mail, Webhook, Code, Database, CheckCircle2, ArrowRight, Repeat, Download } from 'lucide-react';
import { Button } from './ui/button';

/**
 * AUTOMATION PAGE
 * 
 * PURPOSE: Educate users on automation capabilities and drive conversions to paid plans
 * 
 * SECTIONS:
 * 1. Hero - Main value prop for automation
 * 2. Automated Reports - How scheduled reports work
 * 3. API Integration - Technical capabilities for developers
 * 4. Use Cases - Real-world automation workflows
 * 5. Pricing CTA - Strong conversion section
 */

interface AutomationPageProps {
  onNavigate?: (page: string) => void;
}

export function AutomationPage({ onNavigate }: AutomationPageProps) {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#ffd447] via-[#ffd447]/90 to-[#ffd447]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#342e37] text-white px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Work Smarter, Not Harder</span>
            </div>
            
            <h1 className="font-bold text-[36px] md:text-[48px] text-[#342e37] mb-6 leading-tight">
              Automate Your Listing Pipeline & <br className="hidden md:block" />
              Never Miss an Opportunity
            </h1>
            
            <p className="text-[18px] md:text-[20px] text-[#342e37]/80 mb-8 leading-relaxed">
              Stop manually searching for listings every day. ListingBug automates your entire workflow—from 
              fresh listing alerts to CRM integration—so you can focus on closing deals, not hunting for leads.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate?.('pricing')}
                className="inline-flex items-center justify-center gap-2 bg-[#342e37] hover:bg-[#342e37]/90 text-white rounded-lg transition-colors font-bold px-8 py-4 text-[16px]"
              >
                Start Automating Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate?.('api-docs')}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-[#342e37] border-2 border-[#342e37] rounded-lg transition-colors font-bold px-8 py-4 text-[16px]"
              >
                <Code className="w-5 h-5" />
                View API Docs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-bold text-[24px] text-[#342e37] mb-4">
              The Old Way is Costing You Deals
            </h2>
            <p className="text-gray-600 text-[16px] leading-relaxed">
              Every minute you spend logging into portals, running searches, downloading CSVs, and copying data 
              into your CRM is a minute you're not reaching out to agents. By the time you find a listing manually, 
              your competitor has already called the agent.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Automation Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#ffd447] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#342e37]" />
            </div>
            <h3 className="font-bold text-[20px] text-[#342e37] mb-3">
              Save 10+ Hours Per Week
            </h3>
            <p className="text-gray-600 text-[15px] leading-relaxed">
              No more daily logins. No more manual searches. Set your criteria once and get automatic updates.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#ffd447] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-[#342e37]" />
            </div>
            <h3 className="font-bold text-[20px] text-[#342e37] mb-3">
              Be First to New Listings
            </h3>
            <p className="text-gray-600 text-[15px] leading-relaxed">
              Get notified within minutes of new listings hitting the market, before your competition even wakes up.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#ffd447] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Repeat className="w-8 h-8 text-[#342e37]" />
            </div>
            <h3 className="font-bold text-[20px] text-[#342e37] mb-3">
              Seamless CRM Integration
            </h3>
            <p className="text-gray-600 text-[15px] leading-relaxed">
              Listings flow directly into your workflow—email, Salesforce, HubSpot, or any tool you already use.
            </p>
          </div>
        </div>

      </div>

      {/* Automated Reports Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="font-bold text-[32px] text-[#342e37] mb-4">
              Automated Reports: Set It and Forget It
            </h2>
            <p className="text-gray-600 text-[18px] max-w-3xl mx-auto">
              Create a custom search once, and ListingBug will run it automatically on your schedule—daily, weekly, 
              or as new listings appear. Fresh data delivered right to your inbox.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
            {/* Left: Visual/Steps */}
            <div className="order-2 md:order-1">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#ffd447] rounded-full flex items-center justify-center font-bold text-[#342e37]">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[18px] text-[#342e37] mb-2">
                      Define Your Criteria
                    </h3>
                    <p className="text-gray-600 text-[15px]">
                      Set your location, price range, property type, and any other filters. 
                      Save the search as an automated report.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#ffd447] rounded-full flex items-center justify-center font-bold text-[#342e37]">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[18px] text-[#342e37] mb-2">
                      Choose Your Schedule
                    </h3>
                    <p className="text-gray-600 text-[15px]">
                      Get updates daily at 9 AM, weekly on Mondays, or instantly as new listings hit the market.
                      You're in control.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#ffd447] rounded-full flex items-center justify-center font-bold text-[#342e37]">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[18px] text-[#342e37] mb-2">
                      Receive Fresh Data
                    </h3>
                    <p className="text-gray-600 text-[15px]">
                      Reports arrive as CSV, JSON, or email notifications. Download, import, or integrate—
                      whatever fits your workflow.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#ffd447] rounded-full flex items-center justify-center font-bold text-[#342e37]">
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-[18px] text-[#342e37] mb-2">
                      Take Action Immediately
                    </h3>
                    <p className="text-gray-600 text-[15px]">
                      No more stale leads. With real-time agent contact info, you can reach out the moment 
                      a hot property appears.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature List */}
            <div className="order-1 md:order-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
              <h3 className="font-bold text-[20px] text-[#342e37] mb-6">
                What's Included in Automated Reports
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-[15px]">
                    <strong>Unlimited saved searches</strong> with custom filters
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-[15px]">
                    <strong>Flexible scheduling:</strong> Daily, weekly, or real-time alerts
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-[15px]">
                    <strong>Multiple export formats:</strong> CSV, JSON, Excel, PDF
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-[15px]">
                    <strong>Email delivery</strong> with customizable templates
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-[15px]">
                    <strong>Full agent contact info:</strong> Emails, phones, office details
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-[15px]">
                    <strong>Historical data access</strong> to track market trends
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Integration Section */}
      <div className="bg-[#342e37] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Explanation */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#ffd447] text-[#342e37] px-4 py-2 rounded-full mb-6">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">For Developers</span>
              </div>
              
              <h2 className="font-bold text-[32px] mb-6">
                Full API Access: Build Your Perfect Workflow
              </h2>
              
              <p className="text-gray-300 text-[16px] mb-6 leading-relaxed">
                Don't want to visit our site at all? Perfect. Our RESTful API lets you pull listing data 
                programmatically and pipe it anywhere—your internal tools, custom dashboards, or directly into 
                your database.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ffd447] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium mb-1">RESTful API with JSON responses</p>
                    <p className="text-gray-400 text-sm">Clean, predictable endpoints for all listing data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ffd447] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium mb-1">Webhook support for real-time updates</p>
                    <p className="text-gray-400 text-sm">Get instant notifications when new listings match your criteria</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ffd447] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium mb-1">OAuth 2.0 authentication</p>
                    <p className="text-gray-400 text-sm">Secure, industry-standard authorization</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ffd447] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium mb-1">Rate limits that scale with your plan</p>
                    <p className="text-gray-400 text-sm">Professional: 1000 req/hr | Enterprise: 10,000 req/hr</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate?.('api-docs')}
                className="inline-flex items-center gap-2 bg-[#ffd447] hover:bg-[#ffd447]/90 text-[#342e37] rounded-lg transition-colors font-bold px-6 py-3"
              >
                <Code className="w-5 h-5" />
                View Full API Documentation
              </button>
            </div>

            {/* Right: Code Example */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 overflow-hidden border border-gray-700">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-gray-400 text-sm ml-2">API Request Example</span>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">
<code className="language-javascript">{`// Fetch new listings in Austin, TX
const response = await fetch(
  'https://api.listingbug.com/v1/listings/search',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      city: 'Austin',
      state: 'TX',
      propertyType: 'Single Family',
      minPrice: 300000,
      maxPrice: 800000,
      beds: 3,
      daysOnMarket: { max: 7 }
    })
  }
);

const data = await response.json();

// Returns:
{
  "results": 127,
  "listings": [
    {
      "id": "abc123",
      "address": "1234 Oak Street",
      "city": "Austin",
      "state": "TX",
      "price": 575000,
      "bedrooms": 4,
      "bathrooms": 3,
      "agent": {
        "name": "Jane Smith",
        "email": "jane@realestate.com",
        "phone": "(512) 555-1234"
      },
      // ... full listing data
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="font-bold text-[32px] text-[#342e37] mb-4">
              Real Automation Workflows
            </h2>
            <p className="text-gray-600 text-[18px] max-w-3xl mx-auto">
              See how successful service providers use ListingBug automation to scale their business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Use Case 1 */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#ffd447] rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#342e37]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#342e37] mb-3">
                Daily Email Alerts
              </h3>
              <p className="text-gray-600 text-[14px] mb-4 leading-relaxed">
                Get a clean email every morning at 7 AM with all new listings from yesterday. No login required, 
                just open your inbox and start calling agents.
              </p>
              <div className="text-[13px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Save 30 min/day of manual searching</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Perfect for individual agents</span>
                </div>
              </div>
            </div>

            {/* Use Case 2 */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#ffd447] rounded-xl flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-[#342e37]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#342e37] mb-3">
                CRM Auto-Import
              </h3>
              <p className="text-gray-600 text-[14px] mb-4 leading-relaxed">
                Listings automatically flow into Salesforce, HubSpot, or your CRM via API. Your sales team sees 
                new leads instantly without manual data entry.
              </p>
              <div className="text-[13px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Zero manual data entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Ideal for teams with CRMs</span>
                </div>
              </div>
            </div>

            {/* Use Case 3 */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#ffd447] rounded-xl flex items-center justify-center mb-4">
                <Webhook className="w-6 h-6 text-[#342e37]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#342e37] mb-3">
                Real-Time Webhooks
              </h3>
              <p className="text-gray-600 text-[14px] mb-4 leading-relaxed">
                Get instant notifications via webhook the moment a hot listing hits the market. Connect to Slack, 
                custom apps, or trigger automated outreach workflows.
              </p>
              <div className="text-[13px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Sub-minute notification speed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Best for high-volume operations</span>
                </div>
              </div>
            </div>

            {/* Use Case 4 */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#ffd447] rounded-xl flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-[#342e37]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#342e37] mb-3">
                Weekly CSV Reports
              </h3>
              <p className="text-gray-600 text-[14px] mb-4 leading-relaxed">
                Every Monday morning, get a comprehensive CSV with all matching listings from the past week. 
                Perfect for analysis, presentations, or bulk outreach campaigns.
              </p>
              <div className="text-[13px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Great for weekly planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Easy to share with teams</span>
                </div>
              </div>
            </div>

            {/* Use Case 5 */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#ffd447] rounded-xl flex items-center justify-center mb-4">
                <Repeat className="w-6 h-6 text-[#342e37]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#342e37] mb-3">
                Zapier/Make Integration
              </h3>
              <p className="text-gray-600 text-[14px] mb-4 leading-relaxed">
                No coding required—use Zapier or Make.com to connect ListingBug to 1000+ apps. Build custom 
                workflows with drag-and-drop simplicity.
              </p>
              <div className="text-[13px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>No technical skills needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Connect to any tool you use</span>
                </div>
              </div>
            </div>

            {/* Use Case 6 */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#ffd447] rounded-xl flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-[#342e37]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#342e37] mb-3">
                Custom API Integration
              </h3>
              <p className="text-gray-600 text-[14px] mb-4 leading-relaxed">
                Build your own tools on top of ListingBug. Pull data into internal dashboards, create proprietary 
                analysis tools, or power your own service offerings.
              </p>
              <div className="text-[13px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>Full control & flexibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd447]"></span>
                  <span>For developers & enterprises</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-br from-[#ffd447] via-[#ffd447]/95 to-[#ffd447]/90 border-y-4 border-[#342e37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-bold text-[40px] md:text-[48px] text-[#342e37] mb-6 leading-tight">
              Stop Wasting Time.<br />
              Start Closing Deals.
            </h2>
            
            <p className="text-[20px] md:text-[24px] text-[#342e37]/90 mb-8 leading-relaxed">
              <strong>Your competitors are already using automation</strong> to capture listings before you even 
              log in. Join them, or get left behind.
            </p>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-8 mb-8 border-2 border-[#342e37]">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-[36px] font-bold text-[#342e37] mb-2">10+ hrs</div>
                  <div className="text-gray-700 text-[14px]">Saved Per Week</div>
                </div>
                <div>
                  <div className="text-[36px] font-bold text-[#342e37] mb-2">24/7</div>
                  <div className="text-gray-700 text-[14px]">Automated Monitoring</div>
                </div>
                <div>
                  <div className="text-[36px] font-bold text-[#342e37] mb-2">&lt;1 min</div>
                  <div className="text-gray-700 text-[14px]">From Listing to Alert</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={() => onNavigate?.('pricing')}
                className="inline-flex items-center justify-center gap-3 bg-[#342e37] hover:bg-[#342e37]/90 text-white rounded-xl transition-all font-bold px-10 py-5 text-[18px] shadow-2xl hover:shadow-xl transform hover:scale-105"
              >
                <Zap className="w-6 h-6" />
                Start Your 7-Day Free Trial
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            <p className="text-[#342e37]/70 text-[14px]">
              No credit card required • Cancel anytime • Full API access included
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}