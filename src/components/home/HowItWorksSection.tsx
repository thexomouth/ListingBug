import { Search, Zap, RefreshCw, Home, Droplets, Hammer, CheckCircle, ArrowRight, Clock, Database, Send } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Find Your Perfect Search",
    subtitle: "Pinpoint exactly the listings you need with 25+ search parameters",
    description: "Build laser-focused searches that target your ideal opportunities. Whether you're a cleaner looking for high-value homes, a stager seeking luxury listings, or a contractor tracking price drops—our advanced filters let you zero in on what matters.",
    examples: [
      { icon: Droplets, text: "Cleaners: Find 3,000+ sqft homes listed in the last 7 days" },
      { icon: Home, text: "Stagers: Target luxury homes $500K+ needing presentation" },
      { icon: Hammer, text: "Contractors: Track price drops on homes needing repairs" },
    ],
    features: [
      "Filter by price range, square footage, property type",
      "Search by days on market, listing status, location",
      "Target new listings, price drops, or relisted properties",
      "Save unlimited search combinations",
    ]
  },
  {
    number: 2,
    icon: Zap,
    title: "Automate Your Workflow",
    subtitle: "Set it once and let it run 24/7 in the background",
    description: "Your searches run automatically on your schedule—daily, hourly, or custom intervals. Wake up to fresh leads every morning without lifting a finger. While you sleep, ListingBug is working to find your next opportunity.",
    examples: [
      { icon: Clock, text: "Run searches every morning at 8 AM" },
      { icon: Database, text: "Check for new listings every hour during peak season" },
      { icon: RefreshCw, text: "Monitor price changes twice daily" },
    ],
    features: [
      "Schedule automations: hourly, daily, or custom times",
      "Runs 24/7 even when you're offline",
      "Never miss a new listing or price drop",
      "Set it once, forget it forever",
    ]
  },
  {
    number: 3,
    icon: RefreshCw,
    title: "Connect & Sync Seamlessly",
    subtitle: "Export to 17 destinations—your data, your tools",
    description: "Stop copy-pasting. Your listing data flows directly into Google Sheets, Airtable, your CRM, Slack channels, or via webhooks to any custom tool. Contact agents instantly with automated workflows that put you first in line.",
    examples: [
      { icon: Send, text: "Auto-export to Google Sheets for team collaboration" },
      { icon: CheckCircle, text: "Push to Slack channel for instant team notifications" },
      { icon: Database, text: "Sync with your CRM to start outreach immediately" },
    ],
    features: [
      "17 integrations: Google Sheets, Airtable, Slack, webhooks",
      "Automatic CSV exports delivered daily",
      "Real-time agent contact information",
      "No manual data entry ever again",
    ]
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white dark:bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#342e37] dark:text-white text-[42px]">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-[#EBF2FA] max-w-3xl mx-auto">
            Set it once, and let ListingBug work for you around the clock. Here's exactly how service providers use it to win more business.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div key={index} className="relative">
                {/* Connector Line (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 top-full h-24 w-0.5 bg-gradient-to-b from-[#FFCE0A] to-transparent transform -translate-x-1/2 z-0" />
                )}

                <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${isEven ? '' : 'md:flex-row-reverse'}`}>
                  {/* Left side: Main content */}
                  <div className={`space-y-6 ${isEven ? 'md:pr-8' : 'md:pl-8 md:order-2'}`}>
                    {/* Step badge */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#FFCE0A] flex items-center justify-center shadow-lg">
                        <span className="font-bold text-[#0F1115] text-2xl">{step.number}</span>
                      </div>
                      <Icon className="w-10 h-10 text-[#FFCE0A]" />
                    </div>

                    {/* Title and subtitle */}
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-[#342e37] dark:text-white mb-2 text-[33px]">
                        {step.title}
                      </h3>
                      <p className="text-lg text-[#FFCE0A] font-medium">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-[#EBF2FA] text-lg leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-3">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-[#EBF2FA] text-[15px]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right side: Examples */}
                  <div className={`${isEven ? 'md:pl-8' : 'md:pr-8 md:order-1'}`}>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#2F2F2F] dark:to-[#1a1a1a] rounded-2xl p-6 md:p-8 border-2 border-gray-200 dark:border-white/10 shadow-xl">
                      <h4 className="text-lg font-bold text-[#342e37] dark:text-white mb-6 flex items-center gap-2">
                        <span className="text-[#FFCE0A]">Real-World Examples:</span>
                      </h4>
                      <div className="space-y-4">
                        {step.examples.map((example, idx) => {
                          const ExampleIcon = example.icon;
                          return (
                            <div key={idx} className="flex items-start gap-3 bg-white dark:bg-[#0F1115] rounded-lg p-4 border border-gray-200 dark:border-white/10">
                              <div className="w-10 h-10 rounded-lg bg-[#FFCE0A]/10 flex items-center justify-center flex-shrink-0">
                                <ExampleIcon className="w-5 h-5 text-[#FFCE0A]" />
                              </div>
                              <p className="text-gray-700 dark:text-white text-[15px] leading-relaxed">
                                {example.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Call to action arrow for visual flow */}
                      {index < steps.length - 1 && (
                        <div className="mt-6 flex items-center justify-center">
                          <div className="flex items-center gap-2 text-[#FFCE0A] font-medium">
                            <span className="text-sm">Then</span>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}