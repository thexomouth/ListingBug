import { ArrowRight } from 'lucide-react';

interface OnboardingWelcomeOverlayProps {
  onStart: () => void;
  onSkip: () => void;
}

export function OnboardingWelcomeOverlay({ onStart, onSkip }: OnboardingWelcomeOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9000] bg-[#0F1115]/95 flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <img
            src="https://ynqmisrlahjberhmlviz.supabase.co/storage/v1/object/public/email%20assets/bug%20logo%20wht.png"
            alt="ListingBug"
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Welcome to ListingBug</h1>
        <p className="text-gray-400 mb-8 leading-relaxed text-base">
          Let's get you started. We'll load local listings you can export, automate, and message — right from here.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold px-8 py-4 rounded-xl text-base transition-colors w-full mb-4"
        >
          Run Your First Search <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
