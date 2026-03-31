import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  Target,
  Bell,
  BarChart3,
  Zap,
  CheckCircle2
} from "lucide-react";

interface HowItWorksPageProps {
  onNavigate?: (page: string) => void;
}

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <Helmet>
        <title>How It Works — Real Estate Listing Alerts | ListingBug</title>
        <meta name="description" content="Learn how ListingBug monitors real estate markets, delivers new listings to your workflows, and triggers automated outreach — all on a schedule you control." />
        <link rel="canonical" href="https://thelistingbug.com/how-it-works" />
        <meta property="og:title" content="How It Works — Real Estate Listing Alerts | ListingBug" />
        <meta property="og:description" content="Learn how ListingBug monitors real estate markets, delivers new listings to your workflows, and triggers automated outreach — all on a schedule you control." />
        <meta property="og:url" content="https://thelistingbug.com/how-it-works" />
      </Helmet>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-[33px] px-[12px]">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-7 h-7 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="mb-0 text-4xl font-bold text-[33px] dark:text-white">How It Works</h1>
          </div>
          <p className="text-gray-600 dark:text-[#EBF2FA] max-w-3xl leading-relaxed text-[14px] p-[0px]">
            ListingBug puts listing discovery on autopilot. Set your search parameters once, 
            connect your favorite tools, and let automated workflows deliver fresh opportunities 
            24/7 while you focus on closing deals.
          </p>
        </div>

        {/* Step 1 */}
        <div className="mb-20">
          <div className="flex flex-col items-start">
            {/* Number circle - centered on its own row */}
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-[#342e37] dark:bg-[#FFCE0A] text-white dark:text-[#0F1115] flex items-center justify-center">
                <span className="text-xl font-semibold">1</span>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="mb-[16px]">
                <h2 className="mb-0 text-3xl font-semibold tracking-tight text-[#342e37] dark:text-white text-[27px] font-bold">
                  Search Your Target Market
                </h2>
              </div>
              <p className="text-gray-600 dark:text-[#EBF2FA] mb-[33px] leading-relaxed text-[15px] px-[9px] py-[0px] mt-[0px] mr-[0px] ml-[0px]">
                Use powerful filters to find exactly the properties and opportunities that match your service area and business goals.
              </p>
              
              {/* Desktop: 2-column layout */}
              <div className="hidden md:grid md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="flex items-start gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Target className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Geographic Targeting</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Search by city, zip code, specific address, or radius from a location. Focus on your service area and never waste time on properties outside your reach.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Filter className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Property Filters</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Filter by property type, price range, square footage, bedrooms, bathrooms, and more. Find the properties that best match your ideal client profile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Clock className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Listing Status</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Target active listings, pending sales, or recently sold properties. Each stage presents unique opportunities for different service providers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <TrendingUp className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Days on Market</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Identify listings that have been on the market longer - these sellers may be more motivated to invest in services that help their property stand out.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Stacked layout */}
              <div className="block md:hidden space-y-6">
                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Geographic Targeting</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Search by city, zip code, specific address, or radius from a location. Focus on your service area and never waste time on properties outside your reach.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Filter className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Property Filters</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Filter by property type, price range, square footage, bedrooms, bathrooms, and more. Find the properties that best match your ideal client profile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Listing Status</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Target active listings, pending sales, or recently sold properties. Each stage presents unique opportunities for different service providers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10 last:border-b-0 last:pb-0">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Days on Market</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Identify listings that have been on the market longer - these sellers may be more motivated to invest in services that help their property stand out.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-20">
          <div className="flex flex-col items-start">
            {/* Number circle - on its own row */}
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-[#342e37] dark:bg-[#FFCE0A] text-white dark:text-[#0F1115] flex items-center justify-center">
                <span className="text-xl font-semibold">2</span>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="mb-4">
                <h2 className="mb-0 text-3xl font-semibold tracking-tight text-[#342e37] dark:text-white text-[27px] font-bold">
                  Automate Your Workflow
                </h2>
              </div>
              <p className="text-gray-600 dark:text-[#EBF2FA] mb-6 leading-relaxed text-[15px]">
                Set your automation to run daily, hourly, or on your custom schedule. Your searches run 24/7 in the background—no more manual checking.
              </p>
              
              {/* Desktop: 3-column layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-x-8 gap-y-8">
                <div className="flex flex-col items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Clock className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Custom Schedules</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Run automations hourly, daily, weekly, or on any custom schedule. Set it once and let ListingBug monitor the market for you around the clock.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Bell className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Smart Notifications</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Get instant alerts when new listings match your criteria. Never miss a hot lead because you're always the first to know.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Zap className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Set & Forget</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Configure once, benefit forever. Your automations keep running seamlessly while you focus on closing deals and growing your business.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Stacked layout */}
              <div className="block md:hidden space-y-6">
                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Custom Schedules</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Run automations hourly, daily, weekly, or on any custom schedule. Set it once and let ListingBug monitor the market for you around the clock.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Smart Notifications</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Get instant alerts when new listings match your criteria. Never miss a hot lead because you're always the first to know.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10 last:border-b-0 last:pb-0">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Set & Forget</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Configure once, benefit forever. Your automations keep running seamlessly while you focus on closing deals and growing your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-20">
          <div className="flex flex-col items-start">
            {/* Number circle - on its own row */}
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-[#342e37] dark:bg-[#FFCE0A] text-white dark:text-[#0F1115] flex items-center justify-center">
                <span className="text-xl font-semibold">3</span>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="mb-4">
                <h2 className="mb-0 text-3xl font-semibold tracking-tight text-[#342e37] dark:text-white text-[27px] font-bold">
                  Connect & Sync Seamlessly
                </h2>
              </div>
              <p className="text-gray-600 dark:text-[#EBF2FA] mb-6 leading-relaxed text-[15px]">
                Export to 17 destinations including Google Sheets, Airtable, Slack, webhooks, and more. Your data syncs automatically—no more manual CSV downloads.
              </p>
              
              {/* Desktop: 3-column layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-x-8 gap-y-8">
                <div className="flex flex-col items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <RefreshCw className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">17 Integrations</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Connect to Google Sheets, Airtable, Slack, webhooks, email, SMS, and 11+ more destinations. Send data exactly where your team needs it.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <Zap className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Auto-Sync</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Data flows automatically from ListingBug to your tools. No manual exports, no copy-pasting—just seamless real-time updates.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center group-hover:border-[#FFCE0A] transition-all duration-300">
                    <BarChart3 className="w-6 h-6 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">Your CRM, Your Way</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">
                      Feed leads directly into your existing workflows. Whether it's a spreadsheet, CRM, or custom system, ListingBug adapts to you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Stacked layout */}
              <div className="block md:hidden space-y-6">
                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">17 Integrations</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Connect to Google Sheets, Airtable, Slack, webhooks, email, SMS, and 11+ more destinations. Send data exactly where your team needs it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Auto-Sync</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Data flows automatically from ListingBug to your tools. No manual exports, no copy-pasting—just seamless real-time updates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10 last:border-b-0 last:pb-0">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#FFCE0A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">Your CRM, Your Way</h3>
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">
                      Feed leads directly into your existing workflows. Whether it's a spreadsheet, CRM, or custom system, ListingBug adapts to you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Growth Section */}
        <div className="bg-[#FFCE0A] rounded-2xl p-10 text-[#342e37] px-[12px] py-[40px]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <h2 className="mb-0 text-3xl font-semibold tracking-tight text-[36px] font-bold">
                How This Grows Your Business
              </h2>
            </div>
            <p className="mb-[12px] leading-relaxed opacity-90 text-[14px] mt-[0px] mr-[0px] ml-[0px]">
              ListingBug gives you an unfair advantage by connecting you with opportunities before your competitors even know they exist.
            </p>

            <div className="grid md:grid-cols-2 gap-6 p-[0px]">
              <div className="bg-white/50 backdrop-blur rounded-lg p-5 p-[12px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#342e37]" />
                  Increase Visibility
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  Reach agents and sellers proactively instead of waiting for referrals. Position yourself as the go-to expert in your service area.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur rounded-lg p-5 p-[12px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#342e37]" />
                  Better Targeting
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  Stop wasting time on unqualified leads. Focus your energy on properties and agents that match your ideal client profile.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur rounded-lg p-5 p-[12px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#342e37]" />
                  Perfect Timing
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  Contact agents and sellers when they need your services most - during active listings and transactions, not months later.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur rounded-lg p-5 p-[12px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#342e37]" />
                  Scalable Outreach
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  From 10 to 1,000 leads per month, ListingBug scales with your business. Automation handles the heavy lifting while you close deals.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur rounded-lg p-5 p-[12px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#342e37]" />
                  Build Relationships
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  Turn one-time jobs into recurring partnerships. Become the trusted service provider agents call every time they list a property.
                </p>
              </div>

              <div className="bg-white/50 backdrop-blur rounded-lg p-5 p-[12px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#342e37]" />
                  Data-Driven Decisions
                </h3>
                <p className="text-sm leading-relaxed opacity-80">
                  Use market insights to adjust your pricing, identify high-opportunity areas, and make informed business decisions backed by real data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific guides */}
        <div className="mt-12 mb-6">
          <h2 className="font-bold text-[20px] text-[#342e37] dark:text-white mb-2">Built for your profession</h2>
          <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA]/70 mb-5">Read our step-by-step guides for your specific role.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/for/mortgage-brokers", label: "Mortgage Brokers" },
              { href: "/for/property-service-providers", label: "Inspectors & Stagers" },
              { href: "/for/home-improvement-pros", label: "Contractors & Tradespeople" },
              { href: "/for/transaction-services", label: "Insurance & Title" },
            ].map(item => (
              <Link
                key={item.href}
                to={item.href}
                className="block px-4 py-3 bg-gray-50 dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg text-[13px] font-medium text-[#342e37] dark:text-white hover:border-[#FFCE0A] hover:text-[#FFCE0A] transition-all"
              >
                {item.label} →
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#342e37] dark:text-white mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#EBF2FA] mb-8 leading-relaxed max-w-2xl mx-auto">
            Join service providers who are already using ListingBug to discover opportunities, 
            build relationships, and increase revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate?.('pricing')}
              className="px-8 py-3 bg-[#FFCE0A] text-[#0F1115] rounded-lg hover:bg-[#ffc520] transition-colors font-medium font-bold"
            >
              View Pricing
            </button>
            <button 
              onClick={() => onNavigate?.('use-cases')}
              className="px-8 py-3 border-2 border-[#342e37] dark:border-white text-[#342e37] dark:text-white rounded-lg hover:bg-[#342e37]/5 dark:hover:bg-white/10 transition-colors font-medium"
            >
              Explore Use Cases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}