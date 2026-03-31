import { 
  Sparkles, 
  ClipboardCheck, 
  Palette, 
  Trees, 
  Home, 
  Shield,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Wrench,
  Target,
  Clock,
  TrendingDown,
  Zap,
  Phone,
  Hammer
} from "lucide-react";
import { Link } from "react-router-dom";
import { LBButton, LBCard, LBCardContent } from "./design-system";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Helmet } from "react-helmet-async";

interface UseCase {
  id: string;
  category: string;
  tagline: string;
  services: string[];
  intelligence: string[];
  keyScenario: string;
}

const useCases: UseCase[] = [
  {
    id: "property-services",
    category: "Property Service Providers",
    tagline: "Connect with agents before they book someone else",
    services: [
      "Home Inspectors & Appraisers",
      "Home Stagers & Interior Design",
      "Professional Cleaners",
      "Contractors & Handyman"
    ],
    intelligence: [
      "Active listings needing services",
      "Properties in transaction phase",
      "Agent contact info included",
      "Filter by days on market",
      "Track new listings daily"
    ],
    keyScenario: "Inspector finds 12 newly-listed homes in target area in 90 seconds, emails agents directly, books 5 pre-sale inspections by end of week"
  },
  {
    id: "home-improvement",
    category: "Home Improvement Professionals",
    tagline: "Find properties that need your expertise",
    services: [
      "Roofing Contractors",
      "Landscaping & Lawn Care",
      "HVAC & Plumbing",
      "Painters & Exterior"
    ],
    intelligence: [
      "Filter by year built",
      "Price drops signal motivation",
      "Re-listed properties",
      "Agent contacts for partnerships",
      "Pre-listing opportunities"
    ],
    keyScenario: "Roofer filters for homes 20+ years old with price drops, finds 8 motivated sellers, closes 2 re-roof jobs worth $12K total within 3 weeks"
  },
  {
    id: "transaction-support",
    category: "Transaction Support Services",
    tagline: "Be there at the perfect moment",
    services: [
      "Insurance Agents",
      "Real Estate Photographers",
      "Moving Companies",
      "Mortgage Brokers"
    ],
    intelligence: [
      "Active transactions happening now",
      "New listings needing photography",
      "Properties under contract",
      "Agent contact info",
      "Filter by property value"
    ],
    keyScenario: "Insurance agent identifies 15 properties going active next week, reaches out to listing agents, lands 4 new homeowner policies worth $3,200 annual premium"
  }
];

interface UseCasesPageProps {
  onNavigate?: (page: string) => void;
}

