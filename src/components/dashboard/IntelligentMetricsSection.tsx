import { TrendingUp, TrendingDown, Sparkles, DollarSign, Clock, Flame, Bell, ChevronRight, FileText, Home, BarChart3, Package, Activity, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

/**
 * INTELLIGENT METRICS SECTION
 * 
 * PURPOSE: Display system performance metrics for ListingBug reporting
 * 
 * DESIGN PRINCIPLES:
 * - System performance over vanity metrics
 * - Actionable insights into reporting effectiveness
 * - Clear links to detailed analysis
 * 
 * METRICS:
 * 1. New Listings (24h) - Fresh listings across all automated reports
 * 2. Active Reports - Number of automated reports running
 * 3. Data Integrity - Percentage of listings with complete critical details
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: GET /api/dashboard/metrics
 * - Returns system performance data
 * - Real-time calculations from reporting system
 */

interface MetricCardData {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  subtitle: string;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'orange';
  linkTo: string;
  linkLabel: string;
}

interface IntelligentMetricsSectionProps {
  onMetricClick: (metricId: string) => void;
}

export function IntelligentMetricsSection({ onMetricClick }: IntelligentMetricsSectionProps) {
  
  // ============================================================================
  // BACKEND INTEGRATION TODO:
  // Replace mock data with actual API call
  // 
  // useEffect(() => {
  //   const fetchMetrics = async () => {
  //     try {
  //       const response = await fetch('/api/dashboard/metrics');
  //       const data = await response.json();
  //       setMetrics(data);
  //     } catch (error) {
  //       console.error('Failed to fetch metrics:', error);
  //     }
  //   };
  //   fetchMetrics();
  // }, []);
  // ============================================================================

  // Initialize with zero/empty state - data comes from localStorage
  const metrics: MetricCardData[] = [
    {
      id: 'new-listings',
      icon: <Home className="w-5 h-5 md:w-5 md:h-5" />,
      label: 'New Listings',
      value: '0',                                      // DYNAMIC: New_Listings_Last_24h_Count
      change: '+0',                                    // DYNAMIC: New_Listings_Change_From_Previous
      trend: 'neutral',                                // DYNAMIC: New_Listings_Trend
      subtitle: '',                                    // REMOVED: Subtitle for mobile space conservation
      color: 'purple',
      linkTo: '/listings-report',
      linkLabel: 'Listings Report',
    },
    {
      id: 'active-reports',
      icon: <Activity className="w-5 h-5 md:w-5 md:h-5" />,
      label: 'Automations',
      value: '0',                                      // DYNAMIC: Active_Automated_Reports_Count
      change: 'None',                                  // DYNAMIC: Active_Reports_Total_Listings
      trend: 'neutral',                                // DYNAMIC: Active_Reports_Trend
      subtitle: '',                                    // REMOVED: Subtitle for mobile space conservation
      color: 'blue',
      linkTo: '/reports-analysis',
      linkLabel: 'Reports Analysis',
    },
    {
      id: 'data-integrity',
      icon: <CheckCircle className="w-5 h-5 md:w-5 md:h-5" />,
      label: 'Data Integrity',
      value: '0%',                                     // DYNAMIC: Data_Integrity_Percentage
      change: '+0%',                                   // DYNAMIC: Data_Integrity_Change
      trend: 'neutral',                                // DYNAMIC: Data_Integrity_Trend
      subtitle: '',                                    // REMOVED: Subtitle for mobile space conservation
      color: 'green',
      linkTo: '/data-analysis',
      linkLabel: 'Data Analysis',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: {
        icon: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        hover: 'hover:border-green-300',
      },
      red: {
        icon: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        hover: 'hover:border-red-300',
      },
      blue: {
        icon: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:border-blue-300',
      },
      yellow: {
        icon: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        hover: 'hover:border-amber-300',
      },
      purple: {
        icon: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:border-purple-300',
      },
      orange: {
        icon: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        hover: 'hover:border-orange-300',
      },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />;
    return null;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="mb-3">
        <h2 className="flex items-center gap-2 font-bold text-[#342e37] text-xl md:text-2xl mb-1">
          <Activity className="w-5 h-5 text-[#342e37]" />
          System Performance
        </h2>
        <p className="text-xs md:text-sm text-gray-600">
          Track your ListingBug reporting system performance and data quality
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {metrics.map((metric) => {
          const colors = getColorClasses(metric.color);
          
          return (
            <Card
              key={metric.id}
              className={`cursor-pointer transition-all ${colors.border} ${colors.hover} hover:shadow-md group`}
              onClick={() => onMetricClick(metric.id)}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center text-center">
                {/* Icon - Centered at Top */}
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon} mb-1 md:mb-2`}>
                  {metric.icon}
                </div>

                {/* Label */}
                <div className="mb-1">
                  <h3 className="text-[10px] md:text-sm font-bold text-gray-600 leading-tight">{metric.label}</h3>
                </div>

                {/* Value */}
                <div className="mb-0.5 md:mb-1">
                  <div className="text-lg md:text-2xl font-bold text-[#342e37]">{metric.value}</div>
                </div>

                {/* Change with Trend */}
                <div className={`flex items-center gap-0.5 md:gap-1 text-[9px] md:text-sm font-medium ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="leading-tight">{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-center">
        <p className="text-[10px] md:text-xs text-gray-500">
          Data updates every 15 minutes • Last updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

/**
 * BACKEND API RESPONSE FORMAT:
 * 
 * GET /api/dashboard/metrics
 * 
 * Response:
 * {
 *   "success": true,
 *   "metrics": {
 *     "marketTemperature": {
 *       "value": "Hot",
 *       "score": 8.5,
 *       "change": 12,
 *       "trend": "up",
 *       "insight": "High demand, low inventory"
 *     },
 *     "freshListings": {
 *       "count": 127,
 *       "change": 18,
 *       "trend": "up",
 *       "timeframe": "48h"
 *     },
 *     "priceMovement": {
 *       "percent": 3.2,
 *       "average": 524000,
 *       "change": 16200,
 *       "trend": "up",
 *       "period": "30d"
 *     },
 *     "marketVelocity": {
 *       "days": 22,
 *       "change": -18,
 *       "trend": "down",
 *       "previousDays": 27
 *     },
 *     "hotOpportunities": {
 *       "count": 43,
 *       "change": 35,
 *       "trend": "up",
 *       "averageReduction": 18500,
 *       "period": "7d"
 *     },
 *     "reportAlerts": {
 *       "count": 18,
 *       "change": 20,
 *       "trend": "up",
 *       "byReport": {
 *         "report_1": 7,
 *         "report_2": 6,
 *         "report_3": 5
 *       }
 *     }
 *   },
 *   "lastUpdated": "2024-11-23T14:22:00Z"
 * }
 * 
 * CALCULATIONS:
 * 
 * Market Temperature:
 * - Algorithm: Weighted score based on:
 *   - Days on market (lower = hotter)
 *   - New listings vs inventory ratio
 *   - Price trends
 *   - Sale velocity
 * - Scale: 0-10 (Cold, Cool, Warm, Hot, Very Hot)
 * 
 * Fresh Listings:
 * - Count properties with listingDate within last 48 hours
 * - Compare to same period previous week
 * 
 * Price Movement:
 * - Calculate average list price over last 30 days
 * - Compare to previous 30 days
 * - Track median and mean prices
 * 
 * Market Velocity:
 * - Average daysOnMarket for properties sold/pending in last 30 days
 * - Compare to previous 30 days
 * - Lower is better (faster market)
 * 
 * Hot Opportunities:
 * - Count properties with price reductions in last 7 days
 * - Include properties with price/sqft below market average
 * - Flag properties with >20 days on market and recent price drop
 * 
 * Report Alerts:
 * - Count new properties matching user's saved report criteria
 * - Group by report
 * - Show since last check (usually 24h)
 */