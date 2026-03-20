import { Database, TrendingUp, Home, FileText, Users, Clock, ArrowRight, Sparkles } from 'lucide-react';

export function DataEnrichmentSection() {
  const enrichmentFeatures = [
    {
      icon: TrendingUp,
      title: 'Property Valuations (AVMs)',
      description: 'Instant market value estimates',
      examples: ['Automated valuation models', 'Price trend analysis', 'Comparative market data'],
      color: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500',
    },
    {
      icon: Home,
      title: 'Rent Estimates',
      description: 'Rental income projections',
      examples: ['Monthly rent predictions', 'Investment ROI calculations', 'Market rental comparisons'],
      color: 'from-blue-500 to-indigo-500',
      iconBg: 'bg-blue-500',
    },
    {
      icon: FileText,
      title: 'Tax Assessments',
      description: 'Complete tax record access',
      examples: ['Property tax history', 'Assessment valuations', 'Tax exemption details'],
      color: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-500',
    },
    {
      icon: Clock,
      title: 'Ownership History',
      description: 'Track property transfers',
      examples: ['Previous sale dates', 'Chain of ownership', 'Transaction timeline'],
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFCE0A]/10 border border-[#FFCE0A]/30 rounded-full px-4 py-2 mb-4">
            <Database className="w-4 h-4 text-[#FFCE0A]" />
            <span className="text-sm font-semibold text-[#342e37] dark:text-white">Data Enrichment</span>
          </div>
          <h2 className="mb-4 font-bold text-[36px] md:text-[48px] text-[#342e37] dark:text-white">
            Property Reports & Valuations
          </h2>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[18px] md:text-[20px] max-w-3xl mx-auto leading-relaxed">
            Every membership comes with access to <strong className="text-[#342e37] dark:text-white">comprehensive listing enrichment data</strong> including valuations, property history, tax records, and more—giving you the complete picture instantly.
          </p>
        </div>

        {/* Enrichment Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {enrichmentFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={feature.title} 
                className="group relative bg-white dark:bg-[#2F2F2F] rounded-2xl p-8 border-2 border-gray-200 dark:border-white/10 hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
              >
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                
                <div className="relative">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[22px] md:text-[24px] text-[#342e37] dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-[#FFCE0A] font-semibold text-[15px]">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Feature Examples */}
                  <div className="space-y-2 ml-[72px]">
                    {feature.examples.map((example, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFCE0A]" />
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hover CTA */}
                  <div className="mt-4 ml-[72px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1 text-[#FFCE0A] text-sm font-semibold">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Highlight Box */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#FFCE0A]/10 via-[#FFCE0A]/5 to-transparent dark:from-[#FFCE0A]/20 dark:via-[#FFCE0A]/10 dark:to-transparent rounded-2xl border-2 border-[#FFCE0A]/30 p-8 md:p-10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #FFCE0A 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Icon */}
            <div className="w-16 h-16 bg-[#FFCE0A] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
              <Sparkles className="w-8 h-8 text-[#0F1115]" />
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-bold text-[20px] md:text-[24px] text-[#342e37] dark:text-white mb-2">
                Comprehensive Property Intelligence
              </h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px] md:text-[16px] leading-relaxed">
                Access <strong className="text-[#342e37] dark:text-white">property records, ownership transfers, deed information, mortgage details, and more</strong>. Every listing is automatically enriched with critical data points that help you make informed decisions faster.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-3 text-center flex-shrink-0">
              <div className="bg-white dark:bg-[#2F2F2F] rounded-lg px-6 py-3 border border-gray-200 dark:border-white/10">
                <div className="text-[28px] font-bold text-[#FFCE0A]">100%</div>
                <div className="text-[12px] text-gray-600 dark:text-[#EBF2FA]">Auto-Enriched</div>
              </div>
              <div className="bg-white dark:bg-[#2F2F2F] rounded-lg px-6 py-3 border border-gray-200 dark:border-white/10">
                <div className="text-[28px] font-bold text-[#FFCE0A]">15+</div>
                <div className="text-[12px] text-gray-600 dark:text-[#EBF2FA]">Data Points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}