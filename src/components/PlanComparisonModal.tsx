import { X, Check, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect } from 'react';
import { PLAN_CONFIG, type PlanType } from './utils/planLimits';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  onSelectPlan: (planId: PlanType) => void;
}

const PLANS: PlanType[] = ['city', 'market', 'region'];

export function PlanComparisonModal({ isOpen, onClose, currentPlan, onSelectPlan }: PlanComparisonModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b bg-[#FFCE0A] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#342e37]">Choose Your Plan</h2>
              <p className="text-sm text-[#342e37]/80 mt-0.5">
                Pay for messages, not seats. All plans include email &amp; SMS outreach, shared inbox, and campaign templates.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-[#342e37]" />
            </button>
          </div>

          {/* Plans */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
            <div className="grid md:grid-cols-3 gap-5">
              {PLANS.map(planId => {
                const cfg = PLAN_CONFIG[planId];
                const isCurrent = planId === currentPlan;
                const currentIdx = PLANS.indexOf(currentPlan);
                const thisIdx = PLANS.indexOf(planId);
                const isUpgrade = thisIdx > currentIdx;
                const isMarket = planId === 'market';

                return (
                  <div
                    key={planId}
                    className={`rounded-lg border-2 p-6 relative transition-all ${
                      isMarket ? 'border-[#FFCE0A] shadow-md' : 'border-gray-200'
                    } ${isCurrent ? 'bg-gray-50 dark:bg-white/5' : 'bg-white dark:bg-[#111]'}`}
                  >
                    {isMarket && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-[#FFCE0A] text-[#342E37] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          Most Popular
                        </span>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute top-4 right-4">
                        <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Current
                        </span>
                      </div>
                    )}

                    <h3 className="text-2xl font-bold text-[#342e37] dark:text-white mb-1">{cfg.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold text-[#342e37] dark:text-white">${cfg.price}</span>
                      <span className="text-gray-500 text-sm">/month</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {[
                        `${cfg.messagesPerMonth.toLocaleString()} messages/month`,
                        `${cfg.citiesAllowed} ${cfg.citiesAllowed === 1 ? 'city' : 'cities'}`,
                        'Email & SMS campaigns',
                        'Shared inbox',
                        'Campaign templates',
                        '7-day free trial',
                      ].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    ) : (
                      <Button
                        onClick={() => { onSelectPlan(planId); onClose(); }}
                        className="w-full flex items-center justify-center gap-1"
                        variant={isMarket ? 'default' : 'outline'}
                      >
                        {isUpgrade ? 'Upgrade to ' : 'Switch to '}{cfg.name}
                        {isUpgrade && <ArrowUpRight className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Messages beyond your monthly limit are billed at $0.02/message. Campaigns never stop mid-send. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
