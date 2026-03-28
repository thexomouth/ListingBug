import React from 'react';
import { CreditCard, Download, Receipt, TrendingUp, Calendar, AlertCircle, CheckCircle, Crown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChangePlanModal } from './ChangePlanModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { toast } from 'sonner';

/**
 * BILLING PAGE COMPONENT
 * 
 * PURPOSE: Manage subscription, payment methods, and billing history
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: GET /api/billing/subscription - Get current subscription details
 * - API Endpoint: GET /api/billing/payment-methods - Get saved payment methods
 * - API Endpoint: GET /api/billing/invoices - Get billing history
 * - API Endpoint: POST /api/billing/portal - Create Stripe Customer Portal session
 * - API Endpoint: POST /api/billing/change-plan - Change subscription plan
 * - API Endpoint: POST /api/billing/cancel - Cancel subscription
 * - API Endpoint: POST /api/billing/pause - Pause subscription
 * 
 * NAMING CONVENTION:
 * - Billing_Card_CurrentPlan
 * - Billing_Button_ManageSubscription
 * - Billing_Button_ChangePlan
 * - Billing_Button_CancelSubscription
 * - Billing_Card_PaymentMethod
 * - Billing_Button_UpdatePayment
 * - Billing_Table_Invoices
 * - Billing_Button_DownloadInvoice
 */

interface BillingPageProps {
  onNavigate?: (page: string) => void;
  embeddedInTabs?: boolean; // New prop to control header display
}

