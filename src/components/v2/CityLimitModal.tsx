import { MapPin, ArrowUpRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { PLAN_CONFIG, getNextPlan, type PlanType } from '../utils/planLimits';

interface CityLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  citiesUsed: number;
  onUpgrade: () => void;
}

export function CityLimitModal({ isOpen, onClose, currentPlan, citiesUsed, onUpgrade }: CityLimitModalProps) {
  const cfg = PLAN_CONFIG[currentPlan];
  const next = getNextPlan(currentPlan);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">City Limit Reached</DialogTitle>
          <DialogDescription className="text-center text-base pt-1">
            Your <span className="font-bold text-[#342e37]">{cfg.name}</span> plan includes{' '}
            <span className="font-bold text-[#342e37]">
              {cfg.citiesAllowed} {cfg.citiesAllowed === 1 ? 'city' : 'cities'}
            </span>. You&apos;re currently running campaigns in {citiesUsed}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {next.plan && (
            <button
              onClick={() => { onClose(); onUpgrade(); }}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#FFCE0A] to-[#FFCE0A]/80 hover:from-[#FFCE0A]/90 hover:to-[#FFCE0A]/70 rounded-lg transition-all border-2 border-[#FFCE0A] group"
            >
              <div className="text-left">
                <div className="font-bold text-[#342e37] mb-0.5">Upgrade to {next.name}</div>
                <div className="text-sm text-[#342e37]/80">
                  {PLAN_CONFIG[next.plan].citiesAllowed} cities &bull; {next.price}
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#342e37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
