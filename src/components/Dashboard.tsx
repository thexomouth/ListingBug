import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { OnboardingWelcomeOverlay } from './OnboardingWelcomeOverlay';
import { OnboardingChecklist } from './OnboardingChecklist';
import { Card, CardContent } from './ui/card';
import { useWalkthrough } from './WalkthroughContext';
import { InteractiveWalkthroughOverlay } from './InteractiveWalkthroughOverlay';
import { getUserDataState, initializeEmptyUserData } from './utils/userDataUtils';
import { migrateSavedListings } from './utils/sandboxDataUtils';
import { ListingDetailModal } from './ListingDetailModal';
import { normalizeListing } from './utils/normalizeListing';
import { ListingImageWithFallback } from './ListingImageWithFallback';
import { ViewEditAutomationDrawer } from './ViewEditAutomationDrawer';
import { getBillingPeriod } from './utils/billingPeriod';
import {
  LayoutDashboard,
  Database,
  Download,
  Upload,
  Plus,
  Zap,
  AlertCircle,
  CheckCircle,
  List,
  Bookmark,
  Search,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (page: string) => void;
  onOpenReport?: (report: any, tab?: string) => void;
  onAccountTabChange?: (tab: 'profile' | 'billing' | 'integrations' | 'compliance') => void;
  onViewAutomationDetail?: (automation: any) => void;
  onSetAutomationsTab?: (tab: 'create' | 'automations' | 'history') => void;
}

type PlanType = 'trial' | 'starter' | 'pro' | 'enterprise';

const getUserPlan = (): PlanType => {
  const storedPlan = localStorage.getItem('listingbug_user_plan');
  if (storedPlan && ['trial', 'starter', 'pro', 'enterprise'].includes(storedPlan)) {
    return storedPlan as PlanType;
  }
  return 'trial';
};

