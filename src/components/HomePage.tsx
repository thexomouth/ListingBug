import { HeroSection } from './home/HeroSection';
import { DataFieldsSection } from './home/DataFieldsSection';
import { AdditionalDataSection } from './home/AdditionalDataSection';
import { DataEnrichmentSection } from './home/DataEnrichmentSection';
import { IntegrationsSection } from './home/IntegrationsSection';
import { UseCaseSection } from './home/UseCaseSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { TestimonialsSection } from './home/TestimonialsSection';
import { TrialCTASection } from './home/TrialCTASection';
import { BottomCTASection } from './home/BottomCTASection';
import { SampleReportModal } from './SampleReportModal';
import { SampleReportLoading } from './SampleReportLoading';
import { generateSampleListingsByZip } from '../utils/listingGenerator';
import { SampleListing } from '../types/listing';
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { ChevronDown, DollarSign, CheckCircle, X, BarChart3, Zap, Shield, TrendingUp, Lock, Phone } from 'lucide-react';
import { LBCard as Card, LBCardHeader as CardHeader, LBCardTitle as CardTitle, LBCardContent as CardContent } from './design-system/LBCard';
import { LBButton as Button } from './design-system/LBButton';

interface HomePageProps {
  page: 'home' | 'data-sets' | 'use-cases' | 'pricing';
  onNavigate?: (page: string) => void;
  onSampleReportGenerated?: (zipcode: string, listings: SampleListing[]) => void;
}

