import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { X, Check, Crown, Zap, Building2, TrendingUp, TrendingDown, CheckCircle, Sparkles, Info, ArrowRight, ChevronLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';

/**
 * CHANGE PLAN MODAL
 * 
 * PURPOSE: Allow users to upgrade or downgrade their subscription plan
 * 
 * DESIGN MODES:
 * - LIGHT MODE (SAVED): Original light mode design with yellow header (#ffd447), white backgrounds, dark text (#342e37)
 * - DARK MODE (REDESIGNED): New dark mode implementation with brand yellow accents (#FFCE0A), dark containers (#2F2F2F, #1a1a2e), light text
 * 
 * STYLING APPROACH:
 * All components use Tailwind's dark: prefix for dark mode compatibility
 * Dark mode uses consistent color scheme: bg-[#2F2F2F] (main), bg-[#1a1a2e] (secondary), text-white/80 (secondary text), #FFCE0A (accents)
 * 
 * FEATURES:
 * - Show all available plans
 * - Highlight current plan
 * - Show upgrade vs downgrade differences
 * - Calculate  amounts
 * - Confirm plan change
 * - Full light/dark mode support
 * 
 * BACKEND INTEGRATION:
 * - POST /api/billing/change-plan
 * - Body: { newPlan: "Professional" | "Enterprise" | "Starter" }
 */

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    reports: number | 'Unlimited';
    dataPoints: number;
    users?: number;
  };
  popular?: boolean;
}

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  currentPrice: number;
  onChangePlan: (planId: string) => void;
}

