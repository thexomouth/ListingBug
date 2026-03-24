import { X, MapPin, Home, TrendingUp, TrendingDown, Phone, Mail, Building2, FileText, DollarSign, Calendar, Ruler, Bed, Bath, Target, Sparkles, Save, ChevronLeft, Shield, AlertTriangle, CheckCircle2, Clock, Activity, BarChart3, User } from 'lucide-react';
import { LBButton } from './design-system/LBButton';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface ListingDetailModalProps {
  listing: any;
  onClose: () => void;
  onSaveListing?: (listing: any) => void;
  isSaved?: boolean;
}

type ViewMode = 'listing' | 'property-record' | 'valuation';

export function ListingDetailModal({ listing, onClose, onSaveListing, isSaved = false }: ListingDetailModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('listing');
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Enable swipe-to-close on mobile (swipe right to close)
  useSwipeGesture({
    onSwipeRight: () => {
      // Only close on swipe right if we're at the left edge of content
      onClose();
    },
    threshold: 80, // Require 80px swipe
    velocityThreshold: 0.4, // Or fast swipe
  });

  // CRITICAL: Proper scroll lock that works on mobile and desktop
  useEffect(() => {
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Get original body overflow and position values
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    
    // Lock body scroll completely - prevents background scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.right = '0';
    
    return () => {
      // Restore body scroll - use stored values or defaults
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.left = '';
      document.body.style.right = '';
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode !== 'listing') {
          setViewMode('listing');
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, viewMode]);

  if (!listing) return null;

  // Calculate opportunity score (mock calculation)
  const calculateOpportunityScore = () => {
    let score = 50;
    if (listing.daysListed > 14) score += 20;
    if (listing.priceDrop) score += 15;
    if (listing.reList) score += 10;
    if (listing.yearBuilt < 2000) score += 5;
    return Math.min(score, 100);
  };

  const opportunityScore = calculateOpportunityScore();

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-red-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-gray-100';
  };

  // Mock property record data
  const generatePropertyRecord = () => {
    const purchaseYear = listing.yearBuilt + Math.floor(Math.random() * 10);
    const purchasePrice = Math.floor(listing.price * (0.6 + Math.random() * 0.2));
    const taxAssessment = Math.floor(listing.price * 0.85);
    const landValue = Math.floor(taxAssessment * 0.25);
    const improvementValue = taxAssessment - landValue;
    const annualTax = Math.floor(taxAssessment * 0.012);

    return {
      ownerName: 'John & Sarah Henderson',
      mailingAddress: '1425 Oak Street, Portland, OR 97204',
      purchaseDate: `${purchaseYear}-03-15`,
      purchasePrice: purchasePrice,
      taxAssessment: {
        total: taxAssessment,
        land: landValue,
        improvements: improvementValue,
      },
      annualTax: annualTax,
      legalDescription: `LOT 12, BLOCK 5, ${listing.city.toUpperCase()} HEIGHTS SUBDIVISION, ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 47 OF PLATS, PAGE 23`,
      parcelNumber: `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      zoning: listing.propertyType === 'Commercial' ? 'C-2 (General Commercial)' : listing.propertyType === 'Multi-Family' ? 'R-3 (Multi-Family Residential)' : 'R-1 (Single Family Residential)',
      deedType: 'Warranty Deed',
      recordedDate: `${purchaseYear}-04-02`,
      liens: Math.random() > 0.7 ? [
        { type: 'Mortgage Lien', amount: Math.floor(listing.price * 0.7), holder: 'First National Bank', recorded: `${purchaseYear}-04-02` }
      ] : [],
      permits: [
        { type: 'Building Permit', description: 'Roof Replacement', date: '2021-06-15', status: 'Completed' },
        { type: 'Building Permit', description: 'HVAC Installation', date: '2019-03-22', status: 'Completed' },
      ],
      salesHistory: [
        { date: `${purchaseYear}-03-15`, price: purchasePrice, type: 'Sale' },
        { date: `${purchaseYear - 8}-07-20`, price: Math.floor(purchasePrice * 0.75), type: 'Sale' },
        { date: `${listing.yearBuilt}-01-10`, price: Math.floor(purchasePrice * 0.45), type: 'New Construction' },
      ],
    };
  };

  // Mock valuation data
  const generateValuation = () => {
    const estimatedValue = Math.floor(listing.price * (0.95 + Math.random() * 0.1));
    const lowRange = Math.floor(estimatedValue * 0.92);
    const highRange = Math.floor(estimatedValue * 1.08);
    const pricePerSqFt = Math.floor(estimatedValue / listing.sqft);
    const rentEstimate = Math.floor(estimatedValue * 0.008);
    
    const comps = [
      {
        address: '1456 Maple Ave',
        distance: '0.3 mi',
        price: Math.floor(estimatedValue * 0.98),
        beds: listing.bedrooms,
        baths: listing.bathrooms,
        sqft: listing.sqft + Math.floor(Math.random() * 200 - 100),
        soldDate: '2024-11-15',
        daysOnMarket: 12,
      },
      {
        address: '892 Birch Street',
        distance: '0.5 mi',
        price: Math.floor(estimatedValue * 1.02),
        beds: listing.bedrooms,
        baths: listing.bathrooms,
        sqft: listing.sqft + Math.floor(Math.random() * 200 - 100),
        soldDate: '2024-10-28',
        daysOnMarket: 8,
      },
      {
        address: '2134 Cedar Lane',
        distance: '0.7 mi',
        price: Math.floor(estimatedValue * 0.96),
        beds: listing.bedrooms === 3 ? 4 : listing.bedrooms,
        baths: listing.bathrooms,
        sqft: listing.sqft + Math.floor(Math.random() * 300 - 150),
        soldDate: '2024-10-05',
        daysOnMarket: 15,
      },
    ];

    return {
      estimatedValue,
      confidenceScore: 87,
      valueRange: { low: lowRange, high: highRange },
      pricePerSqFt,
      marketPricePerSqFt: Math.floor(pricePerSqFt * 1.03),
      appreciation: {
        oneYear: 6.2,
        threeYear: 18.5,
        fiveYear: 34.8,
      },
      rentalEstimate: {
        monthly: rentEstimate,
        low: Math.floor(rentEstimate * 0.9),
        high: Math.floor(rentEstimate * 1.1),
      },
      comparables: comps,
      marketConditions: {
        avgDaysOnMarket: 24,
        listToSaleRatio: 98.2,
        inventoryLevel: 'Low',
        marketTrend: 'Appreciating',
      },
      equity: estimatedValue - Math.floor(estimatedValue * 0.7),
    };
  };

  const handleLoadReport = (type: 'property-record' | 'valuation') => {
    setIsLoadingReport(true);
    // Simulate API call
    setTimeout(() => {
      setViewMode(type);
      setIsLoadingReport(false);
    }, 800);
  };

  const propertyRecord = generatePropertyRecord();
  const valuation = generateValuation();

  // Render modal content
  const modalContent = (
    <>
      {/* Backdrop - Fixed positioning, click to close */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={() => viewMode === 'listing' ? onClose() : setViewMode('listing')}
        aria-hidden="true"
      />
      
      {/* Modal - Side Drawer with proper overflow handling */}
      <div 
        className="fixed right-0 top-0 h-screen w-[calc(100%-12px)] md:w-[650px] lg:w-[800px] bg-white dark:bg-[#0F1115] z-[9999] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Wrapper for flex layout */}
        <div className="h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 bg-[#ffd447] border-b border-[#ffd447]/20 px-3 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {viewMode !== 'listing' && (
                <button
                  onClick={() => setViewMode('listing')}
                  className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Back to listing"
                >
                  <ChevronLeft className="w-5 h-5 text-[#342e37]" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-[21px] font-bold text-[#342e37] mb-1 truncate">
                  {viewMode === 'property-record' && 'Property Record'}
                  {viewMode === 'valuation' && 'Property Valuation'}
                  {viewMode === 'listing' && listing.address}
                </h2>
                <p className="text-[14px] text-[#342e37]/80 truncate">
                  {viewMode === 'listing' ? `${listing.city}, ${listing.state} ${listing.zip}` : listing.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {viewMode === 'listing' && onSaveListing && (
                <button
                  onClick={() => onSaveListing(listing)}
                  className={`p-2 rounded-lg transition-colors ${ 
                    isSaved 
                      ? 'bg-[#342e37] text-[#FFD447] hover:bg-[#342e37]/90' 
                      : 'hover:bg-[#342e37]/10'
                  }`}
                  aria-label={isSaved ? "Unsave listing" : "Save listing"}
                  title={isSaved ? "Remove from saved listings" : "Save this listing"}
                >
                  <Save className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#342e37]" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingReport ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#FFD447] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading report...</p>
                </div>
              </div>
            ) : viewMode === 'property-record' ? (
              <div className="px-3 md:px-6 py-6 space-y-6">
                {/* Report Header */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-[18px]">Property Record Report</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Comprehensive public record information for {listing.address}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Current Ownership */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Current Ownership</h3>
                  </div>
                  <div className="space-y-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Owner Name</p>
                      <p className="font-medium">{propertyRecord.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Mailing Address</p>
                      <p className="font-medium">{propertyRecord.mailingAddress}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-600 mb-1">Purchase Date</p>
                        <p className="font-medium">{new Date(propertyRecord.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Purchase Price</p>
                        <p className="font-medium">${propertyRecord.purchasePrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Assessment */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Tax Assessment</h3>
                  </div>
                  <div className="space-y-3 text-[14px]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-600 mb-1">Total Assessment</p>
                        <p className="font-medium text-[16px]">${propertyRecord.taxAssessment.total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Annual Tax</p>
                        <p className="font-medium text-[16px]">${propertyRecord.annualTax.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Land Value</p>
                        <p className="font-medium">${propertyRecord.taxAssessment.land.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Improvement Value</p>
                        <p className="font-medium">${propertyRecord.taxAssessment.improvements.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Legal Information</h3>
                  </div>
                  <div className="space-y-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Parcel Number (APN)</p>
                      <p className="font-medium font-mono">{propertyRecord.parcelNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Zoning</p>
                      <p className="font-medium">{propertyRecord.zoning}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Legal Description</p>
                      <p className="font-medium text-xs leading-relaxed">{propertyRecord.legalDescription}</p>
                    </div>
                  </div>
                </div>

                {/* Deed Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Deed Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Deed Type</p>
                      <p className="font-medium">{propertyRecord.deedType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Recorded Date</p>
                      <p className="font-medium">{new Date(propertyRecord.recordedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Liens & Encumbrances */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {propertyRecord.liens.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    <h3 className="font-bold text-[18px]">Liens & Encumbrances</h3>
                  </div>
                  {propertyRecord.liens.length > 0 ? (
                    <div className="space-y-3">
                      {propertyRecord.liens.map((lien, idx) => (
                        <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-[14px]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold">{lien.type}</p>
                            <p className="font-bold text-orange-700">${lien.amount.toLocaleString()}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                            <div>
                              <p className="text-gray-600">Holder</p>
                              <p className="font-medium">{lien.holder}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Recorded</p>
                              <p className="font-medium">{new Date(lien.recorded).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[14px]">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <p>No active liens or encumbrances found</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Building Permits */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Building Permits</h3>
                  </div>
                  <div className="space-y-2">
                    {propertyRecord.permits.map((permit, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 text-[14px]">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold">{permit.description}</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            {permit.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{permit.type}</span>
                          <span>•</span>
                          <span>{new Date(permit.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales History */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Sales History</h3>
                  </div>
                  <div className="space-y-2">
                    {propertyRecord.salesHistory.map((sale, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 text-[14px]">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{new Date(sale.date).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-600">{sale.type}</p>
                          </div>
                          <p className="font-bold text-[16px]">${sale.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Padding */}
                <div className="pt-4 pb-2"></div>
              </div>
            ) : viewMode === 'valuation' ? (
              <div className="px-3 md:px-6 py-6 space-y-6">
                {/* Report Header */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-[18px]">Property Valuation Report</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Automated valuation model (AVM) for {listing.address}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Estimated Value */}
                <div className="bg-gradient-to-br from-[#FFD447]/20 to-[#FFD447]/5 border-2 border-[#FFD447] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estimated Market Value</p>
                      <p className="font-bold text-[28px] text-[#342e37]">${valuation.estimatedValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Confidence Score</p>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <span className="font-bold">{valuation.confidenceScore}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#FFD447]/30">
                    <p className="text-xs text-gray-600 mb-2">Value Range</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">${valuation.valueRange.low.toLocaleString()}</span>
                      <span className="text-gray-400">—</span>
                      <span className="font-medium">${valuation.valueRange.high.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Price Analysis */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Price Analysis</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Property Price/SF</p>
                      <p className="font-medium text-[16px]">${valuation.pricePerSqFt}/sf</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Market Avg Price/SF</p>
                      <p className="font-medium text-[16px]">${valuation.marketPricePerSqFt}/sf</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Current List Price</p>
                      <p className="font-medium">${listing.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Est. vs. List</p>
                      <p className={`font-medium ${valuation.estimatedValue > listing.price ? 'text-green-600' : 'text-red-600'}`}>
                        {valuation.estimatedValue > listing.price ? '+' : ''}
                        {(((valuation.estimatedValue - listing.price) / listing.price) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Appreciation Trends */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Appreciation Trends</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm text-gray-700">1-Year Appreciation</span>
                      <span className="font-bold text-green-600">+{valuation.appreciation.oneYear}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm text-gray-700">3-Year Appreciation</span>
                      <span className="font-bold text-green-600">+{valuation.appreciation.threeYear}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm text-gray-700">5-Year Appreciation</span>
                      <span className="font-bold text-green-600">+{valuation.appreciation.fiveYear}%</span>
                    </div>
                  </div>
                </div>

                {/* Rental Estimate */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Rental Estimate</h3>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Estimated Monthly Rent</p>
                      <p className="font-bold text-[24px] text-blue-600">${valuation.rentalEstimate.monthly.toLocaleString()}/mo</p>
                    </div>
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-600 mb-2">Rental Range</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">${valuation.rentalEstimate.low.toLocaleString()}</span>
                        <span className="text-gray-400">—</span>
                        <span className="font-medium">${valuation.rentalEstimate.high.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-blue-200 mt-3">
                      <p className="text-xs text-gray-600 mb-1">Estimated Annual Yield</p>
                      <p className="font-bold text-blue-600">
                        {((valuation.rentalEstimate.monthly * 12 / valuation.estimatedValue) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comparable Sales */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Comparable Sales</h3>
                  </div>
                  <div className="space-y-3">
                    {valuation.comparables.map((comp, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-[15px]">{comp.address}</p>
                            <p className="text-xs text-gray-600">{comp.distance} away</p>
                          </div>
                          <p className="font-bold text-[16px]">${comp.price.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <p className="text-gray-500">Beds/Baths</p>
                            <p className="font-medium text-gray-900">{comp.beds} / {comp.baths}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Sq Ft</p>
                            <p className="font-medium text-gray-900">{comp.sqft.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">$/SF</p>
                            <p className="font-medium text-gray-900">${Math.floor(comp.price / comp.sqft)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                          <span>Sold: {new Date(comp.soldDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{comp.daysOnMarket} days on market</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Conditions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-[#342e37]" />
                    <h3 className="font-bold text-[18px]">Market Conditions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Avg Days on Market</p>
                      <p className="font-medium">{valuation.marketConditions.avgDaysOnMarket} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">List to Sale Ratio</p>
                      <p className="font-medium">{valuation.marketConditions.listToSaleRatio}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Inventory Level</p>
                      <p className="font-medium">{valuation.marketConditions.inventoryLevel}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Market Trend</p>
                      <p className="font-medium text-green-600">{valuation.marketConditions.marketTrend}</p>
                    </div>
                  </div>
                </div>

                {/* Equity Position */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-[16px]">Estimated Equity Position</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Based on estimated mortgage balance of 70% LTV
                  </p>
                  <p className="font-bold text-[24px] text-purple-600">${valuation.equity.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {((valuation.equity / valuation.estimatedValue) * 100).toFixed(1)}% equity
                  </p>
                </div>

                {/* Bottom Padding */}
                <div className="pt-4 pb-2"></div>
              </div>
            ) : (
              <div className="px-3 md:px-6 py-6 space-y-6">
                {/* Property Photo - Only show if we have a real photo or can generate Street View */}
                {(() => {
                  const hasPhoto = listing.photos && listing.photos.length > 0 && listing.photos[0];
                  const hasLatLng = listing.latitude && listing.longitude;
                  const streetViewUrl = hasLatLng
                    ? `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${listing.latitude},${listing.longitude}&key=AIzaSyBx4RH4XvtQWTRfIw4EW-g1VzwEAihe628`
                    : null;
                  const photoSrc = hasPhoto ? listing.photos[0] : null;

                  if (!photoSrc && !hasLatLng) return null;

                  return (
                    <div className="rounded-lg overflow-hidden">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={listing.address}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            // If RentCast photo fails to load, try Street View or hide
                            const target = e.currentTarget;
                            if (hasLatLng && streetViewUrl) {
                              target.src = streetViewUrl;
                            } else {
                              target.parentElement!.style.display = 'none';
                            }
                          }}
                        />
                      ) : hasLatLng ? (
                        <div className="w-full h-64 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                          <img
                            src={`https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${listing.latitude},${listing.longitude}&fov=90&pitch=10&key=AIzaSyBx4RH4XvtQWTRfIw4EW-g1VzwEAihe628`}
                            alt={`Street view of ${listing.address}`}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.parentElement!.style.display = 'none';
                            }}
                          />
                          <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Street View</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                {/* Description - Moved to top */}
                {listing.description && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-[#342e37]" />
                      <h3 className="font-bold text-[18px]">Description</h3>
                    </div>
                    <p className="text-[14px] text-gray-700 leading-relaxed">
                      {listing.description}
                    </p>
                  </div>
                )}

                {/* Opportunity Intelligence Section */}
                <div className="bg-gradient-to-br from-[#FFD447]/20 to-[#FFD447]/5 border-2 border-[#FFD447] rounded-lg p-3 md:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#ffffff]" />
                      <h3 className="font-bold text-[18px] text-[#ffffff]">Opportunity Intelligence</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${getScoreBgColor(opportunityScore)}`}>
                      <span className={`font-bold ${getScoreColor(opportunityScore)}`}>
                        {opportunityScore}/100
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-[14px]">
                    {listing.daysListed > 14 && (
                      <div className="flex items-start gap-2 text-orange-700">
                        <span>🔥</span>
                        <span><strong>Long market time:</strong> {listing.daysListed} days (opportunity for motivated seller)</span>
                      </div>
                    )}
                    {listing.priceDrop && (
                      <div className="flex items-start gap-2 text-red-700">
                        <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Price reduced:</strong> ${listing.priceDropAmount.toLocaleString()} ({listing.priceDropPercent}% drop)</span>
                      </div>
                    )}
                    {listing.reList && (
                      <div className="flex items-start gap-2 text-orange-700">
                        <span>🔁</span>
                        <span><strong>Re-listed property:</strong> Previously listed and returned to market</span>
                      </div>
                    )}
                    {listing.yearBuilt < 2000 && (
                      <div className="flex items-start gap-2 text-blue-700">
                        <span>🏚️</span>
                        <span><strong>Older property:</strong> Built in {listing.yearBuilt} - likely needs updates</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-[#FFD447]/30">
                    <p className="text-xs mb-2 text-[#c0c0c0]">Get detailed reports (requires credits):</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <LBButton 
                        variant="outline" 
                        size="sm" 
                        className="whitespace-nowrap text-xs"
                        onClick={() => handleLoadReport('property-record')}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Property Record <span className="ml-1 font-bold text-[#8e8e8e]">1 credit</span>
                      </LBButton>
                      <LBButton 
                        variant="outline" 
                        size="sm" 
                        className="whitespace-nowrap text-xs"
                        onClick={() => handleLoadReport('valuation')}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Valuation <span className="ml-1 font-bold text-[#8e8e8e]">1 credit</span>
                      </LBButton>
                    </div>
                  </div>
                </div>

                {/* Listing Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-[#ffffff]" />
                    <h3 className="font-bold text-[18px]">Listing Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">List Price</p>
                      <p className="font-medium text-[16px]">${listing.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Status</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          listing.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : listing.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Days on Market</p>
                      <p className={`font-medium ${listing.daysListed > 14 ? 'text-orange-600' : ''}`}>
                        {listing.daysListed} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">MLS Number</p>
                      <p className="font-medium">{listing.mlsNumber || <span className="text-gray-400">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">MLS Source</p>
                      <p className="font-medium">{listing.mlsSource || <span className="text-gray-400">—</span>}</p>
                    </div>
                    {listing.priceDrop && (
                      <div>
                        <p className="text-gray-600 mb-1">Price Change</p>
                        <p className="font-medium text-red-600">
                          -${listing.priceDropAmount.toLocaleString()} ({listing.priceDropPercent}%)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="w-5 h-5 text-[#ffffff]" />
                    <h3 className="font-bold text-[18px]">Property Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Property Type</p>
                      <p className="font-medium">{listing.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Year Built</p>
                      <p className="font-medium">{listing.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Bedrooms</p>
                      <p className="font-medium">{listing.bedrooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Bathrooms</p>
                      <p className="font-medium">{listing.bathrooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Square Feet</p>
                      <p className="font-medium">{listing.sqft.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Lot Size</p>
                      <p className="font-medium">
                        {listing.lotSize > 0 ? `${listing.lotSize.toLocaleString()} sq ft` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-[#ffffff]" />
                    <h3 className="font-bold text-[18px]">Location Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Address</p>
                      <p className="font-medium">{listing.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">City</p>
                      <p className="font-medium">{listing.city}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">State</p>
                      <p className="font-medium">{listing.state}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">ZIP Code</p>
                      <p className="font-medium">{listing.zip}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Latitude</p>
                      <p className="font-medium font-mono text-xs">{listing.latitude}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Longitude</p>
                      <p className="font-medium font-mono text-xs">{listing.longitude}</p>
                    </div>
                  </div>
                </div>

                {/* Agent & Broker Information */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-[#ffffff]" />
                    <h3 className="font-bold text-[18px]">Agent & Broker Information</h3>
                  </div>
                  <div className="space-y-3 text-[14px]">
                    <div>
                      <p className="text-gray-600 mb-1">Listing Agent</p>
                      <p className="font-medium">{listing.agentName || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Brokerage</p>
                      <p className="font-medium">{listing.brokerage || <span className="text-gray-400 italic">Not provided</span>}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Agent Phone</p>
                      {listing.agentPhone ? (
                        <a
                          href={`tel:${listing.agentPhone}`}
                          className="font-medium text-[#342e37] dark:text-white hover:underline"
                        >
                          {listing.agentPhone}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Not provided</span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Agent Email</p>
                      {listing.agentEmail ? (
                        <a
                          href={`mailto:${listing.agentEmail}`}
                          className="font-medium text-[#342e37] dark:text-white hover:underline"
                        >
                          {listing.agentEmail}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Homeowner Data — PropertyRadar */}
                <div className="bg-[#342e37] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-[#FFCE0A]" />
                        <h3 className="font-bold text-[16px] text-white">Homeowner Data</h3>
                        <span className="text-[10px] bg-[#FFCE0A] text-[#342e37] font-bold px-2 py-0.5 rounded">COMING SOON</span>
                      </div>
                      <p className="text-[13px] text-gray-300 leading-relaxed">
                        Owner name, mailing address, equity estimate, loan info, and direct contact data — powered by PropertyRadar.
                      </p>
                    </div>
                  </div>
                  <LBButton
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-[#FFCE0A]/40 text-[#FFCE0A] hover:bg-[#FFCE0A]/10 opacity-60 cursor-not-allowed"
                    disabled
                  >
                    <User className="w-3.5 h-3.5 mr-2" />
                    Get Homeowner Data — 1 credit
                  </LBButton>
                </div>

                {/* Investment Analysis Preview (Coming Soon) */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-[18px] text-gray-400">Investment Analysis</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Coming Soon</span>
                  </div>
                  <p className="text-[13px] text-gray-600">
                    Get detailed investment calculations including ARV estimates, flip potential, rental analysis, and ROI projections.
                  </p>
                  <LBButton variant="outline" size="sm" className="mt-3" disabled>
                    <DollarSign className="w-4 h-4" />
                    Generate Report (2 credits)
                  </LBButton>
                </div>

                {/* Action Buttons - Inside scrollable area with extra bottom padding */}
                <div className="pt-4 pb-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <LBButton variant="outline" onClick={onClose}>
                      Close
                    </LBButton>
                    {onSaveListing && (
                      <LBButton 
                        variant={isSaved ? "outline" : "primary"}
                        onClick={() => onSaveListing(listing)}
                      >
                        <Save className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        {isSaved ? 'Unsave' : 'Save'}
                      </LBButton>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}