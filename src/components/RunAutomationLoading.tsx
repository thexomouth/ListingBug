import { motion } from 'motion/react';
import { Loader2, Search, Zap, Send, CheckCircle, Database } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

interface RunAutomationLoadingProps {
  isOpen: boolean;
  automationName: string;
  searchName: string;
  destinationType: string;
  destinationLabel: string;
  onCancel?: () => void;
}

export function RunAutomationLoading({ 
  isOpen, 
  automationName, 
  searchName,
  destinationType,
  destinationLabel,
  onCancel 
}: RunAutomationLoadingProps) {
  const loadingSteps = [
    { icon: Search, label: 'Running saved search criteria', delay: 0 },
    { icon: Database, label: 'Fetching matching listings', delay: 0.6 },
    { icon: Zap, label: 'Processing automation rules', delay: 1.2 },
    { icon: Send, label: `Delivering to ${destinationLabel}`, delay: 1.8 },
  ];

  // Get destination icon based on type
  const getDestinationIcon = () => {
    const icons: Record<string, string> = {
      email: '📧',
      mailchimp: '🐵',
      hubspot: '🧡',
      salesforce: '☁️',
      sheets: '📊',
      slack: '💬',
      webhook: '🔗',
      pipedrive: '📈',
      followupboss: '🎯',
      liondesk: '🦁',
      activecampaign: '📬',
      zapier: '⚡',
      make: '🔧',
    };
    return icons[destinationType] || '📤';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onCancel}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-[#ffd447]">
          <SheetTitle className="text-2xl text-[#342e37]">Running Automation</SheetTitle>
          <SheetDescription className="text-[15px] text-[#342e37]/80">
            {automationName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Main Loading Spinner */}
            <div className="flex justify-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-16 h-16 text-[#FFD447]" />
              </motion.div>
            </div>

            {/* Automation Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getDestinationIcon()}</div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-gray-900 mb-1">
                    Search: <span className="text-[#342E37]">{searchName}</span>
                  </p>
                  <p className="text-[13px] text-gray-600">
                    Destination: {destinationLabel}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Loading Steps */}
            <div className="space-y-3">
              {loadingSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay, duration: 0.5 }}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ 
                      delay: step.delay + 0.5,
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <step.icon className="w-5 h-5 text-[#342E37]" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-gray-900">{step.label}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: step.delay + 0.8, duration: 0.3 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#FFD447]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                />
              </div>
              <p className="text-center text-[12px] text-gray-600 mt-3">
                This should only take a few seconds...
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
