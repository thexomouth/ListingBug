import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CompletionStatus {
  step1: boolean; // search_runs
  step2: boolean; // integration_connections
  step3: boolean; // automations
  step4: boolean; // messaging_config (optional)
}

interface OnboardingChecklistProps {
  onNavigate?: (page: string) => void;
  onDismiss: () => void;
}

export function OnboardingChecklist({ onNavigate, onDismiss }: OnboardingChecklistProps) {
  const [status, setStatus] = useState<CompletionStatus>({ step1: false, step2: false, step3: false, step4: false });
  const [collapsed, setCollapsed] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [
      { data: searchRuns },
      { data: integrations },
      { data: automations },
      { data: messagingConfig },
    ] = await Promise.all([
      supabase.from('search_runs').select('id').eq('user_id', user.id).limit(1),
      supabase.from('integration_connections').select('id').eq('user_id', user.id).limit(1),
      supabase.from('automations').select('id').eq('user_id', user.id).limit(1),
      supabase.from('messaging_config').select('config').eq('user_id', user.id).eq('platform', 'sendgrid').limit(1),
    ]);

    const newStatus: CompletionStatus = {
      step1: !!(searchRuns?.length),
      step2: !!(integrations?.length),
      step3: !!(automations?.length),
      step4: !!(messagingConfig?.length && messagingConfig[0]?.config?.api_key),
    };

    setStatus(newStatus);
    setLoading(false);

    if (newStatus.step1 && newStatus.step2 && newStatus.step3) {
      setAllDone(true);
      setTimeout(onDismiss, 3000);
    }
  };

  const completedRequired = [status.step1, status.step2, status.step3].filter(Boolean).length;

  if (loading) return null;

  if (allDone) {
    return (
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <span className="font-semibold text-sm text-green-800 dark:text-green-300">You're all set! Setup complete.</span>
      </div>
    );
  }

  const steps = [
    {
      label: 'Run your first search',
      done: status.step1,
      cta: 'Go to Search',
      action: () => onNavigate?.('search-listings'),
    },
    {
      label: 'Connect a destination',
      done: status.step2,
      cta: 'Go to Integrations',
      action: () => onNavigate?.('integrations'),
    },
    {
      label: 'Create your first automation',
      done: status.step3,
      cta: 'Create automation',
      action: () => {
        sessionStorage.setItem('listingbug_automations_tab', 'create');
        onNavigate?.('automations');
      },
    },
    {
      label: 'Set up ListingBug Messaging',
      done: status.step4,
      cta: 'Go to Setup',
      optional: true,
      action: () => {
        sessionStorage.setItem('messaging_open_tab', 'setup');
        onNavigate?.('messaging');
      },
    },
  ];

  return (
    <div className="mb-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Setup guide</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
            {completedRequired}/3 done
          </span>
        </div>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-gray-100 dark:border-white/10">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/5 last:border-b-0"
            >
              <div className="flex-shrink-0">
                {step.done
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${step.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                  {step.label}
                </span>
                {step.optional && !step.done && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                )}
              </div>
              {!step.done && (
                <button
                  onClick={step.action}
                  className="text-xs font-medium text-[#FFCE0A] hover:underline whitespace-nowrap flex-shrink-0"
                >
                  {step.cta} →
                </button>
              )}
            </div>
          ))}

          {/* Dismiss */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <button
              onClick={onDismiss}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
