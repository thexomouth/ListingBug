import { X, TrendingUp, TrendingDown, Clock, DollarSign, Home, MapPin, AlertCircle, Calendar, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useEffect } from 'react';

/**
 * METRIC DETAILS PANEL COMPONENT
 * 
 * PURPOSE: Display detailed breakdown when user clicks on dashboard metric cards
 * Uses side panel pattern for deep-dive analytics
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: GET /api/metrics/{metricType}/details
 * - Fetches detailed breakdown based on metric type
 * 
 * METRIC TYPES:
 * - market-temperature: Overall market health analysis
 * - your-listings: Properties matching your reports
 * - active-inventory: New listings vs sold properties ratio
 * - avg-listing-age: Days on market trends
 * - price-reductions: Price drops and deals
 * - your-reports: Individual report performance breakdown
 */

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  pricePerSqft: number;
  daysOnMarket: number;
  priceChange?: number;
  priceChangePercent?: number;
  listingDate: string;
  propertyType: string;
}

interface MetricData {
  type: 'new-listings' | 'active-reports' | 'data-integrity';
  title: string;
  summary: string;
  primaryValue: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
  breakdown?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendPercent?: number;
  }[];
  properties?: Property[];
  chart?: {
    labels: string[];
    values: number[];
  };
  insights?: string[];
}

interface MetricDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: MetricData | null;
  onSetAlert?: () => void;
}

export function MetricDetailsPanel({ isOpen, onClose, data, onSetAlert }: MetricDetailsPanelProps) {
  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-[calc(100%-12px)] md:w-[600px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300">
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <div className="bg-[#ffd447] px-[24px] py-[9px] flex items-center justify-between border-b">
            <div>
              <h2 className="font-bold text-[#342e37] text-[20px]">{data.title}</h2>
              <p className="text-sm text-[#342e37]/80 mt-0.5 text-[13px]">{data.summary}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors flex-shrink-0 ml-4"
            >
              <X className="w-5 h-5 text-[#342e37]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 md:p-6 space-y-6">
              
              {/* Primary Metric */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Current Value</span>
                  {data.trend && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(data.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(data.trend)}`}>
                        {data.trendPercent && `${data.trendPercent > 0 ? '+' : ''}${data.trendPercent}%`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold text-[#342e37]">{data.primaryValue}</div>
              </div>

              {/* Breakdown */}
              {data.breakdown && data.breakdown.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#342e37] mb-3">Breakdown</h3>
                  <div className="space-y-3">
                    {data.breakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg px-[12px] py-[9px]">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#342e37]">{item.value}</span>
                          {item.trend && (
                            <div className="flex items-center gap-1">
                              {getTrendIcon(item.trend)}
                              {item.trendPercent && (
                                <span className={`text-xs ${getTrendColor(item.trend)}`}>
                                  {item.trendPercent > 0 ? '+' : ''}{item.trendPercent}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {data.insights && data.insights.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#342e37] mb-3">Key Insights</h3>
                  <div className="space-y-2">
                    {data.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 px-[12px] py-[9px]">
                        <AlertCircle className="w-4 h-4 text-[#342e37] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Properties List */}
              {data.properties && data.properties.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#342e37] mb-3">
                    {data.type === 'your-listings' && 'Matching Properties'}
                    {data.type === 'price-reductions' && 'Top Opportunities'}
                    {data.type === 'your-reports' && 'Recent Listings'}
                    {!['your-listings', 'price-reductions', 'your-reports'].includes(data.type) && 'Properties'}
                  </h3>
                  <div className="space-y-3">
                    {data.properties.map((property) => (
                      <div 
                        key={property.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[#342e37] truncate font-bold">{property.address}</h4>
                            <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
                          </div>
                          {property.priceChange && (
                            <Badge 
                              variant={property.priceChange < 0 ? 'default' : 'secondary'}
                              className={property.priceChange < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                            >
                              {property.priceChange < 0 ? '-' : '+'}{formatCurrency(Math.abs(property.priceChange))}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-0.5">Price</span>
                            <span className="font-medium text-[#342e37]">{formatCurrencyCompact(property.price)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-0.5">$/sqft</span>
                            <span className="font-medium text-[#342e37]">${property.pricePerSqft}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-0.5">Beds/Baths</span>
                            <span className="font-medium text-[#342e37]">{property.beds}bd / {property.baths}ba</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs mb-0.5">Size</span>
                            <span className="font-medium text-[#342e37]">{formatNumber(property.sqft)} sqft</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              {property.daysOnMarket} days
                            </span>
                            <span className="flex items-center gap-1 min-w-0 max-w-[120px]">
                              <Home className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{property.propertyType}</span>
                            </span>
                          </div>
                          <span className="text-gray-400 whitespace-nowrap flex-shrink-0">
                            Listed {new Date(property.listingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simple Chart Visualization */}
              {data.chart && data.chart.labels.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#342e37] mb-3">Trend Over Time</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-end justify-between gap-2 h-40">
                      {data.chart.values.map((value, index) => {
                        const maxValue = Math.max(...data.chart!.values);
                        const height = (value / maxValue) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div 
                              className="w-full bg-[#342e37] rounded-t transition-all hover:bg-[#342e37]/80"
                              style={{ height: `${height}%` }}
                              title={`${data.chart!.labels[index]}: ${value}`}
                            />
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {data.chart!.labels[index]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4">
                <Separator className="mb-4" />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  {onSetAlert && (
                    <Button variant="outline" className="flex-1" onClick={onSetAlert}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Set Alert
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * USAGE EXAMPLE:
 * 
 * const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
 * const [isPanelOpen, setIsPanelOpen] = useState(false);
 * 
 * const handleMetricClick = async (metricType: string) => {
 *   // Fetch detailed data from API
 *   const response = await fetch(`/api/metrics/${metricType}/details`);
 *   const data = await response.json();
 *   
 *   setSelectedMetric(data);
 *   setIsPanelOpen(true);
 * };
 * 
 * <MetricDetailsPanel
 *   isOpen={isPanelOpen}
 *   onClose={() => setIsPanelOpen(false)}
 *   data={selectedMetric}
 * />
 */