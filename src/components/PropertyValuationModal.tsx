import { X, TrendingUp, BarChart3, DollarSign, Home, MapPin, Calendar, CheckCircle2, Download, Share2 } from 'lucide-react';
import { LBButton } from './design-system/LBButton';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface PropertyValuationModalProps {
  report: any;
  onClose: () => void;
}

export function PropertyValuationModal({ report, onClose }: PropertyValuationModalProps) {
  // Enable swipe-to-close on mobile (swipe right to close)
  useSwipeGesture({
    onSwipeRight: () => {
      onClose();
    },
    threshold: 80,
    velocityThreshold: 0.4,
  });

  // Proper scroll lock
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.right = '0';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!report) return null;

  // Generate comprehensive valuation data
  const estimatedValue = report.result.estimatedValue;
  const confidenceRange = report.result.confidenceRange;
  const pricePerSqft = report.result.pricePerSqft || 285;
  const marketPricePerSqft = Math.floor(pricePerSqft * 1.03);
  
  // Generate comparable properties
  const comparables = [
    {
      address: '2851 Riverside Drive',
      distance: '0.2 mi',
      price: Math.floor(estimatedValue * 0.97),
      beds: 3,
      baths: 2,
      sqft: 2350,
      soldDate: '2024-11-20',
      daysOnMarket: 9,
      pricePerSqft: Math.floor((estimatedValue * 0.97) / 2350)
    },
    {
      address: '1523 Riverside Circle',
      distance: '0.4 mi',
      price: Math.floor(estimatedValue * 1.02),
      beds: 4,
      baths: 2.5,
      sqft: 2425,
      soldDate: '2024-11-05',
      daysOnMarket: 14,
      pricePerSqft: Math.floor((estimatedValue * 1.02) / 2425)
    },
    {
      address: '3101 Lakeview Avenue',
      distance: '0.6 mi',
      price: Math.floor(estimatedValue * 0.95),
      beds: 3,
      baths: 2,
      sqft: 2280,
      soldDate: '2024-10-18',
      daysOnMarket: 21,
      pricePerSqft: Math.floor((estimatedValue * 0.95) / 2280)
    },
    {
      address: '892 Oak Valley Lane',
      distance: '0.8 mi',
      price: Math.floor(estimatedValue * 1.01),
      beds: 3,
      baths: 2,
      sqft: 2410,
      soldDate: '2024-09-30',
      daysOnMarket: 17,
      pricePerSqft: Math.floor((estimatedValue * 1.01) / 2410)
    },
    {
      address: '1847 Highland Drive',
      distance: '0.9 mi',
      price: Math.floor(estimatedValue * 0.98),
      beds: 4,
      baths: 2,
      sqft: 2390,
      soldDate: '2024-09-12',
      daysOnMarket: 12,
      pricePerSqft: Math.floor((estimatedValue * 0.98) / 2390)
    }
  ];

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal - Side Drawer */}
      <div 
        className="fixed right-0 top-0 h-screen w-[calc(100%-12px)] md:w-[650px] lg:w-[800px] bg-white z-[9999] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-[#ffd447] border-b border-[#ffd447]/20 px-3 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[21px] font-bold text-[#342e37] mb-1 truncate">
                  Property Valuation
                </h2>
                <p className="text-[14px] text-[#342e37]/80 truncate">
                  {report.property.address}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
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
            <div className="px-3 md:px-6 py-6 space-y-6">
              {/* Report Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-[18px]">Automated Valuation Model (AVM)</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  AI-powered property valuation based on recent sales, market trends, and property characteristics
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-gray-600">
                    Generated: {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="font-bold text-[18px] mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#342e37]" />
                  Subject Property
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#342e37]">{report.property.address}</p>
                      <p className="text-sm text-gray-600">{report.property.city}, {report.property.state} {report.property.zip}</p>
                    </div>
                  </div>
                  {report.property.mlsId && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      MLS ID: {report.property.mlsId}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Value - Featured */}
              <div>
                <h3 className="font-bold text-[18px] mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#342e37]" />
                  Estimated Market Value
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 text-center">
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-[#342e37]">
                      ${estimatedValue.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">Estimated Fair Market Value</p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Low Range</p>
                      <p className="font-bold text-[#342e37]">${confidenceRange[0].toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-300" />
                    <div>
                      <p className="text-gray-600">High Range</p>
                      <p className="font-bold text-[#342e37]">${confidenceRange[1].toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="font-bold text-[18px] mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#342e37]" />
                  Valuation Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Price per Sq Ft</p>
                    <p className="text-2xl font-bold text-[#342e37]">${pricePerSqft}</p>
                    <p className="text-xs text-gray-500 mt-1">Subject property</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Market Avg $/Sq Ft</p>
                    <p className="text-2xl font-bold text-[#342e37]">${marketPricePerSqft}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {((pricePerSqft / marketPricePerSqft - 1) * 100).toFixed(1)}% vs market
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Market Trend</p>
                    <p className="text-2xl font-bold text-green-600">{report.result.marketTrend || 'Rising'}</p>
                    <p className="text-xs text-gray-500 mt-1">Current direction</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Comparables Used</p>
                    <p className="text-2xl font-bold text-[#342e37]">{report.result.comparables || comparables.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Recent sales</p>
                  </div>
                </div>
              </div>

              {/* Market Appreciation */}
              <div>
                <h3 className="font-bold text-[18px] mb-3">Historical Appreciation</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">1 Year</p>
                      <p className="text-xl font-bold text-green-600">+5.8%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">3 Year</p>
                      <p className="text-xl font-bold text-green-600">+17.2%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">5 Year</p>
                      <p className="text-xl font-bold text-green-600">+32.5%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparable Sales */}
              <div>
                <h3 className="font-bold text-[18px] mb-3">Comparable Properties</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Recent sales of similar properties in the area
                </p>
                <div className="space-y-3">
                  {comparables.map((comp, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-[#342e37] mb-1">{comp.address}</p>
                          <p className="text-sm text-gray-600 mb-2">{comp.distance} away</p>
                          <div className="flex items-center gap-3 text-sm text-gray-700">
                            <span>{comp.beds} beds</span>
                            <span>•</span>
                            <span>{comp.baths} baths</span>
                            <span>•</span>
                            <span>{comp.sqft.toLocaleString()} sq ft</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#342e37]">${comp.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">${comp.pricePerSqft}/sq ft</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Sold: {new Date(comp.soldDate).toLocaleDateString()}</span>
                        </div>
                        <span>{comp.daysOnMarket} days on market</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <strong>Disclaimer:</strong> This automated valuation model (AVM) is provided for informational purposes only and should not be considered a formal appraisal. The estimated value is based on available data, comparable sales, and market trends. Actual market value may vary. For financing or legal purposes, please obtain a professional appraisal from a licensed appraiser.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <LBButton
                  variant="default"
                  className="flex-1"
                  onClick={() => {
                    // PDF download logic
                    console.log('Download PDF');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </LBButton>
                <LBButton
                  variant="outline"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `Property Valuation - ${report.property.address}`,
                          text: `Estimated value: $${estimatedValue.toLocaleString()}`,
                          url: window.location.href
                        });
                      } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                          console.error('Share failed');
                        }
                      }
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="md:hidden"
                >
                  <Share2 className="w-4 h-4" />
                </LBButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
