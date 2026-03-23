import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { X, AlertCircle, Check, Clock, TrendingDown, Coffee, ArrowLeft, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

/**
 * CANCEL SUBSCRIPTION MODAL
 * 
 * PURPOSE: Handle subscription cancellation with exit survey and retention offers
 * 
 * FLOW:
 * 1. Initial warning - Show what they'll lose
 * 2. Reason selection - Why are they canceling?
 * 3. Alternatives - Offer pause or downgrade
 * 4. Final confirmation - Are you sure?
 * 5. Feedback - Optional additional feedback
 * 6. Cancellation complete - Confirmation with reactivation info
 * 
 * BACKEND INTEGRATION:
 * - POST /api/billing/cancel
 * - POST /api/billing/pause
 * - POST /api/feedback/cancellation
 */

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onCancel: (reason: string, feedback?: string) => void;
  onPause?: () => void;
  onDowngrade?: () => void;
}

type CancellationReason = 
  | 'too-expensive'
  | 'not-using'
  | 'missing-features'
  | 'found-alternative'
  | 'technical-issues'
  | 'other';

type Step = 'warning' | 'reason' | 'alternatives' | 'confirmation' | 'complete';

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  currentPlan,
  onCancel,
  onPause,
  onDowngrade,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<Step>('warning');
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [feedback, setFeedback] = useState('');
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

  const reasons: { value: CancellationReason; label: string; description: string }[] = [
    {
      value: 'too-expensive',
      label: 'Too expensive',
      description: "The pricing doesn't fit my budget",
    },
    {
      value: 'not-using',
      label: 'Not using it enough',
      description: "I'm not getting enough value from the features",
    },
    {
      value: 'missing-features',
      label: 'Missing features I need',
      description: "The platform doesn't have what I'm looking for",
    },
    {
      value: 'found-alternative',
      label: 'Found a better alternative',
      description: "I'm switching to another service",
    },
    {
      value: 'technical-issues',
      label: 'Technical problems',
      description: "I'm experiencing bugs or performance issues",
    },
    {
      value: 'other',
      label: 'Other reason',
      description: 'Something else (please explain below)',
    },
  ];

  const handleReasonContinue = () => {
    if (!selectedReason) return;
    setStep('alternatives');
  };

  const handleSkipAlternatives = () => {
    setStep('confirmation');
  };

  const handleFinalCancel = async () => {
    setIsProcessing(true);

    // TODO: Replace with actual API call
    // await fetch('/api/billing/cancel', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     reason: selectedReason,
    //     feedback: feedback
    //   })
    // });

    setTimeout(() => {
      onCancel(selectedReason || 'other', feedback);
      setIsProcessing(false);
      setStep('complete');
    }, 1500);
  };

  const handlePauseSubscription = async () => {
    setIsProcessing(true);
    
    // TODO: API call
    // await fetch('/api/billing/pause', { method: 'POST' });
    
    setTimeout(() => {
      onPause?.();
      setIsProcessing(false);
      onClose();
    }, 1000);
  };

  const handleDowngradeOffer = () => {
    onDowngrade?.();
    onClose();
  };

  const handleClose = () => {
    if (step === 'complete') {
      onClose();
      // Reset state after close animation
      setTimeout(() => {
        setStep('warning');
        setSelectedReason(null);
        setFeedback('');
      }, 300);
    } else {
      onClose();
    }
  };

  const getAlternativesByReason = () => {
    switch (selectedReason) {
      case 'too-expensive':
        return {
          primary: {
            icon: <TrendingDown className="w-5 h-5" />,
            title: 'Downgrade to Starter',
            description: 'Get essential features for just $49/month',
            action: 'Downgrade',
            onClick: handleDowngradeOffer,
          },
          secondary: {
            icon: <Clock className="w-5 h-5" />,
            title: 'Pause for 3 Months',
            description: 'Take a break and come back later',
            action: 'Pause Subscription',
            onClick: handlePauseSubscription,
          },
        };
      case 'not-using':
        return {
          primary: {
            icon: <Clock className="w-5 h-5" />,
            title: 'Pause for 3 Months',
            description: "We'll be here when you're ready",
            action: 'Pause Subscription',
            onClick: handlePauseSubscription,
          },
          secondary: {
            icon: <TrendingDown className="w-5 h-5" />,
            title: 'Switch to Starter Plan',
            description: 'Lower cost while you ramp up usage',
            action: 'Downgrade',
            onClick: handleDowngradeOffer,
          },
        };
      case 'missing-features':
        return {
          primary: {
            icon: <Coffee className="w-5 h-5" />,
            title: 'Talk to Our Team',
            description: 'We might be building what you need',
            action: 'Contact Support',
            onClick: () => window.open('mailto:support@listingbug.com'),
          },
          secondary: {
            icon: <Clock className="w-5 h-5" />,
            title: 'Pause for Now',
            description: 'Return when we add the features',
            action: 'Pause Subscription',
            onClick: handlePauseSubscription,
          },
        };
      default:
        return {
          primary: {
            icon: <Clock className="w-5 h-5" />,
            title: 'Pause Instead',
            description: 'Keep your account without charges',
            action: 'Pause Subscription',
            onClick: handlePauseSubscription,
          },
          secondary: {
            icon: <TrendingDown className="w-5 h-5" />,
            title: 'Try Starter Plan',
            description: 'Basic features at lower cost',
            action: 'Downgrade',
            onClick: handleDowngradeOffer,
          },
        };
    }
  };

  const alternatives = getAlternativesByReason();

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={step !== 'complete' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200">
        
        {/* Step 1: Warning */}
        {step === 'warning' && (
          <>
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-[#342e37]">Cancel Subscription</h2>
                  <p className="text-sm text-gray-600">We're sorry to see you go</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Before you cancel, here's what you'll lose:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Access to search</li>
                    <li>All automated imports and exports</li>
                    <li>Email delivery and integrations</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-[#342e37] mb-2">Your Current Plan</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{currentPlan === 'Trial' ? 'Trial' : `${currentPlan} Plan`}</span>
                  <span className="font-bold text-[#342e37]">{currentPlan === 'Trial' ? 'Active (Free)' : 'Active until Dec 15, 2024'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Keep My Subscription
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setStep('reason')}
                  className="flex-1"
                >
                  Continue to Cancel
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Reason Selection */}
        {step === 'reason' && (
          <>
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#342e37]">Why are you canceling?</h2>
                <p className="text-sm text-gray-600">Help us improve by sharing your reason</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <RadioGroup value={selectedReason || ''} onValueChange={(v) => setSelectedReason(v as CancellationReason)}>
                <div className="space-y-3">
                  {reasons.map((reason) => (
                    <Card
                      key={reason.value}
                      className={`cursor-pointer transition-all ${
                        selectedReason === reason.value
                          ? 'border-2 border-[#342e37] bg-blue-50'
                          : 'border-2 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedReason(reason.value)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={reason.value} className="font-medium text-[#342e37] cursor-pointer">
                            {reason.label}
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>

              {/* Optional feedback */}
              {selectedReason === 'other' && (
                <div className="mt-4">
                  <Label htmlFor="feedback">Please tell us more (optional)</Label>
                  <Textarea
                    id="feedback"
                    placeholder="What would have made you stay?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep('warning')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleReasonContinue}
                  disabled={!selectedReason}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Alternatives */}
        {step === 'alternatives' && (
          <>
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#342e37]">Before you go...</h2>
                <p className="text-sm text-gray-600">Consider these alternatives</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Based on your feedback, here are some options that might work better for you:
              </p>

              {/* Primary Alternative */}
              <Card className="border-2 border-[#342e37] mb-4">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {alternatives.primary.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#342e37] mb-1">{alternatives.primary.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{alternatives.primary.description}</p>
                      <Button
                        onClick={alternatives.primary.onClick}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {alternatives.primary.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Secondary Alternative */}
              <Card className="border-2 border-gray-200 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {alternatives.secondary.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#342e37] mb-1">{alternatives.secondary.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{alternatives.secondary.description}</p>
                      <Button
                        variant="outline"
                        onClick={alternatives.secondary.onClick}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {alternatives.secondary.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <button
                  onClick={handleSkipAlternatives}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  No thanks, I still want to cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Final Confirmation */}
        {step === 'confirmation' && (
          <>
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-[#342e37]">Final Confirmation</h2>
                  <p className="text-sm text-gray-600">This action will cancel your subscription</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Your subscription will be canceled immediately:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>You'll lose access to all premium features</li>
                    <li>Your reports and data will be deleted after 30 days</li>
                    <li>You won't be charged again</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-[#342e37] mb-3">Additional Feedback (Optional)</h3>
                <Textarea
                  placeholder="Is there anything else you'd like us to know?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('alternatives')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleFinalCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Canceling...' : 'Yes, Cancel Subscription'}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <>
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-[#342e37]">Subscription Canceled</h2>
                  <p className="text-sm text-gray-600">We're sorry to see you go</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="font-medium mb-2">Your subscription has been canceled</p>
                  <p className="text-sm">
                    You'll have access to your account until <strong>December 15, 2024</strong>. 
                    After that, your data will be stored for 30 days in case you want to come back.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-[#342e37] mb-2">Want to Reactivate?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  You can reactivate your subscription anytime before December 15, 2024. 
                  Just go to Account Settings → Billing and click "Reactivate Subscription".
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Thank you for being a ListingBug customer. We hope to see you again!
                </p>
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}

/**
 * BACKEND API
 * 
 * POST /api/billing/cancel
 * Request:
 * {
 *   "reason": "too-expensive",
 *   "feedback": "Optional additional feedback"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "cancellation": {
 *     "effectiveDate": "2024-11-23T10:30:00Z",
 *     "accessUntil": "2024-12-15T00:00:00Z",
 *     "dataRetentionUntil": "2025-01-14T00:00:00Z"
 *   }
 * }
 * 
 * POST /api/billing/pause
 * Response:
 * {
 *   "success": true,
 *   "pause": {
 *     "startDate": "2024-12-15T00:00:00Z",
 *     "resumeDate": "2025-03-15T00:00:00Z",
 *     "duration": "3 months"
 *   }
 * }
 */