export function ChangePlanModal({
  isOpen,
  onClose,
  currentPlan,
  currentPrice,
  onChangePlan,
}: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Trial',
      price: 0,
      interval: 'month',
      features: [
        'Limited listings',
        'Limited automations',
        'All 9 integrations',
        'Email notifications',
        'CSV exports',
        'Basic support',
      ],
      limits: {
        reports: 1000,
        dataPoints: 10000,
        users: 1,
      },
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      interval: 'month',
      features: [
        '4,000 listings/month',
        '1 automation',
        'All 9 integrations',
        'Email notifications',
        'CSV exports',
        'Basic support',
      ],
      limits: {
        reports: 4000,
        dataPoints: 40000,
        users: 1,
      },
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      interval: 'month',
      features: [
        '10,000 listings/month',
        'Property valuations',
        'Relisted property alerts',
        'Priority support',
        'Advanced search filters',
        'All 9 integrations',
      ],
      limits: {
        reports: 10000,
        dataPoints: 100000,
        users: 3,
      },
      popular: true,
    },
  ];

  const isTrialUser = currentPlan.toLowerCase() === 'trial';
  const isStarterUser = currentPlan.toLowerCase() === 'starter';
  const isProUser = currentPlan.toLowerCase() === 'professional' || currentPlan.toLowerCase() === 'pro';
  const currentPlanId = isTrialUser ? 'trial' : isStarterUser ? 'starter' : isProUser ? 'professional' : currentPlan.toLowerCase();
  const currentPlanData = plans.find(p => p.id === currentPlanId);
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const isUpgrade = selectedPlanData && currentPlanData && selectedPlanData.price > currentPlanData.price;
  const isDowngrade = selectedPlanData && currentPlanData && selectedPlanData.price < currentPlanData.price;

  const calculate = () => {
    if (!selectedPlanData || !currentPlanData) return 0;
    
    // Mock calculation - in real app, this comes from backend
    const daysRemaining = 15; // Example: 15 days left in current billing period
    const dailyRateOld = currentPlanData.price / 30;
    const dailyRateNew = selectedPlanData.price / 30;
    const credit = dailyRateOld * daysRemaining;
    const charge = dailyRateNew * daysRemaining;
    
    return charge - credit;
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlanId) return;
    setSelectedPlan(planId);
    setShowConfirmation(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      // Get session — refresh if needed to guarantee a valid token
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData.session;
      }
      if (!session?.access_token) throw new Error('Not authenticated — please sign in again');

      const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      let data: any = {};
      try { data = await res.json(); } catch (_) {}

      if (data.url) {
        // Open Stripe checkout in a new tab so our app stays open
        const stripeTab = window.open(data.url, '_blank');

        // Poll for when the user closes/returns from the Stripe tab, then reload
        if (stripeTab) {
          const pollInterval = setInterval(() => {
            if (stripeTab.closed) {
              clearInterval(pollInterval);
              // Reload the page so billing state reflects any changes
              window.location.reload();
            }
          }, 1000);
        }

        onClose();
        setIsProcessing(false);
      } else {
        const msg = data.error || data.detail || `Checkout failed (${res.status})`;
        throw new Error(msg);
      }
    } catch (err: any) {
      console.error('Checkout error:', err.message);
      alert(`Could not start checkout: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setSelectedPlan(null);
  };

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal - Always centered in viewport */}
      {/* LIGHT MODE: bg-white | DARK MODE: dark:bg-[#2F2F2F] */}
      <div 
        className="fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] w-[calc(100%-2rem)] md:w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#2F2F2F] rounded-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200"
        style={{ margin: 0 }}
      >
        
        {!showConfirmation ? (
          <>
            {/* Header */}
            {/* LIGHT MODE: bg-[#ffd447] with dark text | DARK MODE: dark:bg-[#FFCE0A] dark:text-[#0F1115] */}
            <div className="sticky top-0 bg-[#ffd447] dark:bg-[#FFCE0A] border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-[#342e37] dark:text-[#0F1115]">Change Your Plan</h2>
                <p className="text-sm text-[#342e37]/80 dark:text-white/70 mt-1">
                  {isTrialUser ? 'Free trial — choose a plan to continue' : `Currently on ${currentPlan} — $${currentPrice}/month`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#342e37] dark:text-[#0F1115]" />
              </button>
            </div>

            {/* Plans Grid */}
            {/* LIGHT MODE: Light background | DARK MODE: dark:bg-[#2F2F2F] */}
            <div className="p-6 bg-white dark:bg-[#2F2F2F]">
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {plans.filter(plan => plan.id !== 'trial').map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const isSelected = plan.id === selectedPlan;
                  // Special style for trial: dark bg, yellow border, no 'Current Plan' badge
                  let cardClass = 'relative transition-all bg-white dark:bg-[#1a1a2e]';
                  if (plan.id === 'trial') {
                    cardClass = 'relative transition-all bg-[#1a1a2e] border-2 border-[#FFCE0A]';
                  } else if (isCurrent && plan.id === 'starter') {
                    cardClass = 'relative transition-all bg-white dark:bg-[#1a1a2e] border-2 border-green-400 dark:border-green-500 bg-green-50/30 dark:bg-green-500/10';
                  } else if (isCurrent && plan.id === 'professional') {
                    cardClass = 'relative transition-all bg-white dark:bg-[#1a1a2e] border-2 border-[#FFCE0A] dark:border-[#FFCE0A] shadow-lg dark:shadow-xl dark:shadow-[#FFCE0A]/20';
                  } else if (isSelected) {
                    cardClass = 'relative transition-all bg-white dark:bg-[#1a1a2e] border-2 border-[#342e37] dark:border-[#FFCE0A] shadow-lg dark:shadow-xl dark:shadow-[#FFCE0A]/20';
                  } else {
                    cardClass = 'relative transition-all bg-white dark:bg-[#1a1a2e] border-2 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md dark:hover:shadow-lg cursor-pointer';
                  }

                  return (
                    <Card
                      key={plan.id}
                      className={cardClass}
                      onClick={() => !isCurrent && plan.id !== 'trial' && handleSelectPlan(plan.id)}
                    >
                      {/* Popular Badge */}
                      {plan.popular && !isCurrent && plan.id !== 'trial' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-[#ffd447] dark:bg-[#FFCE0A] text-[#342e37] dark:text-[#0F1115] border-2 border-white shadow-md">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      {/* Current Plan Badge */}
                      {isCurrent && plan.id === 'starter' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-green-600 text-white border-2 border-white shadow-md">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current Plan
                          </Badge>
                        </div>
                      )}
                      {isCurrent && plan.id === 'professional' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-[#FFCE0A] text-[#0F1115] border-2 border-white shadow-md">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current Plan
                          </Badge>
                        </div>
                      )}
                      {/* No badge for trial */}

                      <CardContent className="p-6">
                        <div className="text-center mb-6">
                          <h3 className="font-bold text-xl text-[#342e37] dark:text-white mb-2">{plan.name}</h3>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-[#342e37] dark:text-white">${plan.price}</span>
                            <span className="text-gray-600 dark:text-white/60">/month</span>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-white/80">{feature}</span>
                            </div>
                          ))}
                        </div>
                        {/* Action Button */}
                        {isCurrent && plan.id === 'starter' && (
                          <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                        )}
                        {isCurrent && plan.id === 'professional' && (
                          <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                        )}
                        {/* For trial, show upgrade button to Starter */}
                        {plan.id === 'starter' && isTrialUser && (
                          <Button className="w-full" variant="default" onClick={(e) => { e.stopPropagation(); handleSelectPlan('starter'); }}>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade to Starter
                          </Button>
                        )}
                        {/* For selectable plans (not current, not trial) */}
                        {!isCurrent && plan.id !== 'trial' && !(plan.id === 'starter' && isTrialUser) && (
                          <Button
                            className="w-full"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPlan(plan.id);
                            }}
                          >
                            {plan.price > currentPrice ? (
                              <>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Upgrade to {plan.name}
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4 mr-2" />
                                Downgrade to {plan.name}
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Info Box */}
              {/* LIGHT MODE: Light gray background | DARK MODE: dark:bg-white/5 dark:border-white/10 dark:text-white/80 */}
              <Alert className="mt-6 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <Info className="h-4 w-4 text-gray-600 dark:text-white/60" />
                <AlertDescription className="text-gray-700 dark:text-white/80">
                  <strong>Upgrades</strong> take effect immediately. <strong>Downgrades</strong> take effect at the end of your current billing period.
                </AlertDescription>
              </Alert>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Screen */}
            {/* LIGHT MODE: White background | DARK MODE: dark:bg-[#2F2F2F] dark:border-white/10 */}
            <div className="sticky top-0 bg-white dark:bg-[#2F2F2F] border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                ><ChevronLeft className="w-6 h-6" /></button>
                <div>
                  <h2 className="font-bold text-[#342e37] dark:text-white">Confirm Plan Change</h2>
                  <p className="text-sm text-gray-600 dark:text-white/60 mt-1">
                    Review the details of your plan change
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-white/60" />
              </button>
            </div>

            {/* LIGHT MODE: Light background | DARK MODE: dark:bg-[#1a1a2e] */}
            <div className="p-6 max-w-2xl mx-auto bg-white dark:bg-[#2F2F2F]">
              {/* Change Summary */}
              <div className="bg-gray-50 dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-lg p-6 mb-6">
                {isTrialUser ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-white/60 mb-1">Upgrading to</p>
                    <p className="font-bold text-lg text-[#342e37] dark:text-white">{selectedPlanData?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-white/60">${selectedPlanData?.price}/month</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <p className="text-sm text-gray-600 dark:text-white/60 mb-1">Current Plan</p>
                        <p className="font-bold text-lg text-[#342e37] dark:text-white">{currentPlanData?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-white/60">${currentPlanData?.price}/month</p>
                      </div>
                      <div className="px-6">
                        <ArrowRight className="w-6 h-6 text-[#342e37] dark:text-white/60" />
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-sm text-gray-600 dark:text-white/60 mb-1">New Plan</p>
                        <p className="font-bold text-lg text-[#342e37] dark:text-white">{selectedPlanData?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-white/60">${selectedPlanData?.price}/month</p>
                      </div>
                    </div>
                    {isUpgrade && (
                      <Alert className="bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription>
                          <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">Upgrading Your Plan</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200/80">
                            Your plan starts today. You'll be billed ${selectedPlanData?.price}/month from your first payment.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                    {isDowngrade && (
                      <Alert className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
                        <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription>
                          <p className="font-medium text-amber-900 dark:text-amber-300 mb-1">Downgrading Your Plan</p>
                          <p className="text-sm text-amber-800 dark:text-amber-200/80">
                            Your plan will change to <strong>{selectedPlanData?.name}</strong> at the end of your current billing period.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
              {/* LIGHT MODE: Dark text | DARK MODE: dark:text-white */}
              <div className="mb-6">
                <h3 className="font-bold text-[#342e37] dark:text-white mb-4">What's Changing</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-white/60 mb-2">Current Features</p>
                    <div className="space-y-2">
                      {currentPlanData?.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400 dark:text-white/40">•</span>
                          <span className="text-gray-600 dark:text-white/70">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-white/60 mb-2">New Features</p>
                    <div className="space-y-2">
                      {selectedPlanData?.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-white/80">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Info */}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmChange}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing...' : `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

/**
 * BACKEND API
 * 
 * POST /api/billing/change-plan
 * 
 * Request:
 * {
 *   "newPlan": "professional",
 *   "billingCycle": "monthly"
 * }
 * 
 * Response (Upgrade):
 * {
 *   "success": true,
 *   "change": {
 *     "type": "upgrade",
 *     "fromPlan": "Starter",
 *     "toPlan": "Professional",
 *     "effectiveDate": "2024-11-23T10:30:00Z",
 *     "": 15.50,
 *     "nextBillingDate": "2024-12-15T00:00:00Z",
 *     "nextBillingAmount": 49.00
 *   }
 * }
 * 
 * Response (Downgrade):
 * {
 *   "success": true,
 *   "change": {
 *     "type": "downgrade",
 *     "fromPlan": "Professional",
 *     "toPlan": "Starter",
 *     "effectiveDate": "2024-12-15T00:00:00Z",
 *     "scheduledDate": "2024-12-15T00:00:00Z",
 *     "nextBillingAmount": 19.00
 *   }
 * }
 */