import { LBButton } from "../design-system/LBButton";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/button';
import { CityAutocomplete } from '../CityAutocomplete';

interface HeroSectionProps {
  onNavigate?: (page: string) => void;
  onGenerateSample?: (city: string, state: string) => void;
}

// Sample cities database with ZIP codes (kept for reference only — no longer used in search)
const US_CITIES = [
  { city: 'Los Angeles', state: 'CA', zip: '90001' },
  { city: 'New York', state: 'NY', zip: '10001' },
  { city: 'Chicago', state: 'IL', zip: '60601' },
  { city: 'Houston', state: 'TX', zip: '77001' },
  { city: 'Phoenix', state: 'AZ', zip: '85001' },
  { city: 'Philadelphia', state: 'PA', zip: '19101' },
  { city: 'San Antonio', state: 'TX', zip: '78201' },
  { city: 'San Diego', state: 'CA', zip: '92101' },
  { city: 'Dallas', state: 'TX', zip: '75201' },
  { city: 'San Jose', state: 'CA', zip: '95101' },
  { city: 'Austin', state: 'TX', zip: '78701' },
  { city: 'Jacksonville', state: 'FL', zip: '32099' },
  { city: 'Fort Worth', state: 'TX', zip: '76101' },
  { city: 'Columbus', state: 'OH', zip: '43085' },
  { city: 'Charlotte', state: 'NC', zip: '28201' },
  { city: 'San Francisco', state: 'CA', zip: '94101' },
  { city: 'Indianapolis', state: 'IN', zip: '46201' },
  { city: 'Seattle', state: 'WA', zip: '98101' },
  { city: 'Denver', state: 'CO', zip: '80201' },
  { city: 'Boston', state: 'MA', zip: '02101' },
  { city: 'Nashville', state: 'TN', zip: '37201' },
  { city: 'Miami', state: 'FL', zip: '33101' },
  { city: 'Portland', state: 'OR', zip: '97201' },
  { city: 'Las Vegas', state: 'NV', zip: '89101' },
  { city: 'Detroit', state: 'MI', zip: '48201' },
  { city: 'Memphis', state: 'TN', zip: '37501' },
  { city: 'Louisville', state: 'KY', zip: '40201' },
  { city: 'Baltimore', state: 'MD', zip: '21201' },
  { city: 'Milwaukee', state: 'WI', zip: '53201' },
  { city: 'Albuquerque', state: 'NM', zip: '87101' },
  { city: 'Tucson', state: 'AZ', zip: '85701' },
  { city: 'Fresno', state: 'CA', zip: '93650' },
  { city: 'Mesa', state: 'AZ', zip: '85201' },
  { city: 'Sacramento', state: 'CA', zip: '94203' },
  { city: 'Atlanta', state: 'GA', zip: '30301' },
  { city: 'Kansas City', state: 'MO', zip: '64101' },
  { city: 'Colorado Springs', state: 'CO', zip: '80901' },
  { city: 'Raleigh', state: 'NC', zip: '27601' },
  { city: 'Omaha', state: 'NE', zip: '68101' },
  { city: 'Long Beach', state: 'CA', zip: '90801' },
  { city: 'Virginia Beach', state: 'VA', zip: '23450' },
  { city: 'Oakland', state: 'CA', zip: '94601' },
  { city: 'Minneapolis', state: 'MN', zip: '55401' },
  { city: 'Tampa', state: 'FL', zip: '33601' },
  { city: 'Tulsa', state: 'OK', zip: '74101' },
  { city: 'Arlington', state: 'TX', zip: '76010' },
  { city: 'New Orleans', state: 'LA', zip: '70112' },
];

export function HeroSection({ onNavigate, onGenerateSample }: HeroSectionProps) {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCity && selectedState && onGenerateSample) {
      onGenerateSample(selectedCity, selectedState);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#0F1115] md:py-16 px-[0px] py-[50px]">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 p-[0px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column: Text Content */}
          <div className="text-center lg:text-left p-[0px]">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-[18px] text-[42px] mt-[0px] mr-[0px] ml-[0px] dark:text-white">
              Real Estate Listing Alerts for Service Providers
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-[#EBF2FA] mb-[21px] max-w-2xl mx-auto lg:mx-0 text-[16px] mt-[0px] mr-[0px] ml-[0px] px-[12px] py-[0px]">
              Type your city and state to try our exclusive real estate monitoring service for free.
            </p>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto lg:mx-0">
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start px-[12px] py-[0px]">
                <div className="flex-1 relative">
                  <CityAutocomplete
                    value={selectedCity}
                    stateValue={selectedState}
                    onSelect={(city, state) => { setSelectedCity(city); setSelectedState(state); }}
                    className="h-12 text-[14px] text-zinc-900 dark:text-[rgb(235,242,250)] placeholder:opacity-[0.33] border-b border-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-8 bg-[#342e37] dark:bg-[#FFCE0A] hover:bg-[#342e37]/90 dark:hover:bg-[#FFCE0A]/90 text-white dark:text-[#0F1115] font-bold"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Free Sample Report
                </Button>
              </div>
            </form>
          </div>
          
          {/* Right Column: Image */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-[var(--elevation-xl)]">
              <ImageWithFallback
                src="https://images.unsplash.com/flagged/photo-1556438758-df7b9e0c0fe4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwZmxvb3IlMjBwbGFuJTIwbGl2aW5nJTIwcm9vbSUyMGtpdGNoZW58ZW58MXx8fHwxNzY0MTI5Mjg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Open floor plan living room and kitchen"
                className="w-full h-auto object-cover"
              />
              {/* Overlay gradient for visual depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#342e37]/10 to-transparent pointer-events-none"></div>
            </div>
            {/* Decorative element */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-[#ffd447]/5 rounded-full blur-3xl"></div>
            <div className="absolute -z-10 -bottom-4 -left-4 w-72 h-72 bg-[#d4f5f5]/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}