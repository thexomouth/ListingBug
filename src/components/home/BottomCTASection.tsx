import { Zap, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';

interface BottomCTASectionProps {
  onNavigate?: (page: string) => void;
}

export function BottomCTASection({ onNavigate }: BottomCTASectionProps) {
  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFCE0A] rounded-lg px-6 py-12 md:px-12 md:py-16">
          <div className="text-center">
            {/* Main Heading */}
            <h2 className="text-[32px] md:text-[42px] lg:text-[48px] font-bold text-[#342E37] mb-4">
              Get A Real Estate Listing Radar.
            </h2>
            
            {/* Subheading */}
            <p className="text-[16px] md:text-[18px] text-[#342E37]/90 mb-8 max-w-3xl mx-auto">
              One new client could pay for months of ListingBug. 7-day free trial. No credit card required.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button 
                size="lg"
                className="w-full sm:w-auto h-12 md:h-14 px-8 bg-white hover:bg-white/90 text-[#342E37] font-bold text-[15px] md:text-[16px] shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => onNavigate?.('signup')}
              >
                <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button 
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto h-12 md:h-14 px-8 bg-[#342E37] border-0 text-white hover:bg-[#342E37]/90 font-bold text-[15px] md:text-[16px] transition-all duration-200"
                onClick={() => onNavigate?.('pricing')}
              >
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                View Pricing
              </Button>
            </div>
            
            {/* Fine Print */}
            <p className="text-[13px] md:text-[14px] text-[#342E37]/70">
              7-day free trial • No credit card required • Cancel anytime • <strong>Renew:</strong> first month of extra reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}