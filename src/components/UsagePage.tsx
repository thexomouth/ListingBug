import { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../lib/supabase';
import { normalizePlan, PLAN_CONFIG, getNextPlan, getMessageUsage, type PlanType } from './utils/planLimits';

interface UsagePageProps {
  embeddedInTabs?: boolean;
}

const OVERAGE_RATE = 0.02;

export function UsagePage({ embeddedInTabs = false }: UsagePageProps) {
  const [plan, setPlan] = useState<PlanType>('trial');
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [periodLabel, setPeriodLabel] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('plan, trial_ends_at, stripe_subscription_end')
        .eq('id', user.id)
        .single();

      if (!userData) { setIsLoading(false); return; }

      const normalizedPlan = normalizePlan(userData.plan);
      setPlan(normalizedPlan);

      let used = 0;

      if (userData.stripe_subscription_end) {
        const periodEnd = new Date(userData.stripe_subscription_end);
        const periodStart = new Date(periodEnd);
        periodStart.setMonth(periodStart.getMonth() - 1);
        const now = new Date();
        const totalDays = Math.round((periodEnd.getTime() - periodStart.getTime()) / 86_400_000);
        const elapsed = Math.max(1, Math.round((now.getTime() - periodStart.getTime()) / 86_400_000));
        const remaining = Math.max(0, Math.round((periodEnd.getTime() - now.getTime()) / 86_400_000));

        setDaysElapsed(Math.min(elapsed, totalDays));
        setDaysRemaining(remaining);
        setPeriodLabel(
          `Billing period · resets ${periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        );

        const { data: logs } = await supabase
          .from('usage_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('logged_at', periodStart.toISOString());
        used = logs?.length ?? 0;
      } else if (normalizedPlan === 'trial' && userData.trial_ends_at) {
        const end = new Date(userData.trial_ends_at);
        const diffDays = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
        setPeriodLabel(`Trial · ${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`);
        const { count } = await supabase
          .from('usage_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        used = count ?? 0;
      } else {
        setPeriodLabel('All time');
        const { count } = await supabase
          .from('usage_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        used = count ?? 0;
      }

      setMessagesUsed(used);
      setIsLoading(false);
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#FFCE0A', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const planConfig = PLAN_CONFIG[plan];
  const { used, limit, remaining, pct, isNearLimit, isOverLimit } = getMessageUsage(plan, messagesUsed);
  const overageMessages = Math.max(0, used - limit);
  const overageFee = overageMessages * OVERAGE_RATE;
  const dailyAvg = daysElapsed > 0 ? messagesUsed / daysElapsed : 0;
  const projected = Math.round(messagesUsed + dailyAvg * daysRemaining);
  const projectedOverage = Math.max(0, projected - limit);
  const projectedFee = projectedOverage * OVERAGE_RATE;
  const nextPlan = getNextPlan(plan);

  const barColor = isOverLimit ? '#ef4444' : isNearLimit ? '#fa824c' : '#FFCE0A';

  return (
    <div className={embeddedInTabs ? '' : 'min-h-screen bg-white dark:bg-[#0f0f0f]'}>
      {!embeddedInTabs && (
        <div className="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
              <h1 className="font-bold text-gray-900 dark:text-white">Usage & Billing</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monitor your message usage and billing</p>
          </div>
        </div>
      )}

      <div className={embeddedInTabs ? 'py-4 space-y-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4'}>

        {/* Current plan + usage */}
        <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
              <Zap className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
              {planConfig.name} Plan
              {planConfig.price != null && planConfig.price > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  ${planConfig.price}/month
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-[13px] text-gray-600 dark:text-gray-400">
              {periodLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <p className="font-bold text-[#342e37] dark:text-white text-[15px] mb-0.5">Messages This Period</p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  {used.toLocaleString()} of {limit.toLocaleString()} messages used
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-3xl font-bold text-[#342e37] dark:text-white">{used.toLocaleString()}</div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {remaining.toLocaleString()} remaining
                </div>
              </div>
            </div>

            <div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{pct}% used</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {limit.toLocaleString()} msg limit
                </span>
              </div>
            </div>

            {isOverLimit && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-900 dark:text-red-300 text-[13px]">
                  <span className="font-bold">Over limit:</span> {overageMessages.toLocaleString()} messages over your plan.
                  Current overage fee: <span className="font-bold">${overageFee.toFixed(2)}</span>
                </AlertDescription>
              </Alert>
            )}
            {isNearLimit && !isOverLimit && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-900 dark:text-amber-300 text-[13px]">
                  <span className="font-bold">Approaching your limit</span> — extra messages are billed at $0.02 each.
                </AlertDescription>
              </Alert>
            )}
            {!isNearLimit && !isOverLimit && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-[13px] text-gray-600 dark:text-gray-400">
                  On track — no overage fees projected this period.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projected usage */}
        {daysRemaining > 0 && (
          <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-bold text-[16px] text-[#342e37] dark:text-white">
                <TrendingUp className="w-4 h-4 text-[#342e37] dark:text-[#FFCE0A]" />
                Projected End-of-Period
              </CardTitle>
              <CardDescription className="text-[13px] text-gray-500 dark:text-gray-400">
                {dailyAvg.toFixed(1)} messages/day average · {daysRemaining} days remaining
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-white/10">
                <div className="pr-3">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Projected total</div>
                  <div className={`font-bold text-[20px] ${projectedOverage > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {projected.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {((projected / limit) * 100).toFixed(0)}% of limit
                  </div>
                </div>
                <div className="px-3">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Projected overage</div>
                  <div className={`font-bold text-[20px] ${projectedOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {projectedOverage > 0 ? `+${projectedOverage.toLocaleString()}` : '0'}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">messages over</div>
                </div>
                <div className="pl-3">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Projected fee</div>
                  <div className={`font-bold text-[20px] ${projectedFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${projectedFee.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">overage charges</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overage billing details */}
        <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-[16px] text-[#342e37] dark:text-white">Overage Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/10">
              <span className="text-[13px] text-gray-600 dark:text-gray-400">Overage rate</span>
              <span className="text-[13px] font-bold text-gray-900 dark:text-white">$0.02 per message</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${overageMessages > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className="text-[13px] text-gray-600 dark:text-gray-400">Current overage</span>
              </div>
              <span className={`text-[13px] font-bold ${overageMessages > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overageMessages > 0 ? `${overageMessages.toLocaleString()} messages` : 'None'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[14px] font-bold text-gray-900 dark:text-white">Current overage fee</span>
              <span className={`text-[18px] font-bold ${overageFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${overageFee.toFixed(2)}
              </span>
            </div>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 pt-2">
              Overage fees are added to your next invoice at the end of the billing period. Campaigns never stop mid-send.
            </p>
          </CardContent>
        </Card>

        {/* Upgrade nudge */}
        {nextPlan.plan && (isNearLimit || isOverLimit) && (
          <Card className="border-2 border-[#FFCE0A] bg-gradient-to-br from-[#FFCE0A]/10 to-white dark:to-transparent dark:from-[#FFCE0A]/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#342E37] dark:text-white text-[15px] mb-0.5">
                  Upgrade to {nextPlan.name} — {nextPlan.price}
                </h4>
                <p className="text-[13px] text-gray-700 dark:text-gray-400">
                  {nextPlan.plan === 'market'
                    ? '5,000 messages/month · 3 cities'
                    : '10,000 messages/month · 10 cities'}
                </p>
              </div>
              <a
                href="/pricing"
                className="px-4 py-2 bg-[#342E37] text-white rounded-lg font-bold text-[13px] hover:bg-[#342E37]/90 transition-colors whitespace-nowrap text-center no-underline"
              >
                View Plans
              </a>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
