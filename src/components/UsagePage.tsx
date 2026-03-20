import { BarChart3, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';

/**
 * USAGE PAGE COMPONENT
 * 
 * PURPOSE: Display current listing usage aligned with member dashboard
 * PRICING MODEL: Listing-based with $0.01 per listing overage
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: GET /api/usage/current - Get current period usage
 * - API Endpoint: GET /api/usage/projected - Get projected usage for month
 * 
 * NAMING CONVENTION:
 * - Usage_Card_ListingsUsage
 * - Usage_Display_ListingsProcessed
 * - Usage_ProgressBar_Listings
 * - Usage_Display_ProjectedListings
 * - Usage_Display_OverageFee
 */

interface UsagePageProps {
  embeddedInTabs?: boolean;
}

export function UsagePage({ embeddedInTabs = false }: UsagePageProps) {
  // MOCK DATA - Replace with API response
  // Simulating different plan tiers
  const CURRENT_PLAN = 'starter'; // 'starter' | 'pro' | 'enterprise'
  
  const planConfigs = {
    starter: { listingsCap: 4000, name: 'Starter' },
    pro: { listingsCap: 10000, name: 'Professional' },
    enterprise: { listingsCap: Infinity, name: 'Enterprise' }
  };

  const currentPlanConfig = planConfigs[CURRENT_PLAN as keyof typeof planConfigs];

  const usage = {
    // Listing-based usage
    listingsProcessed: 3542,                  // DYNAMIC: Current listings processed this month
    listingsLimit: currentPlanConfig.listingsCap, // DYNAMIC: Plan limit
    projectedListings: 3850,                  // DYNAMIC: Projected end-of-month usage
    
    // Overage calculations
    overageRate: 0.01,                        // $0.01 per listing
    
    // Billing period
    billingPeriodStart: '2024-12-01',
    billingPeriodEnd: '2024-12-31',
    daysInPeriod: 31,
    daysElapsed: 7,
    daysRemaining: 24
  };

  // Calculate percentages and overages
  const listingsPercentage = CURRENT_PLAN === 'enterprise' 
    ? 0 
    : (usage.listingsProcessed / usage.listingsLimit) * 100;
  
  const projectedPercentage = CURRENT_PLAN === 'enterprise'
    ? 0
    : (usage.projectedListings / usage.listingsLimit) * 100;

  const currentOverage = CURRENT_PLAN === 'enterprise'
    ? 0
    : Math.max(0, usage.listingsProcessed - usage.listingsLimit);
  
  const projectedOverage = CURRENT_PLAN === 'enterprise'
    ? 0
    : Math.max(0, usage.projectedListings - usage.listingsLimit);

  const currentOverageFee = currentOverage * usage.overageRate;
  const projectedOverageFee = projectedOverage * usage.overageRate;

  const isNearingCap = listingsPercentage >= 90 && CURRENT_PLAN !== 'enterprise';
  const isOverCap = listingsPercentage >= 100 && CURRENT_PLAN !== 'enterprise';

  return (
    <div className={embeddedInTabs ? '' : 'min-h-screen bg-white'}>
      {/* Page Header */}
      {!embeddedInTabs && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-[#342e37]" />
              <h1 className="font-bold">Usage & Billing</h1>
            </div>
            <p className="text-base text-gray-600">
              Monitor your listing usage and billing projections
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={embeddedInTabs ? 'py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'}>
        
        {/* Current Plan Info - Mobile Optimized */}
        <div className="bg-gradient-to-r from-[#FFD447] to-[#FFD447]/80 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#342E37] text-[16px]">{currentPlanConfig.name} Plan</h3>
              <p className="text-[13px] text-[#342E37]/80">
                {CURRENT_PLAN === 'enterprise' 
                  ? 'Unlimited listings per month'
                  : `${currentPlanConfig.listingsCap.toLocaleString()} listings per month`
                }
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[13px] text-[#342E37]/80">Billing Period</div>
              <div className="font-bold text-[#342E37]">
                Dec 1 - Dec 31, 2024
              </div>
            </div>
          </div>
        </div>

        {/* Main Usage Card */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-bold text-[18px]">
              <BarChart3 className="w-5 h-5 text-[#342e37] dark:text-white" />
              Listings Usage
            </CardTitle>
            <CardDescription className="text-[13px]">
              Track your listing processing and overage charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Current Usage Section - Mobile Optimized */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-[#342e37] dark:text-white text-[15px] mb-1">
                    Listings Synced This Month
                  </h4>
                  <p className="text-[13px] text-gray-600">
                    {CURRENT_PLAN === 'enterprise' 
                      ? 'Unlimited listings on your plan'
                      : `${usage.listingsProcessed.toLocaleString()} of ${usage.listingsLimit.toLocaleString()} listings used`
                    }
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-[#342e37] dark:text-white">
                    {usage.listingsProcessed.toLocaleString()}
                  </div>
                  {CURRENT_PLAN !== 'enterprise' && (
                    <div className="text-[13px] text-gray-500 mt-1">
                      {(100 - listingsPercentage).toFixed(0)}% remaining
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {CURRENT_PLAN !== 'enterprise' && (
                <div className="mb-3">
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all rounded-full ${
                        isOverCap ? 'bg-red-500' :
                        isNearingCap ? 'bg-[#fa824c]' : 
                        'bg-[#FFD447]'
                      }`}
                      style={{ width: `${Math.min(listingsPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Usage Status Alert */}
              {isOverCap && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-900 text-[13px]">
                    <span className="font-bold">Over limit:</span> You've processed {currentOverage.toLocaleString()} listings beyond your plan. 
                    Overage fee: ${currentOverageFee.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}

              {isNearingCap && !isOverCap && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 text-[13px]">
                    <span className="font-bold">You're at {listingsPercentage.toFixed(0)}% of your listings</span> — 
                    Extra listings billed at ${usage.overageRate.toFixed(2)} each.
                  </AlertDescription>
                </Alert>
              )}

              {!isNearingCap && CURRENT_PLAN !== 'enterprise' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-900 text-[13px]">
                    You're on track! No overage fees projected this month.
                  </AlertDescription>
                </Alert>
              )}

              {CURRENT_PLAN === 'enterprise' && (
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-[13px]">
                    <span className="font-bold">Unlimited listings</span> — No usage caps on your Enterprise plan.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Projected Usage Section - Mobile Optimized */}
            {CURRENT_PLAN !== 'enterprise' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-5 h-5 text-[#342e37] dark:text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-[#342e37] dark:text-white text-[15px] mb-1">
                      Projected End-of-Month Usage
                    </h4>
                    <p className="text-[13px] text-gray-600">
                      Based on current automation activity and daily average
                    </p>
                  </div>
                </div>
                
                {/* Projection Stats - Stacked on Mobile */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-[11px] text-gray-600 mb-1">PROJECTED TOTAL</div>
                    <div className="font-bold text-[18px] dark:text-white text-[#00a63e]">
                      {usage.projectedListings.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {projectedPercentage.toFixed(0)}% of limit
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-[11px] text-gray-600 mb-1">PROJECTED OVERAGE</div>
                    <div className={`font-bold text-[18px] ${projectedOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {projectedOverage > 0 ? `+${projectedOverage.toLocaleString()}` : '0'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      listings over limit
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-[11px] text-gray-600 mb-1">PROJECTED FEE</div>
                    <div className={`font-bold text-[18px] ${projectedOverageFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${projectedOverageFee.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      overage charges
                    </div>
                  </div>
                </div>

                {/* Daily Average Info */}
                <div className="">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-[13px] text-[#ffffff]">
                        <span className="font-bold">Daily Average:</span> {Math.round(usage.listingsProcessed / usage.daysElapsed)} listings/day
                      </p>
                      <p className="text-[12px] mt-1 text-[#4a5565]">
                        {usage.daysRemaining} days remaining in billing period
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Overage Billing Info - Mobile Optimized */}
            <div className="space-y-3">
              <h4 className="font-bold text-[15px] text-[#ffffff]">Overage Billing</h4>
              
              <div className="space-y-2">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 py-2 border-b">
                  <span className="text-[13px] text-gray-600">Overage Rate</span>
                  <span className="text-[13px] font-bold text-[#ffffff]">
                    ${usage.overageRate.toFixed(2)} per listing
                  </span>
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 py-2 border-b">
                  <span className="text-[13px] text-gray-600">Current Overage</span>
                  <span className={`text-[13px] font-bold ${currentOverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {currentOverage > 0 ? `${currentOverage.toLocaleString()} listings` : 'None'}
                  </span>
                </div>

                {/* Current Overage Fee - Highlighted */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 py-3 px-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <span className="text-[14px] font-bold text-gray-900">Current Overages</span>
                  <span className={`text-[18px] font-bold ${currentOverageFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${currentOverageFee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Billing Note */}
              <div className="">
                <p className="text-[12px] text-gray-700 leading-relaxed">
                  <strong>Note:</strong> Overage fees are calculated at the end of your billing period and added to your next invoice. 
                  Monitor your usage throughout the month to avoid unexpected charges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Upgrade CTA - Only show if nearing/over cap */}
        {(isNearingCap || isOverCap) && CURRENT_PLAN !== 'enterprise' && (
          <Card className="mt-4 border-2 border-[#FFD447] bg-gradient-to-br from-[#FFD447]/10 to-white">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-[#342E37] text-[15px] mb-1">
                    Upgrade to {CURRENT_PLAN === 'starter' ? 'Pro' : 'Enterprise'}
                  </h4>
                  <p className="text-[13px] text-gray-700">
                    {CURRENT_PLAN === 'starter' 
                      ? 'Get 2,000 listings/month and save on overages'
                      : 'Get unlimited listings and premium features'
                    }
                  </p>
                </div>
                <button 
                  className="px-4 py-2 bg-[#342E37] text-white rounded-lg font-bold text-[13px] hover:bg-[#342E37]/90 transition-colors whitespace-nowrap"
                >
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