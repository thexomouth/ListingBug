import { Quote } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Button } from "../ui/button";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Home Cleaning Services",
    location: "Austin, TX",
    quote: "ListingBug has transformed how we find new clients. We're connecting with agents before homes even hit the market.",
    image: "SM",
  },
  {
    name: "James Rodriguez",
    role: "Property Inspector",
    location: "Phoenix, AZ",
    quote: "The daily updates mean I'm always first to reach out. My booking rate has increased by 40% since using ListingBug.",
    image: "JR",
  },
  {
    name: "Linda Chen",
    role: "Staging Professional",
    location: "Seattle, WA",
    quote: "Being able to automate my searches and get instant notifications has been a game-changer for my staging business.",
    image: "LC",
  },
];

interface TestimonialsSectionProps {
  onNavigate?: (page: string) => void;
}

export function TestimonialsSection({ onNavigate }: TestimonialsSectionProps) {
  return (
    <section className="md:py-12 bg-white dark:bg-[#0F1115] px-[0px] py-[23px]">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 p-[0px]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">
            Trusted by Service Professionals
          </h2>
          <p className="text-lg text-muted-foreground dark:text-[#EBF2FA] max-w-2xl mx-auto text-[14px]">
            See how ListingBug is helping small businesses grow their visibility in the real estate market
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-[9px] bg-white dark:bg-[#2F2F2F] border border-border dark:border-white/10 hover:shadow-[var(--elevation-lg)] transition-all duration-300 px-[18px] py-[9px]"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white dark:bg-[#FFCE0A] flex items-center justify-center">
                <Quote className="w-5 h-5 text-primary dark:text-[#0F1115]" />
              </div>
              
              {/* Testimonial content */}
              <div className="mb-6">
                <p className="text-foreground dark:text-[#EBF2FA] italic text-[14px]">"{testimonial.quote}"</p>
              </div>
              
              {/* Author info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary dark:bg-[#FFCE0A] text-primary-foreground dark:text-[#0F1115] flex items-center justify-center flex-shrink-0 font-bold">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-medium text-foreground dark:text-white text-[15px]">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground dark:text-[#EBF2FA]">{testimonial.role}</div>
                  <div className="text-sm text-muted-foreground dark:text-[#EBF2FA]">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 md:mt-20 text-center bg-gradient-to-r from-[#FFCE0A]/10 via-[#FFCE0A]/5 to-transparent rounded-2xl p-8 md:p-12 border-2 border-[#FFCE0A]/30">
          <h3 className="text-2xl md:text-3xl font-bold text-[#342e37] dark:text-white mb-4">
            Ready to automate your lead generation?
          </h3>
          <p className="text-gray-600 dark:text-[#EBF2FA] text-lg mb-6 max-w-2xl mx-auto">
            Join 1,000+ service providers who've automated their listing searches and never miss an opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#EBF2FA]">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#EBF2FA]">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#EBF2FA]">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="px-8 bg-[#FFCE0A] hover:bg-[#FFD447] text-[#0F1115] font-semibold"
              onClick={() => onNavigate?.('signup')}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 border-2 border-[#FFCE0A] text-[#342e37] dark:text-white hover:bg-[#FFCE0A]/10"
              onClick={() => onNavigate?.('pricing')}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}