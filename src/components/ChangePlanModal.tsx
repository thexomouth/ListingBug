import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
 * FEATURES:
 * - Show all available plans
 * - Highlight current plan
 * - Show upgrade vs downgrade differences
 * - Calculate  amounts
 * - Confirm plan change
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

  const currentPlanData = plans.find(p => p.id === currentPlan.toLowerCase());
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
    if (planId === currentPlan.toLowerCase()) return;
    setSelectedPlan(planId);
    setShowConfirmation(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { throw new Error(data.error || 'Failed to start checkout'); }
    } catch (err) {
      console.error(err);
      alert('Could not start checkout. Please try again.');
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
      <div 
        className="fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] w-[calc(100%-2rem)] md:w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200"
        style={{ margin: 0 }}
      >
        
        {!showConfirmation ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-[#ffd447] border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-[#342e37]">Change Your Plan</h2>
                <p className="text-sm text-[#342e37]/80 mt-1">
                  Currently on <span className="font-medium">{currentPlan}</span> - ${currentPrice}/month
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#342e37]" />
              </button>
            </div>

            {/* Plans Grid */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentPlan.toLowerCase();
                  const isSelected = plan.id === selectedPlan;

                  return (
                    <Card
                      key={plan.id}
                      className={`relative transition-all ${
                        isCurrent
                          ? 'border-2 border-green-400 bg-green-50/30'
                          : isSelected
                          ? 'border-2 border-[#342e37] shadow-lg'
                          : 'border-2 border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
                      }`}
                      onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                    >
                      {/* Popular Badge */}
                      {plan.popular && !isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-[#ffd447] text-[#342e37] border-2 border-white shadow-md">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      {/* Current Plan Badge */}
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-green-600 text-white border-2 border-white shadow-md">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current Plan
                          </Badge>
                        </div>
                      )}

                      <CardContent className="p-6">
                        {/* Plan Header */}
                        <div className="text-center mb-6">
                          <h3 className="font-bold text-xl text-[#342e37] mb-2">{plan.name}</h3>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-[#342e37]">${plan.price}</span>
                            <span className="text-gray-600">/month</span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3 mb-6">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Button */}
                        {isCurrent ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            Current Plan
                          </Button>
                        ) : (
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
              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Upgrades</strong> take effect immediately. <strong>Downgrades</strong> take effect at the end of your current billing period.
                </AlertDescription>
              </Alert>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Screen */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                ><ChevronLeft className="w-6 h-6" /></button>
                <div>
                  <h2 className="font-bold text-[#342e37]">Confirm Plan Change</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Review the details of your plan change
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-w-2xl mx-auto">
              {/* Change Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                    <p className="font-bold text-lg text-[#342e37]">{currentPlanData?.name}</p>
                    <p className="text-sm text-gray-600">${currentPlanData?.price}/month</p>
                  </div>

                  <div className="px-6">
                    <ArrowRight className="w-6 h-6 text-[#342e37]" />
                  </div>

                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 mb-1">New Plan</p>
                    <p className="font-bold text-lg text-[#342e37]">{selectedPlanData?.name}</p>
                    <p className="text-sm text-gray-600">${selectedPlanData?.price}/month</p>
                  </div>
                </div>

                {isUpgrade && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                      <p className="font-medium text-blue-900 mb-1">Upgrading Your Plan</p>
                      <p className="text-sm text-blue-800">
                        Your plan starts today. You'll be billed ${selectedPlanData?.price}/month from your first payment.
                        Your next full billing cycle starts on your renewal date.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {isDowngrade && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    <AlertDescription>
                      <p className="font-medium text-amber-900 mb-1">Downgrading Your Plan</p>
                      <p className="text-sm text-amber-800">
                        Your plan will change to <strong>{selectedPlanData?.name}</strong> at the end of your current billing period 
                        (December 15, 2024). You'll continue to have access to {currentPlanData?.name} features until then.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* What Changes */}
              <div className="mb-6">
                <h3 className="font-bold text-[#342e37] mb-4">What's Changing</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Current Features</p>
                    <div className="space-y-2">
                      {currentPlanData?.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">New Features</p>
                    <div className="space-y-2">
                      {selectedPlanData?.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
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