export function BillingPage({ onNavigate, embeddedInTabs = false }: BillingPageProps) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(() => {
    const flag = sessionStorage.getItem('billing_open_change_plan');
    if (flag) { sessionStorage.removeItem('billing_open_change_plan'); return true; }
    return false;
  });
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ============================================================================
  // BACKEND INTEGRATION TODO:
  // Replace mock data with actual API calls
  // 
  // const [subscription, setSubscription] = useState(null);
  // const [paymentMethod, setPaymentMethod] = useState(null);
  // const [invoices, setInvoices] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  // 
  // useEffect(() => {
  //   fetchBillingData();
  // }, []);
  // 
  // const fetchBillingData = async () => {
  //   try {
  //     const [subRes, pmRes, invRes] = await Promise.all([
  //       fetch('/api/billing/subscription'),
  //       fetch('/api/billing/payment-methods'),
  //       fetch('/api/billing/invoices?limit=12')
  //     ]);
  //     
  //     const subData = await subRes.json();
  //     const pmData = await pmRes.json();
  //     const invData = await invRes.json();
  //     
  //     setSubscription(subData.subscription);
  //     setPaymentMethod(pmData.paymentMethods[0]); // Primary payment method
  //     setInvoices(invData.invoices);
  //   } catch (error) {
  //     console.error('Failed to fetch billing data:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  // ============================================================================

  const [subscription, setSubscription] = React.useState({
    plan: 'Trial',
    status: 'Trial',
    price: 0,
    billingCycle: 'Monthly',
    nextBillingDate: '—',
    reportsLimit: 1000,
    reportsUsed: 0,
    dataPointsLimit: 40000,
    dataPointsUsed: 0,
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
    projectedReports: 0,
    projectedDataPoints: 0,
    overageReports: 0,
    overageDataPoints: 0,
    overageRateReports: 0.01,
    overageRateDataPoints: 0.0001,
    overageFee: 0,
  });

  React.useEffect(() => {
    const fetchBillingData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users')
        .select('plan, plan_status, trial_ends_at, stripe_subscription_end')
        .eq('id', user.id).single();
      if (data) {
        const isTrialing = data.plan_status === 'trialing' || !!data.trial_ends_at;
        // If user is in trial, show "Trial" as current plan; otherwise show actual plan
        const planName = isTrialing ? 'Trial' : (data.plan === 'professional' ? 'Professional' : data.plan === 'enterprise' ? 'Enterprise' : 'Starter');
        const price = isTrialing ? 0 : data.plan === 'professional' ? 49 : data.plan === 'enterprise' ? 0 : 19;
        const limit = data.plan === 'professional' ? 10000 : data.plan === 'enterprise' ? 999999 : data.plan === 'trial' ? 1000 : 4000;
        setSubscription(prev => ({
          ...prev,
          plan: planName, price, reportsLimit: limit,
          status: isTrialing ? 'Trial' : data.plan_status === 'active' ? 'Active' : data.plan_status || 'Active',
          trialEndsAt: data.trial_ends_at ?? null,
          nextBillingDate: data.stripe_subscription_end ? new Date(data.stripe_subscription_end).toLocaleDateString() : '—',
        }));
      }
    };
    fetchBillingData();
  }, []);

  const paymentMethod = null; // Populated from Stripe after user subscribes

  const invoices: any[] = []; // Will be populated from Stripe

  // WORKFLOW: Manage subscription via Stripe portal
  // BACKEND: POST /api/billing/portal → Returns Stripe portal URL
  // Frontend: Redirect to Stripe portal
  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/stripe-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { toast.info('No billing account found. Please subscribe first.'); }
    } catch (err) {
      console.error(err);
      toast.error('Could not open billing portal. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // WORKFLOW: Download invoice
  // BACKEND: Invoice PDF URL from API
  // Frontend: Open PDF in new tab or trigger download
  const handleDownloadInvoice = (invoiceId: string, pdfUrl: string) => {
    // PRODUCTION: Replace with actual download
    // window.open(pdfUrl, '_blank');
    
    toast.success(`Downloading invoice ${invoiceId}...`, {
      description: 'In production, this would download your invoice PDF.'
    });
  };

  // WORKFLOW: Cancel subscription
  // BACKEND: POST /api/billing/cancel
  // Frontend: Show confirmation, then call API
  const handleCancelSubscription = async () => {
    // PRODUCTION: Replace with actual API call
    // try {
    //   const response = await fetch('/api/billing/cancel', { method: 'POST' });
    //   const data = await response.json();
    //   toast.success('Subscription cancelled. You can continue using the service until the end of your billing period.');
    // } catch (error) {
    //   toast.error('Failed to cancel subscription. Please try again.');
    //   console.error('Failed to cancel subscription:', error);
    // }
    
    toast.success('Subscription cancellation scheduled', {
      description: 'You can continue using the service until the end of your billing period.'
    });
    setShowCancelModal(false);
  };

  // Calculate usage percentages
  const reportsUsagePercent = (subscription.reportsUsed / subscription.reportsLimit) * 100;
  const dataPointsUsagePercent = (subscription.dataPointsUsed / subscription.dataPointsLimit) * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      {/* Page Header */}
      {!embeddedInTabs && (
        <div className="bg-white dark:bg-[#0F1115] border-b border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="w-6 h-6 text-[#342e37] dark:text-white" />
              <h1 className="font-bold text-[#342e37] dark:text-white">Billing & Subscription</h1>
            </div>
            <p className="text-base text-gray-600 dark:text-[#EBF2FA]">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={embeddedInTabs ? 'py-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'}>
        
        {/* Trial/Cancellation Alert */}
        {subscription.trialEndsAt && (
          <Alert className="mb-3 border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-300">
              Your trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. 
              Add a payment method to continue using ListingBug after your trial.
            </AlertDescription>
          </Alert>
        )}

        {subscription.cancelAtPeriodEnd && (
          <Alert className="mb-3 border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-900 dark:text-red-300">
              Your subscription is scheduled to cancel on {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. 
              You can continue using ListingBug until then.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          
          {/* Current Plan Card */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
                    <Crown className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                    Current Plan
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-[#EBF2FA]">
                    Your active subscription and usage
                  </CardDescription>
                </div>
                
                {/* Billing_Badge_Status - Plan status indicator */}
                <Badge 
                  variant={subscription.status === 'Active' ? 'default' : 'secondary'}
                  className={subscription.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/20 dark:text-green-300' : ''}
                >
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Plan Details */}
              <div>
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  {/* Billing_Display_PlanName - DYNAMIC: Current plan name */}
                  <h3 className="text-2xl font-bold text-[#342e37] dark:text-white">{subscription.plan}</h3>
                  <span className="text-gray-500 dark:text-[#EBF2FA]">Plan</span>
                </div>
                <div className="flex items-baseline gap-1">
                  {/* Billing_Display_Price - DYNAMIC: Monthly price */}
                  <span className="text-xl font-bold text-[#342e37] dark:text-white">${subscription.price}</span>
                  {/* Billing_Display_Cycle - DYNAMIC: Billing cycle */}
                  <span className="text-gray-600 dark:text-[#EBF2FA]">/ {subscription.billingCycle.toLowerCase()}</span>
                </div>
              </div>

              <Separator className="dark:bg-white/10" />

              {/* Billing Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#EBF2FA]">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription.status === 'Trial' ? 'Trial ends' : 'Next billing date'}:{' '}
                  <span className="font-medium text-[#342e37] dark:text-white">
                    {(() => {
                      const d = subscription.trialEndsAt || subscription.nextBillingDate;
                      if (!d || d === '\u2014' || d === '-') return '\u2014';
                      const parsed = new Date(d);
                      return isNaN(parsed.getTime()) ? '\u2014' : parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    })()
                    }
                  </span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {/* Billing_Button_ChangePlan - WORKFLOW: Initiate plan upgrade */}
                <Button 
                  onClick={() => setShowChangePlanModal(true)}
                  className="gap-2 w-full sm:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115]"
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Change Plan
                </Button>
                
                {/* Billing_Button_ManageSubscription - WORKFLOW: Open Stripe Customer Portal */}
                <Button 
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                  className="w-full sm:w-auto border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  size="sm"
                >
                  {isLoadingPortal ? 'Loading...' : 'Manage Subscription'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Card */}
          <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-[#342e37] dark:text-white">
                <CreditCard className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                Payment Method
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-[#EBF2FA]">
                Your default payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {paymentMethod ? (
                <>
                  {/* Payment Method Display */}
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-[#0F1115]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Billing_Icon_CardBrand - DYNAMIC: Card brand logo */}
                        <div className="w-12 h-8 bg-gray-100 dark:bg-white/10 rounded flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-gray-400 dark:text-white/60" />
                        </div>
                        <div>
                          {/* Billing_PaymentMethod_Brand - DYNAMIC: Card brand */}
                          <p className="font-medium text-[#342e37] dark:text-white">{paymentMethod.brand}</p>
                          {/* Billing_PaymentMethod_Last4 - DYNAMIC: Last 4 digits */}
                          <p className="text-sm text-gray-600 dark:text-[#EBF2FA]">•••• {paymentMethod.last4}</p>
                        </div>
                      </div>
                      {paymentMethod.isDefault && (
                        <Badge variant="secondary" className="text-xs dark:bg-white/10 dark:text-white">Default</Badge>
                      )}
                    </div>
                    
                    {/* Billing_PaymentMethod_Expiry - DYNAMIC: Expiration date */}
                    <p className="text-xs text-gray-500 dark:text-[#EBF2FA]/70">
                      Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                    </p>
                  </div>

                  {/* Billing_Button_UpdatePayment - WORKFLOW: Update payment method via Stripe */}
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                    onClick={handleManageSubscription}
                  >
                    Update Payment Method
                  </Button>
                </>
              ) : (
                <>
                  {/* No Payment Method */}
                  <div className="text-center py-6">
                    <CreditCard className="w-12 h-12 text-gray-300 dark:text-white/30 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-[#EBF2FA] mb-4">No payment method on file</p>
                    
                    {/* Billing_Button_AddPayment - WORKFLOW: Add payment method */}
                    <Button 
                      onClick={handleManageSubscription}
                      className="w-full bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115]"
                    >
                      Add Payment Method
                    </Button>
                  </div>
                </>
              )}

              <Separator className="dark:bg-white/10" />

              {/* Security Note */}
              <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-[#EBF2FA]/70">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                <p>
                  All payments are securely processed by Stripe. We never store your full card details.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing History - moved from bottom*/}
        <Card className="mb-8 bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-bold text-[#342e37] dark:text-white">
              <Receipt className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
              Billing History
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-[#EBF2FA]">
              Download invoices and view past payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Billing_Table_Invoices - REPEATABLE: List of invoices */}
            <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#0F1115] border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-[#EBF2FA]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-[#EBF2FA]">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-[#EBF2FA]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-[#EBF2FA]">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-[#EBF2FA]">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-b-0 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                      {/* Billing_Invoice_Date - DYNAMIC: Invoice date */}
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {new Date(invoice.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      {/* Billing_Invoice_Description - DYNAMIC: Line item description */}
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-[#EBF2FA]">
                        {invoice.description}
                      </td>
                      {/* Billing_Invoice_Amount - DYNAMIC: Invoice total */}
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      {/* Billing_Invoice_Status - DYNAMIC: Payment status */}
                      <td className="py-3 px-4">
                        <Badge 
                          variant={invoice.status === 'Paid' ? 'default' : 'secondary'}
                          className={invoice.status === 'Paid' ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/20 dark:text-green-300' : ''}
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      {/* Billing_Button_DownloadInvoice - WORKFLOW: Download PDF invoice */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id, invoice.pdfUrl)}
                          className="gap-2 dark:text-white dark:hover:bg-white/10"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invoices.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 dark:text-white/30 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-[#EBF2FA]">No billing history yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Subscription Section */}
        {!subscription.cancelAtPeriodEnd && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
            <Card className="border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-300">Cancel Subscription</CardTitle>
                <CardDescription className="text-red-700 dark:text-red-400">
                  Cancel your subscription and stop future billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-900 dark:text-red-300">
                  If you cancel your subscription, you'll continue to have access until the end of your current billing period 
                  ({new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}). 
                  After that, your account will be downgraded to a free plan with limited features.
                </p>

                {showCancelModal && (
                  <Alert className="border-red-300 bg-red-100 dark:border-red-500/30 dark:bg-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-900 dark:text-red-300">
                      Are you sure you want to cancel? This action will stop all future billing.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  {!showCancelModal ? (
                    <Button 
                      variant="destructive"
                      onClick={() => setShowCancelModal(true)}
                      className="dark:bg-red-600 dark:hover:bg-red-700"
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        className="dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        Yes, Cancel Subscription
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowCancelModal(false)}
                        className="border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                      >
                        No, Keep Subscription
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlan={subscription.plan}
        currentPrice={subscription.price}
        onChangePlan={(planId) => {
          console.log('Plan changed to:', planId);
          // TODO: Update subscription state
          setShowChangePlanModal(false);
        }}
      />

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        currentPlan={subscription.plan}
        trialEndsAt={subscription.trialEndsAt}
        onCancel={(reason, feedback) => {
          console.log('Canceled:', reason, feedback);
          handleCancelSubscription();
        }}
        onPause={() => {
          console.log('Paused subscription');
          setShowCancelModal(false);
        }}
        onDowngrade={() => {
          setShowCancelModal(false);
          setShowChangePlanModal(true);
        }}
      />
    </div>
  );
}
