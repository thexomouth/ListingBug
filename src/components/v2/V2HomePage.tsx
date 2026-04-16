import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, MessageSquare, MapPin, Zap, Sparkles, Home, Palette, Trees, Hammer, Shield, Building2, Wrench, Package } from 'lucide-react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const USE_CASES = [
  { icon: Sparkles, label: 'Cleaners' },
  { icon: Home, label: 'Home Inspectors' },
  { icon: Palette, label: 'Stagers' },
  { icon: Trees, label: 'Landscapers' },
  { icon: Hammer, label: 'Roofers' },
  { icon: Shield, label: 'Insurance' },
  { icon: Building2, label: 'RE Agents' },
  { icon: Wrench, label: 'Contractors' },
  { icon: Package, label: 'Movers' },
];

const HOW_STEPS = [
  {
    num: 1,
    icon: MapPin,
    title: 'Set your market',
    body: 'Pick your city and what kind of listings to watch — new listings, price drops, property type. Takes 60 seconds.',
  },
  {
    num: 2,
    icon: Mail,
    title: 'Write your message',
    body: 'Write a short intro email or SMS. Use variables like {{agent_name}} and {{address}} to personalize every send automatically.',
  },
  {
    num: 3,
    icon: MessageSquare,
    title: 'Get replies',
    body: "Every new listing triggers a send. Agent replies land in your shared inbox. You only talk to people who are interested.",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function V2HomePage() {
  const navigate = useNavigate();

  const goToOnboarding = () => navigate('/v2/onboarding');

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-16 pb-20 md:pt-24 md:pb-28 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#FFCE0A]/10 border border-[#FFCE0A]/30 rounded-full px-4 py-1.5 mb-6">
          <Zap className="w-3.5 h-3.5 text-[#342e37] dark:text-[#FFCE0A]" />
          <span className="text-xs font-semibold text-[#342e37] dark:text-white tracking-wide uppercase">Now with direct email + SMS</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-[#342e37] dark:text-white mb-5 leading-tight">
          Automatically reach listing agents<br className="hidden md:block" /> the moment they list
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-[#EBF2FA] max-w-2xl mx-auto mb-8 leading-relaxed">
          ListingBug watches your market 24/7 and sends a branded email or SMS to every new listing agent — before your competitors even see the listing.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
          <button
            onClick={goToOnboarding}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-[15px] font-bold transition-opacity hover:opacity-90"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Set up my first campaign →
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
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-[#0f0f0f] py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#342e37] dark:text-white mb-3">
              How it works
            </h2>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[16px] max-w-xl mx-auto">
              Set it up once in about 5 minutes. ListingBug does the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {HOW_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="bg-white dark:bg-[#2F2F2F] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: '#FFCE0A', color: '#342e37' }}
                    >
                      {s.num}
                    </div>
                    <Icon className="w-5 h-5 text-gray-400 dark:text-[#EBF2FA]/50" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#342e37] dark:text-white mb-2">{s.title}</h3>
                  <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA] leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#342e37] dark:text-white mb-3">
            Built for real estate service providers
          </h2>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px] mb-10 max-w-xl mx-auto">
            Any business that sells to listing agents or new homeowners can use ListingBug to automate their outreach.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {USE_CASES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F] text-[14px] text-gray-700 dark:text-[#EBF2FA]"
              >
                <Icon className="w-4 h-4 text-[#342e37] dark:text-[#FFCE0A]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / after ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-[#0f0f0f] py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#342e37] dark:text-white text-center mb-10">
            Stop hunting for leads manually
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#2F2F2F] rounded-xl p-6 border-l-4 border-l-red-400 border border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-[15px] text-red-800 dark:text-red-400 mb-4">Without ListingBug</h3>
              <ul className="space-y-3 text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                {[
                  'Check Zillow every morning hoping to catch new listings',
                  'Build a spreadsheet of agents to cold-call',
                  'Reach out 3 days after listing — when someone else already got the job',
                  'Repeat this process every single week',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-[#2F2F2F] rounded-xl p-6 border-l-4 border-l-green-400 border border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-[15px] text-green-800 dark:text-green-400 mb-4">With ListingBug</h3>
              <ul className="space-y-3 text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                {[
                  'New listing hits the market — your email goes out automatically',
                  "You're first to reach out, every time",
                  'Agent replies land in your shared inbox — you only respond to interested agents',
                  'Set it up once, get booked consistently',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing callout ──────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#342e37] dark:text-white text-center mb-3">Simple, message-based pricing</h2>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-center text-[15px] mb-10">Plans based on how many messages you send and how many cities you cover.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'City', price: '$19', msgs: '2,500', cities: '1' },
              { name: 'Market', price: '$49', msgs: '5,000', cities: '3', popular: true },
              { name: 'Region', price: '$99', msgs: '10,000', cities: '10' },
            ].map(plan => (
              <div
                key={plan.name}
                className={`rounded-xl p-5 border text-center relative ${plan.popular
                  ? 'border-[#FFCE0A] bg-[#FFCE0A]/5 dark:bg-[#FFCE0A]/10'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FFCE0A] text-[#342e37] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">Popular</span>
                  </div>
                )}
                <div className="text-[18px] font-bold text-[#342e37] dark:text-white mb-1">{plan.name}</div>
                <div className="text-[32px] font-bold text-[#342e37] dark:text-white">{plan.price}<span className="text-[14px] font-normal text-gray-500">/mo</span></div>
                <div className="text-[13px] text-gray-600 dark:text-[#EBF2FA] mt-2">{plan.msgs} messages</div>
                <div className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">{plan.cities} {Number(plan.cities) === 1 ? 'city' : 'cities'}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-[12px] text-gray-400 dark:text-[#EBF2FA]/50 mt-4">
            Overages billed at $0.02/message · All plans include email + SMS + shared inbox
          </p>

          <div className="text-center mt-6">
            <a href="/pricing" className="text-[14px] text-[#342e37] dark:text-[#FFCE0A] underline underline-offset-2 hover:opacity-80">
              See full plan comparison →
            </a>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-2xl mx-auto text-center bg-[#FFCE0A] rounded-2xl px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#342e37] mb-3">
            Your first campaign goes out today
          </h2>
          <p className="text-[#342e37]/80 text-[15px] mb-6">
            Set up in 5 minutes. Free for 7 days. No credit card required.
          </p>
          <button
            onClick={goToOnboarding}
            className="px-8 py-3.5 rounded-lg text-[15px] font-bold bg-[#342e37] text-white hover:bg-[#342e37]/90 transition-colors"
          >
            Set up my first campaign →
          </button>
          <p className="text-[#342e37]/60 text-[12px] mt-4">
            7-day free trial · No credit card · Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
}