export function Dashboard({ onNavigate, onOpenReport, onAccountTabChange, onViewAutomationDetail, onSetAutomationsTab }: DashboardProps) {
  const { isStepActive, completeStep, skipWalkthrough, totalSteps, walkthroughActive, currentStep } = useWalkthrough();
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getUserPlan());
  const [userDataState, setUserDataState] = useState(getUserDataState());
  const [activeAutomations, setActiveAutomations] = useState<any[]>([]);
  const [totalAutomationCount, setTotalAutomationCount] = useState(0);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<any | null>(null);
  const [isAutomationDrawerOpen, setIsAutomationDrawerOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [listingsImported, setListingsImported] = useState(0);
  const [listingsExported, setListingsExported] = useState(0);
  const [listingsThisPeriod, setListingsThisPeriod] = useState(0);
  const [billingPeriodLabel, setBillingPeriodLabel] = useState('this billing period');
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const pendingLoads = useRef(3);

  // Onboarding state
  const [showWelcome, setShowWelcome] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const markLoaded = () => {
    pendingLoads.current -= 1;
    if (pendingLoads.current <= 0) setIsDashboardLoading(false);
  };

  // Reset any stuck body scroll lock left over from modals on other pages.
  // Clears ALL properties set by ListingDetailModal's scroll lock.
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';
  }, []);

  useEffect(() => {
    const dataState = getUserDataState();
    if (dataState.isFirstTimeUser) initializeEmptyUserData();
    setUserDataState(dataState);
  }, []);

  // Onboarding: decide whether to show welcome overlay or checklist
  useEffect(() => {
    const initOnboarding = async () => {
      const welcomed = localStorage.getItem('lb_onboarding_welcomed') === 'true';
      const dismissed = localStorage.getItem('lb_onboarding_dismissed') === 'true';
      if (dismissed) return;

      if (!welcomed) {
        // Show welcome overlay only to users with no prior searches
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('search_runs').select('id').eq('user_id', user.id).limit(1);
        if (data?.length) {
          // Existing user — skip welcome, go straight to checklist
          localStorage.setItem('lb_onboarding_welcomed', 'true');
          setShowChecklist(true);
        } else {
          setShowWelcome(true);
        }
      } else {
        setShowChecklist(true);
      }
    };
    initOnboarding();
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { markLoaded(); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('total_listings_fetched, created_at')
        .eq('id', user.id)
        .single();

      if (userData) {
        setListingsImported(userData.total_listings_fetched ?? 0);

        const period = getBillingPeriod(userData.created_at);
        setBillingPeriodLabel(period.label);

        if (period.monthYears.length > 0) {
          const { data: usageRows } = await supabase
            .from('usage_tracking')
            .select('listings_fetched')
            .eq('user_id', user.id)
            .in('month_year', period.monthYears);

          if (usageRows) {
            const total = usageRows.reduce((sum: number, r: any) => sum + (r.listings_fetched ?? 0), 0);
            setListingsThisPeriod(total);
          }
        }
      }

      const { data: runData } = await supabase
        .from('automation_runs')
        .select('listings_sent')
        .eq('user_id', user.id);
      if (runData) {
        const total = runData.reduce((sum: number, r: any) => sum + (r.listings_sent ?? 0), 0);
        setListingsExported(total);
      }

      markLoaded();
    };
    fetchUsage();
  }, []);

  useEffect(() => {
    const loadAutomations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { markLoaded(); return; }

      const { data: userData } = await supabase.from('users').select('plan').eq('id', user.id).single();
      if (userData?.plan) {
        const planMap: Record<string, PlanType> = { trial: 'trial', starter: 'starter', professional: 'pro', pro: 'pro', enterprise: 'enterprise' };
        setCurrentPlan(planMap[userData.plan?.toLowerCase()] ?? 'trial');
      }

      const { data, error } = await supabase
        .from('automations')
        .select('id,name,destination_type,destination_label,destination_config,active,last_run_at,next_run_at,schedule')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          destination: { type: row.destination_type, label: row.destination_label ?? row.destination_type, config: row.destination_config ?? {} },
          status: 'idle',
          lastRun: row.last_run_at,
          nextRun: row.next_run_at,
          schedule: row.schedule,
          active: row.active,
        }));
        setTotalAutomationCount(mapped.length);
        setActiveAutomations(mapped.filter(a => a.active));
      }
      markLoaded();
    };
    loadAutomations();
  }, []);

  useEffect(() => {
    const INTEGRATION_META: Record<string, { name: string; category: string }> = {
      salesforce: { name: 'Salesforce', category: 'CRM' },
      hubspot: { name: 'HubSpot', category: 'CRM' },
      mailchimp: { name: 'Mailchimp', category: 'Email Marketing' },
      sendgrid: { name: 'SendGrid', category: 'Email Marketing' },
      constantcontact: { name: 'Constant Contact', category: 'Email Marketing' },
      google: { name: 'Google Sheets', category: 'Spreadsheets' },
      sheets: { name: 'Google Sheets', category: 'Spreadsheets' },
      airtable: { name: 'Airtable', category: 'Spreadsheets' },
      twilio: { name: 'Twilio', category: 'SMS' },
      zapier: { name: 'Zapier', category: 'Automation' },
      make: { name: 'Make', category: 'Automation' },
      webhook: { name: 'Custom Webhook', category: 'Developer' },
    };
    const fetchConnected = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('integration_connections').select('integration_id').eq('user_id', user.id);
      if (data) {
        const list = data.map((row: any) => row.integration_id).filter((id: string) => INTEGRATION_META[id]).map((id: string) => ({ id, ...INTEGRATION_META[id] }));
        setConnectedIntegrations(list);
      }
    };
    fetchConnected();
  }, []);

  useEffect(() => {
    migrateSavedListings();
    const loadFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { markLoaded(); return; }
      const { data } = await supabase.from('saved_listings').select('listing_data_json, saved_at').eq('user_id', user.id).order('saved_at', { ascending: false });
      const listings = (data ?? []).map((r: any) => normalizeListing(r.listing_data_json)).filter(Boolean);
      setSavedListings(listings);
      localStorage.setItem('listingbug_saved_listings', JSON.stringify(listings));
      markLoaded();
    };
    loadFromSupabase();
    const updateSavedListings = () => {
      const saved = localStorage.getItem('listingbug_saved_listings');
      if (saved) { try { setSavedListings(JSON.parse(saved)); } catch { setSavedListings([]); } } else { setSavedListings([]); }
    };
    window.addEventListener('storage', updateSavedListings);
    window.addEventListener('savedListingsChanged', updateSavedListings);
    return () => {
      window.removeEventListener('storage', updateSavedListings);
      window.removeEventListener('savedListingsChanged', updateSavedListings);
    };
  }, []);

  const planConfig = {
    trial: { listingsCap: 1000, automationSlots: 3, price: 0, name: 'Trial' },
    starter: { listingsCap: 4000, automationSlots: 3, price: 19, name: 'Starter' },
    pro: { listingsCap: 10000, automationSlots: 9, price: 49, name: 'Professional' },
    enterprise: { listingsCap: Infinity, automationSlots: Infinity, price: null, name: 'Enterprise' },
  };
  const currentPlanConfig = planConfig[currentPlan];
  const listingsPercentage = currentPlan === 'enterprise' ? 0 : (listingsThisPeriod / currentPlanConfig.listingsCap) * 100;
  const isNearingCap = listingsPercentage >= 90;
  // Trial accounts are hard-blocked at 100% — show a stronger warning
  const isTrialOverLimit = currentPlan === 'trial' && listingsPercentage >= 100;

  useEffect(() => {
    const updateAlertCount = () => {
      const stored = localStorage.getItem('listingbug_notifications');
      if (stored) { try { const n = JSON.parse(stored); setAlertCount(Array.isArray(n) ? n.length : 0); } catch { setAlertCount(0); } }
    };
    updateAlertCount();
    window.addEventListener('storage', updateAlertCount);
    window.addEventListener('notificationsChanged', updateAlertCount);
    return () => {
      window.removeEventListener('storage', updateAlertCount);
      window.removeEventListener('notificationsChanged', updateAlertCount);
    };
  }, []);

  const toggleAutomationStatus = async (automationId: string) => {
    const automation = activeAutomations.find(a => a.id === automationId);
    if (!automation) return;
    const newActive = !automation.active;
    setActiveAutomations(prev => prev.map(a => a.id === automationId ? { ...a, active: newActive } : a));
    await supabase.from('automations').update({ active: newActive, updated_at: new Date().toISOString() }).eq('id', automationId);
  };

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

  const handleWelcomeStart = () => {
    localStorage.setItem('lb_onboarding_welcomed', 'true');
    setShowWelcome(false);
    setShowChecklist(true);
    onNavigate?.('search-listings');
  };

  const handleWelcomeSkip = () => {
    localStorage.setItem('lb_onboarding_welcomed', 'true');
    setShowWelcome(false);
    setShowChecklist(true);
  };

  const handleChecklistDismiss = () => {
    localStorage.setItem('lb_onboarding_dismissed', 'true');
    setShowChecklist(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      {/* Welcome overlay — first login only */}
      {showWelcome && (
        <OnboardingWelcomeOverlay onStart={handleWelcomeStart} onSkip={handleWelcomeSkip} />
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">

        <div className="mb-8">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your listing activity and market performance</p>
          </div>

          {/* Onboarding checklist — shown after welcome overlay is dismissed */}
          {showChecklist && (
            <OnboardingChecklist onNavigate={onNavigate} onDismiss={handleChecklistDismiss} />
          )}

          <div className="flex gap-2 md:gap-3 mb-4">
            <Card className="cursor-pointer transition-all border-2 border-blue-200 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 flex-1" onClick={() => { sessionStorage.setItem('listingbug_open_tab', 'history'); onNavigate?.('search-listings'); }}>
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-2"><Upload className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" /></div>
                {isDashboardLoading ? <div className="h-7 w-10 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-1" /> : <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{listingsImported.toLocaleString()}</div>}
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Imported</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all border-2 border-green-200 dark:border-green-900 hover:border-green-300 dark:hover:border-green-700 flex-1" onClick={() => { sessionStorage.setItem('listingbug_automations_tab', 'history'); onNavigate?.('automations'); }}>
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center mb-2"><Download className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" /></div>
                {isDashboardLoading ? <div className="h-7 w-10 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-1" /> : <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{listingsExported.toLocaleString()}</div>}
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Exported</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all border-2 border-purple-200 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 flex-1" onClick={() => { sessionStorage.setItem('listingbug_open_tab', 'listings'); onNavigate?.('search-listings'); }}>
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center mb-2"><Bookmark className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" /></div>
                {isDashboardLoading ? <div className="h-7 w-10 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-1" /> : <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{savedListings.length}</div>}
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center">Listings Saved</div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all border-2 border-amber-200 dark:border-amber-900 hover:border-amber-300 dark:hover:border-amber-700 flex-1" onClick={() => { sessionStorage.setItem('listingbug_automations_tab', 'automations'); onNavigate?.('automations'); }}>
              <CardContent className="p-3 md:p-4 flex flex-col items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center mb-2"><Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" /></div>
                {isDashboardLoading ? <div className="h-7 w-10 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse mb-1" /> : <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-1">{activeAutomations.length}</div>}
                <div className="text-xs leading-tight text-gray-600 dark:text-gray-400 text-center w-full max-w-[4rem] md:max-w-none">Active<br />Automations</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-[#342e37] dark:text-white mb-1">Data Usage This Billing Period</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPlan === 'enterprise'
                    ? 'Unlimited listings on your plan'
                    : (<><span>{listingsThisPeriod.toLocaleString()} of {currentPlanConfig.listingsCap.toLocaleString()} listings used</span><span className="hidden sm:inline"> · {billingPeriodLabel}</span><span className="block sm:hidden text-xs">{billingPeriodLabel}</span></>)
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#342e37] dark:text-white">{listingsThisPeriod.toLocaleString()}</div>
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
                  <div className={`h-full transition-all rounded-full ${isNearingCap ? 'bg-[#fa824c]' : 'bg-[#FFCE0A]'}`} style={{ width: `${Math.min(listingsPercentage, 100)}%` }} />
                </div>
              </div>
            )}
            {/* Trial hard-block warning — shown when trial account has hit 100% of limit */}
            {isTrialOverLimit && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-900 dark:text-red-200 font-medium mb-1">Your free trial listing limit has been reached. Search and automation features are paused until you upgrade.</p>
                  <button onClick={() => onNavigate?.('pricing')} className="mt-2 text-sm font-medium text-red-900 dark:text-red-200 hover:text-red-700 underline">Upgrade to continue →</button>
                </div>
              </div>
            )}
            {/* Near-cap warning for non-trial plans (paid accounts can overage) */}
            {isNearingCap && !isTrialOverLimit && currentPlan !== 'enterprise' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-1">You're at {listingsPercentage.toFixed(0)}% of your listings — upgrading can help avoid overrages</p>
                  <button onClick={() => onNavigate?.('pricing')} className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-200 hover:text-amber-700 underline">Upgrade Now →</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAVED LISTINGS */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Listings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{savedListings.length === 0 ? 'Quick access to your bookmarked properties' : `${savedListings.length} saved listing${savedListings.length !== 1 ? 's' : ''}`}</p>
            </div>
            <button onClick={() => onNavigate?.('search-listings')} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all w-full md:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37]">
              <Search className="w-4 h-4" />Search Listings
            </button>
          </div>
          {savedListings.length === 0 ? (
            <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]"><Bookmark className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div>
              <h3 className="font-bold text-lg text-gray-600 dark:text-white mb-2">No saved listings yet</h3>
              <p className="text-sm text-gray-500 dark:text-[#EBF2FA] mb-6">Save listings from search results to review them later</p>
              <button onClick={() => onNavigate?.('search-listings')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all"><Search className="w-4 h-4" />Search Listings</button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <div className="relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {savedListings.slice(0, 4).map((listing) => (
                    <div key={listing.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-white/10" onClick={() => setSelectedListing(listing)}>
                      <div className="relative w-full aspect-[4/3] bg-gray-100"><ListingImageWithFallback listing={listing} /><span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${listing.status === 'Active' ? 'bg-green-100 text-green-800' : listing.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{listing.status}</span></div>
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
                  <button onClick={() => { sessionStorage.setItem('listingbug_open_tab', 'listings'); onNavigate?.('search-listings'); }} className="mt-3 text-sm font-medium text-[#342e37] dark:text-white hover:underline flex items-center gap-1">
                    View all {savedListings.length} saved listings <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AUTOMATIONS */}
        <div className="mb-8 pt-8 border-t-2 border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Automations</h2>
              <p className={`text-sm ${currentPlan !== 'enterprise' && totalAutomationCount >= currentPlanConfig.automationSlots ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                {totalAutomationCount} of {currentPlanConfig.automationSlots === Infinity ? '\u221e' : currentPlanConfig.automationSlots} automation slots used
              </p>
            </div>
            <button onClick={() => onNavigate?.('automations')} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all w-full md:w-auto bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37]">
              <List className="w-4 h-4" />View Automations
            </button>
          </div>
          {activeAutomations.length === 0 ? (
            <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]"><Zap className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div>
              <h3 className="font-bold text-lg text-gray-600 dark:text-white mb-2">No Active Automations</h3>
              <p className="text-sm text-gray-500 dark:text-[#EBF2FA] mb-6">Create your first automation to start receiving listing updates automatically</p>
              <button onClick={() => onNavigate?.('automations')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all"><Plus className="w-4 h-4" />Create First Automation</button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {activeAutomations.map((automation) => (
                  <div key={automation.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all rounded-lg py-3 first:pt-0 last:pb-0" onClick={() => { setSelectedAutomation(automation); setIsAutomationDrawerOpen(true); }}>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#342e37] dark:text-white truncate">{automation.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{automation.destination?.label || automation.destination} · Last run {formatTimestamp(automation.lastRun)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleAutomationStatus(automation.id); }} disabled={automation.status === 'error'} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${automation.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${automation.active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* INTEGRATIONS */}
        <div className="mb-8 pt-8 pb-[100px] border-t-2 border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Integrations</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your connected services</p>
            </div>
            <button onClick={() => onNavigate?.('integrations')} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] w-full md:w-auto">
              <Settings className="w-4 h-4" />Connect More Tools
            </button>
          </div>
          {connectedIntegrations.length === 0 ? (
            <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]"><Database className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div>
              <h3 className="font-bold text-lg text-gray-600 dark:text-white mb-2">No Connected Integrations</h3>
              <p className="text-sm text-gray-500 dark:text-[#EBF2FA] mb-6">Connect tools like Mailchimp, Google Sheets, Salesforce, and more</p>
              <button onClick={() => onNavigate?.('integrations')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#342e37] rounded-lg font-bold transition-all"><Plus className="w-4 h-4" />Connect Your First Tool</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedIntegrations.map((integration) => (
                <div key={integration.id} className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-[#FFCE0A] transition-all" onClick={() => onNavigate?.('integrations')}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-[#0F1115] flex-shrink-0"><Database className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[14px] text-gray-900 dark:text-white truncate">{integration.name}</p>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">{integration.category}</p>
                  </div>
                  <div className="ml-auto flex-shrink-0"><span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3" />Connected</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Only mount the modal when a listing is selected. This ensures the modal's
          scroll lock useEffect cleanup always runs on unmount — gating here means
          animateClose() has already called releaseScrollLock() before onClose()
          sets selectedListing=null, so the body is never left in a frozen state. */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          isSaved={savedListings.some((l: any) => l.id === selectedListing?.id)}
          onSaveListing={async (listing: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const alreadySaved = savedListings.some((l: any) => l.id === listing.id);
            if (alreadySaved) {
              await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', listing.id);
              setSavedListings((prev: any[]) => prev.filter((l: any) => l.id !== listing.id));
            } else {
              await supabase.from('saved_listings').upsert({ user_id: user.id, listing_id: listing.id, listing_data_json: listing, saved_at: new Date().toISOString() }, { onConflict: 'user_id,listing_id' });
              setSavedListings((prev: any[]) => [...prev, listing]);
            }
            window.dispatchEvent(new Event('savedListingsUpdated'));
          }}
        />
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
