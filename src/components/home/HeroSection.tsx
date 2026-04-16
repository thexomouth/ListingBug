import { Mail, MessageSquare, Zap } from 'lucide-react';

interface HeroSectionProps {
  onNavigate?: (page: string) => void;
  onGenerateSample?: (city: string, state: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0F1115] py-[50px] md:py-20">
      <div className="mx-auto max-w-4xl text-center px-4">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#FFCE0A]/10 border border-[#FFCE0A]/30 rounded-full px-4 py-1.5 mb-6">
          <Zap className="w-3.5 h-3.5 text-[#342e37] dark:text-[#FFCE0A]" />
          <span className="text-xs font-semibold text-[#342e37] dark:text-white tracking-wide uppercase">Email + SMS outreach, fully automated</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-[#342e37] dark:text-white mb-5 leading-tight">
          Automate Outreach to<br className="hidden md:block" /> Listing Agents
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-[#EBF2FA] max-w-2xl mx-auto mb-8 leading-relaxed">
          Send email and SMS to every new listing in your market. Set it up once, get new jobs every week.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
          <button
            onClick={() => onNavigate?.('v2-onboarding')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-[15px] font-bold transition-opacity hover:opacity-90"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Start My First Campaign →
          </button>
          <a
            href="/pricing"
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-[15px] font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#EBF2FA] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-center"
          >
            View pricing
          </a>
        </div>

        <p className="text-xs text-gray-400 dark:text-[#EBF2FA]/50">
          7-day free trial · No credit card required · Cancel anytime
        </p>

        {/* Channel pills */}
        <div className="flex justify-center gap-4 mt-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[13px] text-gray-600 dark:text-[#EBF2FA]">
            <Mail className="w-4 h-4 text-[#342e37] dark:text-[#FFCE0A]" />
            Email campaigns
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[13px] text-gray-600 dark:text-[#EBF2FA]">
            <MessageSquare className="w-4 h-4 text-[#342e37] dark:text-[#FFCE0A]" />
            SMS campaigns
          </div>
        </div>

      </div>
    </section>
  );
}
