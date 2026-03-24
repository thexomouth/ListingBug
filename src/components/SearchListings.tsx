import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { LBButton } from './design-system/LBButton';
import { LBToggle } from './design-system/LBToggle';
import { CityAutocomplete } from './CityAutocomplete';
import { Download, Plus, X, MapPin, DollarSign, Home, Eye, Save, Search, Filter, Sliders, ArrowUpDown, ArrowUp, ArrowDown, Check, Calendar, Clock, Loader2, FileText, Database, CheckCircle, Zap, Edit2, Trash2, Play, TrendingUp, History, BarChart3, Share2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'react-toastify';
import { ListingDetailModal } from './ListingDetailModal';
import { CreateAutomationModal } from './CreateAutomationModal';
import { PropertyValuationModal } from './PropertyValuationModal';
import { PropertyHistoryModal } from './PropertyHistoryModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useWalkthrough } from './WalkthroughContext';
import { InteractiveWalkthroughOverlay } from './InteractiveWalkthroughOverlay';
import { createNotification } from '../lib/notifications';
import { TableColumnCustomizer, ColumnConfig } from './TableColumnCustomizer';
import { ExportDropdown } from './ExportDropdown';
import { SearchResultsTableHeader } from './SearchResultsTableHeader';
import { SearchResultsTableRow } from './SearchResultsTableRow';

type FilterKey =
  | 'latitude'
  | 'longitude'
  | 'radius'
  | 'bedrooms'
  | 'bathrooms'
  | 'squareFootage'
  | 'lotSize'
  | 'yearBuilt'
  | 'daysOld'
  | 'reListedProperty'
  | 'pricePerSqFt'
  | 'hoaFees'
  | 'taxAmount'
  | 'garage'
  | 'pool'
  | 'waterfront'
  | 'foreclosureStatus'
  | 'distressedProperty'
  | 'vacancy'
  | 'openHouseScheduled'
  | 'virtualTourAvailable'
  | 'schoolRating'
  | 'walkScore'
  | 'newConstruction'
  | 'priceReduction';

interface AdditionalFilter {
  key: FilterKey;
  label: string;
  placeholder: string;
  type: 'number' | 'text' | 'boolean' | 'select';
  options?: string[];
  category?: string;
}

const availableFilters: AdditionalFilter[] = [
  // Location Filters
  { key: 'address', label: 'Address', placeholder: '123 Main St', type: 'text', category: 'Location' },
  { key: 'zip', label: 'ZIP Code', placeholder: '90001', type: 'text', category: 'Location' },
  { key: 'latitude', label: 'Latitude', placeholder: '34.0522', type: 'text', category: 'Location' },
  { key: 'longitude', label: 'Longitude', placeholder: '-118.2437', type: 'text', category: 'Location' },
  { key: 'radius', label: 'Search Radius (mi)', placeholder: '5', type: 'text', category: 'Location' },
  
  // Property Basics
  { key: 'bedrooms', label: 'Bedrooms', placeholder: '3 or 3-4', type: 'text', category: 'Property' },
  { key: 'bathrooms', label: 'Bathrooms', placeholder: '2 or 2.5-3', type: 'text', category: 'Property' },
  { key: 'squareFootage', label: 'Square Footage', placeholder: '1500-2500', type: 'text', category: 'Property' },
  { key: 'lotSize', label: 'Lot Size (sq ft)', placeholder: '5000-10000', type: 'text', category: 'Property' },
  
  // Financial Filters
  { key: 'pricePerSqFt', label: 'Price Per Sq Ft', placeholder: '100-200', type: 'text', category: 'Financial' },
  { key: 'hoaFees', label: 'HOA Fees/Month', placeholder: '0-500', type: 'text', category: 'Financial' },
  { key: 'taxAmount', label: 'Annual Property Tax', placeholder: '2000-5000', type: 'text', category: 'Financial' },
  { key: 'priceReduction', label: 'Price Reduction %', placeholder: '5-20', type: 'text', category: 'Financial' },
  
  // Property Features
  { key: 'garage', label: 'Garage Spaces', placeholder: '2', type: 'text', category: 'Features' },
  { key: 'pool', label: 'Pool Type', placeholder: 'Any', type: 'select', options: ['Any', 'In-Ground', 'Above-Ground', 'None'], category: 'Features' },
  { key: 'waterfront', label: 'Waterfront', placeholder: '', type: 'boolean', category: 'Features' },
  { key: 'newConstruction', label: 'New Construction', placeholder: '', type: 'boolean', category: 'Features' },
  
  // Market Intelligence
  { key: 'foreclosureStatus', label: 'Foreclosure Status', placeholder: 'Any', type: 'select', options: ['Any', 'Pre-Foreclosure', 'Foreclosure', 'REO'], category: 'Intelligence' },
  { key: 'distressedProperty', label: 'Distressed Property', placeholder: '', type: 'boolean', category: 'Intelligence' },
  { key: 'vacancy', label: 'Vacant Property', placeholder: '', type: 'select', options: ['Any', 'Vacant', 'Occupied'], category: 'Intelligence' },
  { key: 'openHouseScheduled', label: 'Open House Scheduled', placeholder: '', type: 'boolean', category: 'Intelligence' },
  { key: 'virtualTourAvailable', label: 'Virtual Tour Available', placeholder: '', type: 'boolean', category: 'Intelligence' },
  
  // Location Quality
  { key: 'schoolRating', label: 'School Rating (1-10)', placeholder: '7-10', type: 'text', category: 'Location' },
  { key: 'walkScore', label: 'Walk Score (0-100)', placeholder: '70-100', type: 'text', category: 'Location' },
];

interface SearchCriteria {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
  radius: string;
  propertyType: string;
  status: string;
  beds: string;
  baths: string;
  minPrice: string;
  maxPrice: string;
  pricePerSqFt: string;
  yearBuilt: string;
  daysOld: string;
  reListedProperty: boolean;
  priceDrop: boolean;
  newConstruction: boolean;
  foreclosure: boolean;
  [key: string]: string | boolean;
}

interface SearchListingsProps {
  onAddToMyReports?: (reportData: any) => void;
  onNavigate?: (page: string) => void;
}

const US_STATES = [
  { value: '', label: 'Select state' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

export function SearchListings({ onAddToMyReports, onNavigate, onViewSearchResults }: SearchListingsProps = {}) {
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'listings' | 'history'>('search');

  // Reset scroll lock on tab change — prevents blackout on mobile
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = '';
  }, [activeTab]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'valuation' | 'property-history' | null>(null);
  
  // Walkthrough integration
  const { isStepActive, completeStep, skipWalkthrough, totalSteps, previousStep, walkthroughActive, currentStep } = useWalkthrough();
  
  // Track if location field has been interacted with for Step 3 trigger
  const [locationFieldBlurred, setLocationFieldBlurred] = useState(false);
  
  // Track if search has been performed for Step 4 trigger  
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  useEffect(() => {
    if (cityInputRef.current) {
      cityInputRef.current.focus();
    }
  }, []);

  // Check if we should open saved listings tab (from dashboard navigation)
  useEffect(() => {
    const shouldOpenSaved = sessionStorage.getItem('listingbug_open_saved_tab');
    const tabToOpen = sessionStorage.getItem('listingbug_open_tab');
    
    if (shouldOpenSaved === 'true') {
      setActiveTab('saved');
      sessionStorage.removeItem('listingbug_open_saved_tab');
    } else if (tabToOpen) {
      setActiveTab(tabToOpen as 'search' | 'saved' | 'listings' | 'history');
      sessionStorage.removeItem('listingbug_open_tab');
    }
  }, []);
  
  // Walkthrough: Auto-resume and advance on page load
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('listingbug_walkthrough_step') || '0');
    const completed = localStorage.getItem('listingbug_walkthrough_completed') === 'true';
    
    console.log('🔍 SearchListings mounted - Walkthrough state:', { 
      walkthroughActive, 
      currentStep, 
      savedStep,
      completed 
    });
    
    // If user just navigated here from Dashboard (step 1), advance to step 2
    if (!completed && currentStep === 1 && walkthroughActive) {
      console.log('✅ Advancing from Step 1 → Step 2 (user navigated to Search Listings)');
      completeStep(1); // This will set currentStep to 2 and show step 2 overlay
    }
  }, [walkthroughActive, currentStep, completeStep]);
  
  // Walkthrough: Step 3 trigger (after location blur)
  useEffect(() => {
    if (locationFieldBlurred && isStepActive(2)) {
      completeStep(2);
    }
  }, [locationFieldBlurred, isStepActive]);
  
  // Walkthrough: Step 4 trigger (after search)
  useEffect(() => {
    if (searchPerformed && isStepActive(3)) {
      completeStep(3);
    }
  }, [searchPerformed, isStepActive]);

  // Load subscription / plan info for reset text
  useEffect(() => {
    const fetchBillingInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('plan,plan_status,trial_ends_at,stripe_subscription_start,stripe_subscription_end')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Failed to load billing info', error);
        return;
      }

      if (user?.plan) {
        if (user.plan.toLowerCase() === 'starter') setListingsCap(4000);
        if (user.plan.toLowerCase() === 'professional') setListingsCap(10000);
        if (user.plan.toLowerCase() === 'enterprise') setListingsCap(999999);
      }

      if (user.plan_status?.toLowerCase() === 'trialing' || user.trial_ends_at) {
        setIsTrialUser(true);
        const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
        if (trialEnd) {
          const formatted = trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          setResetLabel(`Trial ends ${formatted}`);
        } else {
          setResetLabel('Trial ends soon');
        }
      } else if (user.stripe_subscription_end) {
        const end = new Date(user.stripe_subscription_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setResetLabel(`Resets ${end}`);
      }

      // Load real usage count from Supabase so meter starts at correct value
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('listings_fetched')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .single();
      if (usageData?.listings_fetched !== undefined) {
        setListingsSynced(usageData.listings_fetched);
      }
    };

    fetchBillingInfo();
  }, []);

  // Load saved searches from Supabase on mount (cross-device sync)
  useEffect(() => {
    const loadSavedSearches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('searches')
        .select('id, name, location, filters_json, created_at, last_run_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const searches = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          criteria: r.filters_json?.criteria || {},
          activeFilters: r.filters_json?.activeFilters || [],
          criteriaDescription: r.filters_json?.criteriaDescription || '',
          createdAt: r.created_at,
          lastUsed: r.last_run_at,
        }));
        setSavedSearches(searches);
        localStorage.setItem('listingbug_saved_searches', JSON.stringify(searches));
      }
    };
    loadSavedSearches();
  }, []);

  // Load saved listings from Supabase on mount (cross-device sync)
  useEffect(() => {
    const loadSavedListings = async () => {
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
      }
    };
    loadSavedListings();
  }, []);

  // Load saved searches from Supabase on mount (cross-device sync)
  useEffect(() => {
    const loadSavedSearches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('searches')
        .select('id, name, location, filters_json, created_at, last_run_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const searches = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          criteria: r.filters_json?.criteria || {},
          activeFilters: r.filters_json?.activeFilters || [],
          criteriaDescription: r.filters_json?.criteriaDescription || '',
          createdAt: r.created_at,
          lastUsed: r.last_run_at,
        }));
        setSavedSearches(searches);
        localStorage.setItem('listingbug_saved_searches', JSON.stringify(searches));
      }
    };
    loadSavedSearches();
  }, []);

  // Load saved searches from Supabase on mount (cross-device sync)
  useEffect(() => {
    const loadSavedSearches = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('searches')
        .select('id, name, location, filters_json, created_at, last_run_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        const searches = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          location: r.location,
          criteria: r.filters_json?.criteria || {},
          activeFilters: r.filters_json?.activeFilters || [],
          criteriaDescription: r.filters_json?.criteriaDescription || '',
          createdAt: r.created_at,
          lastUsed: r.last_run_at,
        }));
        setSavedSearches(searches);
        localStorage.setItem('listingbug_saved_searches', JSON.stringify(searches));
      }
    };
    loadSavedSearches();
  }, []);
  

  // Load search history from Supabase on mount
  useEffect(() => {
    const loadSearchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: loadError } = await supabase
        .from('search_runs')
        .select('id, location, criteria_description, criteria_json, results_json, results_count, searched_at')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(50);
      if (loadError) console.error('[search_runs load]', loadError.message);
      if (data && data.length > 0) {
        setSearchHistory(data.map((r: any) => ({
          id: r.id,
          location: r.location,
          criteriaDescription: r.criteria_description,
          criteria: r.criteria_json,
          resultsCount: r.results_count,
          searchDate: r.searched_at,
          listings: r.results_json || [], // loaded from DB — works across devices
        })));
      }
    };
    loadSearchHistory();
  }, []);

  // Saved searches state - load from localStorage
  const [savedSearches, setSavedSearches] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_saved_searches');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored searches:', e);
      }
    }
    return [];
  });
  
  // Search history state - load from localStorage
  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_search_history');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
    return [];
  });
  
  // Report history state - load from localStorage with sample data for returning users
  const [reportHistory, setReportHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_report_history');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse report history:', e);
      }
    }
    
    // Check if returning user (has automations or saved searches)
    const hasAutomations = localStorage.getItem('listingbug_automations');
    const hasSavedSearches = localStorage.getItem('listingbug_saved_searches');
    
    if (hasAutomations || hasSavedSearches) {
      // Returning user - provide sample report history
      const sampleReports = [
        {
          id: 'report-val-001',
          type: 'valuation',
          property: {
            address: '2847 Riverside Drive',
            city: 'Austin',
            state: 'TX',
            zip: '78741',
            mlsId: 'MLS-78945'
          },
          result: {
            estimatedValue: 675000,
            confidenceRange: [650000, 700000],
            pricePerSqft: 285,
            marketTrend: 'Rising',
            comparables: 12
          },
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000).toISOString()
        },
        {
          id: 'report-hist-001',
          type: 'property-history',
          property: {
            address: '1523 Oak Valley Lane',
            city: 'Austin',
            state: 'TX',
            zip: '78704',
            mlsId: 'MLS-65432'
          },
          result: {
            salesHistory: 4,
            yearsTracked: 15,
            lastSalePrice: 425000,
            lastSaleDate: '2022-03-15',
            priceAppreciation: 18.5
          },
          status: 'completed',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45000).toISOString()
        }
      ];
      
      localStorage.setItem('listingbug_report_history', JSON.stringify(sampleReports));
      return sampleReports;
    }
    
    // First-time user - no reports
    return [];
  });
  
  // Report pagination state
  const [reportPage, setReportPage] = useState(1);
  const reportsPerPage = 10;
  
  // Saved listings state - load from localStorage
  const [savedListings, setSavedListings] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_saved_listings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse saved listings:', e);
      }
    }
    return [];
  });
  
  // Persist saved listings to localStorage
  useEffect(() => {
    localStorage.setItem('listingbug_saved_listings', JSON.stringify(savedListings));
    // Dispatch event to update dashboard count
    window.dispatchEvent(new Event('savedListingsUpdated'));
  }, [savedListings]);
  
  // Persist report history to localStorage
  useEffect(() => {
    localStorage.setItem('listingbug_report_history', JSON.stringify(reportHistory));
  }, [reportHistory]);
  
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedSavedSearch, setSelectedSavedSearch] = useState<any | null>(null);
  
  const [criteria, setCriteria] = useState<SearchCriteria>({
    address: '',
    city: '',
    state: '',
    zip: '',
    latitude: '',
    longitude: '',
    radius: '',
    propertyType: 'Single Family',
    status: 'Active',
    beds: '',
    baths: '',
    minPrice: '',
    maxPrice: '',
    pricePerSqFt: '',
    yearBuilt: '',
    daysOld: '1',
    reListedProperty: false,
    priceDrop: false,
    newConstruction: false,
    foreclosure: false,
  });

  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<{ city?: string; state?: string; zip?: string; general?: string }>({});
  const [isCappedAtMax, setIsCappedAtMax] = useState(false);
  const cityInputRef = useRef<HTMLInputElement | null>(null);
  const [includeIncompleteData, setIncludeIncompleteData] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showComplexFilterModal, setShowComplexFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Listings synced tracking
  const [listingsSynced, setListingsSynced] = useState(0);
  const [listingsCap, setListingsCap] = useState(4000);
  const [resetLabel, setResetLabel] = useState('Resets 04/27/25');
  const [isTrialUser, setIsTrialUser] = useState(false);
  
  // Sorting state
  type SortColumn = 'address' | 'city' | 'price' | 'yearBuilt' | 'agentName' | 'daysListed' | 'status';
  type SortDirection = 'asc' | 'desc';
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Column customization state
  const [searchResultsColumns, setSearchResultsColumns] = useState<ColumnConfig[]>([
    { id: 'address', label: 'Address', visible: true, required: true },
    { id: 'city', label: 'City', visible: true },
    { id: 'price', label: 'List Price', visible: true },
    { id: 'yearBuilt', label: 'Year Built', visible: true },
    { id: 'agentName', label: 'Agent Name', visible: true },
    { id: 'daysListed', label: 'Days on Market', visible: true },
    { id: 'reList', label: 'Re-Listed?', visible: true },
    { id: 'priceDrop', label: 'Price Drop?', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'actions', label: 'Actions', visible: true, required: true },
  ]);

  // Sample preview data (shown before first search) - Single row with hyphens until results load
  const samplePreviewData = [
    { id: 'sample-preview', address: '—', city: '—', price: 0, yearBuilt: '—', agentName: '—', daysListed: '—', reList: false, priceDrop: false, status: '—' },
  ];

  // Save to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('listingbug_saved_searches', JSON.stringify(savedSearches));
  }, [savedSearches]);
  
  useEffect(() => {
    localStorage.setItem('listingbug_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  useEffect(() => {
    localStorage.setItem('listingbug_saved_listings', JSON.stringify(savedListings));
  }, [savedListings]);

  // Handle mobile keyboard behavior for Save Search modal
  useEffect(() => {
    if (showSaveSearchModal) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Add iOS-specific viewport adjustments
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.getAttribute('content');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        
        return () => {
          document.body.style.overflow = '';
          if (originalContent) {
            viewport.setAttribute('content', originalContent);
          }
        };
      }
    } else {
      document.body.style.overflow = '';
    }
  }, [showSaveSearchModal]);

  // Handle scroll locking for loading animation
  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading]);

  const handleSearch = async () => {
    const errors: { city?: string; state?: string; zip?: string; general?: string } = {};

    const hasAddress = !!criteria.address;
    const hasCity = !!criteria.city;
    const hasZip = !!criteria.zip;
    const hasLatLng = !!criteria.latitude && !!criteria.longitude;
    const hasRadius = !!criteria.radius;

    // Need at least one locating anchor
    if (!hasAddress && !hasCity && !hasZip && !hasLatLng) {
      errors.general = 'Please select a city from the dropdown, or enter a ZIP code or address';
    }

    // Lat/lng without radius is ambiguous
    if (hasLatLng && !hasRadius && !hasCity && !hasZip && !hasAddress) {
      errors.general = 'Add a radius (miles) when searching by coordinates';
    }

    // City must have been selected from dropdown (will have state auto-filled)
    if (hasCity && !criteria.state) {
      errors.state = 'Please select a city from the dropdown list';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.general) {
        toast.error(errors.general);
      }
      return;
    }

    setFieldErrors({});
    setSearchPerformed(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.style.overflow = 'hidden';
    setIsLoading(true);
    setIsCappedAtMax(false);

    try {
      // getSession is the authoritative source for the JWT token.
      // We call refreshSession first to ensure the token is fresh,
      // then fall back to getSession if already valid.
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        // Try to refresh — handles cases where session expired or wasn't cached
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData.session;
      }

      const token = session?.access_token;
      const currentUser = session?.user;

      if (!currentUser || !token) {
        toast.error('You must be signed in to search. Please refresh and sign in again.');
        setIsLoading(false);
        document.body.style.overflow = 'unset';
        return;
      }

      const body: Record<string, any> = {
        listingType: 'sale',
        status: criteria.status || 'Active',
        limit: 500,
        offset: 0,
      };

      // ── Location ──────────────────────────────────────────────────────────
      if (criteria.city) body.city = criteria.city;
      if (criteria.state) body.state = criteria.state;
      if (criteria.zip) body.zipCode = criteria.zip;
      if (criteria.address) body.address = criteria.address;
      if (criteria.latitude) body.latitude = Number(criteria.latitude);
      if (criteria.longitude) body.longitude = Number(criteria.longitude);
      if (criteria.radius) body.radius = Number(criteria.radius);

      // ── Property type — always send, Single Family is intentional default ─
      if (criteria.propertyType && criteria.propertyType !== 'All Types') {
        body.propertyType = criteria.propertyType;
      }

      // ── Property basics ───────────────────────────────────────────────────
      if (criteria.beds) body.bedrooms = criteria.beds;
      if (criteria.baths) body.bathrooms = criteria.baths;

      // ── Price ─────────────────────────────────────────────────────────────
      if (criteria.minPrice) body.minPrice = Number(criteria.minPrice);
      if (criteria.maxPrice) body.maxPrice = Number(criteria.maxPrice);

      // ── Days on market (RentCast: daysOld) ────────────────────────────────
      if (criteria.daysOld && criteria.daysOld !== '') body.daysOld = Number(criteria.daysOld);

      // ── Additional filters (from activeFilters panel) ─────────────────────
      // These map directly to RentCast-supported query params
      const af = criteria; // alias for brevity
      if (activeFilters.includes('squareFootage') && af.squareFootage) body.squareFootage = af.squareFootage;
      if (activeFilters.includes('lotSize') && af.lotSize) body.lotSize = af.lotSize;
      if (activeFilters.includes('yearBuilt') && af.yearBuilt) body.yearBuilt = af.yearBuilt;
      if (activeFilters.includes('latitude') && af.latitude && !body.latitude) body.latitude = Number(af.latitude);
      if (activeFilters.includes('longitude') && af.longitude && !body.longitude) body.longitude = Number(af.longitude);
      if (activeFilters.includes('radius') && af.radius && !body.radius) body.radius = Number(af.radius);
      if (activeFilters.includes('bedrooms') && af.beds && !body.bedrooms) body.bedrooms = af.beds;
      if (activeFilters.includes('bathrooms') && af.baths && !body.bathrooms) body.bathrooms = af.baths;

      console.log('[handleSearch] posting to edge function, body:', JSON.stringify(body));

      let res: Response;
      try {
        res = await fetch(
          'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/search-listings',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );
      } catch (fetchErr: any) {
        console.error('[handleSearch] fetch threw:', fetchErr.message);
        toast.error(`Network error: ${fetchErr.message}`);
        setIsLoading(false);
        document.body.style.overflow = 'unset';
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr: any) {
        console.error('[handleSearch] JSON parse failed, status:', res.status);
        toast.error(`Server error (${res.status}) — could not parse response`);
        setIsLoading(false);
        document.body.style.overflow = 'unset';
        return;
      }

      console.log('[handleSearch] edge function response:', res.status, JSON.stringify(data).slice(0, 300));

      if (!res.ok) {
        if (data?.code === 'TRIAL_EXPIRED' || data?.code === 'SUBSCRIPTION_INACTIVE') {
          toast.error('Your subscription is inactive. Please upgrade to continue.', { autoClose: 6000 });
        } else {
          // Show the REAL error from the edge function
          const msg = data?.error || data?.detail || `Search failed (${res.status})`;
          toast.error(msg, { autoClose: 8000 });
        }
        setIsLoading(false);
        document.body.style.overflow = 'unset';
        return;
      }

      const fetchedResults = (data.listings || []).slice(0, 500);
      const finalResults = fetchedResults.map((l: any, i: number) => ({
        id: l.id || i,
        address: l.addressLine1 || l.formattedAddress || '',
        formattedAddress: l.formattedAddress || '',
        city: l.city || '',
        state: l.state || '',
        zip: l.zipCode || '',
        county: l.county || '',
        stateFips: l.stateFips || '',
        countyFips: l.countyFips || '',
        propertyType: l.propertyType || 'Single Family',
        bedrooms: l.bedrooms || 0,
        bathrooms: l.bathrooms || 0,
        sqft: l.squareFootage || 0,
        lotSize: l.lotSize || 0,
        yearBuilt: l.yearBuilt || 0,
        garage: l.garage ?? null,
        garageSpaces: l.garageSpaces ?? null,
        pool: l.pool ?? null,
        stories: l.stories ?? null,
        status: l.status || 'Active',
        price: l.price || 0,
        daysListed: l.daysOnMarket || 0,
        listedDate: l.listedDate || '',
        removedDate: l.removedDate || '',
        createdDate: l.createdDate || '',
        lastSeenDate: l.lastSeenDate || '',
        listingType: l.listingType || '',
        mlsNumber: l.mlsNumber || '',
        mlsName: l.mlsName || '',
        hoaFee: l.hoa?.fee ?? null,
        agentName: l.listingAgent?.name || '',
        agentPhone: l.listingAgent?.phone || '',
        agentEmail: l.listingAgent?.email || '',
        agentWebsite: l.listingAgent?.website || '',
        officeName: l.listingOffice?.name || '',
        officePhone: l.listingOffice?.phone || '',
        officeEmail: l.listingOffice?.email || '',
        officeWebsite: l.listingOffice?.website || '',
        // Legacy field mappings for backward compatibility
        brokerage: l.listingAgent?.office || l.listingOffice?.name || '',
        history: l.history || null,
        reList: false,
        priceDrop: l.priceReduced || false,
        priceDropAmount: 0,
        priceDropPercent: 0,
        latitude: l.latitude || 0,
        longitude: l.longitude || 0,
        description: l.description || '',
        virtualTourUrl: l.virtualTourUrl || '',
        photos: l.photos || [],
        mlsSource: '',
      }));

      setResults(finalResults);
      setIsCappedAtMax(fetchedResults.length >= 500);
      setHasSearched(true);
      setIsLoading(false);
      setCurrentPage(1);
      // Use the authoritative usage count returned by the edge function
      if (data.usage?.used !== undefined) {
        setListingsSynced(data.usage.used);
      }
      if (data.usage?.limit !== undefined) {
        setListingsCap(data.usage.limit);
      }
      document.body.style.overflow = 'unset';

      const locationParts = [criteria.city, criteria.state].filter(Boolean);
      const location = locationParts.join(', ') || 'Custom search';
      const criteriaDescription = [
        criteria.propertyType ? `Type: ${criteria.propertyType}` : '',
        criteria.minPrice || criteria.maxPrice
          ? `Price: ${criteria.minPrice ? '$' + criteria.minPrice : ''}${criteria.minPrice && criteria.maxPrice ? '-' : ''}${criteria.maxPrice ? '$' + criteria.maxPrice : ''}`
          : '',
        criteria.beds ? `Beds: ${criteria.beds}` : '',
        criteria.baths ? `Baths: ${criteria.baths}` : '',
      ].filter(Boolean).join(', ') || 'All criteria';

      const historyEntry = {
        id: crypto.randomUUID(), // must be valid UUID to match search_runs.id (uuid type)
        criteria: { ...criteria },
        activeFilters: [...(activeFilters || [])],
        location,
        criteriaDescription,
        resultsCount: finalResults.length,
        searchDate: new Date().toISOString(),
        listings: finalResults,
      };
      // Save run to Supabase — results stored permanently, accessible across devices
      try {
        const { data: { user: runUser } } = await supabase.auth.getUser();
        if (runUser) {
          const { error: insertError } = await supabase.from('search_runs').insert({
            id: historyEntry.id,
            user_id: runUser.id,
            location: historyEntry.location,
            criteria_description: historyEntry.criteriaDescription,
            criteria_json: historyEntry.criteria,
            results_json: finalResults,
            results_count: finalResults.length,
            searched_at: historyEntry.searchDate,
          });
          if (insertError) {
            console.error('[search_runs insert failed]', insertError.code, insertError.message, insertError.details);
          } else {
            console.log('[search_runs] saved', historyEntry.id, 'with', finalResults.length, 'listings');
          }
        }
      } catch (e: any) {
        console.error('[search_runs exception]', e.message || e);
      }
      setSearchHistory(prev => [historyEntry, ...prev.slice(0, 49)]);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error('[handleSearch] unhandled exception:', err.message, err.stack);
      toast.error(`Search error: ${err.message || 'Unknown error'}`, { autoClose: 8000 });
      setIsLoading(false);
      document.body.style.overflow = 'unset';
    }
  };

  const handleDownloadCSV = () => {
    if (!results || results.length === 0) { toast.error('No results to export'); return; }

    const q = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const exportDate = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const location = [criteria.city, criteria.state].filter(Boolean).join(', ') || 'Custom Search';
    const priceRange = criteria.minPrice && criteria.maxPrice
      ? `$${Number(criteria.minPrice).toLocaleString()} – $${Number(criteria.maxPrice).toLocaleString()}`
      : criteria.minPrice ? `$${Number(criteria.minPrice).toLocaleString()}+`
      : criteria.maxPrice ? `Up to $${Number(criteria.maxPrice).toLocaleString()}`
      : 'Any';

    const lines: string[] = [];

    // Company header
    lines.push(q('LISTINGBUG') + ',,,,,,,,,,,,,,,,');
    lines.push(q('Real Estate Data Intelligence') + ',,,,,,,,,,,,,,,,');
    lines.push(q('thelistingbug.com') + ',,,,,,,,,,,,,,,,');
    lines.push('');
    lines.push(`${q('Report Generated:')},${q(exportDate)}`);
    lines.push('');

    // Search parameters
    lines.push(q('── SEARCH PARAMETERS ────────────────────────────────────────────'));
    lines.push(`${q('Location:')},${q(location)}`);
    lines.push(`${q('Property Type:')},${q(criteria.propertyType || 'All')}`);
    lines.push(`${q('Listing Status:')},${q(criteria.status || 'Active')}`);
    lines.push(`${q('Price Range:')},${q(priceRange)}`);
    if (criteria.beds) lines.push(`${q('Min Bedrooms:')},${q(criteria.beds)}`);
    if (criteria.baths) lines.push(`${q('Min Bathrooms:')},${q(criteria.baths)}`);
    if (criteria.daysOld) lines.push(`${q('Listed Within (days):')},${q(criteria.daysOld)}`);
    lines.push('');

    // Results summary
    lines.push(q('── RESULTS SUMMARY ──────────────────────────────────────────────'));
    lines.push(`${q('Total Listings:')},${q(results.length)}`);
    const noPhone = results.filter((r: any) => !r.agentPhone).length;
    const noEmail = results.filter((r: any) => !r.agentEmail).length;
    lines.push(`${q('No Agent Phone:')},${q(noPhone)}`);
    lines.push(`${q('No Agent Email:')},${q(noEmail)}`);
    lines.push('');

    // Sort: price descending; records missing both phone AND email sink to bottom
    const sorted = [...results].sort((a: any, b: any) => {
      const aContact = !!(a.agentPhone || a.agentEmail);
      const bContact = !!(b.agentPhone || b.agentEmail);
      if (aContact !== bContact) return aContact ? -1 : 1;
      return (b.price || 0) - (a.price || 0);
    });

    // Column headers
    lines.push(q('── LISTINGS ─────────────────────────────────────────────────────'));
    lines.push([
      'MLS #', 'Status', 'Listed Date', 'Days on Market', 'Price Drop',
      'Full Address', 'Street Address', 'City', 'State', 'ZIP', 'County',
      'Property Type', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Lot Size (sq ft)', 'Year Built', 'HOA Fee/mo',
      'List Price', 'Price per Sq Ft',
      'Agent Name', 'Agent Phone', 'Agent Email',
      'Brokerage', 'Brokerage Phone', 'Brokerage Email',
      'Latitude', 'Longitude',
    ].map(q).join(','));

    // Data rows
    sorted.forEach((r: any) => {
      const pricePsf = r.price && r.sqft ? Math.round(r.price / r.sqft) : '';
      const listedDate = r.listedDate ? new Date(r.listedDate).toLocaleDateString('en-US') : '';
      lines.push([
        q(r.mlsNumber || ''), q(r.status || 'Active'), q(listedDate), q(r.daysListed || 0), q(r.priceDrop ? 'Yes' : 'No'),
        q(r.formattedAddress || `${r.address}, ${r.city}, ${r.state} ${r.zip}`),
        q(r.address || ''), q(r.city || ''), q(r.state || ''), q(r.zip || ''), q(r.county || ''),
        q(r.propertyType || ''), q(r.bedrooms || ''), q(r.bathrooms || ''),
        q(r.sqft || ''), q(r.lotSize || ''), q(r.yearBuilt || ''),
        q(r.hoaFee != null ? `$${r.hoaFee}` : ''),
        q(r.price ? `$${r.price.toLocaleString()}` : ''),
        q(pricePsf ? `$${pricePsf}` : ''),
        q(r.agentName || ''), q(r.agentPhone || ''), q(r.agentEmail || ''),
        q(r.brokerage || r.officeName || ''), q(r.officePhone || ''), q(r.officeEmail || ''),
        q(r.latitude || ''), q(r.longitude || ''),
      ].join(','));
    });

    lines.push('');
    lines.push(q('── END OF REPORT ────────────────────────────────────────────────'));
    lines.push(`${q('Powered by ListingBug × RentCast')},${q('')},${q('Data sourced from RentCast MLS feed')}`);

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ListingBug-${location.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${results.length} listings`);

    // Track CSV export
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('automation_runs').insert({
            user_id: user.id,
            automation_name: 'CSV Export',
            run_date: new Date().toISOString(),
            status: 'success',
            listings_sent: results.length,
            destination: 'csv',
          }).catch(() => {});
        }
      });
    } catch {}
  };

  const handleViewPrintCSV = () => {
    // Open print-friendly view in new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to view report');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Listing Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #342E37; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #FFD447; color: #342E37; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Listing Report - ${new Date().toLocaleDateString()}</h1>
          <p>Total Results: ${results.length}</p>
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Zip</th>
                <th>Price</th>
                <th>Beds</th>
                <th>Baths</th>
                <th>Days Listed</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(r => `
                <tr>
                  <td>${r.address}</td>
                  <td>${r.city}</td>
                  <td>${r.state}</td>
                  <td>${r.zipCode}</td>
                  <td>$${r.price.toLocaleString()}</td>
                  <td>${r.beds}</td>
                  <td>${r.baths}</td>
                  <td>${r.daysListed}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #FFD447; border: none; cursor: pointer; font-size: 16px;">Print Report</button>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    toast.success('Report opened for viewing/printing');
  };

  const handleSaveSearch = () => {
    setShowSaveSearchModal(true);
  };

  const handleConfirmSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a search name');
      return;
    }

    const locationParts = [criteria.city, criteria.state].filter(Boolean);
    const location = locationParts.join(', ') || 'Custom Search';
    
    const criteriaDescription = [
      criteria.propertyType ? `Type: ${criteria.propertyType}` : '',
      criteria.minPrice || criteria.maxPrice 
        ? `Price: ${criteria.minPrice ? '$' + criteria.minPrice : ''}${criteria.minPrice && criteria.maxPrice ? '-' : ''}${criteria.maxPrice ? '$' + criteria.maxPrice : ''}` 
        : '',
      criteria.beds ? `Beds: ${criteria.beds}` : '',
      criteria.baths ? `Baths: ${criteria.baths}` : '',
    ].filter(Boolean).join(', ') || 'Various criteria';

    const newSearch = {
      id: crypto.randomUUID(),
      name: saveSearchName,
      criteria: { ...criteria },
      activeFilters: [...(activeFilters || [])],
      location,
      criteriaDescription,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    setSavedSearches(prev => [newSearch, ...prev]);
    setShowSaveSearchModal(false);
    setSaveSearchName('');
    toast.success(`Search "${saveSearchName}" saved successfully!`);

    // Sync to Supabase for cross-device access
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('searches').upsert({
        id: newSearch.id,
        user_id: user.id,
        name: newSearch.name,
        location: newSearch.location,
        filters_json: { criteria: newSearch.criteria, activeFilters: newSearch.activeFilters, criteriaDescription: newSearch.criteriaDescription },
        created_at: newSearch.createdAt,
        last_run_at: newSearch.lastUsed,
        status: 'active',
      }, { onConflict: 'id' });

      await createNotification({
        userId: user.id,
        type: 'success',
        title: 'Search Saved',
        message: `your search "${saveSearchName}" for ${location} with ${results.length} listings`,
      });
    }
    
    // Complete walkthrough step 2 if active (Save Search step)
    if (isStepActive(2)) {
      completeStep(2);
      
      // Navigate to automations page for next step
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('automations');
        }
      }, 1000);
    }
  };

  const handleLoadSavedSearch = (search: any) => {
    setCriteria(search.criteria);
    setActiveFilters(search.activeFilters || []);
    setActiveTab('search');
    toast.success(`Loaded search "${search.name}"`);
    
    // Update last used
    setSavedSearches(prev => prev.map(s => 
      s.id === search.id ? { ...s, lastUsed: new Date().toISOString() } : s
    ));
  };

  const handleDeleteSavedSearch = async (id: string) => {
    const search = savedSearches.find(s => s.id === id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    toast.success(`Deleted search "${search?.name}"`);
    // Sync deletion to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('searches').delete().eq('id', id).eq('user_id', user.id);
    }
  };

  const handleCreateAutomation = (search?: any) => {
    // If no saved search provided, we're automating current search
    // We need criteria to be set for the modal to work properly
    if (!search && !criteria.city && !criteria.state && !criteria.address) {
      toast.error('Please enter search criteria before creating an automation');
      return;
    }
    setSelectedSavedSearch(search || null);
    setShowAutomationModal(true);
  };

  // Function to automate current search - requires saved search first
  const handleAutomateCurrentSearch = () => {
    // Check if user has entered any search criteria
    if (!criteria.city && !criteria.state && !criteria.address && !criteria.zip) {
      toast.error('Please enter search criteria before creating an automation');
      return;
    }
    
    // Check if search has been saved
    const existingSavedSearch = savedSearches.find(s => 
      JSON.stringify(s.criteria) === JSON.stringify(criteria)
    );

    if (!existingSavedSearch) {
      // Search not saved - prompt user to save first
      toast.error('Please save this search before creating an automation', {
        description: 'Run your search and click Save to save your criteria first.',
        duration: 4000,
      });
      return;
    }

    // Search is saved - navigate to automations page with pre-filled data
    if (onNavigate) {
      sessionStorage.setItem('listingbug_prefill_automation', JSON.stringify({
        searchId: existingSavedSearch.id,
        searchName: existingSavedSearch.name,
      }));
      
      toast.success('Redirecting to create automation...', {
        duration: 2000,
      });
      
      onNavigate('automations');
    }
  };

  // Function to automate from results - requires saved search first
  const handleAutomateFromResults = () => {
    // Check if search has been saved already
    const existingSavedSearch = savedSearches.find(s => 
      JSON.stringify(s.criteria) === JSON.stringify(criteria)
    );

    if (!existingSavedSearch) {
      // Search not saved - prompt user to save first
      toast.error('Please save this search before creating an automation', {
        description: 'Click the Save button above to save your search criteria first.',
        duration: 4000,
      });
      return;
    }

    // Search is saved - navigate to automations page with pre-filled data
    if (onNavigate) {
      sessionStorage.setItem('listingbug_prefill_automation', JSON.stringify({
        searchId: existingSavedSearch.id,
        searchName: existingSavedSearch.name,
      }));
      
      toast.success('Redirecting to create automation...', {
        duration: 2000,
      });
      
      onNavigate('automations');
    }
  };

  const handleAutomationCreated = (automation: any) => {
    // Save to localStorage so it appears in AutomationsManagementPage
    const stored = localStorage.getItem('listingbug_automations');
    let automations = [];
    if (stored) {
      try {
        automations = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored automations:', e);
      }
    }
    
    const newAutomation = {
      id: automation.id,
      name: automation.name,
      searchName: automation.searchName,
      schedule: automation.schedule + (automation.scheduleTime ? ` at ${automation.scheduleTime}` : ''),
      destination: {
        type: automation.destination.type,
        label: automation.destination.label,
        config: automation.destination.config
      },
      // Store the search criteria so the automation knows what to run
      searchCriteria: automation.searchCriteria,
      activeFilters: automation.activeFilters,
      active: true,
      nextRun: automation.schedule.includes('Real-time') ? 'When new matches appear' : 'Pending first run'
    };
    
    automations.unshift(newAutomation);
    localStorage.setItem('listingbug_automations', JSON.stringify(automations));
  };

  const handleSaveListing = async (listing: any) => {
    const isAlreadySaved = savedListings.some(l => l.id === listing.id);
    const { data: { user } } = await supabase.auth.getUser();

    if (isAlreadySaved) {
      setSavedListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success('Listing removed from saved');
      // Remove from Supabase
      if (user) {
        await supabase.from('saved_listings').delete()
          .eq('user_id', user.id)
          .eq('listing_id', String(listing.id));
      }
    } else {
      const savedListing = { ...listing, savedAt: new Date().toISOString() };
      setSavedListings(prev => [savedListing, ...prev]);
      toast.success('Listing saved successfully!');
      // Sync to Supabase
      if (user) {
        await supabase.from('saved_listings').upsert({
          user_id: user.id,
          listing_id: String(listing.id),
          listing_data_json: savedListing,
          saved_at: savedListing.savedAt,
        }, { onConflict: 'user_id,listing_id' });
      }
    }
  };

  const isListingSaved = (listingId: any) => {
    return savedListings.some(l => l.id === listingId);
  };

  const handleAddToMyReports = () => {
    handleSaveSearch();
  };

  const updateCriteria = (field: string, value: string | boolean) => {
    setCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const addFilter = (filterKey: FilterKey) => {
    if (!(activeFilters || []).includes(filterKey)) {
      setActiveFilters([...(activeFilters || []), filterKey]);
      setCriteria((prev) => ({ ...prev, [filterKey]: '' }));
    }
  };

  const removeFilter = (filterKey: FilterKey) => {
    setActiveFilters((activeFilters || []).filter((f) => f !== filterKey));
    const newCriteria = { ...criteria };
    delete newCriteria[filterKey];
    setCriteria(newCriteria);
  };

  const unusedFilters = availableFilters.filter(
    (filter) => !(activeFilters || []).includes(filter.key)
  );

  // Sorting handler
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sorted and paginated data
  const getSortedData = (data: any[]) => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle undefined/null values
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Get paginated data
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(results.length / resultsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Handle results per page change
  const handleResultsPerPageChange = (perPage: number) => {
    setResultsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing results per page
  };

  // Sort icon component
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
      {/* Header - Compact */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Search className="w-5 h-5 md:w-6 md:h-6 text-[#FFCE0A]" />
          <h1 className="mb-0 text-2xl md:text-4xl font-bold text-[33px]">Listings</h1>
        </div>
        <p className="text-gray-600 text-[13px] md:text-sm">
          Search, save, and manage property listings with custom criteria
        </p>
      </div>

      {/* Tabs - Responsive with horizontal scroll on mobile */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-2 md:gap-0 overflow-x-auto scrollbar-hide -mb-px">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-2 md:px-4 border-b-2 transition-colors text-[14px] whitespace-nowrap flex-1 text-center ${
              activeTab === 'search'
                ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-2 md:px-4 border-b-2 transition-colors text-[14px] whitespace-nowrap flex-1 text-center ${
              activeTab === 'saved'
                ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Saved Searches
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-3 px-2 md:px-4 border-b-2 transition-colors text-[14px] whitespace-nowrap flex-1 text-center ${
              activeTab === 'listings'
                ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Saved Listings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-2 md:px-4 border-b-2 transition-colors text-[14px] whitespace-nowrap flex-1 text-center ${
              activeTab === 'history'
                ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'search' ? (
        <>
      {/* Search Form - Borderless, cleaner design */}
      <div className="mb-4">
        <div className="space-y-3">
          {/* Primary Filters - Always Visible */}
          <div className="space-y-3">
            {/* Location Section */}
            <div data-walkthrough="location-section">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-[24px] font-bold">Location</h3>
              </div>

              {/* City + State — single autocomplete, state auto-fills from selection */}
              <div className="mb-2">
                <CityAutocomplete
                  value={criteria.city}
                  stateValue={criteria.state}
                  onSelect={(city, state) => {
                    updateCriteria('city', city);
                    updateCriteria('state', state);
                  }}
                  onBlur={() => setLocationFieldBlurred(true)}
                  error={fieldErrors.state}
                />
              </div>
            </div>

            {/* Property Details, Price Range & Listing Details - 3-column grid on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4" data-walkthrough="search-criteria">
              {/* Property Details Section */}
              <div data-walkthrough="property-details">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-primary" />
                  <h3 className="text-[24px] font-bold">Property Details</h3>
                </div>
                <div className="space-y-1.5">
                  {/* Property Type and Listing Status side-by-side on desktop and mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    <LBSelect className="mx-[0px] mt-[0px] mb-[12px]"
                      label="Property Type"
                      value={criteria.propertyType}
                      onChange={(value) => updateCriteria('propertyType', value)}
                      options={[
                        { value: '', label: 'All Types' },
                        { value: 'Single Family', label: 'Single Family' },
                        { value: 'Condo', label: 'Condo' },
                        { value: 'Townhouse', label: 'Townhouse' },
                        { value: 'Multi-Family', label: 'Multi-Family' },
                        { value: 'Land', label: 'Land' },
                        { value: 'Commercial', label: 'Commercial' },
                      ]}
                    />
                    <LBSelect
                      label="Listing Status"
                      value={criteria.status}
                      onChange={(value) => updateCriteria('status', value)}
                      options={[
                        { value: '', label: 'All Statuses' },
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                      ]}
                    />
                  </div>

                </div>
              </div>

              {/* Price Range Section */}
              <div data-walkthrough="price-range">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h3 className="text-[24px] font-bold">Price Range</h3>
                </div>
                <div className="space-y-1.5">
                  {/* Min and Max Price side-by-side on desktop and mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                      label="Min Price"
                      value={criteria.minPrice}
                      onChange={(e) => updateCriteria('minPrice', e.target.value)}
                      placeholder="500000"
                    />
                    <LBInput
                      label="Max Price"
                      value={criteria.maxPrice}
                      onChange={(e) => updateCriteria('maxPrice', e.target.value)}
                      placeholder="1000000"
                    />
                  </div>
                </div>
              </div>

              {/* Listing Details Section */}
              <div data-walkthrough="listing-details">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-[24px] font-bold">Listing Details</h3>
                </div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                      label="Year Built"
                      value={criteria.yearBuilt}
                      onChange={(e) => updateCriteria('yearBuilt', e.target.value)}
                      placeholder="2000-2020"
                    />
                    <LBInput
                      label="Days Listed"
                      value={criteria.daysOld}
                      onChange={(e) => updateCriteria('daysOld', e.target.value)}
                      placeholder="30 or 10-30"
                    />
                  </div>
                  
                  {/* Boolean Toggles */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
                    <LBToggle
                      checked={criteria.reListedProperty}
                      onCheckedChange={(checked) => updateCriteria('reListedProperty', checked)}
                      label="Re-Listed"
                      size="sm"
                    />
                    <LBToggle
                      checked={criteria.priceDrop}
                      onCheckedChange={(checked) => updateCriteria('priceDrop', checked)}
                      label="Price Drop"
                      size="sm"
                    />
                    <LBToggle
                      checked={criteria.newConstruction}
                      onCheckedChange={(checked) => updateCriteria('newConstruction', checked)}
                      label="New Construction"
                      size="sm"
                    />
                    <LBToggle
                      checked={criteria.foreclosure}
                      onCheckedChange={(checked) => updateCriteria('foreclosure', checked)}
                      label="Foreclosure"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            {(activeFilters || []).length > 0 && (
              <div className="border-t pt-3">
                <h3 className="mb-2 text-[15px] font-bold">Additional Filters</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(activeFilters || []).map((filterKey) => {
                    const filter = availableFilters.find((f) => f.key === filterKey);
                    if (!filter) return null;
                    return (
                      <div key={filterKey} className="relative">
                        <LBInput
                          label={filter.label}
                          type={filter.type}
                          value={criteria[filterKey] || ''}
                          onChange={(e) => updateCriteria(filterKey, e.target.value)}
                          placeholder={filter.placeholder}
                        />
                        <button
                          onClick={() => removeFilter(filterKey)}
                          className="absolute right-1 top-0 p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Remove filter"
                        >
                          <X className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Tip */}
            <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-gray-700 dark:text-gray-300">
                <span className="text-gray-900 dark:text-white font-medium">Search Tip:</span> Wide search radius + long date ranges may increase listing usage. Monitor your usage meter to avoid overages.
              </p>
            </div>

            {/* Add Filter Button */}
            <div className="pt-3">
              <div className="flex items-center justify-center">
                {unusedFilters.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <LBButton variant="ghost" size="sm" className="border-0 hover:bg-transparent">
                        <Plus className="w-4 h-4" />
                        <span>Add Filter</span>
                      </LBButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
                      {unusedFilters.map((filter) => (
                        <DropdownMenuItem
                          key={filter.key}
                          onClick={() => addFilter(filter.key)}
                          className="cursor-pointer"
                        >
                          {filter.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Actions - Search & Automate Buttons */}
            <div className="pt-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-wrap items-center gap-2 justify-center w-full">
                  <LBButton 
                    onClick={handleSearch} 
                    variant="primary" 
                    size="sm" 
                    className="flex-1 md:flex-initial min-w-[140px]"
                    data-walkthrough="search-button"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </LBButton>
                  {results.length > 0 && (
                    <span className="text-xs text-gray-600 hidden md:inline">
                      Showing {((currentPage-1)*resultsPerPage)+1}–{Math.min(currentPage*resultsPerPage, results.length)} of {results.length} listings
                    </span>
                  )}
                </div>
                {/* Listings synced footnote */}
                <p className="text-[11px] text-gray-500 text-center">
                  {listingsSynced.toLocaleString()} / {listingsCap.toLocaleString()} listings. {resetLabel}
                </p>
                <div className="pb-[50px]" />
                {isCappedAtMax && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 text-center mt-1">
                    Showing up to 500 listings
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <LBCard elevation="sm" className="border-0" ref={resultsRef} data-walkthrough="results-section">
          <LBCardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <LBCardTitle className="text-base md:text-lg">
                Showing {((currentPage-1)*resultsPerPage)+1}–{Math.min(currentPage*resultsPerPage, results.length)} of {results.length} listings
              </LBCardTitle>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <LBButton 
                  onClick={handleSaveSearch} 
                  variant="ghost" 
                  size="sm" 
                  className="whitespace-nowrap flex-1 sm:flex-none min-w-0"
                  data-walkthrough="save-search"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">Save Search</span>
                  <span className="inline xs:hidden sm:hidden">Save</span>
                </LBButton>
                <LBButton 
                  onClick={handleAutomateFromResults} 
                  variant="ghost" 
                  size="sm" 
                  className="whitespace-nowrap flex-1 sm:flex-none min-w-0"
                  data-walkthrough="create-automation-button"
                >
                  <Zap className="w-4 h-4" />
                  <span>Automate</span>
                </LBButton>
                <ExportDropdown 
                  onExportCSV={handleDownloadCSV}
                  onSendToIntegration={(integration) => {
                    toast.success(`Sending ${results.length} listings to ${integration}...`);
                  }}
                  className="flex-1 sm:flex-none min-w-0"
                />
              </div>
            </div>
          </LBCardHeader>
          <LBCardContent className="pt-0">
            <div className="overflow-x-auto -mx-6 md:mx-0">
              <LBTable>
                <LBTableHeader>
                  <SearchResultsTableHeader
                    columns={searchResultsColumns}
                    onSort={handleSort}
                    SortIcon={SortIcon}
                    onColumnsChange={setSearchResultsColumns}
                  />
                </LBTableHeader>
                <LBTableBody>
                  {getPaginatedData(getSortedData(results)).map((result) => (
                    <SearchResultsTableRow
                      key={result.id}
                      result={result}
                      columns={searchResultsColumns}
                      onSelect={setSelectedListing}
                      onSave={handleSaveListing}
                      isSaved={isListingSaved}
                    />
                  ))}
                </LBTableBody>
              </LBTable>
            </div>
            
            {/* Results per page selector - Below table */}
            <div className="flex flex-col gap-3 mt-4 pt-3 border-t">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-600">Rows per page:</span>
                <select
                  value={resultsPerPage}
                  onChange={(e) => handleResultsPerPageChange(Number(e.target.value))}
                  className="h-8 px-2 pr-8 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd447] focus:border-[#ffd447]"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <LBButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                  >
                    Previous
                  </LBButton>
                  
                  <div className="flex items-center gap-1">
                    {/* Show first page */}
                    {currentPage > 3 && (
                      <>
                        <LBButton
                          onClick={() => handlePageChange(1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          1
                        </LBButton>
                        {currentPage > 4 && <span className="text-gray-400 px-1">...</span>}
                      </>
                    )}
                    
                    {/* Show pages around current page */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === currentPage || 
                               page === currentPage - 1 || 
                               page === currentPage - 2 ||
                               page === currentPage + 1 || 
                               page === currentPage + 2;
                      })
                      .map(page => (
                        <LBButton
                          key={page}
                          onClick={() => handlePageChange(page)}
                          variant={currentPage === page ? "primary" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </LBButton>
                      ))}
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-gray-400 px-1">...</span>}
                        <LBButton
                          onClick={() => handlePageChange(totalPages)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {totalPages}
                        </LBButton>
                      </>
                    )}
                  </div>
                  
                  <LBButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                  >
                    Next
                  </LBButton>
                  
                  <span className="text-xs text-gray-600 ml-2">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </div>
          </LBCardContent>
        </LBCard>
      )}

      {!isLoading && searchPerformed && results.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-white/20 rounded-lg mt-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">No listings found for that location.</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Try a nearby city or different ZIP code.</p>
        </div>
      )}

        </>
      ) : activeTab === 'saved' ? (
        /* Saved Searches Tab */
        <div className="space-y-4 pb-[100px]">
          {savedSearches.length === 0 ? (
            <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
              <CardContent className="text-center py-12">
                <Save className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">No saved searches yet</p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">
                  Save your search criteria to quickly access them later or create automations
                </p>
                <LBButton onClick={() => setActiveTab('search')} size="sm">
                  Go to Search
                </LBButton>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[24px]">Your Saved Searches ({savedSearches.length})</h3>
              </div>
              <div className="grid gap-4">
                {savedSearches.map((search) => (
                  <Card key={search.id} className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10 hover:shadow-sm transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-[16px] mb-1">{search.name}</h4>
                          <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-1">{search.location}</p>
                          <p className="text-[13px] text-gray-500 dark:text-gray-500">{search.criteriaDescription}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
                        <div className="text-[12px] text-gray-500 dark:text-gray-400">
                          Created: {new Date(search.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <LBButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSavedSearch(search)}
                          >
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            Load
                          </LBButton>
                          <LBButton
                            variant="primary"
                            size="sm"
                            onClick={() => handleCreateAutomation(search)}
                          >
                            <Zap className="w-3.5 h-3.5 mr-1.5" />
                            Automate
                          </LBButton>
                          <LBButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSavedSearch(search.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </LBButton>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'listings' ? (
        /* Saved Listings Tab */
        <div className="space-y-4 pb-[100px]">
          {savedListings.length === 0 ? (
            <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
              <CardContent className="text-center py-12">
                <Save className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">No saved listings yet</p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">
                  Save listings from search results to review them later
                </p>
                <LBButton onClick={() => setActiveTab('search')} size="sm">
                  Go to Search
                </LBButton>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-bold text-[24px]">Saved Listings ({savedListings.length})</CardTitle>
                    <LBButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove all ${savedListings.length} saved listings?`)) {
                          setSavedListings([]);
                          toast.success('All saved listings cleared');
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Clear All
                    </LBButton>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Saved Listings Table */}
                  <LBTable>
                    <LBTableHeader>
                      <LBTableRow>
                        <LBTableHead>Address</LBTableHead>
                        <LBTableHead>City</LBTableHead>
                        <LBTableHead>Price</LBTableHead>
                        <LBTableHead>Beds/Baths</LBTableHead>
                        <LBTableHead>Sq Ft</LBTableHead>
                        <LBTableHead>Status</LBTableHead>
                        <LBTableHead>Saved Date</LBTableHead>
                        <LBTableHead className="text-right">Actions</LBTableHead>
                      </LBTableRow>
                    </LBTableHeader>
                    <LBTableBody>
                      {savedListings.map((listing) => (
                        <LBTableRow 
                          key={listing.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                          onClick={() => setSelectedListing(listing)}
                        >
                          <LBTableCell className="font-medium">{listing.address}</LBTableCell>
                          <LBTableCell>{listing.city}</LBTableCell>
                          <LBTableCell className="font-medium">${listing.price.toLocaleString()}</LBTableCell>
                          <LBTableCell>{listing.bedrooms} / {listing.bathrooms}</LBTableCell>
                          <LBTableCell>{listing.sqft.toLocaleString()} sf</LBTableCell>
                          <LBTableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                listing.status === 'Active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
                                  : listing.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'
                              }`}
                            >
                              {listing.status}
                            </span>
                          </LBTableCell>
                          <LBTableCell className="text-[13px] text-gray-600 dark:text-gray-400">
                            {new Date(listing.savedAt).toLocaleDateString()}
                          </LBTableCell>
                          <LBTableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <LBButton
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedListing(listing);
                                }}
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </LBButton>
                              <LBButton
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveListing(listing);
                                }}
                                title="Remove from saved"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </LBButton>
                        </div>
                      </LBTableCell>
                    </LBTableRow>
                  ))}
                    </LBTableBody>
                  </LBTable>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4 pb-[100px]">
          {searchHistory.length === 0 ? (
            <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">No search history yet</p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">
                  Run your first search to see your history here. Results are saved so you can view them again without re-querying.
                </p>
                <LBButton onClick={() => setActiveTab('search')} size="sm">
                  Go to Search
                </LBButton>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search History Section */}
              {searchHistory.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[24px]">Recent Searches ({searchHistory.length})</h3>
                    <LBButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchHistory([]);
                        toast.success('Search history cleared');
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Clear Searches
                    </LBButton>
                  </div>
                  <div className="grid gap-4 pb-[100px]">
                    {searchHistory.map((search) => (
                      <Card
                        key={search.id}
                        className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => {
                          if (onViewSearchResults) onViewSearchResults(search);
                        }}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-bold text-[16px] mb-1">{search.location}</p>
                              <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-1">{search.criteriaDescription}</p>
                              <p className="text-[13px] text-green-600 dark:text-green-400">
                                {search.resultsCount} {search.resultsCount === 1 ? 'result' : 'results'} found
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
                            <div className="text-[12px] text-gray-500 dark:text-gray-400">
                              {new Date(search.searchDate).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <LBButton
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onViewSearchResults) onViewSearchResults(search);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                View Results
                              </LBButton>
                              <LBButton
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCriteria(search.criteria);
                                  setActiveFilters(search.activeFilters || []);
                                  setActiveTab('search');
                                  toast.success('Search criteria loaded');
                                }}
                              >
                                <Play className="w-3.5 h-3.5 mr-1.5" />
                                Re-run
                              </LBButton>
                              <LBButton
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchHistory(prev => prev.filter(s => s.id !== search.id));
                                  toast.success('Removed from history');
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </LBButton>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {/* Modals and Dialogs below - keeping reports section structure but moved into history tab above */}
      {false && activeTab === 'reports' ? (
        /* This section has been merged into History tab */
        <div className="space-y-4">
          {reportHistory.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No report history yet</p>
              <p className="text-[13px] text-gray-500 mb-4">
                Run property valuations and history reports to see them here
              </p>
              <LBButton onClick={() => setActiveTab('search')} size="sm">
                Go to Search
              </LBButton>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[18px]">Report History ({reportHistory.length})</h3>
                <LBButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all report history?')) {
                      setReportHistory([]);
                      toast.success('Report history cleared');
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Clear All
                </LBButton>
              </div>
              <div className="grid gap-4">
                {reportHistory
                  .slice((reportPage - 1) * reportsPerPage, reportPage * reportsPerPage)
                  .map((report) => {
                    const reportTypeConfig = {
                      'valuation': {
                        icon: TrendingUp,
                        color: 'blue',
                        label: 'Property Valuation'
                      },
                      'property-history': {
                        icon: History,
                        color: 'purple',
                        label: 'Property History'
                      },
                      'market-analysis': {
                        icon: BarChart3,
                        color: 'green',
                        label: 'Market Analysis'
                      },
                      'rental-analysis': {
                        icon: DollarSign,
                        color: 'amber',
                        label: 'Rental Income Analysis'
                      }
                    };

                    const config = reportTypeConfig[report.type as keyof typeof reportTypeConfig] || reportTypeConfig['valuation'];
                    const Icon = config.icon;

                    return (
                      <div
                        key={report.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              config.color === 'blue' ? 'bg-blue-50' :
                              config.color === 'purple' ? 'bg-purple-50' :
                              config.color === 'green' ? 'bg-green-50' :
                              'bg-amber-50'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                config.color === 'blue' ? 'text-blue-600' :
                                config.color === 'purple' ? 'text-purple-600' :
                                config.color === 'green' ? 'text-green-600' :
                                'text-amber-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-[#342E37]">{config.label}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  report.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : report.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {report.status === 'completed' ? 'Completed' : report.status === 'processing' ? 'Processing' : 'Failed'}
                                </span>
                              </div>
                              <p className="text-sm text-[#342E37] font-medium">{report.property.address}</p>
                              <p className="text-[13px] text-gray-600">{report.property.city}, {report.property.state} {report.property.zip}</p>
                              
                              {/* Report Results Summary */}
                              {report.status === 'completed' && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  {report.type === 'valuation' && (
                                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                                      <div>
                                        <span className="text-gray-600">Estimated Value:</span>
                                        <span className="ml-1 font-bold text-[#342E37]">${report.result.estimatedValue.toLocaleString()}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Range:</span>
                                        <span className="ml-1 text-gray-700">${report.result.confidenceRange[0].toLocaleString()} - ${report.result.confidenceRange[1].toLocaleString()}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Price/sqft:</span>
                                        <span className="ml-1 text-gray-700">${report.result.pricePerSqft}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Trend:</span>
                                        <span className="ml-1 text-green-600 font-medium">{report.result.marketTrend}</span>
                                      </div>
                                    </div>
                                  )}
                                  {report.type === 'property-history' && (
                                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                                      <div>
                                        <span className="text-gray-600">Sales History:</span>
                                        <span className="ml-1 font-bold text-[#342E37]">{report.result.salesHistory} sales</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Last Sale:</span>
                                        <span className="ml-1 text-gray-700">${report.result.lastSalePrice.toLocaleString()}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Sale Date:</span>
                                        <span className="ml-1 text-gray-700">{new Date(report.result.lastSaleDate).toLocaleDateString()}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Appreciation:</span>
                                        <span className="ml-1 text-green-600 font-medium">+{report.result.priceAppreciation}%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Generated {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <LBButton
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setSelectedReportType(report.type);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            View Report
                          </LBButton>
                          <LBButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast.success('PDF download started');
                            }}
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            PDF
                          </LBButton>
                          {/* Mobile Share Button */}
                          <LBButton
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (navigator.share) {
                                try {
                                  await navigator.share({
                                    title: `${config.label} - ${report.property.address}`,
                                    text: `Check out this ${config.label.toLowerCase()} for ${report.property.address}`,
                                    url: window.location.href
                                  });
                                  toast.success('Shared successfully');
                                } catch (err) {
                                  if ((err as Error).name !== 'AbortError') {
                                    toast.error('Failed to share');
                                  }
                                }
                              } else {
                                // Fallback: Copy link to clipboard
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied to clipboard');
                              }
                            }}
                            className="md:hidden"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </LBButton>
                          <LBButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this report?')) {
                                setReportHistory(prev => prev.filter(r => r.id !== report.id));
                                toast.success('Report deleted');
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </LBButton>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Pagination */}
              {reportHistory.length > reportsPerPage && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {((reportPage - 1) * reportsPerPage) + 1} - {Math.min(reportPage * reportsPerPage, reportHistory.length)} of {reportHistory.length} reports
                  </p>
                  <div className="flex items-center gap-2">
                    <LBButton
                      variant="outline"
                      size="sm"
                      onClick={() => setReportPage(p => Math.max(1, p - 1))}
                      disabled={reportPage === 1}
                    >
                      Previous
                    </LBButton>
                    <span className="text-sm text-gray-600">
                      Page {reportPage} of {Math.ceil(reportHistory.length / reportsPerPage)}
                    </span>
                    <LBButton
                      variant="outline"
                      size="sm"
                      onClick={() => setReportPage(p => Math.min(Math.ceil(reportHistory.length / reportsPerPage), p + 1))}
                      disabled={reportPage >= Math.ceil(reportHistory.length / reportsPerPage)}
                    >
                      Next
                    </LBButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {/* Save Search Modal */}
      <Dialog open={showSaveSearchModal} onOpenChange={setShowSaveSearchModal}>
        <DialogContent className="max-w-md sm:top-[50%] top-[20%] sm:translate-y-[-50%] translate-y-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-[#FFD447] -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6">
            <DialogTitle className="text-[#342E37]">Save Search</DialogTitle>
            <DialogDescription className="text-[#342E37]/80">
              Give your search a name so you can easily find it later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="w-full space-y-1">
              <label
                htmlFor="save-search-name-input"
                className="block text-[13px] text-foreground"
              >
                Search Name
              </label>
              <input
                id="save-search-name-input"
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="e.g., Miami Foreclosures Under 300K"
                autoFocus
                onFocus={(e) => {
                  // Scroll input into view on mobile when keyboard opens
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                onKeyDown={(e) => {
                  // Allow Enter key to save the search
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmSaveSearch();
                  }
                }}
                className="flex h-10 w-full border-b-2 bg-transparent px-0 py-2 text-[16px] transition-colors placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 focus-visible:border-[#FFD447] hover:border-gray-400"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[13px] text-gray-600 mb-2">Current criteria:</p>
              <p className="text-[13px] text-gray-800">
                {[criteria.city, criteria.state].filter(Boolean).join(', ') || 'Custom search'} • 
                {criteria.propertyType || 'All types'} • 
                {criteria.minPrice || criteria.maxPrice 
                  ? `${criteria.minPrice ? '$' + criteria.minPrice : ''}${criteria.minPrice && criteria.maxPrice ? '-' : ''}${criteria.maxPrice ? '$' + criteria.maxPrice : ''}`
                  : 'Any price'}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <LBButton 
                variant="outline" 
                onClick={() => {
                  setShowSaveSearchModal(false);
                  setSaveSearchName('');
                }}
              >
                Cancel
              </LBButton>
              <LBButton 
                variant="primary"
                onClick={handleConfirmSaveSearch}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </LBButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Automation Modal */}
      <CreateAutomationModal
        isOpen={showAutomationModal}
        onClose={() => {
          setShowAutomationModal(false);
          setSelectedSavedSearch(null);
        }}
        savedSearch={selectedSavedSearch}
        currentCriteria={!selectedSavedSearch ? criteria : undefined}
        onAutomationCreated={handleAutomationCreated}
        onNavigate={onNavigate}
      />

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal 
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSaveListing={handleSaveListing}
          isSaved={isListingSaved(selectedListing.id)}
        />
      )}

      {/* Property Valuation Modal */}
      {selectedReport && selectedReportType === 'valuation' && (
        <PropertyValuationModal
          report={selectedReport}
          onClose={() => {
            setSelectedReport(null);
            setSelectedReportType(null);
          }}
        />
      )}

      {/* Property History Modal */}
      {selectedReport && selectedReportType === 'property-history' && (
        <PropertyHistoryModal
          report={selectedReport}
          onClose={() => {
            setSelectedReport(null);
            setSelectedReportType(null);
          }}
        />
      )}

      {/* Walkthrough Overlays - Steps 2-6 */}
      
      {/* Step 2: Enter Location */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(2)}
        step={2}
        totalSteps={totalSteps}
        title="Add a location"
        description="Enter a city, ZIP, or address to narrow your search. Tap outside the field when done."
        highlightSelector="[data-walkthrough='location-section']"
        tooltipPosition="auto"
        mode="wait-for-blur"
        onSkip={skipWalkthrough}
        showSkip={true}
      />
      
      {/* Step 3: Set Search Criteria */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(3)}
        step={3}
        totalSteps={totalSteps}
        title="Add search parameters"
        description="Set property type, price range, and listing details. Use Add Filter to refine results."
        highlightSelector="[data-walkthrough='search-criteria']"
        tooltipPosition="auto"
        mode="click-to-continue"
        onNext={() => completeStep(3)}
        onSkip={skipWalkthrough}
        showSkip={true}
      />
      
      {/* Step 4: View Results */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(4)}
        step={4}
        totalSteps={totalSteps}
        title="Search results"
        description="Results appear here. Use Save Search to reuse criteria, Automate to create a rule, or Export to download data."
        highlightSelector="[data-walkthrough='results-section']"
        tooltipPosition="auto"
        mode="click-to-continue"
        onNext={() => completeStep(4)}
        onSkip={skipWalkthrough}
        showSkip={true}
      />
      
      {/* Step 5: Save a Listing (Optional prompt) */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(5)}
        step={5}
        totalSteps={totalSteps}
        title="Save a listing"
        description="Click Save, give it a name, and confirm. This will appear in Saved Listings."
        highlightSelector="[data-walkthrough='save-search-button']"
        tooltipPosition="auto"
        mode="wait-for-click"
        onSkip={skipWalkthrough}
        showSkip={true}
      />
      
      {/* Step 6: Create Your First Automation */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(6)}
        step={6}
        totalSteps={totalSteps}
        title="Create your first automation"
        description="Click 'Create Automation' to set up automatic delivery of matching listings. You'll connect a destination and configure when and how listings are sent."
        highlightSelector="[data-walkthrough='create-automation-button']"
        tooltipPosition="auto"
        mode="wait-for-click"
        onSkip={skipWalkthrough}
        showSkip={true}
      />

      {/* Loading Animation Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            {/* Main Loading Spinner */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-16 h-16 text-[#FFD447]" />
              </motion.div>
            </div>

            {/* Loading Steps */}
            <div className="space-y-4">
              {[
                { icon: Database, label: 'Connecting to data sources', delay: 0 },
                { icon: FileText, label: 'Fetching listing data', delay: 0.5 },
                { icon: CheckCircle, label: 'Processing results', delay: 1 },
              ].map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay, duration: 0.5 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ 
                      delay: step.delay + 0.5,
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <step.icon className="w-6 h-6 text-[#342E37]" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-gray-900">{step.label}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: step.delay + 1, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#FFD447]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
              <p className="text-center text-[12px] text-gray-600 mt-3">
                Searching {criteria.city ? `${criteria.city}${criteria.state ? `, ${criteria.state}` : ""}...` : "listings..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
