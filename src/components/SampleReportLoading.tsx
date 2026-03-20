import { motion } from 'motion/react';
import { Loader2, FileText, Database, CheckCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

interface SampleReportLoadingProps {
  isOpen: boolean;
  zipcode: string;
  onCancel?: () => void;
}

export function SampleReportLoading({ isOpen, zipcode, onCancel }: SampleReportLoadingProps) {
  const loadingSteps = [
    { icon: Database, label: 'Connecting to data sources', delay: 0 },
    { icon: FileText, label: 'Fetching listing data', delay: 0.5 },
    { icon: CheckCircle, label: 'Processing results', delay: 1 },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onCancel}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-[#ffd447]">
          <SheetTitle className="text-2xl text-[#342e37]">Generating Sample Report</SheetTitle>
          <SheetDescription className="text-[15px] text-[#342e37]/80">
            Fetching listing data for ZIP {zipcode}
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

            {/* Loading Steps */}
            <div className="space-y-4">
              {loadingSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay, duration: 0.5 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ 
                      delay: step.delay + 0.5,
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <step.icon className="w-6 h-6 text-[#342E37]" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-gray-900">{step.label}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: step.delay + 1, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#FFD447]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
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