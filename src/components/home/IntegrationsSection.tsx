import { Plug, CheckCircle, Clock, Users, Mail, Database, FileSpreadsheet, Zap, Share2 } from 'lucide-react';

export function IntegrationsSection() {
  const integrations = [
    {
      name: 'Mailchimp',
      icon: Mail,
      status: 'available',
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-500',
      useCases: ['Email campaigns', 'Lead nurturing', 'Market updates'],
    },
    {
      name: 'Google Sheets',
      icon: FileSpreadsheet,
      status: 'available',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500',
      useCases: ['Data analysis', 'Team sharing', 'Custom reporting'],
    },
    {
      name: 'Zapier',
      icon: Zap,
      status: 'available',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500',
      useCases: ['Workflow automation', 'Multi-app sync', 'Custom triggers'],
    },
    {
      name: 'Airtable',
      icon: Database,
      status: 'available',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-500',
      useCases: ['Advanced databases', 'Team collaboration', 'Project tracking'],
    },
    {
      name: 'Salesforce',
      icon: Users,
      status: 'planned',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500',
      useCases: ['CRM integration', 'Lead management', 'Sales pipeline'],
    },
    {
      name: 'HubSpot',
      icon: Share2,
      status: 'planned',
      color: 'from-orange-500 to-pink-500',
      bgColor: 'bg-orange-500',
      useCases: ['Marketing automation', 'Contact management', 'Deal tracking'],
    },
  ];

  const availableIntegrations = integrations.filter(i => i.status === 'available');
  const plannedIntegrations = integrations.filter(i => i.status === 'planned');

  return (
    <div className="bg-white dark:bg-[#0F1115] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 md:mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFCE0A]/10 border border-[#FFCE0A]/30 rounded-full px-4 py-2 mb-4">
            <Plug className="w-4 h-4 text-[#FFCE0A]" />
            <span className="text-sm font-semibold text-[#342e37] dark:text-white">Integrations</span>
          </div>
          <h2 className="mb-4 font-bold text-[36px] md:text-[48px] text-[#342e37] dark:text-white">
            Connect Your Favorite Tools
          </h2>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[18px] md:text-[20px] max-w-3xl mx-auto leading-relaxed">
            Send listings to the tools you already use. <strong className="text-[#342e37] dark:text-white">Seamless automation</strong> with your favorite platforms—no technical skills required.
          </p>
        </div>

        {/* Available Integrations */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-[24px] md:text-[28px] text-[#342e37] dark:text-white">
              Available Now
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableIntegrations.map((integration) => {
              const IconComponent = integration.icon;
              return (
                <div
                  key={integration.name}
                  className="group relative bg-white dark:bg-[#2F2F2F] rounded-xl p-6 border-2 border-gray-200 dark:border-white/10 hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  {/* Gradient accent on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${integration.bgColor} rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>

                    {/* Name & Status */}
                    <div className="mb-3">
                      <h4 className="font-bold text-[18px] text-[#342e37] dark:text-white mb-1">
                        {integration.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[11px] font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Available
                      </span>
                    </div>

                    {/* Use Cases */}
                    <div className="space-y-1.5">
                      {integration.useCases.map((useCase, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-gray-600 dark:text-[#EBF2FA] text-[13px]">
                          <div className="w-1 h-1 rounded-full bg-[#FFCE0A] mt-1.5 flex-shrink-0" />
                          <span>{useCase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Planned MVP Integrations */}
        <div>
          
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plannedIntegrations.map((integration) => {
              const IconComponent = integration.icon;
              return (
                null
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          
        </div>
      </div>
    </div>
  );
}
