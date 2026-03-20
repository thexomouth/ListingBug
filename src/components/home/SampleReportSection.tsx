import { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface SampleReportSectionProps {
  onGenerateSample: (zipcode: string) => void;
}

// Sample cities database with ZIP codes
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

export function SampleReportSection({ onGenerateSample }: SampleReportSectionProps) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedZip, setSelectedZip] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<typeof US_CITIES>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    setSelectedZip(''); // Clear selected ZIP when typing

    // If it's numeric, don't show city suggestions
    if (/^\d+$/.test(value)) {
      setShowDropdown(false);
      setFilteredCities([]);
      setSelectedZip(value); // Store ZIP directly if numeric
      return;
    }

    // Filter cities based on input
    if (value.length >= 2) {
      const matches = US_CITIES.filter(
        (city) =>
          city.city.toLowerCase().startsWith(value.toLowerCase()) ||
          city.city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions

      setFilteredCities(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setFilteredCities([]);
      setShowDropdown(false);
    }
  };

  const handleCitySelect = (city: typeof US_CITIES[0]) => {
    setSearchInput(`${city.city}, ${city.state}`);
    setSelectedZip(city.zip);
    setShowDropdown(false);
    setFilteredCities([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zipToUse = selectedZip || searchInput.trim();
    if (zipToUse) {
      onGenerateSample(zipToUse);
    }
  };

  return (
    <div className="bg-[#FFD447] md:py-12 p-[0px] px-[0px] py-[33px]">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 p-[21px] px-[21px] py-[18px]">
        {/* Mobile: Stacked Layout */}
        <div className="block md:hidden text-center mb-6">
          <h2 className="mb-2 text-[27px] font-bold not-italic">Sample your market for free.</h2>
          <p className="text-gray-600 text-[14px] max-w-2xl mx-auto">
            Enter your city or zipcode to get fresh listing data for your market.
          </p>
        </div>

        {/* Desktop: Two Column Layout */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12 md:items-center">
          {/* Left: Heading and Description */}
          <div>
            <h2 className="mb-3 text-[36px] font-bold">Sample your market for free.</h2>
            <p className="text-gray-600 text-[14px]">
              Enter your city or zipcode to get fresh listing data for your market.
            </p>
          </div>

          {/* Right: Form and Caption */}
          <div>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Enter City or Zip Code (e.g., Los Angeles or 90210)"
                    value={searchInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="h-12 text-[14px]"
                    required
                  />
                  {showDropdown && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      {filteredCities.map((city) => (
                        <div
                          key={city.zip}
                          className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                          onClick={() => handleCitySelect(city)}
                        >
                          <MapPin className="mr-2 inline-block h-4 w-4" />
                          {city.city}, {city.state} - {city.zip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-8 bg-[#342E37] hover:bg-[#342E37]/90 text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Free Sample Report
                </Button>
              </div>
            </form>

            <p className="text-gray-500 text-[11px] mt-3">
              Sample reports show property data only. Agent and contact information require a paid account.
            </p>
          </div>
        </div>

        {/* Mobile: Form */}
        <form onSubmit={handleSubmit} className="block md:hidden max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Enter City or ZIP (e.g., Miami or 90210)"
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className="h-12 text-[14px]"
                required
              />
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  {filteredCities.map((city) => (
                    <div
                      key={city.zip}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleCitySelect(city)}
                    >
                      <MapPin className="mr-2 inline-block h-4 w-4" />
                      {city.city}, {city.state} - {city.zip}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              className="h-12 px-8 bg-[#342E37] hover:bg-[#342E37]/90 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Free Sample Report
            </Button>
          </div>
        </form>

        {/* Mobile: Caption */}
        <p className="block md:hidden text-center text-gray-500 text-[11px] mt-4">
          Sample reports show property data only. Agent and contact information require a paid account.
        </p>
      </div>
    </div>
  );
}