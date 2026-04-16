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
import { Helmet } from 'react-helmet-async';
import { SampleReportModal } from './SampleReportModal';
import { SampleReportLoading } from './SampleReportLoading';
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
  onSampleReportLoading?: (loading: boolean) => void;
}

export function HomePage({ page, onNavigate, onSampleReportGenerated, onSampleReportLoading }: HomePageProps) {
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [showSampleReport, setShowSampleReport] = useState(false);
  const [sampleZipcode, setSampleZipcode] = useState('');
  const [sampleListings, setSampleListings] = useState<SampleListing[]>([]);
  const [sampleError, setSampleError] = useState<string | null>(null);
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

  const handleGenerateSample = async (city: string, state: string) => {
    const locationLabel = `${city}, ${state}`;
    setSampleZipcode(locationLabel);
    setSampleError(null);
    setIsLoadingReport(true);
    onSampleReportLoading?.(true);

    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }

    try {
      const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/search-listings?preview=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingType: 'sale',
          status: 'Active',
          propertyType: 'Single Family',
          city,
          state,
          daysOld: new Date().getDay() === 0 || new Date().getDay() === 1 ? 3 : 1,
          limit: 10,
          offset: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !Array.isArray(data?.listings)) {
        const message = data?.error || 'No listings found for that location. Try another city.';
        setSampleError(message);
        setSampleListings([]);

        if (onSampleReportGenerated) {
          onSampleReportGenerated(locationLabel, []);
        }

        return;
      }

      const fetchedListings = (data.listings || []).slice(0, 10).map((l: any, index: number) => ({
        id: l.id || index,
        formattedAddress: l.formattedAddress || l.addressLine1 || '',
        addressLine1: l.addressLine1 || '',
        city: l.city || '',
        state: l.state || '',
        zipCode: l.zipCode || '',
        county: l.county || '',
        latitude: l.latitude || 0,
        longitude: l.longitude || 0,
        propertyType: l.propertyType || 'Single Family',
        bedrooms: l.bedrooms || 0,
        bathrooms: l.bathrooms || 0,
        squareFeet: l.squareFootage || l.squareFeet || 0,
        lotSize: l.lotSize || 0,
        yearBuilt: l.yearBuilt || 0,
        price: l.price || 0,
        status: l.status || 'Active',
        daysOnMarket: l.daysOnMarket || 0,
        listingDate: l.listedDate || '',
        lastSeenDate: l.lastSeenDate || '',
        removedDate: l.removedDate || null,
        createdDate: l.createdDate || '',
        agentName: l.agent?.name || l.agentName || 'Unknown',
        agentWebsite: l.agent?.website || '',
        officeName: l.office?.name || l.officeName || '',
        officeWebsite: l.office?.website || '',
        brokerName: l.broker?.name || l.brokerName || '',
        mlsNumber: l.mlsNumber || '',
        mlsName: l.mlsName || '',
        builderName: l.builderName || '',
      }));

      if (fetchedListings.length === 0) {
        setSampleError('No listings found for that ZIP code. Try another.');
      }

      setSampleListings(fetchedListings);

      if (onSampleReportGenerated) {
        onSampleReportGenerated(locationLabel, fetchedListings);
      } else {
        setShowSampleReport(true);
      }

    } catch (error: any) {
      setSampleError('No listings found for that ZIP code. Try another.');
      setSampleListings([]);
      if (onSampleReportGenerated) {
        onSampleReportGenerated(locationLabel, []);
      }
    } finally {
      setIsLoadingReport(false);
      onSampleReportLoading?.(false);
      setLoadingTimeout(null);
    }
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
        <Helmet>
          <title>Real Estate Listing Data Sets | ListingBug</title>
          <meta name="description" content="Access comprehensive real estate listing data: property details, agent contacts, pricing, days on market, and status — updated daily from live MLS sources." />
          <link rel="canonical" href="https://thelistingbug.com/data-sets" />
          <meta property="og:title" content="Real Estate Listing Data Sets | ListingBug" />
          <meta property="og:description" content="Access comprehensive real estate listing data: property details, agent contacts, pricing, days on market, and status — updated daily from live MLS sources." />
          <meta property="og:url" content="https://thelistingbug.com/data-sets" />
        </Helmet>
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
        <Helmet>
          <title>Use Cases — Real Estate Service Providers | ListingBug</title>
          <meta name="description" content="See how mortgage brokers, home inspectors, stagers, contractors, insurance agents, and other real estate service providers use ListingBug to automate outreach and grow referral networks." />
          <link rel="canonical" href="https://thelistingbug.com/use-cases" />
          <meta property="og:title" content="Use Cases — Real Estate Service Providers | ListingBug" />
          <meta property="og:description" content="See how mortgage brokers, home inspectors, stagers, contractors, insurance agents, and other real estate service providers use ListingBug to automate outreach and grow referral networks." />
          <meta property="og:url" content="https://thelistingbug.com/use-cases" />
        </Helmet>
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
        <Helmet>
          <title>Pricing — Automated Agent Outreach via Email & SMS | ListingBug</title>
          <meta name="description" content="ListingBug plans start at $19/month. Send automated email and SMS outreach to listing agents in your market. 7-day free trial, no credit card required." />
          <link rel="canonical" href="https://thelistingbug.com/pricing" />
          <meta property="og:title" content="Pricing — Automated Agent Outreach via Email & SMS | ListingBug" />
          <meta property="og:description" content="ListingBug plans start at $19/month. Send automated email and SMS outreach to listing agents in your market. 7-day free trial, no credit card required." />
          <meta property="og:url" content="https://thelistingbug.com/pricing" />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "ListingBug Pricing",
            "description": "Pricing plans for ListingBug — automated email and SMS outreach to real estate listing agents.",
            "url": "https://thelistingbug.com/pricing",
            "publisher": { "@type": "Organization", "name": "ListingBug", "url": "https://thelistingbug.com" },
          })}</script>
        </Helmet>

        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-7 h-7 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="mb-0 text-4xl font-bold text-[33px]">Pricing</h1>
          </div>
          <p className="text-gray-600 dark:text-[#EBF2FA] max-w-2xl leading-relaxed text-[14px]">
            Pay for messages, not seats. Every plan includes email and SMS outreach, a shared inbox, and campaign templates. Pick the plan that matches your market size.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto px-[9px] py-[0px]">
          {/* City Plan */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="pt-[12px] pr-[24px] pb-[0px] pl-[24px]">
              <CardTitle className="text-[27px] font-bold">City</CardTitle>
              <div className="mt-4">
                <span className="text-[45px] font-bold">$19</span>
                <span className="text-gray-600 dark:text-[#EBF2FA] text-[15px] font-bold">/month</span>
              </div>
              <p className="text-gray-500 dark:text-[#EBF2FA]/70 text-[13px] mt-1">Best for a single focused market</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">2,500 messages/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">1 city</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Email & SMS campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Shared inbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Campaign templates</span>
                </li>
              </ul>
              <Button className="w-full mt-6" onClick={() => onNavigate?.('signup')}>Start Free Trial</Button>
            </CardContent>
          </Card>

          {/* Market Plan — highlighted */}
          <Card className="border-2 border-[#FFCE0A] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#FFCE0A] text-[#342E37] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
            </div>
            <CardHeader className="pt-[12px] pr-[24px] pb-[0px] pl-[24px]">
              <CardTitle className="text-[27px] font-bold">Market</CardTitle>
              <div className="mt-4">
                <span className="text-[45px] font-bold">$49</span>
                <span className="text-gray-600 dark:text-[#EBF2FA] text-[15px] font-bold">/month</span>
              </div>
              <p className="text-gray-500 dark:text-[#EBF2FA]/70 text-[13px] mt-1">Best for a metro area or county</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">5,000 messages/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">3 cities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Email & SMS campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Shared inbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Campaign templates</span>
                </li>
              </ul>
              <Button className="w-full mt-6" onClick={() => onNavigate?.('signup')}>Start Free Trial</Button>
            </CardContent>
          </Card>

          {/* Region Plan */}
          <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="pt-[12px] pr-[24px] pb-[0px] pl-[24px]">
              <CardTitle className="text-[27px] font-bold">Region</CardTitle>
              <div className="mt-4">
                <span className="text-[45px] font-bold">$99</span>
                <span className="text-gray-600 dark:text-[#EBF2FA] text-[15px] font-bold">/month</span>
              </div>
              <p className="text-gray-500 dark:text-[#EBF2FA]/70 text-[13px] mt-1">Best for multi-city or statewide coverage</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">10,000 messages/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">10 cities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Email & SMS campaigns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Shared inbox</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-[14px]">Campaign templates</span>
                </li>
              </ul>
              <Button className="w-full mt-6" onClick={() => onNavigate?.('signup')}>Start Free Trial</Button>
            </CardContent>
          </Card>
        </div>

        {/* Overage footnote */}
        <div className="mt-3 max-w-7xl mx-auto px-[9px]">
          <p className="text-[12px] text-gray-500 dark:text-[#EBF2FA]/60 italic">
            * Messages beyond your monthly limit are billed at $0.02 per message. Campaigns never stop mid-send.
          </p>
        </div>

        {/* Plan Comparison Table */}
        <div className="mt-16 p-[0px]">
          <div className="border-[12px] md:border-[24px] border-[#FFCE0A] rounded-none p-4 md:p-8">
            <div className="mb-6 md:mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-[#FFCE0A]" />
                <h2 className="mb-0 md:text-[36px] font-bold text-center text-[27px]">Plan Comparison</h2>
              </div>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                All plans include the same core features — plans differ by message volume and city count
              </p>
            </div>

            {/* Mobile: Stacked Cards */}
            <div className="block md:hidden space-y-4">
              {[
                { name: 'City', messages: '2,500', cities: '1', highlight: false },
                { name: 'Market', messages: '5,000', cities: '3', highlight: true },
                { name: 'Region', messages: '10,000', cities: '10', highlight: false },
              ].map((plan) => (
                <div key={plan.name} className={`border-2 rounded-lg p-3 ${plan.highlight ? 'border-[#FFCE0A] bg-[#FFCE0A]/5' : 'border-gray-200'}`}>
                  <h3 className={`font-bold text-[21px] text-center mb-3 pb-2 border-b-2 ${plan.highlight ? 'border-[#FFCE0A]' : 'border-gray-200'}`}>{plan.name}</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Messages/month', value: plan.messages },
                      { label: 'Cities', value: plan.cities },
                      { label: 'Overage rate', value: '$0.02/msg' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-100 gap-3">
                        <span className="text-[11px] text-gray-600 flex-1 min-w-0">{label}</span>
                        <span className="text-[11px] font-medium whitespace-nowrap">{value}</span>
                      </div>
                    ))}
                    {[
                      'Email campaigns',
                      'SMS campaigns',
                      'Shared inbox',
                      'Campaign templates',
                      'Agent contact lookup',
                      '7-day free trial',
                    ].map((feature) => (
                      <div key={feature} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-b-0 gap-3">
                        <span className="text-[11px] text-gray-600 flex-1 min-w-0">{feature}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-white/10">
                    <th className="text-left py-4 px-4 text-[14px] font-medium text-gray-600 dark:text-[#EBF2FA]">Feature</th>
                    <th className="text-center py-4 px-4 text-[14px] font-medium text-gray-600 dark:text-[#EBF2FA]">City</th>
                    <th className="text-center py-4 px-4 text-[14px] font-medium text-gray-600 dark:text-[#EBF2FA] bg-[#FFCE0A]/10">Market</th>
                    <th className="text-center py-4 px-4 text-[14px] font-medium text-gray-600 dark:text-[#EBF2FA]">Region</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-white/10">
                    <td className="py-3 px-4 text-[14px] dark:text-white">Messages/month</td>
                    <td className="text-center py-3 px-4 text-[14px] dark:text-white">2,500</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5 dark:text-white">5,000</td>
                    <td className="text-center py-3 px-4 text-[14px] dark:text-white">10,000</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/10">
                    <td className="py-3 px-4 text-[14px] dark:text-white">Cities</td>
                    <td className="text-center py-3 px-4 text-[14px] dark:text-white">1</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5 dark:text-white">3</td>
                    <td className="text-center py-3 px-4 text-[14px] dark:text-white">10</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/10">
                    <td className="py-3 px-4 text-[14px] dark:text-white">Overage rate</td>
                    <td className="text-center py-3 px-4 text-[14px] dark:text-white">$0.02/msg</td>
                    <td className="text-center py-3 px-4 text-[14px] bg-[#FFCE0A]/5 dark:text-white">$0.02/msg</td>
                    <td className="text-center py-3 px-4 text-[14px] dark:text-white">$0.02/msg</td>
                  </tr>
                  {[
                    'Email campaigns',
                    'SMS campaigns',
                    'Shared inbox',
                    'Campaign templates',
                    'Agent contact lookup',
                    '7-day free trial',
                  ].map((feature) => (
                    <tr key={feature} className="border-b border-gray-100 dark:border-white/10">
                      <td className="py-3 px-4 text-[14px] dark:text-white">{feature}</td>
                      <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                      <td className="text-center py-3 px-4 bg-[#FFCE0A]/5"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                      <td className="text-center py-3 px-4"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Why Choose ListingBug Section */}
        <div className="mt-16 p-[0px]">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-[27px] md:text-[33px] font-bold">Why ListingBug?</h2>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] max-w-2xl mx-auto">
              Built for service providers who want to reach listing agents without the manual work
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-[9px]">
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="w-12 h-12 bg-[#FFCE0A] rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[#342E37]" />
                </div>
                <h3 className="font-bold text-[16px] mb-2">Sends for You</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                  ListingBug monitors new listings and fires your campaign automatically. You don't lift a finger — replies land in your shared inbox.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="w-12 h-12 bg-[#FFCE0A] rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#342E37]" />
                </div>
                <h3 className="font-bold text-[16px] mb-2">First to Their Inbox</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                  Messages go out within hours of a new listing hitting the market — before your competitors have even seen it.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="w-12 h-12 bg-[#FFCE0A] rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#342E37]" />
                </div>
                <h3 className="font-bold text-[16px] mb-2">Grow Your Market</h3>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                  Start with one city, expand to a region. Upgrade anytime with prorated billing. No contracts, no surprises.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Before/After Section */}
        <div className="mt-16 p-[0px]">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-[27px] md:text-[33px] font-bold">The Old Way vs. ListingBug</h2>
            <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] max-w-2xl mx-auto">
              Stop manually hunting for leads. Let your outreach run on autopilot.
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
                    <h3 className="font-bold text-[16px] mb-2 text-red-900 dark:text-red-400">Without ListingBug</h3>
                    <ul className="space-y-2 text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Manually checking Zillow and MLS every morning</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Cold calling from a spreadsheet you built yourself</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Reaching out days after the listing — when it's too late</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>Competitors already booked the job</span>
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
                    <h3 className="font-bold text-[16px] mb-2 text-green-900 dark:text-green-400">With ListingBug</h3>
                    <ul className="space-y-2 text-[14px] text-gray-600 dark:text-[#EBF2FA]">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>New listing hits the market — your message goes out automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Agent replies land in your shared inbox, organized by campaign</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>You're first to reach out — every time, in every city you cover</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Set up once, get booked consistently</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust & Security */}
        <div className="mt-16 p-[0px]">
          <div className="max-w-4xl mx-auto">
            <div className="pt-8 pb-8">
              <div className="text-center mb-6">
                <h2 className="mb-3 text-[24px] font-bold dark:text-white">Built to Be Trusted</h2>
                <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                  Reliable infrastructure your business can depend on
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
                  <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">Campaigns keep running even when you're not watching</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
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
                  <h3 className="font-bold text-[16px] text-left dark:text-white">What counts as a "message"?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    Each email or SMS sent to a listing agent counts as one message. If your campaign sends an email and an SMS to the same agent, that's two messages. Replies from agents do not count against your limit.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">What happens when I hit my monthly message limit?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    Your campaigns keep running — we never stop a send mid-campaign. Messages beyond your monthly limit are billed at $0.02 each. You can monitor usage in real time from your dashboard and upgrade anytime to get a better per-message rate.
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
                    Yes. Upgrade or downgrade anytime from your account settings. Upgrades take effect immediately with prorated billing; downgrades apply at your next billing cycle. No penalties, no hassle.
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
                    Start any plan free for 7 days — no credit card required. Set up your first campaign, pick your city, and watch messages go out to real listing agents. Add payment details before day 7 to keep going. Cancel anytime if it's not for you.
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
                    Never. ListingBug is month-to-month with no long-term contracts. Cancel anytime from your account settings — no need to contact support.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] transition-colors cursor-pointer group">
                  <h3 className="font-bold text-[16px] text-left dark:text-white">How do I know how many messages I'll need?</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-all group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0F1115] border-x border-b border-gray-200 dark:border-white/10 rounded-b-lg -mt-2">
                  <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">
                    A typical mid-sized city sees 200–600 new listings per month. If you're sending one email per listing, that's 200–600 messages. The City plan (2,500 messages) comfortably covers most single-city use cases. Your dashboard shows real-time usage so you can right-size your plan at any time.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 px-[21px] mb-8 text-center">
          <p className="text-gray-600 dark:text-[#EBF2FA] mb-4 text-[14px]">
            Join service providers who've automated their agent outreach with ListingBug
          </p>
          <Button size="lg" onClick={() => onNavigate?.('signup')} className="px-8">
            Start Your Free Trial
          </Button>
          <p className="text-gray-500 dark:text-[#EBF2FA]/60 text-xs mt-3">
            No credit card required • Cancel anytime • 7-day free trial
          </p>
        </div>
      </div>
    );
  }

  // Home page
  return (
    <>
      <Helmet>
        <title>ListingBug — Real Estate Listing Alerts & Workflow Automation</title>
        <meta name="description" content="ListingBug sends new real estate listings straight into your workflows the moment they hit the market. Built for mortgage brokers, inspectors, stagers, contractors, and other service providers." />
        <link rel="canonical" href="https://thelistingbug.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ListingBug — Real Estate Listing Alerts & Workflow Automation" />
        <meta property="og:description" content="ListingBug sends new real estate listings straight into your workflows the moment they hit the market. Built for mortgage brokers, inspectors, stagers, contractors, and other service providers." />
        <meta property="og:url" content="https://thelistingbug.com/" />
        <meta property="og:site_name" content="ListingBug" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ListingBug",
          "applicationCategory": "BusinessApplication",
          "description": "Real estate listing alerts and workflow automation for service providers. Monitor markets, get new listings instantly, and trigger outreach automations.",
          "url": "https://thelistingbug.com",
          "offers": { "@type": "Offer", "price": "19", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "price": "19", "priceCurrency": "USD", "unitText": "MONTH" }},
          "publisher": { "@type": "Organization", "name": "ListingBug", "url": "https://thelistingbug.com" },
        })}</script>
      </Helmet>
      <div className="px-[12px] py-[0px]">
        <HeroSection onNavigate={onNavigate} onGenerateSample={handleGenerateSample} />
        <TrialCTASection onNavigate={onNavigate} />
        <HowItWorksSection />
        <AdditionalDataSection />
        <DataFieldsSection />
        {/* <DataEnrichmentSection /> */}
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