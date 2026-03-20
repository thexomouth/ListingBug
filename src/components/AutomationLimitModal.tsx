import { AlertTriangle, ArrowUpRight, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

/**
 * AUTOMATION LIMIT MODAL
 * 
 * Displays when user reaches their plan's automation slot limit
 * Provides upgrade and contact support options
 */

interface AutomationLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'starter' | 'pro' | 'enterprise';
  currentSlots: number;
  maxSlots: number;
  onUpgrade: () => void;
  onContactSupport: () => void;
}

export function AutomationLimitModal({
  isOpen,
  onClose,
  currentPlan,
  currentSlots,
  maxSlots,
  onUpgrade,
  onContactSupport
}: AutomationLimitModalProps) {
  
  const planInfo = {
    starter: {
      name: 'Starter',
      nextPlan: 'Professional',
      nextSlots: 3,
      price: '$99/mo'
    },
    pro: {
      name: 'Professional',
      nextPlan: 'Enterprise',
      nextSlots: 'Unlimited',
      price: 'Custom pricing'
    },
    enterprise: {
      name: 'Enterprise',
      nextPlan: null,
      nextSlots: 'Unlimited',
      price: null
    }
  };

  const info = planInfo[currentPlan];
  const showUpgradeOption = currentPlan !== 'enterprise';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Automation Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            You've reached your plan limit of <span className="font-bold text-[#342e37]">{maxSlots} automation{maxSlots !== 1 ? 's' : ''}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Current Status */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ffd447]" />
              <span className="text-sm font-bold text-[#342e37]">{info.name} Plan</span>
            </div>
            <span className="text-sm text-gray-600">
              {currentSlots} / {maxSlots} slots used
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
          
          <p className="text-xs text-gray-600 mt-3 text-center">
            All {maxSlots} automation slot{maxSlots !== 1 ? 's are' : ' is'} currently in use
          </p>
        </div>

        {/* Options */}
        <div className="mt-6 space-y-3">
          {showUpgradeOption && (
            <>
              <p className="text-sm text-gray-700 text-center mb-4">
                To create more automations, you can:
              </p>

              {/* Upgrade Option */}
              <button
                onClick={() => {
                  onClose();
                  onUpgrade();
                }}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#ffd447] to-[#ffd447]/80 hover:from-[#ffd447]/90 hover:to-[#ffd447]/70 rounded-lg transition-all border-2 border-[#ffd447] group"
              >
                <div className="text-left">
                  <div className="font-bold text-[#342e37] mb-1">
                    Upgrade to {info.nextPlan}
                  </div>
                  <div className="text-sm text-[#342e37]/80">
                    Get {info.nextSlots} automation{typeof info.nextSlots === 'number' && info.nextSlots !== 1 ? 's' : ''} • Starting at {info.price}
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#342e37] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </>
          )}

          {/* Contact Support Option */}
          <button
            onClick={() => {
              onClose();
              onContactSupport();
            }}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 group"
          >
            <div className="text-left">
              <div className="font-bold text-[#342e37] mb-1">
                Contact Support
              </div>
              <div className="text-sm text-gray-600">
                {currentPlan === 'enterprise' 
                  ? 'Discuss custom automation needs'
                  : 'Get help managing your automations'
                }
              </div>
            </div>
            <MessageSquare className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform" />
          </button>

          {/* Alternative: Delete Existing */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Or delete an existing automation to free up a slot
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}