import { MapPin, PenLine, Inbox, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: MapPin,
    title: "Set Your Target Market",
    subtitle: "Pick your city and listing criteria in 60 seconds",
    description: "Tell ListingBug which market to watch. Choose your city, what kind of listings to target — new listings, price drops, property type — and set your price range. That's it.",
    examples: [
      { text: "New listings in Austin, TX under $600K" },
      { text: "Single-family homes listed in the last 24 hours" },
      { text: "Price reductions of 5%+ in Denver, CO" },
    ],
    features: [
      "Filter by city, price range, and property type",
      "Target new listings, price drops, or re-listed homes",
      "Set days-on-market and square footage thresholds",
      "Multiple cities on Market and Region plans",
    ],
  },
  {
    number: 2,
    icon: PenLine,
    title: "Write Your Message",
    subtitle: "Compose once — personalize automatically",
    description: "Write a short email or SMS introducing your business. Use personalization fields and they fill in automatically for every send — agent name, property address, city, listing date, and more. Or pick from a library of proven templates.",
    examples: [
      { text: "\"Hi {{agent_name}}, I saw you just listed {{address}}…\"" },
      { text: "Choose from shared templates for cleaners, stagers, movers, and more" },
      { text: "Send email, SMS, or both on the same campaign" },
    ],
    features: [
      "Personalization fields: agent name, address, city, price, date",
      "Email and SMS campaigns from one dashboard",
      "Template library with proven outreach messages",
      "Preview every message before it goes live",
    ],
  },
  {
    number: 3,
    icon: Inbox,
    title: "Land Recurring Jobs",
    subtitle: "Every new listing triggers a send — you only talk to interested agents",
    description: "Once your campaign is live, ListingBug watches your market 24/7. Every new listing that matches your criteria gets your message — automatically. Replies land in your shared inbox, organized by campaign, so your whole team can respond.",
    examples: [
      { text: "\"Agent replied within 4 hours — booked a staging job\"" },
      { text: "\"Got 3 cleaning clients in my first week from a single campaign\"" },
      { text: "\"Booked a moving job from the first outreach I sent\"" },
    ],
    features: [
      "Replies go to your shared inbox — your whole team can respond",
      "Campaigns run automatically while you focus on the work",
      "Track opens, clicks, and replies per campaign",
      "Pause or adjust campaigns anytime",
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white dark:bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#342e37] dark:text-white">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-[#EBF2FA] max-w-3xl mx-auto">
            Set it up once in about 5 minutes. ListingBug reaches listing agents for you — automatically, every day.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;

            return (
              <div key={index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 top-full h-24 w-0.5 bg-gradient-to-b from-[#FFCE0A] to-transparent transform -translate-x-1/2 z-0" />
                )}

                <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center`}>
                  {/* Content side */}
                  <div className={`space-y-6 ${isEven ? 'md:pr-8' : 'md:pl-8 md:order-2'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#FFCE0A] flex items-center justify-center shadow-lg shrink-0">
                        <span className="font-bold text-[#0F1115] text-2xl">{step.number}</span>
                      </div>
                      <Icon className="w-10 h-10 text-[#FFCE0A]" />
                    </div>

                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-[#342e37] dark:text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-lg text-[#FFCE0A] font-medium">
                        {step.subtitle}
                      </p>
                    </div>

                    <p className="text-gray-600 dark:text-[#EBF2FA] text-lg leading-relaxed">
                      {step.description}
                    </p>

                    <div className="space-y-3">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-[#EBF2FA] text-[15px]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Examples card */}
                  <div className={`${isEven ? 'md:pl-8' : 'md:pr-8 md:order-1'}`}>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#2F2F2F] dark:to-[#1a1a1a] rounded-2xl p-6 md:p-8 border-2 border-gray-200 dark:border-white/10 shadow-xl">
                      <h4 className="text-sm font-bold text-[#FFCE0A] uppercase tracking-wide mb-6">
                        Real examples
                      </h4>
                      <div className="space-y-4">
                        {step.examples.map((example, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-white dark:bg-[#0F1115] rounded-lg p-4 border border-gray-200 dark:border-white/10">
                            <CheckCircle className="w-5 h-5 text-[#FFCE0A] shrink-0 mt-0.5" />
                            <p className="text-gray-700 dark:text-white text-[15px] leading-relaxed">
                              {example.text}
                            </p>
                          </div>
                        ))}
                      </div>

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
