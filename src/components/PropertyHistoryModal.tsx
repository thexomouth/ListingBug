import { X, History, TrendingUp, DollarSign, Calendar, Home, MapPin, CheckCircle2, Download, Share2, FileText, Building2 } from 'lucide-react';
import { LBButton } from './design-system/LBButton';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface PropertyHistoryModalProps {
  report: any;
  onClose: () => void;
}

export function PropertyHistoryModal({ report, onClose }: PropertyHistoryModalProps) {
  // Enable swipe-to-close on mobile
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

  // Generate comprehensive sales history
  const salesHistory = [
    {
      date: report.result.lastSaleDate,
      price: report.result.lastSalePrice,
      type: 'Sale',
      pricePerSqft: Math.floor(report.result.lastSalePrice / 2400),
      daysOnMarket: 18,
      buyer: 'Michael & Rebecca Thompson',
      seller: 'Anderson Family Trust'
    },
    {
      date: '2018-06-12',
      price: Math.floor(report.result.lastSalePrice * 0.82),
      type: 'Sale',
      pricePerSqft: Math.floor((report.result.lastSalePrice * 0.82) / 2400),
      daysOnMarket: 24,
      buyer: 'Anderson Family Trust',
      seller: 'Jessica Martinez'
    },
    {
      date: '2012-03-20',
      price: Math.floor(report.result.lastSalePrice * 0.65),
      type: 'Sale',
      pricePerSqft: Math.floor((report.result.lastSalePrice * 0.65) / 2400),
      daysOnMarket: 42,
      buyer: 'Jessica Martinez',
      seller: 'David & Karen Wilson'
    },
    {
      date: '2005-01-15',
      price: Math.floor(report.result.lastSalePrice * 0.48),
      type: 'New Construction',
      pricePerSqft: Math.floor((report.result.lastSalePrice * 0.48) / 2400),
      daysOnMarket: 0,
      buyer: 'David & Karen Wilson',
      seller: 'Riverside Development LLC'
    }
  ];

  // Generate tax history
  const taxHistory = [
    { year: 2024, assessment: Math.floor(report.result.lastSalePrice * 0.88), taxAmount: Math.floor(report.result.lastSalePrice * 0.88 * 0.0125) },
    { year: 2023, assessment: Math.floor(report.result.lastSalePrice * 0.85), taxAmount: Math.floor(report.result.lastSalePrice * 0.85 * 0.0122) },
    { year: 2022, assessment: Math.floor(report.result.lastSalePrice * 0.82), taxAmount: Math.floor(report.result.lastSalePrice * 0.82 * 0.0118) },
    { year: 2021, assessment: Math.floor(report.result.lastSalePrice * 0.78), taxAmount: Math.floor(report.result.lastSalePrice * 0.78 * 0.0115) },
    { year: 2020, assessment: Math.floor(report.result.lastSalePrice * 0.75), taxAmount: Math.floor(report.result.lastSalePrice * 0.75 * 0.0112) },
  ];

  // Calculate appreciation
  const firstSalePrice = salesHistory[salesHistory.length - 1].price;
  const lastSalePrice = salesHistory[0].price;
  const totalAppreciation = ((lastSalePrice - firstSalePrice) / firstSalePrice) * 100;
  const yearsOwned = new Date().getFullYear() - new Date(salesHistory[salesHistory.length - 1].date).getFullYear();
  const annualAppreciation = totalAppreciation / yearsOwned;

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
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                <History className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[21px] font-bold text-[#342e37] mb-1 truncate">
                  Property History Report
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
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-[18px]">Comprehensive Property History</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Complete sales, ownership, and tax history for {report.property.address}
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

              {/* Summary Stats */}
              <div>
                <h3 className="font-bold text-[18px] mb-3">History Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                    <p className="text-2xl font-bold text-[#342e37]">{report.result.salesHistory}</p>
                    <p className="text-xs text-gray-500 mt-1">Since {new Date(salesHistory[salesHistory.length - 1].date).getFullYear()}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Years Tracked</p>
                    <p className="text-2xl font-bold text-[#342e37]">{report.result.yearsTracked}</p>
                    <p className="text-xs text-gray-500 mt-1">Complete history</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Appreciation</p>
                    <p className="text-2xl font-bold text-green-600">+{report.result.priceAppreciation}%</p>
                    <p className="text-xs text-gray-500 mt-1">Since first sale</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Annual Growth</p>
                    <p className="text-2xl font-bold text-green-600">+{annualAppreciation.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">Average per year</p>
                  </div>
                </div>
              </div>

              {/* Sales History Timeline */}
              <div>
                <h3 className="font-bold text-[18px] mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#342e37]" />
                  Sales History
                </h3>
                <div className="space-y-4">
                  {salesHistory.map((sale, idx) => {
                    const isFirst = idx === 0;
                    const previousPrice = idx < salesHistory.length - 1 ? salesHistory[idx + 1].price : sale.price;
                    const priceChange = ((sale.price - previousPrice) / previousPrice) * 100;
                    
                    return (
                      <div key={idx} className="relative pl-8 pb-4">
                        {/* Timeline dot and line */}
                        <div className="absolute left-0 top-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isFirst ? 'bg-green-600' : 'bg-gray-400'
                          }`}>
                            {isFirst ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          {idx < salesHistory.length - 1 && (
                            <div className="absolute top-6 left-3 w-0.5 h-full bg-gray-300" />
                          )}
                        </div>

                        {/* Sale details */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-[#342e37]">{sale.type}</p>
                                {isFirst && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Most Recent
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(sale.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[#342e37]">${sale.price.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">${sale.pricePerSqft}/sq ft</p>
                            </div>
                          </div>
                          
                          {idx > 0 && sale.type !== 'New Construction' && (
                            <div className={`text-sm font-medium mb-2 ${
                              priceChange > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% from previous sale
                              <span className="text-gray-600 font-normal ml-1">
                                ({priceChange > 0 ? '+' : ''}${(sale.price - previousPrice).toLocaleString()})
                              </span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600 text-xs mb-0.5">Buyer</p>
                              <p className="text-[#342e37] font-medium">{sale.buyer}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs mb-0.5">Seller</p>
                              <p className="text-[#342e37] font-medium">{sale.seller}</p>
                            </div>
                          </div>
                          
                          {sale.daysOnMarket > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                              {sale.daysOnMarket} days on market
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax Assessment History */}
              <div>
                <h3 className="font-bold text-[18px] mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#342e37]" />
                  Tax Assessment History
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Assessment</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Annual Tax</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {taxHistory.map((tax, idx) => {
                          const prevAssessment = idx < taxHistory.length - 1 ? taxHistory[idx + 1].assessment : tax.assessment;
                          const assessmentChange = ((tax.assessment - prevAssessment) / prevAssessment) * 100;
                          
                          return (
                            <tr key={tax.year} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-[#342e37]">{tax.year}</td>
                              <td className="px-4 py-3 text-sm text-right text-[#342e37]">
                                ${tax.assessment.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-[#342e37]">
                                ${tax.taxAmount.toLocaleString()}
                              </td>
                              <td className={`px-4 py-3 text-sm text-right font-medium ${
                                idx === taxHistory.length - 1 ? 'text-gray-400' :
                                assessmentChange > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {idx === taxHistory.length - 1 ? '—' : 
                                  `${assessmentChange > 0 ? '+' : ''}${assessmentChange.toFixed(1)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Ownership Timeline */}
              <div>
                <h3 className="font-bold text-[18px] mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#342e37]" />
                  Ownership Timeline
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {salesHistory.slice(0, -1).map((sale, idx) => {
                      const nextSale = salesHistory[idx + 1];
                      const yearsOwned = Math.round(
                        (new Date(sale.date).getTime() - new Date(nextSale.date).getTime()) / 
                        (1000 * 60 * 60 * 24 * 365)
                      );
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-[#342e37]">{nextSale.buyer}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(nextSale.date).getFullYear()} - {new Date(sale.date).getFullYear()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#342e37]">{yearsOwned} years</p>
                            <p className="text-xs text-gray-600">owned</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <strong>Disclaimer:</strong> This property history report is compiled from public records and may not include all transactions. Information is provided as-is and should be independently verified. Tax assessments may not reflect current market value. For legal or title purposes, please consult with a licensed title company or real estate attorney.
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
                          title: `Property History - ${report.property.address}`,
                          text: `${report.result.salesHistory} sales tracked over ${report.result.yearsTracked} years`,
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