export function UseCasesPage({ onNavigate }: UseCasesPageProps = {}) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <Helmet>
        <title>Use Cases — Real Estate Service Providers | ListingBug</title>
        <meta name="description" content="Mortgage brokers, home inspectors, stagers, contractors, photographers, insurance agents, and movers use ListingBug to find new listings and reach listing agents first." />
        <link rel="canonical" href="https://thelistingbug.com/use-cases" />
        <meta property="og:title" content="Use Cases — Real Estate Service Providers | ListingBug" />
        <meta property="og:description" content="Mortgage brokers, home inspectors, stagers, contractors, photographers, insurance agents, and movers use ListingBug to find new listings and reach listing agents first." />
        <meta property="og:url" content="https://thelistingbug.com/use-cases" />
      </Helmet>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-[33px] px-[12px]">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Wrench className="w-8 h-8 md:w-9 md:h-9 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="mb-0 text-4xl font-bold dark:text-white">Built for Service Professionals</h1>
          </div>
          <p className="text-gray-600 dark:text-[#EBF2FA] max-w-2xl leading-relaxed text-[14px]">
            Find listing agents who need your services—without cold calling or buying expensive leads. Stop searching, start connecting.
          </p>
        </div>

        {/* Value Proposition Bar */}
        <div className="bg-[#ffffff] dark:bg-[#2F2F2F] rounded-lg p-6 mb-12 border border-gray-200 dark:border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Phone className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A] flex-shrink-0" />
              <div>
                <div className="font-bold text-[#342e37] dark:text-white">No cold calling</div>
                <div className="text-[13px] text-[#342e37]/80 dark:text-[#EBF2FA]">Agent emails included</div>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <DollarSign className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A] flex-shrink-0" />
              <div>
                <div className="font-bold text-[#342e37] dark:text-white">$2-5 per lead</div>
                <div className="text-[13px] text-[#342e37]/80 dark:text-[#EBF2FA]">vs $20-60 on HomeAdvisor</div>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <Clock className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A] flex-shrink-0" />
              <div>
                <div className="font-bold text-[#342e37] dark:text-white">8+ hours saved weekly</div>
                <div className="text-[13px] text-[#342e37]/80 dark:text-[#EBF2FA]">Searching & prospecting time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases Grid */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-gray-900 dark:text-white mb-3 font-bold text-[27px]">Who We Serve</h2>
            <p className="text-xl text-gray-600 dark:text-[#EBF2FA] max-w-3xl mx-auto text-[15px]">
              If you provide services to homeowners or listing agents, ListingBug helps you find opportunities and build agent relationships.
            </p>
          </div>

          {/* Mobile: Card Grid */}
          <div className="grid grid-cols-1 lg:hidden gap-6">
            {useCases.map((useCase) => (
              <UseCaseCardMobile key={useCase.id} useCase={useCase} />
            ))}
          </div>

          {/* Desktop: Full-Width Sections */}
          <div className="hidden lg:block space-y-16">
            {useCases.map((useCase, index) => (
              <UseCaseSectionDesktop key={useCase.id} useCase={useCase} index={index} />
            ))}
          </div>
        </div>

        {/* Other Uses Light Mention */}
        <div className="bg-gray-50 dark:bg-[#252525] rounded-lg p-6 mb-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-[14px] leading-relaxed">
            <strong className="text-[#342e37] dark:text-white">Also used by:</strong> Real estate investors for deal sourcing, agents for competitive analysis, 
            and market researchers for trend data—but our focus is helping service professionals connect with listing agents.
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="bg-gray-50 dark:bg-[#252525] rounded-lg p-8 mb-12">
          <h3 className="text-center font-bold text-[24px] mb-8 text-[#342e37] dark:text-white">Before ListingBug vs After ListingBug</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h4 className="font-bold text-[18px] text-gray-900 dark:text-white">Before: Expensive & Time-Consuming</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 flex-shrink-0">✗</span>
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Buying leads on HomeAdvisor/Thumbtack at $20-60 each</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 flex-shrink-0">✗</span>
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Cold calling agents with no context</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 flex-shrink-0">✗</span>
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Driving around neighborhoods looking for signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 flex-shrink-0">✗</span>
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Competing with 10 other service providers on the same lead</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 flex-shrink-0">✗</span>
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Missing opportunities because you found them too late</span>
                </li>
              </ul>
            </div>

            {/* After */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-[18px] text-gray-900 dark:text-white">After: Direct & Efficient</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Unlimited searches starting at $49/mo (not per lead)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Agent emails included—reach out with relevant context</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">90-second searches from your desk</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Find opportunities before competitors do</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-[14px]">Filter by signals that matter (price drops, high DOM, year built)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deep Dives by Role */}
        <div className="mb-12">
          <h2 className="font-bold text-[22px] text-[#342e37] dark:text-white mb-2">See how it works for your role</h2>
          <p className="text-gray-600 dark:text-[#EBF2FA]/70 text-[14px] mb-6">Step-by-step guides tailored to your profession.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/for/mortgage-brokers", label: "Mortgage Brokers & Lenders", desc: "Win listing agent referrals" },
              { href: "/for/property-service-providers", label: "Inspectors, Stagers & Cleaners", desc: "Land pre-sale service jobs" },
              { href: "/for/home-improvement-pros", label: "Contractors & Tradespeople", desc: "Find motivated sellers first" },
              { href: "/for/transaction-services", label: "Insurance, Title & Closing", desc: "Be the first call on every deal" },
            ].map(item => (
              <Link
                key={item.href}
                to={item.href}
                className="block p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] hover:shadow-md transition-all group"
              >
                <p className="font-bold text-[14px] text-[#342e37] dark:text-white group-hover:text-[#FFCE0A] transition-colors">{item.label}</p>
                <p className="text-[12px] text-gray-500 dark:text-[#EBF2FA]/50 mt-1">{item.desc} →</p>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-[#ffd447] to-[#ffc520] rounded-[0px] p-8 md:p-12 border-2 border-[#ffd447] shadow-[var(--elevation-lg)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[#342e37] mb-4 text-3xl font-bold">Stop Buying Leads. Start Finding Opportunities.</h2>
            <p className="text-xl text-[#342e37] mb-8 text-[16px]">
              One new client pays for months of ListingBug. 7-day free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate?.('signup')}
                className="px-8 py-3 bg-white text-[#342e37] rounded-lg hover:bg-white/90 transition-colors font-bold"
              >
                Start Free Trial
              </button>
              <button 
                onClick={() => onNavigate?.('pricing')}
                className="px-8 py-3 bg-[#252525] border-0 text-[#ffffff] rounded-lg hover:opacity-80 transition-opacity font-bold"
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                View Pricing
              </button>
            </div>
            <p className="text-[#342e37]/80 mt-6 text-[14px]">
              7-day free trial • No credit card required • Cancel anytime • <strong>Bonus:</strong> Free month of extra reports
            </p>
          </div>
        </div>

        {/* Social Proof / Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl text-[#342e37] dark:text-white mb-2 text-[24px] font-bold">100K+</div>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px]">Active Property Listings</p>
          </div>
          <div>
            <div className="text-4xl text-[#342e37] dark:text-white mb-2 text-[24px] font-bold">50+</div>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px]">Major Metro Markets</p>
          </div>
          <div>
            <div className="text-4xl text-[#342e37] dark:text-white mb-2 text-[24px] font-bold">Daily</div>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px]">Real-Time Data Updates</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Use Case Card Component (Mobile)
interface UseCaseCardMobileProps {
  useCase: UseCase;
}

function UseCaseCardMobile({ useCase }: UseCaseCardMobileProps) {
  return (
    <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-6 shadow-sm">
      {/* Category Header */}
      <h3 className="text-gray-900 dark:text-white mb-3 font-bold text-[24px]">{useCase.category}</h3>
      <p className="text-[#342e37] dark:text-[#EBF2FA] text-[15px] mb-6">{useCase.tagline}</p>

      {/* Services - Large, Eye-Catching */}
      <div className="mb-6">
        <p className="text-gray-700 dark:text-[#EBF2FA] mb-3 text-[13px] font-bold uppercase tracking-wide">Perfect for:</p>
        <div className="flex flex-wrap gap-2">
          {useCase.services.map((service, index) => (
            <div
              key={index}
              className="bg-[#FFD447] dark:bg-[#FFCE0A] text-[#342e37] dark:text-[#0F1115] px-4 py-2 rounded-lg font-bold text-[16px]"
            >
              {service}
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence You Get */}
      <div className="mb-6">
        <p className="text-gray-700 dark:text-[#EBF2FA] mb-3 text-[13px] font-bold uppercase tracking-wide">What you get:</p>
        <ul className="space-y-2">
          {useCase.intelligence.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-[#EBF2FA] text-[14px]">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Real Scenario */}
      <div className="pt-4 border-t border-gray-200 dark:border-white/10">
        <p className="text-[12px] text-gray-600 dark:text-[#EBF2FA] mb-2 font-bold uppercase tracking-wide">Real Example:</p>
        <p className="text-gray-700 dark:text-[#EBF2FA] text-[14px] italic leading-relaxed">"{useCase.keyScenario}"</p>
      </div>
    </div>
  );
}

// Use Case Section Component (Desktop)
interface UseCaseSectionDesktopProps {
  useCase: UseCase;
  index: number;
}

function UseCaseSectionDesktop({ useCase, index }: UseCaseSectionDesktopProps) {
  const isEven = index % 2 === 0;
  
  return (
    <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-8 shadow-sm">
      {/* Category Header */}
      <h3 className="text-gray-900 dark:text-white mb-3 font-bold text-[32px]">{useCase.category}</h3>
      <p className="text-[#342e37] dark:text-[#EBF2FA] text-[18px] mb-6">{useCase.tagline}</p>

      {/* Services - Large, Eye-Catching Badges */}
      <div className="mb-8">
        <p className="text-gray-700 dark:text-[#EBF2FA] mb-4 text-[14px] font-bold uppercase tracking-wide">Perfect for:</p>
        <div className="flex flex-wrap gap-3">
          {useCase.services.map((service, idx) => (
            <div
              key={idx}
              className="bg-[#FFD447] dark:bg-[#FFCE0A] text-[#342e37] dark:text-[#0F1115] px-5 py-3 rounded-lg font-bold text-[18px] shadow-sm"
            >
              {service}
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence You Get */}
      <div className="mb-8">
        <p className="text-gray-700 dark:text-[#EBF2FA] mb-4 text-[14px] font-bold uppercase tracking-wide">What you get:</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
          {useCase.intelligence.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-[#EBF2FA] text-[15px]">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Real Scenario */}
      <div className="pt-6 border-t border-gray-300 dark:border-white/10">
        <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA] mb-2 font-bold uppercase tracking-wide">Real Example:</p>
        <p className="text-gray-700 dark:text-[#EBF2FA] text-[16px] italic leading-relaxed">"{useCase.keyScenario}"</p>
      </div>
    </div>
  );
}