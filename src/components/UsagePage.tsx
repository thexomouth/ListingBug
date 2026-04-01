import { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { supabase } from '../lib/supabase';
import { getBillingPeriod } from './utils/billingPeriod';

interface UsagePageProps {
  embeddedInTabs?: boolean;
}

export function UsagePage({ embeddedInTabs = false }: UsagePageProps) {
  const [planState, setPlanState] = useState({
    planKey: 'trial',
    planName: 'Trial',
    listingsCap: 1000,
    isTrial: true,
    trialEndsAt: '',
    billingPeriodLabel: '',
  });

  const planConfigs = {
    trial: { listingsCap: 1000, name: 'Trial' },
    starter: { listingsCap: 4000, name: 'Starter' },
    professional: { listingsCap: 10000, name: 'Professional' },
    enterprise: { listingsCap: Infinity, name: 'Enterprise' },
  };

  const currentPlanConfig = planConfigs[planState.planKey as keyof typeof planConfigs] || planConfigs.starter;

  const [usage, setUsage] = useState({
    listingsProcessed: 0,
    listingsLimit: currentPlanConfig.listingsCap,
    projectedListings: 0,
    overageRate: 0.01,
    daysInPeriod: 30,
    daysElapsed: 1,
    daysRemaining: 29,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan, plan_status, trial_ends_at, stripe_subscription_end, created_at')
        .eq('id', user.id)
        .single();

      if (userError || !userData) { setIsLoading(false); return; }

      const planKey = userData.plan?.toLowerCase() || 'trial';
      const planName = planConfigs[planKey as keyof typeof planConfigs]?.name || 'Trial';
      const listingsCap = planConfigs[planKey as keyof typeof planConfigs]?.listingsCap || 1000;
      const isTrial = planKey === 'trial' || !!userData.trial_ends_at;

      // Compute billing period anchored to account creation date
      const period = getBillingPeriod(userData.created_at);

      let billingPeriodLabel = '';
      if (isTrial && userData.trial_ends_at) {
        const end = new Date(userData.trial_ends_at);
        const now = new Date();
        const diffDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const formatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        billingPeriodLabel = `Trial Period | ${diffDays} day${diffDays !== 1 ? 's' : ''} remaining (${formatted})`;
      } else {
        billingPeriodLabel = `Billing Period | ${period.label}`;
      }

      setPlanState({ planKey, planName, listingsCap, isTrial, trialEndsAt: userData.trial_ends_at || '', billingPeriodLabel });

      // Sum usage_tracking rows that overlap the billing period
      let listingsProcessed = 0;
      if (period.monthYears.length > 0) {
        const { data: usageRows } = await supabase
          .from('usage_tracking')
          .select('listings_fetched')
          .eq('user_id', user.id)
          .in('month_year', period.monthYears);

        if (usageRows) {
          listingsProcessed = usageRows.reduce((sum: number, r: any) => sum + (r.listings_fetched ?? 0), 0);
        }
      }

      const dailyAverage = period.daysElapsed > 0 ? listingsProcessed / period.daysElapsed : 0;
      const projectedListings = Math.round(listingsProcessed + (dailyAverage * period.daysRemaining));

      setUsage({
        listingsProcessed,
        listingsLimit: listingsCap,
        projectedListings,
        overageRate: 0.01,
        daysInPeriod: period.daysInPeriod,
        daysElapsed: period.daysElapsed,
        daysRemaining: period.daysRemaining,
      });
      setIsLoading(false);
    };

    loadUsage();
  }, []);

  const isEnterprise = planState.planKey === 'enterprise';
  const listingsPercentage = isEnterprise ? 0 : (usage.listingsProcessed / usage.listingsLimit) * 100;
  const projectedPercentage = isEnterprise ? 0 : (usage.projectedListings / usage.listingsLimit) * 100;
  const currentOverage = isEnterprise ? 0 : Math.max(0, usage.listingsProcessed - usage.listingsLimit);
  const projectedOverage = isEnterprise ? 0 : Math.max(0, usage.projectedListings - usage.listingsLimit);
  const currentOverageFee = currentOverage * usage.overageRate;
  const projectedOverageFee = projectedOverage * usage.overageRate;
  const isNearingCap = !isEnterprise && listingsPercentage >= 90;
  const isOverCap = !isEnterprise && listingsPercentage >= 100;

  return (
    <div className={embeddedInTabs ? '' : 'min-h-screen bg-white'}>
      {!embeddedInTabs && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-[#342e37]" />
              <h1 className="font-bold">Usage & Billing</h1>
            </div>
            <p className="text-base text-gray-600">Monitor your listing usage and billing projections</p>
          </div>
        </div>
      )}

      <div className={embeddedInTabs ? 'py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'}>
        <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
              <BarChart3 className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
              Listings Usage
            </CardTitle>
            <CardDescription className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">
              {planState.billingPeriodLabel || 'Track your listing processing and overage charges'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-[#342e37] dark:text-white text-[15px] mb-1">
                    Listings Synced This Billing Period
                  </h4>
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">
                    {isEnterprise
                      ? 'Unlimited listings on your plan'
                      : `${usage.listingsProcessed.toLocaleString()} of ${usage.listingsLimit.toLocaleString()} listings used`
                    }
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-[#342e37] dark:text-white">
                    {usage.listingsProcessed.toLocaleString()}
                  </div>
                  {!isEnterprise && (
                    <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                      {Math.max(0, 100 - listingsPercentage).toFixed(0)}% remaining
                    </div>
                  )}
                </div>
              </div>

              {planState.planKey !== 'enterprise' && (
                <div className="mb-3">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${isOverCap ? 'bg-red-500' : isNearingCap ? 'bg-[#fa824c]' : 'bg-[#FFD447]'}`}
                      style={{ width: `${Math.min(listingsPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {isOverCap && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-900 text-[13px]">
                    <span className="font-bold">Over limit:</span> You've processed {currentOverage.toLocaleString()} listings beyond your plan. Overage fee: ${currentOverageFee.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}

              {isNearingCap && !isOverCap && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 text-[13px]">
                    <span className="font-bold">You're at {listingsPercentage.toFixed(0)}% of your listings</span> — Extra listings billed at ${usage.overageRate.toFixed(2)} each.
                  </AlertDescription>
                </Alert>
              )}

              {!isNearingCap && planState.planKey !== 'enterprise' && (
                <div className="flex items-center gap-2 py-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[13px] text-gray-600 dark:text-gray-400">You're on track! No overage fees projected this billing period.</span>
                </div>
              )}

              {planState.planKey === 'enterprise' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-[13px]">
                    <span className="font-bold">Unlimited listings</span> — No usage caps on your Enterprise plan.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {planState.planKey !== 'enterprise' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-[#342e37] dark:text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-[#342e37] dark:text-white text-[15px] mb-1">Projected End-of-Period Usage</h4>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400">Based on current daily average</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-white/10">
                  <div className="pr-3">
                    <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">PROJECTED TOTAL</div>
                    <div className="font-bold text-[18px] text-[#00a63e]">{usage.projectedListings.toLocaleString()}</div>
                    <div className="text-[11px] text-gray-500">{projectedPercentage.toFixed(0)}% of limit</div>
                  </div>
                  <div className="px-3">
                    <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">PROJECTED OVERAGE</div>
                    <div className={`font-bold text-[18px] ${projectedOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {projectedOverage > 0 ? `+${projectedOverage.toLocaleString()}` : '0'}
                    </div>
                    <div className="text-[11px] text-gray-500">listings over limit</div>
                  </div>
                  <div className="pl-3">
                    <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">PROJECTED FEE</div>
                    <div className={`font-bold text-[18px] ${projectedOverageFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${projectedOverageFee.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-gray-500">overage charges</div>
                  </div>
                </div>

                <div>
                  <p className="text-[13px] text-gray-900 dark:text-white">
                    <span className="font-bold">Daily Average:</span>{' '}
                    {usage.daysElapsed > 0 ? `${(usage.listingsProcessed / usage.daysElapsed).toFixed(1)} listings/day` : '0 listings/day'}
                  </p>
                  <p className="text-[12px] mt-1 text-gray-500 dark:text-gray-400">
                    {usage.daysRemaining} days remaining in billing period
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h4 className="font-bold text-[15px] text-gray-900 dark:text-white">Overage Billing</h4>
              <div className="space-y-2">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 py-2 border-b">
                  <span className="text-[13px] text-gray-600 dark:text-gray-400">Overage Rate</span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white">${usage.overageRate.toFixed(2)} per listing</span>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${currentOverage > 0 ? 'bg-yellow-400' : 'bg-green-500'}`} />
                    <span className="text-[13px] text-gray-600 dark:text-gray-400">Current Overage</span>
                  </div>
                  <span className={`text-[13px] font-bold ${currentOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {currentOverage > 0 ? `${currentOverage.toLocaleString()} listings` : 'None'}
                  </span>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 py-3">
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white">Current Overage Fees</span>
                  <span className={`text-[18px] font-bold ${currentOverageFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${currentOverageFee.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-gray-700 dark:text-gray-400 leading-relaxed">
                <strong>Note:</strong> Overage fees are calculated at the end of your billing period and added to your next invoice.
              </p>
            </div>
          </CardContent>
        </Card>

        {(isNearingCap || isOverCap) && planState.planKey !== 'enterprise' && (
          <Card className="mt-4 border-2 border-[#FFD447] bg-gradient-to-br from-[#FFD447]/10 to-white dark:to-transparent">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-[#342E37] dark:text-white text-[15px] mb-1">
                    Upgrade to {planState.planKey === 'starter' ? 'Pro' : 'Enterprise'}
                  </h4>
                  <p className="text-[13px] text-gray-700 dark:text-gray-400">
                    {planState.planKey === 'starter' ? 'Get 10,000 listings/period and save on overages' : 'Get unlimited listings and premium features'}
                  </p>
                </div>
                <button className="px-4 py-2 bg-[#342E37] text-white rounded-lg font-bold text-[13px] hover:bg-[#342E37]/90 transition-colors whitespace-nowrap">
                  View Plans
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
