import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

interface DashboardProps {
  onNavigate?: (page: string) => void;
  onOpenReport?: (report: any, tab?: string) => void;
  onAccountTabChange?: (tab: 'profile' | 'billing' | 'integrations' | 'compliance') => void;
  onViewAutomationDetail?: (automation: any) => void;
  onSetAutomationsTab?: (tab: 'create' | 'automations' | 'history') => void;
}

type PlanType = 'starter' | 'pro' | 'enterprise';

const getUserPlan = (): PlanType => {
  const storedPlan = localStorage.getItem('listingbug_user_plan');
  if (storedPlan && ['starter', 'pro', 'enterprise'].includes(storedPlan)) {
    return storedPlan as PlanType;
  }
  const hasAutomations = localStorage.getItem('listingbug_automations');
  if (hasAutomations) {
    try {
      const automations = JSON.parse(hasAutomations);
      if (Array.isArray(automations) && automations.length > 0) {
        localStorage.setItem('listingbug_user_plan', 'pro');
        return 'pro';
      }
    } catch (e) {}
  }
  return 'starter';
};

export function Dashboard({ onNavigate, onOpenReport, onAccountTabChange, onViewAutomationDetail, onSetAutomationsTab }: DashboardProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'new' | 'removed' | 'price-changed' | 'relisted'>('all');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '14d' | '30d' | 'all'>('30d');
  const { isStepActive, completeStep, skipWalkthrough, totalSteps, walkthroughActive, currentStep } = useWalkthrough();
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getUserPlan());
  const [userDataState, setUserDataState] = useState(getUserDataState());
  const [activeAutomations, setActiveAutomations] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<any | null>(null);
  const [isAutomationDrawerOpen, setIsAutomationDrawerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  // Real usage data from Supabase
  const [listingsImported, setListingsImported] = useState(0);
  const [listingsExported, setListingsExported] = useState(0);
  const [listingsThisMonth, setListingsThisMonth] = useState(0);

  useEffect(() => {
    const dataState = getUserDataState();
    if (dataState.isFirstTimeUser) {
      initializeEmptyUserData();
    }
    setUserDataState(dataState);
  }, []);

  // Fetch real usage data from Supabase
  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const monthYear = new Date().toISOString().slice(0, 7);

      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('listings_fetched')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .single();
      if (usageData) {
        setListingsImported(usageData.listings_fetched ?? 0);
        setListingsThisMonth(usageData.listings_fetched ?? 0);
      }

      const { data: runData } = await supabase
        .from('automation_runs')
        .select('listings_sent')
        .eq('user_id', user.id)
        .gte('run_date', monthYear + '-01');
      if (runData) {
        const total = runData.reduce((sum: number, r: any) => sum + (r.listings_sent ?? 0), 0);
        setListingsExported(total);
      }
    };
    fetchUsage();
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

  // Load saved listings — Supabase is source of truth, localStorage is cache
  useEffect(() => {
    migrateSavedListings();

    const loadFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('saved_listings')
        .select('listing_data_json, saved_at')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
      if (data && data.length > 0) {
        const listings = data.map((r: any) => r.listing_data_json).filter(Boolean);
        setSavedListings(listings);
        localStorage.setItem('listingbug_saved_listings', JSON.stringify(listings));
        return;
      }
      // Fallback to localStorage if Supabase has nothing yet
      const saved = localStorage.getItem('listingbug_saved_listings');
      if (saved) {
        try { setSavedListings(JSON.parse(saved)); } catch (e) { setSavedListings([]); }
      }
    };
    loadFromSupabase();

    const updateSavedListings = () => {
      const saved = localStorage.getItem('listingbug_saved_listings');
      if (saved) {
        try { setSavedListings(JSON.parse(saved)); } catch (e) { setSavedListings([]); }
      } else {
        setSavedListings([]);
      }
    };
    window.addEventListener('storage', updateSavedListings);
    window.addEventListener('savedListingsChanged', updateSavedListings);
    return () => {
      window.removeEventListener('storage', updateSavedListings);
      window.removeEventListener('savedListingsChanged', updateSavedListings);
    };
  }, []);

  const planConfig = {
    starter: { listingsCap: 4000, automationSlots: 1, price: 49, name: 'Starter' },
    pro: { listingsCap: 10000, automationSlots: 3, price: 99, name: 'Professional' },
    enterprise: { listingsCap: Infinity, automationSlots: Infinity, price: null, name: 'Enterprise' }
  };
  const currentPlanConfig = planConfig[currentPlan];
  const listingsPercentage = currentPlan === 'enterprise' ? 0 : (listingsThisMonth / currentPlanConfig.listingsCap) * 100;
  const isNearingCap = listingsPercentage >= 90;

  const getNotificationCount = () => {
    const stored = localStorage.getItem('listingbug_notifications');
    if (stored) {
      try {
        const notifications = JSON.parse(stored);
        return Array.isArray(notifications) ? notifications.length : 0;
      } catch (e) { return 0; }
    }
    return 0;
  };

  useEffect(() => {
    const updateAlertCount = () => setAlertCount(getNotificationCount());
    updateAlertCount();
    window.addEventListener('storage', updateAlertCount);
    window.addEventListener('notificationsChanged', updateAlertCount);
    return () => {
      window.removeEventListener('storage', updateAlertCount);
      window.removeEventListener('notificationsChanged', updateAlertCount);
    };
  }, []);

  const snapshotData = {
    listingsImported,
    listingsExported,
    activeAutomations: activeAutomations.filter(a => a.status === 'running').length
  };

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

  const overageFee = 0.01;
  const overageAmount = Math.max(0, listingsThisMonth - currentPlanConfig.listingsCap);

  const formatTimestamp = (date: Date | string | undefined) => {
    if (!date) return 'Never';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return 'Invalid date';
    const diff = Date.now() - dateObj.getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">

        {/* LISTINGS SECTION */}
        <div className="mb-8">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#342e37] dark:text-white" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
            </div>
            <p className="text-sm text-gray-600">Track your monthly listing usage and market activity</p>
          </div>

          {/* Snapshot Cards */}
          <div className="flex gap-2 md:gap-3 mb-4">
            <Card
              className="cursor-pointer transition-all border-2 border-blue-200 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 flex-1"
              onClick={() => {
                sessionStorage.setItem('listingbug_open_tab', 'history');
                onNavigate?.('search-listings');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-2">
                  <Upload className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{snapshotData.listingsImported}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Imported</div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all border-2 border-green-200 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 flex-1"
              onClick={() => {
                sessionStorage.setItem('listingbug_automations_tab', 'history');
                onNavigate?.('automations');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center mb-2">
                  <Download className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{snapshotData.listingsExported}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Exported</div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all border-2 border-purple-200 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 flex-1"
              onClick={() => {
                sessionStorage.setItem('listingbug_open_saved_tab', 'listings');
                onNavigate?.('search-listings');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center mb-2">
                  <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{savedListings.length}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Saved</div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all border-2 border-amber-200 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 flex-1"
              onClick={() => {
                sessionStorage.setItem('listingbug_automations_tab', 'automations');
                onNavigate?.('automations');
              }}
            >
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-2">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{snapshotData.activeAutomations}</div>
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center w-full max-w-[4rem] md:max-w-none">Active<br />Automations</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Usage */}
          <div className="mt-4">
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
                <div className="text-3xl font-bold text-[#342e37] dark:text-white">{listingsThisMonth.toLocaleString()}</div>
                {currentPlan !== 'enterprise' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Math.max(0, 100 - listingsPercentage).toFixed(0)}% remaining
                  </div>
                )}
              </div>
            </div>
            {currentPlan !== 'enterprise' && (
              <div className="mb-3">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${isNearingCap ? 'bg-[#fa824c]' : 'bg-[#FFCE0A]'}`}
                    style={{ width: `${Math.min(listingsPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {isNearingCap && currentPlan !== 'enterprise' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-1">
                    You're at {listingsPercentage.toFixed(0)}% of your listings — upgrade for more.
                  </p>
                  <button onClick={() => onNavigate?.('pricing')} className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200 hover:text-amber-700 underline">
                    Upgrade Now →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAVED LISTINGS SECTION */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Listings</h2>
              <p className="text-sm text-gray-600">
                {savedListings.length === 0 ? 'Quick access to your bookmarked properties' : `${savedListings.length} saved listing${savedListings.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={() => onNavigate?.('search-listings')} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all w-full md:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37]">
              <Search className="w-4 h-4" />
              Search Listings
            </button>
          </div>

          {savedListings.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFCE0A]/20 flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-6 h-6 text-[#FFCE0A]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-700 dark:text-white mb-1">No saved listings yet</h3>
                  <p className="text-sm text-gray-600">Save listings from search results to review them later</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {savedListings.slice(0, 4).map((listing) => (
                  <div key={listing.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-white/10" onClick={() => setSelectedListing(listing)}>
                    <div className="relative w-full aspect-[4/3] bg-gray-100">
                      {listing.photos?.[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.address}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <Bookmark className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${listing.status === 'Active' ? 'bg-green-100 text-green-800' : listing.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{listing.status}</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-[#342e37] dark:text-white mb-1">${listing.price?.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 mb-1">{listing.bedrooms} bd · {listing.bathrooms} ba · {listing.sqft?.toLocaleString()} sf</div>
                      <div className="text-xs text-gray-900 dark:text-gray-100 font-medium line-clamp-1">{listing.address}</div>
                      <div className="text-xs text-gray-600 line-clamp-1">{listing.city}, {listing.state}</div>
                    </div>
                  </div>
                ))}
              </div>
              {savedListings.length > 4 && (
                <button onClick={() => { sessionStorage.setItem('listingbug_open_saved_tab', 'listings'); onNavigate?.('search-listings'); }} className="mt-3 text-sm font-medium text-[#342e37] dark:text-white hover:underline flex items-center gap-1">
                  View all {savedListings.length} saved listings <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* AUTOMATIONS SECTION */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Automations</h2>
              <p className={`text-sm ${currentPlan !== 'enterprise' && activeAutomations.length >= currentPlanConfig.automationSlots ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                {activeAutomations.length} of {currentPlanConfig.automationSlots === Infinity ? '∞' : currentPlanConfig.automationSlots} automation slots used
              </p>
            </div>
            <button onClick={() => onNavigate?.('automations')} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all w-full md:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37]">
              <List className="w-4 h-4" />
              View Automations
            </button>
          </div>

          {activeAutomations.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-700 mb-2">No Active Automations</h3>
                <p className="text-sm text-gray-600 mb-4">Create your first automation to start receiving listing updates automatically</p>
                <button onClick={() => onNavigate?.('automations')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all">
                  <Plus className="w-4 h-4" />
                  Create First Automation
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeAutomations.map((automation) => (
                <div key={automation.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all rounded-lg py-3" onClick={() => { setSelectedAutomation(automation); setIsAutomationDrawerOpen(true); }}>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#342e37] dark:text-white truncate">{automation.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{automation.destination?.label || automation.destination} · Last run {formatTimestamp(automation.lastRun)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAutomationStatus(automation.id); }}
                      disabled={automation.status === 'error'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${automation.status === 'running' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${automation.status === 'running' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INTEGRATIONS SECTION */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Integrations</h2>
              <p className="text-sm text-gray-600">Manage your connected services</p>
            </div>
            <button onClick={() => onNavigate?.('integrations')} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] w-full md:w-auto">
              <Settings className="w-4 h-4" />
              Connect More Tools
            </button>
          </div>
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-gray-700 mb-2">No Connected Integrations</h3>
              <p className="text-sm text-gray-600 mb-4">Connect tools like Mailchimp, Google Sheets, Salesforce, and more</p>
              <button onClick={() => onNavigate?.('integrations')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all">
                <Plus className="w-4 h-4" />
                Connect Your First Tool
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <InteractiveWalkthroughOverlay
        isActive={isStepActive(1)}
        step={1}
        totalSteps={totalSteps}
        title="Welcome to ListingBug!"
        description="Let's get you started. Click 'Search Listings' to find properties."
        highlightSelector="[data-walkthrough='search-listings-button']"
        tooltipPosition="bottom-left"
        mode="wait-for-click"
        onNext={() => completeStep(1)}
        onSkip={skipWalkthrough}
        showSkip={true}
      />

      {selectedListing && (
        <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} isSaved={true} />
      )}

      {isAutomationDrawerOpen && selectedAutomation && (
        <ViewEditAutomationDrawer
          isOpen={isAutomationDrawerOpen}
          automation={selectedAutomation}
          onClose={() => { setIsAutomationDrawerOpen(false); setSelectedAutomation(null); }}
          onViewDetail={onViewAutomationDetail}
          onAutomationUpdated={(updatedAutomation) => {
            setActiveAutomations(prev => prev.map(a => a.id === updatedAutomation.id ? updatedAutomation : a));
            window.dispatchEvent(new Event('automationsChanged'));
          }}
        />
      )}
    </div>
  );
}
