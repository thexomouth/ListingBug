import { X, Check, Crown, Building2, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useEffect } from 'react';

/**
 * PLAN COMPARISON MODAL
 * 
 * PURPOSE: Display plan comparison and handle upgrades/downgrades
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: POST /api/billing/change-plan - Initiate plan change
 * - Stripe Checkout: Redirects to Stripe for payment if upgrading
 * - Stripe Portal: Handles downgrade via customer portal
 * 
 * NAMING CONVENTION:
 * - PlanModal_Card_Professional
 * - PlanModal_Card_Enterprise
 * - PlanModal_Price_Professional
 * - PlanModal_Feature_Item
 * - PlanModal_Button_SelectPlan
 * - PlanModal_Badge_CurrentPlan
 */

interface Plan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  description: string;
  features: string[];
  limits: {
    reports: number;
    dataPoints: number;
    teamMembers: number;
  };
  popular?: boolean;
}

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onSelectPlan: (planId: string) => void;
}

export function PlanComparisonModal({ 
  isOpen, 
  onClose, 
  currentPlan,
  onSelectPlan 
}: PlanComparisonModalProps) {
  
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

  // PLANS CONFIGURATION
  // TODO: Fetch from API - GET /api/billing/plans
  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      billingCycle: 'monthly',
      description: 'For local businesses in one city',
      features: [
        '4,000 listings per month',
        '1 automation',
        'All 9 integrations',
        'Email notifications',
        'CSV exports',
        'Basic support',
      ],
      limits: {
        reports: 4000,
        dataPoints: 40000,
        teamMembers: 1,
      },
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      billingCycle: 'monthly',
      description: 'For businesses covering a greater area',
      features: [
        '10,000 listings per month',
        'Property valuations',
        'Relisted property alerts',
        'Priority support',
        'Advanced search filters',
        'All 9 integrations',
        'Email & Slack notifications',
        'CSV exports',
      ],
      limits: {
        reports: 10000,
        dataPoints: 100000,
        teamMembers: 3,
      },
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 0, // Contact for pricing
      billingCycle: 'monthly',
      description: 'For teams and agencies',
      features: [
        'Unlimited listings',
        'Property valuations',
        'Relisted property alerts',
        'Team collaboration (10 users)',
        'Dedicated account manager',
        'All 9 integrations',
        'API access',
        'Custom workflows',
        'SLA guarantee',
      ],
      limits: {
        reports: Infinity,
        dataPoints: Infinity,
        teamMembers: 10,
      },
    },
  ];

  // WORKFLOW: Handle plan selection
  // BACKEND: POST /api/billing/change-plan
  // - If upgrade: Redirects to Stripe Checkout
  // - If downgrade: Redirects to Stripe Customer Portal for confirmation
  const handleSelectPlan = (planId: string) => {
    onSelectPlan(planId);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b bg-[#ffd447] px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#342e37]">Choose Your Plan</h2>
                <p className="text-sm text-[#342e37]/80 mt-1">
                  Select the perfect plan for your real estate business
                </p>
              </div>
              
              {/* PlanModal_Button_Close */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#342e37]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-6">
              
              {/* Plans Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                
                {plans.map((plan) => {
                  const isCurrentPlan = plan.id === currentPlan.toLowerCase();
                  const isUpgrade = !isCurrentPlan && plan.price > (plans.find(p => p.id === currentPlan.toLowerCase())?.price || 0);
                  
                  return (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-6 relative transition-all ${
                        plan.popular 
                          ? 'border-[#342e37] shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        isCurrentPlan ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-[#342e37] text-white hover:bg-[#342e37]">
                            <Zap className="w-3 h-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      {/* Current Plan Badge */}
                      {isCurrentPlan && (
                        <div className="absolute top-4 right-4">
                          {/* PlanModal_Badge_CurrentPlan - DYNAMIC: Shows if this is user's current plan */}
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <Check className="w-3 h-3 mr-1" />
                            Current Plan
                          </Badge>
                        </div>
                      )}

                      {/* Plan Header */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                          {plan.id === 'starter' ? (
                            <Zap className="w-6 h-6 text-[#342e37]" />
                          ) : plan.id === 'professional' ? (
                            <Crown className="w-6 h-6 text-[#342e37]" />
                          ) : (
                            <Building2 className="w-6 h-6 text-[#342e37]" />
                          )}
                          {/* PlanModal_Name - DYNAMIC: Plan name */}
                          <h3 className="text-2xl font-bold text-[#342e37]">{plan.name}</h3>
                        </div>
                        
                        {/* PlanModal_Description - DYNAMIC: Plan description */}
                        <p className="text-sm text-gray-600">{plan.description}</p>
                      </div>

                      {/* Pricing */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          {/* PlanModal_Price - DYNAMIC: Plan price */}
                          <span className="text-4xl font-bold text-[#342e37]">${plan.price}</span>
                          <span className="text-gray-600">/ month</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Billed {plan.billingCycle}
                        </p>
                      </div>

                      {/* Features List */}
                      <div className="space-y-3 mb-6">
                        {/* PlanModal_Features - REPEATABLE: List of features */}
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Limits Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Active Reports:</span>
                          <span className="font-medium text-[#342e37]">
                            {plan.limits.reports === -1 ? 'Unlimited' : plan.limits.reports}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Data Points/Month:</span>
                          <span className="font-medium text-[#342e37]">
                            {plan.limits.dataPoints === -1 ? 'Unlimited' : plan.limits.dataPoints.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Team Members:</span>
                          <span className="font-medium text-[#342e37]">
                            {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {/* PlanModal_Button_SelectPlan - WORKFLOW: Initiates plan change */}
                      {isCurrentPlan ? (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled
                        >
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleSelectPlan(plan.id)}
                          className="w-full"
                          variant={plan.popular ? 'default' : 'outline'}
                        >
                          {isUpgrade ? 'Upgrade to ' : 'Switch to '}{plan.name}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">All plans include:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Secure data encryption</li>
                      <li>99.9% uptime guarantee</li>
                      <li>Cancel anytime, no long-term contracts</li>
                      <li>30-day money-back guarantee</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Overage Information */}
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-2">📊 Volume-Based Pricing</p>
                  <p className="text-amber-800 mb-2">
                    <strong>Starter</strong> and <strong>Pro</strong> plans include a monthly listing allowance. If you exceed your plan's limit, overage fees apply at <strong>$0.01 per listing</strong>.
                  </p>
                  <p className="text-amber-800">
                    Your automations will continue to run and accrue overage fees—they won't stop. You can monitor your usage in the Dashboard and upgrade anytime to avoid overages.
                  </p>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Need help choosing? <a href="mailto:support@listingbug.com" className="text-[#342e37] hover:underline">Contact our sales team</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * USAGE EXAMPLE:
 * 
 * const [showPlanModal, setShowPlanModal] = useState(false);
 * 
 * const handleSelectPlan = async (planId: string) => {
 *   try {
 *     const response = await fetch('/api/billing/change-plan', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ planId })
 *     });
 *     
 *     const data = await response.json();
 *     
 *     if (data.checkoutUrl) {
 *       // Upgrade: Redirect to Stripe Checkout
 *       window.location.href = data.checkoutUrl;
 *     } else if (data.portalUrl) {
 *       // Downgrade: Redirect to Stripe Customer Portal
 *       window.location.href = data.portalUrl;
 *     } else {
 *       // Plan changed successfully
 *       setShowPlanModal(false);
 *       // Refresh subscription data
 *     }
 *   } catch (error) {
 *     console.error('Failed to change plan:', error);
 *   }
 * };
 * 
 * <PlanComparisonModal
 *   isOpen={showPlanModal}
 *   onClose={() => setShowPlanModal(false)}
 *   currentPlan="Professional"
 *   onSelectPlan={handleSelectPlan}
 * />
 */