import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { useWalkthrough } from './WalkthroughContext';
import { InteractiveWalkthroughOverlay } from './InteractiveWalkthroughOverlay';
import { getUserDataState, initializeEmptyUserData } from './utils/userDataUtils';
import { migrateSavedListings } from './utils/sandboxDataUtils';
import { ListingDetailModal } from './ListingDetailModal';
import { ViewEditAutomationDrawer } from './ViewEditAutomationDrawer';
import {
  LayoutDashboard,
  Database,
  Download,
  Upload,
  Bell,
  Plus,
  Zap,
  AlertCircle,
  Play,
  Pause,
  AlertTriangle,
  ExternalLink,
  Info,
  CheckCircle,
  ArrowUpRight,
  List,
  Bookmark,
  Search,
  Settings,
  Edit,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

/**
 * DASHBOARD COMPONENT - REDESIGNED
 * 
 * PURPOSE: Purpose-driven dashboard for ListingBug with usage tracking and automation management
 * 
 * STRUCTURE:
 * 1. Listings Overview - Monthly sync counter, snapshot cards, quick filters
 * 2. Automations Panel - Active automations with status, remaining slots, create button
 * 3. Notifications & Alerts - Valuation results, sync errors, compliance alerts
 * 4. Integrations Status - Connected integrations with plan-based gating
 * 5. Usage & Plan Nudges - Visual usage meters and upgrade CTAs
 */

interface DashboardProps {
  onNavigate?: (page: string) => void;
  onOpenReport?: (report: any, tab?: string) => void;
  onAccountTabChange?: (tab: 'profile' | 'billing' | 'integrations' | 'compliance') => void;
  onViewAutomationDetail?: (automation: any) => void;
  onSetAutomationsTab?: (tab: 'create' | 'automations' | 'history') => void;
}

// User plan type
type PlanType = 'starter' | 'pro' | 'enterprise';

// Get user plan from localStorage or default to Pro for returning users with data
const getUserPlan = (): PlanType => {
  const storedPlan = localStorage.getItem('listingbug_user_plan');
  if (storedPlan && ['starter', 'pro', 'enterprise'].includes(storedPlan)) {
    return storedPlan as PlanType;
  }
  
  // Check if user has sandbox data (returning user)
  const hasAutomations = localStorage.getItem('listingbug_automations');
  if (hasAutomations) {
    try {
      const automations = JSON.parse(hasAutomations);
      if (Array.isArray(automations) && automations.length > 0) {
        // Returning user with data - default to Pro plan
        localStorage.setItem('listingbug_user_plan', 'pro');
        return 'pro';
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // First-time user - default to Starter
  return 'starter';
};

export function Dashboard({ onNavigate, onOpenReport, onAccountTabChange, onViewAutomationDetail, onSetAutomationsTab }: DashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'new' | 'removed' | 'price-changed' | 'relisted'>('all');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '14d' | '30d' | 'all'>('30d');
  const { isStepActive, completeStep, skipWalkthrough, totalSteps, walkthroughActive, currentStep } = useWalkthrough();
  
  // Get user plan dynamically
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getUserPlan());
  
  // Get user data state
  const [userDataState, setUserDataState] = useState(getUserDataState());
  const [activeAutomations, setActiveAutomations] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<any | null>(null);
  const [isAutomationDrawerOpen, setIsAutomationDrawerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  
  // Initialize empty user data on mount if first time user
  useEffect(() => {
    const dataState = getUserDataState();
    if (dataState.isFirstTimeUser) {
      initializeEmptyUserData();
    }
    setUserDataState(dataState);
  }, []);
  
  // Load automations from localStorage
  useEffect(() => {
    const loadAutomations = () => {
      const stored = localStorage.getItem('listingbug_automations');
      if (stored) {
        try {
          const automations = JSON.parse(stored);
          setActiveAutomations(Array.isArray(automations) ? automations : []);
        } catch (e) {
          setActiveAutomations([]);
        }
      } else {
        setActiveAutomations([]);
      }
    };

    loadAutomations();

    // Listen for changes
    const handleStorageChange = () => {
      loadAutomations();
      setUserDataState(getUserDataState());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('automationsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('automationsChanged', handleStorageChange);
    };
  }, []);
  
  // Load saved listings
  useEffect(() => {
    // Run migration first to ensure photos are unique
    migrateSavedListings();
    
    const updateSavedListings = () => {
      const saved = localStorage.getItem('listingbug_saved_listings');
      if (saved) {
        try {
          const savedListings = JSON.parse(saved);
          setSavedListings(savedListings);
        } catch (e) {
          setSavedListings([]);
        }
      } else {
        setSavedListings([]);
      }
    };

    // Update on mount
    updateSavedListings();

    // Listen for changes to localStorage
    const handleStorageChange = () => {
      updateSavedListings();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event from same window
    window.addEventListener('savedListingsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedListingsChanged', handleStorageChange);
    };
  }, []);

  // Plan configuration
  const planConfig = {
    starter: {
      listingsCap: 4000,
      automationSlots: 1,
      price: 49,
      name: 'Starter'
    },
    pro: {
      listingsCap: 10000,
      automationSlots: 3,
      price: 99,
      name: 'Professional'
    },
    enterprise: {
      listingsCap: Infinity,
      automationSlots: Infinity,
      price: null,
      name: 'Enterprise'
    }
  };

  const currentPlanConfig = planConfig[currentPlan];

  // Initialize with zero - data comes from localStorage
  const listingsThisMonth = 0;
  const listingsPercentage = currentPlan === 'enterprise' ? 0 : (listingsThisMonth / currentPlanConfig.listingsCap) * 100;
  const isNearingCap = listingsPercentage >= 90;

  // Get actual notification count from localStorage
  const getNotificationCount = () => {
    const stored = localStorage.getItem('listingbug_notifications');
    if (stored) {
      try {
        const notifications = JSON.parse(stored);
        return Array.isArray(notifications) ? notifications.length : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };
  
  // Update alert count on mount and when notifications change
  useEffect(() => {
    const updateAlertCount = () => {
      setAlertCount(getNotificationCount());
    };
    
    updateAlertCount();
    
    // Listen for storage changes
    window.addEventListener('storage', updateAlertCount);
    window.addEventListener('notificationsChanged', updateAlertCount);
    
    return () => {
      window.removeEventListener('storage', updateAlertCount);
      window.removeEventListener('notificationsChanged', updateAlertCount);
    };
  }, []);

  const snapshotData = {
    listingsImported: userDataState.isFirstTimeUser ? 0 : 147,
    listingsExported: userDataState.isFirstTimeUser ? 0 : 89,
    activeAutomations: activeAutomations.filter(a => a.status === 'running').length
  };

  // Toggle automation status
  const toggleAutomationStatus = (automationId: number) => {
    setActiveAutomations(prev => 
      prev.map(automation => {
        if (automation.id === automationId && automation.status !== 'error') {
          return {
            ...automation,
            status: automation.status === 'running' ? 'paused' as const : 'running' as const
          };
        }
        return automation;
      })
    );
  };

  // Notifications - Different for returning users vs first-time users
  const notifications = userDataState.isFirstTimeUser ? [] : [
    {
      id: 1,
      type: 'valuation' as const,
      title: 'Automation Ran Successfully',
      message: 'Daily Austin Foreclosures to Mailchimp - 12 new listings synced',
      action: 'View Details',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'valuation' as const,
      title: 'Property Valuation Complete',
      message: '2847 Riverside Drive - Estimated $675k',
      action: 'View Property',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: 'compliance' as const,
      title: 'Compliance Alert',
      message: 'Review required for 3 listings with incomplete data',
      action: 'Review Now',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
    }
  ];

  const integrations = {
    starter: [
      { name: 'Mailchimp', status: (userDataState.isFirstTimeUser ? 'disconnected' : 'connected') as const, category: 'Contact Tools' },
      { name: 'Google Sheets', status: (userDataState.isFirstTimeUser ? 'disconnected' : 'connected') as const, category: 'Contact Tools' },
      { name: 'Airtable', status: 'disconnected' as const, category: 'Contact Tools' },
      { name: 'Twilio', status: 'disconnected' as const, category: 'Contact Tools' }
    ],
    pro: [
      { name: 'Salesforce', status: 'locked' as const, category: 'CRM Integrations' },
      { name: 'HubSpot', status: 'locked' as const, category: 'CRM Integrations' },
      { name: 'Zapier', status: 'locked' as const, category: 'Automation Platforms' },
      { name: 'Make', status: 'locked' as const, category: 'Automation Platforms' }
    ],
    enterprise: [
      { name: 'Custom API', status: 'locked' as const, category: 'Enterprise' },
      { name: 'White-label', status: 'locked' as const, category: 'Enterprise' }
    ]
  };

  const overageFee = 0.01;
  const overageAmount = Math.max(0, listingsThisMonth - currentPlanConfig.listingsCap);

  const formatTimestamp = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if dateObj is a valid Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const diff = Date.now() - dateObj.getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
        
        {/* ============================================================ */}
        {/* 1. LISTINGS SECTION */}
        {/* ============================================================ */}
        <div className="mb-8">
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-[#342e37] dark:text-white" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
                </div>
                <p className="text-sm text-gray-600">Track your monthly listing usage and market activity</p>
              </div>
            </div>
          </div>

          {/* Snapshot Cards Grid - 4 Items */}
          <div className="flex gap-2 md:gap-3 mb-4">
            {/* Listings Imported */}
            <Card 
              className="cursor-pointer transition-all border-2 border-blue-200 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 flex-1"
              onClick={() => onNavigate?.('search-listings')}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{snapshotData.listingsImported}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Imported</div>
              </CardContent>
            </Card>

            {/* Listings Exported */}
            <Card 
              className="cursor-pointer transition-all border-2 border-green-200 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 flex-1"
              onClick={() => {
                sessionStorage.setItem('listingbug_automations_tab', 'history');
                onNavigate?.('automations');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{snapshotData.listingsExported}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Exported</div>
              </CardContent>
            </Card>

            {/* Listings Saved */}
            <Card 
              className="cursor-pointer transition-all border-2 border-purple-200 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 flex-1"
              onClick={() => {
                // Set flag BEFORE navigation to ensure SearchListings reads it
                sessionStorage.setItem('listingbug_open_saved_tab', 'true');
                onNavigate?.('search-listings');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center flex-shrink-0">
                    <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{savedListings.length}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Saved</div>
              </CardContent>
            </Card>

            {/* Active Automations */}
            <Card 
              className="cursor-pointer transition-all border-2 border-amber-200 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 flex-1"
              onClick={() => {
                sessionStorage.setItem('listingbug_automations_tab', 'automations');
                onNavigate?.('automations');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{snapshotData.activeAutomations}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center truncate w-full max-w-[4rem] md:max-w-none">Active Auto...</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Usage This Month */}
          <div 
            className="mt-4 cursor-pointer transition-all"
            onClick={() => {
              sessionStorage.setItem('listingbug_open_usage_tab', 'true');
              onNavigate?.('member/account');
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-[#342e37] dark:text-white mb-1">Data Usage This Month</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPlan === 'enterprise' 
                    ? 'Unlimited listings on your plan'
                    : `${listingsThisMonth.toLocaleString()} of ${currentPlanConfig.listingsCap.toLocaleString()} listings used`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#342e37] dark:text-white">
                  {listingsThisMonth.toLocaleString()}
                </div>
                {currentPlan !== 'enterprise' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {(100 - listingsPercentage).toFixed(0)}% remaining
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {currentPlan !== 'enterprise' && (
              <div className="mb-3">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all rounded-full ${
                      isNearingCap ? 'bg-[#fa824c]' : 'bg-[#FFCE0A]'
                    }`}
                    style={{ width: `${Math.min(listingsPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Usage Warning or Overage Info */}
            {isNearingCap && currentPlan !== 'enterprise' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-1">
                    You're at {listingsPercentage.toFixed(0)}% of your listings — upgrade to {currentPlan === 'starter' ? 'Pro' : 'Enterprise'} for more.
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Extra listings billed at ${overageFee.toFixed(2)} each. 
                    {overageAmount > 0 && ` Current overage: ${overageAmount} listings ($${(overageAmount * overageFee).toFixed(2)})`}
                  </p>
                  <button 
                    onClick={() => onNavigate?.('pricing')}
                    className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200 hover:text-amber-700 dark:hover:text-amber-100 underline"
                  >
                    Upgrade Now →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Filters Info */}
          {selectedFilter !== 'all' && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Viewing: <span className="font-medium">{selectedFilter.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </span>
              <button
                onClick={() => setSelectedFilter('all')}
                className="text-sm font-medium text-[#342e37] hover:text-gray-700"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 2. SAVED LISTINGS SECTION */}
        {/* ============================================================ */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-bold text-[27px] text-[#342e37] dark:text-white mb-1">Listings</h2>
                <p className="text-sm text-gray-600">
                  {savedListings.length === 0 
                    ? 'Quick access to your bookmarked properties'
                    : `${savedListings.length} saved listing${savedListings.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('search-listings')}
                className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all w-full md:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37]"
              >
                <Search className="w-4 h-4" />
                Search Listings
              </button>
            </div>
          </div>

          {/* Saved Listings List */}
          <div className="space-y-3">
            {savedListings.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-700 bg-transparent transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#FFCE0A]/20 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0 md:hidden">
                      <Bookmark className="w-6 h-6 text-[#FFCE0A]" />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex w-12 h-12 rounded-lg bg-[#FFCE0A]/20 items-center justify-center flex-shrink-0">
                        <Bookmark className="w-6 h-6 text-[#FFCE0A]" />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="font-bold text-lg text-[#ffffff] mb-1">
                          No saved listings yet
                        </h3>
                        <p className="text-sm text-gray-600">
                          Save listings from search results to review them later
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {savedListings.slice(0, 4).map((listing) => (
                    <div 
                      key={listing.id} 
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer overflow-hidden rounded-lg"
                      onClick={() => setSelectedListing(listing)}
                    >
                      <div className="p-0">
                        <div className="relative w-full aspect-[4/3] bg-gray-100">
                          <img 
                            src={listing.listingPhoto || listing.photos?.[0] || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'}
                            alt={listing.address}
                            className="w-full h-full object-cover"
                          />
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            listing.status === 'Active' 
                              ? 'bg-green-100 text-green-800'
                              : listing.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <div className="p-3">
                          <div className="font-bold text-[#342e37] dark:text-white mb-1">
                            ${listing.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {listing.bedrooms} bd • {listing.bathrooms} ba • {listing.sqft.toLocaleString()} sf
                          </div>
                          <div className="text-xs text-gray-900 font-medium mb-1 line-clamp-1">
                            {listing.address}
                          </div>
                          <div className="text-xs text-gray-600 line-clamp-1">
                            {listing.city}, {listing.state}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {savedListings.length > 4 && (
                  <button
                    onClick={() => {
                      onNavigate?.('search-listings');
                      setTimeout(() => {
                        sessionStorage.setItem('listingbug_open_saved_tab', 'true');
                      }, 100);
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#FFCE0A] flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    title="View all saved listings"
                  >
                    <ArrowRight className="w-6 h-6 text-[#342e37]" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. AUTOMATIONS PANEL SECTION */}
        {/* ============================================================ */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-bold text-[27px] text-[#342e37] dark:text-white mb-1">Automations</h2>
                <div className="flex items-center gap-3">
                  <p className={`text-sm ${
                    currentPlan !== 'enterprise' && activeAutomations.length >= currentPlanConfig.automationSlots
                      ? 'text-red-600 font-medium'
                      : 'text-gray-600'
                  }`}>
                    {activeAutomations.length} of {currentPlanConfig.automationSlots === Infinity ? '∞' : currentPlanConfig.automationSlots} automation slots used
                  </p>
                  {currentPlan !== 'enterprise' && activeAutomations.length >= currentPlanConfig.automationSlots && (
                    <button 
                      onClick={() => onNavigate?.('pricing')}
                      className="text-sm text-red-600 hover:text-red-700 underline font-medium"
                    >
                      Upgrade for more.
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('automations')}
                className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all w-full md:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37]"
              >
                <List className="w-4 h-4" />
                View Automations
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeAutomations.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-gray-700 mb-2">No Active Automations</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create your first automation to start receiving listing updates automatically
                  </p>
                  <button
                    onClick={() => onNavigate?.('automations')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Automation
                  </button>
                </CardContent>
              </Card>
            ) : (
              activeAutomations.map((automation) => (
                <div 
                  key={automation.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all rounded-lg px-0 py-3"
                  onClick={() => {
                    setSelectedAutomation(automation);
                    setIsAutomationDrawerOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#342e37] dark:text-white truncate">{automation.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {automation.destination?.label || automation.destination} • Last run {formatTimestamp(automation.lastRun)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 px-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#342e37] dark:text-white">147</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">Listings Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#342e37] dark:text-white">89</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Exported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#342e37] dark:text-white">100%</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 whitespace-nowrap">Success Rate</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAutomationStatus(automation.id);
                      }}
                      disabled={automation.status === 'error'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFCE0A] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                        automation.status === 'running'
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      title={automation.status === 'error' ? 'Fix errors before enabling' : automation.status === 'running' ? 'Pause automation' : 'Resume automation'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          automation.status === 'running' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. INTEGRATIONS STATUS SECTION */}
        {/* ============================================================ */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-bold text-[27px] text-[#342e37] dark:text-white mb-1">Integrations</h2>
                <p className="text-sm text-gray-600">Manage your connected services</p>
              </div>
              <button
                onClick={() => onNavigate?.('integrations')}
                className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] w-full md:w-auto"
              >
                <Settings className="w-4 h-4" />
                Connect More Tools
              </button>
            </div>
          </div>

          {(() => {
            const connectedIntegrations = integrations.starter.filter(i => i.status === 'connected');
            
            if (connectedIntegrations.length === 0) {
              return (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-gray-700 mb-2">No Connected Integrations</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect tools like Mailchimp, Google Sheets, Salesforce, and more to automate your workflow
                    </p>
                    <button
                      onClick={() => onNavigate?.('integrations')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Connect Your First Tool
                    </button>
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {connectedIntegrations.map((integration, idx) => (
                  <Card key={idx} className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-green-600 dark:text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#342e37] dark:text-white">{integration.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{integration.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">Connected</span>
                        </div>
                        <button
                          onClick={() => onNavigate?.('integrations')}
                          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                        >
                          <Edit className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
      
      {/* Walkthrough Overlay */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(1)}
        step={1}
        totalSteps={totalSteps}
        title="Welcome to ListingBug!"
        description="Let's get you started. First, click the 'Search Listings' button to find properties that match your criteria. This is the starting point for all your automations."
        highlightSelector="[data-walkthrough='search-listings-button']"
        tooltipPosition="bottom-left"
        mode="wait-for-click"
        onNext={() => completeStep(1)}
        onSkip={skipWalkthrough}
        showSkip={true}
      />

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          isSaved={true}
        />
      )}

      {isAutomationDrawerOpen && selectedAutomation && (
        <ViewEditAutomationDrawer
          isOpen={isAutomationDrawerOpen}
          automation={selectedAutomation}
          onClose={() => {
            setIsAutomationDrawerOpen(false);
            setSelectedAutomation(null);
          }}
          onViewDetail={onViewAutomationDetail}
          onAutomationUpdated={(updatedAutomation) => {
            setActiveAutomations(prev =>
              prev.map(a => a.id === updatedAutomation.id ? updatedAutomation : a)
            );
            window.dispatchEvent(new Event('automationsChanged'));
          }}
        />
      )}
    </div>
  );
}
