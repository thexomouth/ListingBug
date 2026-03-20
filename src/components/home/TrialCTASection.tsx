import { ArrowRight, CheckCircle, Zap, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';

interface TrialCTASectionProps {
  onNavigate?: (page: string) => void;
}

export function TrialCTASection({ onNavigate }: TrialCTASectionProps) {
  return (
    <div className="bg-[#FFCE0A] md:py-12 p-[0px]">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 p-[21px] px-[12px] py-[18px]">
        {/* Mobile: Stacked Layout */}
        <div className="block md:hidden text-center">
          <div className="mb-4">
            <h2 className="mb-3 text-[27px] font-bold">One week free - no cc.</h2>
            <p className="text-[#342E37] text-[14px] max-w-2xl mx-auto mb-6">
              Has your competitor signed up yet?
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-2 mb-6 text-left max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#342E37] flex-shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#342E37]">7-day free trial • No credit card required</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#342E37] flex-shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#342E37]">Access to complete listing database with agent contacts</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-[#342E37] flex-shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#342E37]">Cancel anytime • Setup takes less than 2 minutes</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <Button 
              size="lg"
              className="w-full h-12 bg-white hover:bg-white/90 text-[#342E37] font-bold"
              onClick={() => onNavigate?.('signup')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Your Free Trial
            </Button>
            <Button 
              size="lg"
              variant="ghost"
              className="w-full h-12 bg-[#342e37] border-0 text-white hover:bg-[#342e37]/90 font-bold transition-all duration-200"
              onClick={() => onNavigate?.('pricing')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              View Pricing Plans
            </Button>
          </div>
        </div>

        {/* Desktop: Two Column Layout */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12 md:items-center">
          {/* Left: Heading and Benefits */}
          <div>
            <h2 className="mb-4 text-[36px] font-bold text-[#342E37]">One week free - no cc.</h2>
            <p className="text-[#342E37] text-[15px] mb-6">
              Has your competitor signed up yet?
            </p>
            
            {/* Benefits List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#342E37] flex-shrink-0 mt-0.5" />
                <span className="text-[14px] text-[#342E37]">7-day free trial • No credit card required</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#342E37] flex-shrink-0 mt-0.5" />
                <span className="text-[14px] text-[#342E37]">Access to complete listing database with agent contacts</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#342E37] flex-shrink-0 mt-0.5" />
                <span className="text-[14px] text-[#342E37]">Cancel anytime • Setup takes less than 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Right: CTA Buttons */}
          <div className="space-y-4">
            <Button 
              size="lg"
              className="w-full h-14 bg-white hover:bg-white/90 text-[#342E37] font-bold text-[16px]"
              onClick={() => onNavigate?.('signup')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Your Free Trial
            </Button>
            <Button 
              size="lg"
              variant="ghost"
              className="w-full h-14 bg-[#2F2F2F] border-0 text-white hover:bg-[#ffffff]/90 font-bold text-[16px] transition-all duration-200"
              onClick={() => onNavigate?.('pricing')}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              View Pricing Plans
            </Button>
            
            <p className="text-center text-[#342E37]/80 text-[12px] mt-4">
              💳 No credit card required • ⚡ Instant access • 🔒 Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