export function HomePage({ page, onNavigate, onSampleReportGenerated }: HomePageProps) {
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [showSampleReport, setShowSampleReport] = useState(false);
  const [sampleZipcode, setSampleZipcode] = useState('');
  const [sampleListings, setSampleListings] = useState<SampleListing[]>([]);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle scroll locking for loading animation
  useEffect(() => {
    if (isLoadingReport) {
      // Lock scrolling during loading animation
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Always unlock scrolling on cleanup
        document.body.style.overflow = 'unset';
      };
    } else {
      // Unlock scrolling when not loading
      document.body.style.overflow = 'unset';
    }
  }, [isLoadingReport]);

  const handleGenerateSample = (zipcode: string) => {
    setSampleZipcode(zipcode);
    setIsLoadingReport(true);
    
    // Simulate API call with loading animation
    const timeout = setTimeout(() => {
      const listings = generateSampleListingsByZip(zipcode);
      setSampleListings(listings);
      setIsLoadingReport(false);
      
      // Navigate to the new page instead of showing modal
      if (onSampleReportGenerated) {
        onSampleReportGenerated(zipcode, listings);
      } else {
        // Fallback to modal for backwards compatibility
        setShowSampleReport(true);
      }
      
      setLoadingTimeout(null);
    }, 2500); // 2.5 seconds to show loading animation
    
    setLoadingTimeout(timeout);
  };

  const handleCancelLoading = () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
    setIsLoadingReport(false);
    setSampleZipcode('');
  };

  const handleCloseSampleReport = () => {
    setShowSampleReport(false);
    setSampleZipcode('');
    setSampleListings([]);
  };

  if (page === 'data-sets') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="mb-8">Data Sets</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access comprehensive real estate listing data including property details,
                pricing, location, and status information.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Market Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Historical and real-time market data to help you make informed decisions
                about property investments and trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (page === 'use-cases') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="mb-8">Use Cases</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Real Estate Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Find comparable properties, track market trends, and provide clients
                with data-driven insights.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Investors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Identify investment opportunities, analyze property values, and monitor
                your portfolio performance.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Market Researchers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access comprehensive data sets for market analysis, trend forecasting,
                and research reports.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (page === 'pricing') {
    return (
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 p-[33px] px-[18px] py-[33px]">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-7 h-7 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="mb-0 text-4xl font-bold text-[33px] font-[Work_Sans]">Pricing</h1>
          </div>
          <p className="text-gray-600 max-w-2xl leading-relaxed text-[14px]">
            Choose the plan that fits your business needs. All plans include access to comprehensive listing data, 
            agent contact information, and CSV exports.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto px-[9px] py-[0px]">
          <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="pt-[12px] pr-[24px] pb-[0px] pl-[24px]">
              <CardTitle className="text-[27px] font-bold font-normal font-[Work_Sans]">Starter</CardTitle>
              <div className="mt-4 text-[15px]">
                <span className="text-4xl text-[45px] font-bold font-[Work_Sans]">$49</span>
                <span className="text-gray-600 text-[15px] font-bold">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">4,000 listings/month*</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">1 automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">All 9 integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Email notifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">CSV exports</span>
                </li>
              </ul>
              <Button className="w-full mt-6" onClick={() => onNavigate?.('signup')}>Get Started</Button>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#FFCE0A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="pt-[12px] pr-[24px] pb-[0px] pl-[24px]">
              <CardTitle className="text-[27px] font-[Work_Sans]">Professional</CardTitle>
              <div className="mt-4">
                <span className="text-4xl text-[45px] font-bold">$99</span>
                <span className="text-gray-600 text-[15px] font-bold">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">10,000 listings/month*</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Property valuations</span>
                </li>
                <li className="flex items-center gap-2 text-[14px]">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Relisted property alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Advanced search filters</span>
                </li>
              </ul>
              <Button className="w-full mt-6" onClick={() => onNavigate?.('signup')}>Get Started</Button>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="pt-[12px] pr-[24px] pb-[0px] pl-[24px]">
              <CardTitle className="text-[27px] font-[Work_Sans]">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold text-[#342e37]">Contact Us</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Unlimited listings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Property valuations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Relisted property alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Team collaboration (10 users)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[14px]">Dedicated account manager</span>
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline" onClick={() => window.location.href = 'mailto:sales@listingbug.com'}>Contact Our Team</Button>
            </CardContent>
          </Card>
        </div>

        {/* Footnote for pricing cards */}
        <div className="mt-3 max-w-7xl mx-auto px-[9px]">
          <p className="text-[12px] text-gray-500 italic">
            * Additional listings beyond your monthly allowance are available at $0.01 per listing. Your automations never stop working.
          </p>
        </div>

        {/* Detailed Plan Comparison Chart */}
        <div className="mt-16 p-[0px]">
          <div className="border-[12px] md:border-[24px] border-[#FFCE0A] rounded-none p-4 md:p-8">
            <div className="mb-6 md:mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-[#342e37]" />
                <h2 className="mb-0 md:text-[36px] font-bold text-center text-[27px] font-[Work_Sans]">Plan Comparison</h2>
              </div>
              <p className="text-gray-600 text-[14px]">
                Compare all features across plans to find the perfect fit for your needs
              </p>
            </div>
            
            {/* Mobile: Stacked Cards */}
            <div className="block md:hidden space-y-4">
              {/* Starter Plan */}
              <div className="border-2 border-gray-200 rounded-lg p-3">
                <h3 className="font-bold text-[21px] text-center mb-3 pb-2 border-b-2 border-gray-200">Starter</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Monthly Reports</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">33</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Search Filters</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Basic</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">CSV Exports</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Agent Contact Data</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Automated Reporting</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Email Alerts</span>
                    <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">API Access</span>
                    <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Custom Integrations</span>
                    <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Support</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Standard</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Historical Data</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">30 days</span>
                  </div>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="border-2 border-[#FFCE0A] rounded-lg p-3 bg-[#FFCE0A]/5">
                <h3 className="font-bold text-[16px] text-center mb-3 pb-2 border-b-2 border-[#FFCE0A]">Professional</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Monthly Reports</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">99</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Search Filters</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Advanced</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">CSV Exports</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Agent Contact Data</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Automated Reporting</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Email Alerts</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">API Access</span>
                    <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Custom Integrations</span>
                    <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Support</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Priority</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Historical Data</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">90 days</span>
                  </div>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="border-2 border-gray-200 rounded-lg p-3">
                <h3 className="font-bold text-[16px] text-center mb-3 pb-2 border-b-2 border-gray-200">Enterprise</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Monthly Reports</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Unlimited</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Search Filters</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Advanced + Custom</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">CSV Exports</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Agent Contact Data</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Automated Reporting</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Email Alerts</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">API Access</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Custom Integrations</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Support</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Dedicated Manager</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 gap-3">
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0">Historical Data</span>
                    <span className="text-[11px] font-medium whitespace-nowrap">Unlimited</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-[14px] font-medium text-gray-600">Feature</th>
                    <th className="text-center py-4 px-4 text-[14px] font-medium text-gray-600">Starter</th>
                    <th className="text-center py-4 px-4 text-[14px] font-medium text-gray-600 bg-[#FFCE0A]/10">Professional</th>
                    <th className="text-center py-4 px-4 text-[14px] font-medium text-gray-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Monthly Listing Reports</td>
                    <td className="text-center py-3 px-4 text-[14px]">33</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5">99</td>
                    <td className="text-center py-3 px-4 text-[14px]">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Search Filters</td>
                    <td className="text-center py-3 px-4 text-[14px]">Basic</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5">Advanced</td>
                    <td className="text-center py-3 px-4 text-[14px]">Advanced + Custom</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">CSV Exports</td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Agent Contact Data</td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Automated Reporting</td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Email Alerts</td>
                    <td className="text-center py-3 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">API Access</td>
                    <td className="text-center py-3 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Custom Integrations</td>
                    <td className="text-center py-3 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Support</td>
                    <td className="text-center py-3 px-4 text-[14px]">Standard</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5">Priority</td>
                    <td className="text-center py-3 px-4 text-[14px]">Dedicated Manager</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-[14px]">Historical Data Access</td>
                    <td className="text-center py-3 px-4 text-[14px]">30 days</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5">90 days</td>
                    <td className="text-center py-3 px-4 text-[14px]">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Why Choose ListingBug Section */}
        <div className="mt-16 p-[0px]">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-[27px] md:text-[33px] font-bold">Why Choose ListingBug?</h2>
            <p className="text-gray-600 text-[14px] max-w-2xl mx-auto">
              Built by real estate professionals, for real estate professionals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-[9px]">
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="w-12 h-12 bg-[#FFCE0A] rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[#342E37]" />
                </div>
                <h3 className="font-bold text-[16px] mb-2">Automation That Works</h3>
                <p className="text-gray-600 text-[14px]">
                  Connect to 17 destinations including Google Sheets, Airtable, Slack, and webhooks. 
                  Your automations run 24/7 so you never miss a listing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="w-12 h-12 bg-[#FFCE0A] rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#342E37]" />
                </div>
                <h3 className="font-bold text-[16px] mb-2">Enterprise-Grade Security</h3>
                <p className="text-gray-600 text-[14px]">
                  Bank-level encryption, SOC 2 compliant infrastructure, and 2FA phone verification. 
                  Your data and your clients' privacy are our top priority.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="w-12 h-12 bg-[#FFCE0A] rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#342E37]" />
                </div>
                <h3 className="font-bold text-[16px] mb-2">Scale With Confidence</h3>
                <p className="text-gray-600 text-[14px]">
                  Start small, grow big. Upgrade or downgrade anytime with prorated billing. 
                  No contracts, no surprises—just flexible pricing that grows with you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Problems We Solve Section */}
        <div className="mt-16 p-[0px]">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-[27px] md:text-[33px] font-bold">Problems We Solve</h2>
            <p className="text-gray-600 text-[14px] max-w-2xl mx-auto">
              Stop wasting time on manual data collection and missed opportunities
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto px-[9px]">
            <Card className="border-l-4 border-l-red-400">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] mb-2 text-red-900">Without ListingBug</h3>
                    <ul className="space-y-2 text-[14px] text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Manually checking MLS portals multiple times per day</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Missing new listings because you can't monitor 24/7</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Copy-pasting data into spreadsheets for hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Competitors beating you to leads</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-400">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] mb-2 text-green-900">With ListingBug</h3>
                    <ul className="space-y-2 text-[14px] text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Automated searches running 24/7 in the background</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Instant notifications when new listings match your criteria</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Data automatically exported to your CRM or spreadsheet</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Be the first to reach out to listing agents</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust & Security Section */}
        <div className="mt-16 p-[0px]">
          <div className="max-w-4xl mx-auto">
            <div className="pt-8 pb-8">
              <div className="text-center mb-6">
                <h2 className="mb-3 text-[24px] font-bold dark:text-white">Your Data is Safe With Us</h2>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                  Enterprise-grade security for businesses of all sizes
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-[14px] mb-1 dark:text-white">256-bit Encryption</h3>
                  <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">Bank-level SSL encryption for all data transfers</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-[14px] mb-1 dark:text-white">2FA Protection</h3>
                  <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">Phone verification and two-factor authentication</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-[14px] mb-1 dark:text-white">99.9% Uptime</h3>
                  <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">Reliable infrastructure your business can depend on</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 p-[0px]">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-[27px] md:text-[33px] font-bold">Frequently Asked Questions</h2>
            <p className="text-gray-600 dark:text-gray-300 text-[14px]">
              Everything you need to know about ListingBug pricing and billing
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-3">
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">What happens if I exceed my monthly listing limit?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    No worries! Your automations keep running seamlessly, and additional listings are just $0.01 each. 
                    We never stop your workflows—we believe in flexible, pay-as-you-grow pricing. You can monitor your 
                    usage in real-time from your Dashboard and upgrade to a higher plan anytime to maximize savings.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">Can I change plans at any time?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    Absolutely! You can upgrade or downgrade your plan anytime from your account settings. 
                    Upgrades take effect immediately with prorated billing, and downgrades apply at your next billing cycle. 
                    No penalties, no hassle.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">How does the 7-day free trial work?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    Start with any paid plan risk-free for 7 days. No credit card required to start. Explore all features, 
                    create automations, and pull listing data. If you love it (and we think you will), add payment details 
                    before day 7. Not satisfied? Cancel anytime with our money-back guarantee.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">What's included in the "free month of extra reports"?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    New customers get an additional month's worth of listing reports free (4,000 extra for Starter, 10,000 for Professional). 
                    This gives you breathing room to learn the platform, test automations, and dial in your workflows without worrying about limits.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">Is there a contract or cancellation fee?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    Never. ListingBug is month-to-month with no long-term contracts. Cancel anytime directly from your account 
                    settings—no need to contact support. Your data remains accessible for 30 days after cancellation.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">Do you offer discounts for annual billing?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    Yes! Save 20% by paying annually instead of monthly. Annual subscribers also get priority feature requests 
                    and early access to new integrations. Contact our team for custom pricing on Enterprise plans.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 px-[21px] mb-8 text-center">
          <p className="text-gray-600 mb-4 text-[14px]">
            Join 1,000+ real estate professionals who've transformed their business with ListingBug
          </p>
          <Button size="lg" onClick={() => onNavigate?.('signup')} className="px-8">
            Start Your Free Trial Today
          </Button>
          <p className="text-gray-500 text-xs mt-3">
            No credit card required • Cancel anytime • 7-day money-back guarantee • <strong>Free month of extra reports</strong> to learn the platform
          </p>
        </div>
      </div>
    );
  }

  // Home page
  return (
    <>
      <div className="px-[12px] py-[0px]">
        <HeroSection onNavigate={onNavigate} onGenerateSample={handleGenerateSample} />
        <TrialCTASection onNavigate={onNavigate} />
        <HowItWorksSection />
        <AdditionalDataSection />
        <DataFieldsSection />
        <DataEnrichmentSection />
        <IntegrationsSection />
        <UseCaseSection />
        <BottomCTASection onNavigate={onNavigate} />
      </div>

      {/* Loading Modal */}
      <SampleReportLoading isOpen={isLoadingReport} zipcode={sampleZipcode} onCancel={handleCancelLoading} />

      {/* Sample Report Modal */}
      <SampleReportModal
        isOpen={showSampleReport}
        onClose={handleCloseSampleReport}
        zipcode={sampleZipcode}
        listings={sampleListings}
        onNavigate={onNavigate}
      />
    </>
  );
}