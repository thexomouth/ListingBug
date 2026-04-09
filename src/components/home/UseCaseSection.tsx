import { Sparkles, Home, Palette, Trees, Hammer, Shield, Building2, Wrench, Package, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const useCases = [
  {
    icon: Sparkles,
    title: "Cleaners",
    description: "Connect with agents before move-in day to offer cleaning services for new homeowners.",
  },
  {
    icon: Home,
    title: "Home Inspectors",
    description: "Reach buyers and sellers early in the process when inspection services are needed most.",
  },
  {
    icon: Palette,
    title: "Stagers",
    description: "Get in touch with listing agents to showcase homes with professional staging services.",
  },
  {
    icon: Trees,
    title: "Landscapers",
    description: "Target new listings and connect with homeowners ready to enhance curb appeal.",
  },
  {
    icon: Hammer,
    title: "Roofers",
    description: "Identify homes in need of roof repairs and reach out to agents and homeowners directly.",
  },
  {
    icon: Shield,
    title: "Insurance Agents",
    description: "Connect with new homeowners at the perfect time to discuss insurance coverage options.",
  },
  {
    icon: Building2,
    title: "Real Estate Agents",
    description: "Connect with listing agents, find comparable properties, and provide data-driven insights to your clients.",
  },
  {
    icon: Wrench,
    title: "Home Improvement Contractors",
    description: "Find newly listed properties and connect with agents before the competition. Perfect for remodelers and renovators.",
  },
  {
    icon: Palette,
    title: "Interior Designers",
    description: "Discover properties that need staging or design services. Connect with agents and homeowners looking for your expertise.",
  },
  {
    icon: Package,
    title: "Moving & Storage Companies",
    description: "Identify homeowners preparing to move and connect with agents who refer moving services to their clients.",
  },
  {
    icon: Zap,
    title: "Home Service Providers",
    description: "Electricians, plumbers, HVAC - reach agents and homeowners who need your services for new or transitioning properties.",
  },
];

export function UseCaseSection() {
  return (
    <section className="md:py-12 bg-white dark:bg-[#0F1115] px-[0px] py-[23px] pt-[0px] pr-[0px] pb-[23px] pl-[0px]">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 p-[0px]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white text-[48px]">
            Built for Real Estate Service Providers
          </h2>
          <p className="text-lg text-muted-foreground dark:text-[#EBF2FA] max-w-2xl mx-auto text-[14px]">
            Whether you're cleaning homes, inspecting properties, or providing essential services, ListingBug connects you with the right agents and homeowners.
          </p>
        </div>
        
        {/* Desktop: 2-column layout with dividers */}
        <div className="hidden md:grid md:grid-cols-2 gap-x-12 gap-y-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-5 group"
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-[#342E37] dark:text-[#0F1115]" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="mb-2 text-[21px] font-bold text-[#342E37] dark:text-white">{useCase.title}</h3>
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] leading-relaxed">{useCase.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Stacked layout */}
        <div className="block md:hidden space-y-6">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 group pb-[9px] border-b border-gray-200 dark:border-white/10 last:border-b-0 last:pb-0 pt-[0px] pr-[0px] pl-[0px]"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#FFD447] dark:bg-[#FFCE0A] flex items-center justify-center">
                  <Icon className="w-7 h-7 text-[#342E37] dark:text-[#0F1115]" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1.5 text-[18px] font-bold text-[#342E37] dark:text-white">{useCase.title}</h3>
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px] leading-relaxed">{useCase.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Internal links to persona pages + blog */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
          <p className="text-center text-[13px] text-gray-500 dark:text-[#EBF2FA]/50 mb-4">Guides by profession</p>
          <div className="flex flex-wrap justify-center gap-3 text-[13px]">
            <Link to="/for/mortgage-brokers" className="text-[#342E37] dark:text-[#FFCE0A] hover:underline">Mortgage Brokers</Link>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <Link to="/for/property-service-providers" className="text-[#342E37] dark:text-[#FFCE0A] hover:underline">Inspectors & Stagers</Link>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <Link to="/for/home-improvement-pros" className="text-[#342E37] dark:text-[#FFCE0A] hover:underline">Contractors & Tradespeople</Link>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <Link to="/for/transaction-services" className="text-[#342E37] dark:text-[#FFCE0A] hover:underline">Insurance & Title</Link>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <Link to="/blog" className="text-[#342E37] dark:text-[#FFCE0A] hover:underline">Read the Blog</Link>
          </div>
        </div>
      </div>
    </section>
  );
}