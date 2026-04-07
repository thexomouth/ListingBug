import React, { useState, useRef, useEffect } from 'react';
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
import { Download, Plus, X, MapPin, DollarSign, Home, Eye, Save, Search, Filter, Sliders, ArrowUpDown, ArrowUp, ArrowDown, Check, Calendar, Clock, Loader2, FileText, Database, CheckCircle, Zap, Edit2, Trash2, Play, TrendingUp, History, BarChart3, Share2, ExternalLink, Info, Heart } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'search' | 'listings' | 'history'>(() => {
    const tabToOpen = sessionStorage.getItem('listingbug_open_tab');
    const lastTab = sessionStorage.getItem('listingbug_last_tab');
    if (tabToOpen && ['search','listings','history'].includes(tabToOpen)) {
      return tabToOpen as 'search' | 'listings' | 'history';
    } else if (lastTab && ['search','listings','history'].includes(lastTab)) {
      return lastTab as 'search' | 'listings' | 'history';
    }
    return 'search';
  });

  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = '';
  }, [activeTab]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'valuation' | 'property-history' | null>(null);
  
  const { isStepActive, completeStep, skipWalkthrough, totalSteps, previousStep, walkthroughActive, currentStep } = useWalkthrough();
  
  const [locationFieldBlurred, setLocationFieldBlurred] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  useEffect(() => {
    if (cityInputRef.current) {
      cityInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('listingbug_open_tab')) {
      sessionStorage.removeItem('listingbug_open_tab');
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('listingbug_last_tab', activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('listingbug_walkthrough_step') || '0');
    const completed = localStorage.getItem('listingbug_walkthrough_completed') === 'true';
    
    console.log('🔍 SearchListings mounted - Walkthrough state:', { 
      walkthroughActive, 
      currentStep, 
      savedStep,
      completed 
    });
    
    if (!completed && currentStep === 1 && walkthroughActive) {
      console.log('✅ Advancing from Step 1 → Step 2 (user navigated to Search Listings)');
      completeStep(1);
    }
  }, [walkthroughActive, currentStep, completeStep]);
  
  useEffect(() => {
    if (locationFieldBlurred && isStepActive(2)) {
      completeStep(2);
    }
  }, [locationFieldBlurred, isStepActive]);
  
  useEffect(() => {
    if (searchPerformed && isStepActive(3)) {
      completeStep(3);
    }
  }, [searchPerformed, isStepActive]);

  useEffect(() => {
    const fetchBillingInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('plan,plan_status,trial_ends_at,stripe_subscription_end')
        .eq('id', userId)
        .single();

      if (error || !user) return;

      if (user?.plan) {
        if (user.plan.toLowerCase() === 'trial') setListingsCap(1000);
        if (user.plan.toLowerCase() === 'starter') setListingsCap(4000);
        if (user.plan.toLowerCase() === 'professional') setListingsCap(10000);
        if (user.plan.toLowerCase() === 'enterprise') setListingsCap(999999);
      }

      const isTrialing = user.plan_status?.toLowerCase() === 'trialing' || user.plan?.toLowerCase() === 'trial';
      if (isTrialing) {
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

      const monthYear = new Date().toISOString().slice(0, 7);
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('listings_fetched')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .maybeSingle();
      if (usageData?.listings_fetched !== undefined) {
        setListingsSynced(usageData.listings_fetched);
      }
    };

    fetchBillingInfo();
  }, []);


  useEffect(() => {
    const loadSavedListings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('saved_listings')
        .select('listing_data_json, saved_at')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
      const listings = (data ?? []).map((r: any) => r.listing_data_json).filter(Boolean);
      setSavedListings(listings);
      localStorage.setItem('listingbug_saved_listings', JSON.stringify(listings));
    };
    loadSavedListings();
  }, []);

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
      const history = (data ?? []).map((r: any) => ({
        id: r.id,
        location: r.location,
        searchName: r.search_name || null,
        automationName: r.automation_name || null,
        criteriaDescription: r.criteria_description,
        criteria: r.criteria_json,
        resultsCount: r.results_count,
        searchDate: r.searched_at,
        listings: r.results_json || [],
      }));
      setSearchHistory(history);
      localStorage.setItem('listingbug_search_history', JSON.stringify(history));
    };
    loadSearchHistory();
  }, []);

  const pendingRunNameRef = React.useRef<{ searchName?: string; automationName?: string }>({});

  const [searchHistory, setSearchHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_search_history');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error('Failed to parse search history:', e); }
    }
    return [];
  });
  
  const [reportHistory, setReportHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_report_history');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error('Failed to parse report history:', e); }
    }
    return [];
  });
  
  const [reportPage, setReportPage] = useState(1);
  const reportsPerPage = 10;
  
  const [savedListings, setSavedListings] = useState<any[]>(() => {
    const stored = localStorage.getItem('listingbug_saved_listings');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error('Failed to parse saved listings:', e); }
    }
    return [];
  });
  
  useEffect(() => {
    localStorage.setItem('listingbug_saved_listings', JSON.stringify(savedListings));
    window.dispatchEvent(new Event('savedListingsUpdated'));
  }, [savedListings]);
  
  useEffect(() => {
    localStorage.setItem('listingbug_report_history', JSON.stringify(reportHistory));
  }, [reportHistory]);
  
  
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
  
  const [listingsSynced, setListingsSynced] = useState(0);
  const [listingsCap, setListingsCap] = useState(1000);
  const [resetLabel, setResetLabel] = useState('Resets 04/27/25');
  const [isTrialUser, setIsTrialUser] = useState(false);
  
  type SortColumn = 'address' | 'city' | 'price' | 'yearBuilt' | 'agentName' | 'daysListed' | 'status';
  type SortDirection = 'asc' | 'desc';
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const samplePreviewData = [
    { id: 'sample-preview', address: '—', city: '—', price: 0, yearBuilt: '—', agentName: '—', daysListed: '—', reList: false, priceDrop: false, status: '—' },
  ];

  useEffect(() => {
    localStorage.setItem('listingbug_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  useEffect(() => {
    localStorage.setItem('listingbug_saved_listings', JSON.stringify(savedListings));
  }, [savedListings]);

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    } else {
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

    if (!hasAddress && !hasCity && !hasZip && !hasLatLng) {
      errors.general = 'Please select a city from the dropdown, or enter a ZIP code or address';
    }
    if (hasLatLng && !hasRadius && !hasCity && !hasZip && !hasAddress) {
      errors.general = 'Add a radius (miles) when searching by coordinates';
    }
    if (hasCity && !criteria.state) {
      errors.state = 'Please select a city from the dropdown list';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.general) toast.error(errors.general);
      return;
    }

    setFieldErrors({});
    setSearchPerformed(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.style.overflow = 'hidden';
    setIsLoading(true);
    setIsCappedAtMax(false);

    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
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

      if (criteria.city) body.city = criteria.city;
      if (criteria.state) body.state = criteria.state;
      if (criteria.zip) body.zipCode = criteria.zip;
      if (criteria.address) body.address = criteria.address;
      if (criteria.latitude) body.latitude = Number(criteria.latitude);
      if (criteria.longitude) body.longitude = Number(criteria.longitude);
      if (criteria.radius) body.radius = Number(criteria.radius);
      if (criteria.propertyType && criteria.propertyType !== 'All Types') body.propertyType = criteria.propertyType;
      if (criteria.beds) body.bedrooms = criteria.beds;
      if (criteria.baths) body.bathrooms = criteria.baths;
      if (criteria.minPrice) body.minPrice = Number(criteria.minPrice);
      if (criteria.maxPrice) body.maxPrice = Number(criteria.maxPrice);
      if (criteria.daysOld && criteria.daysOld !== '') body.daysOld = Number(criteria.daysOld);

      const af = criteria;
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
        res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/search-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
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
      if (data.usage?.used !== undefined) setListingsSynced(data.usage.used);
      if (data.usage?.limit !== undefined) setListingsCap(data.usage.limit);
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
        id: crypto.randomUUID(),
        criteria: { ...criteria },
        activeFilters: [...(activeFilters || [])],
        location,
        criteriaDescription,
        resultsCount: finalResults.length,
        searchDate: new Date().toISOString(),
        listings: finalResults,
      };
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
            search_name: pendingRunNameRef.current.searchName || null,
            automation_name: pendingRunNameRef.current.automationName || null,
          });
          pendingRunNameRef.current = {};
          if (insertError) console.error('[search_runs insert failed]', insertError.code, insertError.message, insertError.details);
          else console.log('[search_runs] saved', historyEntry.id, 'with', finalResults.length, 'listings');
        }
      } catch (e: any) {
        console.error('[search_runs exception]', e.message || e);
      }
      setSearchHistory(prev => [historyEntry, ...prev.slice(0, 49)]);
      setTimeout(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);

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
    lines.push(q('LISTINGBUG') + ',,,,,,,,,,,,,,,,');
    lines.push(q('Real Estate Data Intelligence') + ',,,,,,,,,,,,,,,,');
    lines.push(q('thelistingbug.com') + ',,,,,,,,,,,,,,,,');
    lines.push('');
    lines.push(`${q('Report Generated:')},${q(exportDate)}`);
    lines.push('');
    lines.push(q('── SEARCH PARAMETERS ────────────────────────────────────────────'));
    lines.push(`${q('Location:')},${q(location)}`);
    lines.push(`${q('Property Type:')},${q(criteria.propertyType || 'All')}`);
    lines.push(`${q('Listing Status:')},${q(criteria.status || 'Active')}`);
    lines.push(`${q('Price Range:')},${q(priceRange)}`);
    if (criteria.beds) lines.push(`${q('Min Bedrooms:')},${q(criteria.beds)}`);
    if (criteria.baths) lines.push(`${q('Min Bathrooms:')},${q(criteria.baths)}`);
    if (criteria.daysOld) lines.push(`${q('Listed Within (days):')},${q(criteria.daysOld)}`);
    lines.push('');
    lines.push(q('── RESULTS SUMMARY ──────────────────────────────────────────────'));
    lines.push(`${q('Total Listings:')},${q(results.length)}`);
    const noPhone = results.filter((r: any) => !r.agentPhone).length;
    const noEmail = results.filter((r: any) => !r.agentEmail).length;
    lines.push(`${q('No Agent Phone:')},${q(noPhone)}`);
    lines.push(`${q('No Agent Email:')},${q(noEmail)}`);
    lines.push('');
    const sorted = [...results].sort((a: any, b: any) => {
      const aContact = !!(a.agentPhone || a.agentEmail);
      const bContact = !!(b.agentPhone || b.agentEmail);
      if (aContact !== bContact) return aContact ? -1 : 1;
      return (b.price || 0) - (a.price || 0);
    });
    lines.push(q('── LISTINGS ─────────────────────────────────────────────────────'));
    lines.push(['MLS #', 'Status', 'Listed Date', 'Days on Market', 'Price Drop', 'Full Address', 'Street Address', 'City', 'State', 'ZIP', 'County', 'Property Type', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Lot Size (sq ft)', 'Year Built', 'HOA Fee/mo', 'List Price', 'Price per Sq Ft', 'Agent Name', 'Agent Phone', 'Agent Email', 'Brokerage', 'Brokerage Phone', 'Brokerage Email', 'Latitude', 'Longitude'].map(q).join(','));
    sorted.forEach((r: any) => {
      const pricePsf = r.price && r.sqft ? Math.round(r.price / r.sqft) : '';
      const listedDate = r.listedDate ? new Date(r.listedDate).toLocaleDateString('en-US') : '';
      lines.push([q(r.mlsNumber || ''), q(r.status || 'Active'), q(listedDate), q(r.daysListed || 0), q(r.priceDrop ? 'Yes' : 'No'), q(r.formattedAddress || `${r.address}, ${r.city}, ${r.state} ${r.zip}`), q(r.address || ''), q(r.city || ''), q(r.state || ''), q(r.zip || ''), q(r.county || ''), q(r.propertyType || ''), q(r.bedrooms || ''), q(r.bathrooms || ''), q(r.sqft || ''), q(r.lotSize || ''), q(r.yearBuilt || ''), q(r.hoaFee != null ? `$${r.hoaFee}` : ''), q(r.price ? `$${r.price.toLocaleString()}` : ''), q(pricePsf ? `$${pricePsf}` : ''), q(r.agentName || ''), q(r.agentPhone || ''), q(r.agentEmail || ''), q(r.brokerage || r.officeName || ''), q(r.officePhone || ''), q(r.officeEmail || ''), q(r.latitude || ''), q(r.longitude || '')].join(','));
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
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('automation_runs').insert({ user_id: user.id, automation_name: 'CSV Export', run_date: new Date().toISOString(), status: 'success', listings_sent: results.length, destination: 'csv' }).catch(() => {});
        }
      });
    } catch {}
  };

  const openIntegrationTab = (integrationId: string, config: any) => {
    const urls: Record<string, string | null> = { sheets: config.spreadsheet_id ? `https://docs.google.com/spreadsheets/d/${config.spreadsheet_id}` : 'https://sheets.google.com', google: config.spreadsheet_id ? `https://docs.google.com/spreadsheets/d/${config.spreadsheet_id}` : 'https://sheets.google.com', mailchimp: config.dc ? `https://${config.dc}.admin.mailchimp.com/` : 'https://mailchimp.com', hubspot: config.hub_id ? `https://app.hubspot.com/contacts/${config.hub_id}/` : 'https://app.hubspot.com/contacts/', sendgrid: 'https://app.sendgrid.com/marketing/contacts', twilio: 'https://console.twilio.com/', zapier: null, make: null, webhook: null };
    const url = urls[integrationId];
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendToIntegration = async (integrationId: string) => {
    if (!results || results.length === 0) { toast.error('No results to export'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { toast.error('Not signed in'); return; }
    const token = session.access_token;
    const userId = session.user.id;
    const { data: conn } = await supabase.from('integration_connections').select('config').eq('user_id', userId).eq('integration_id', integrationId).single();
    const config = conn?.config ?? {};
    const listings = results.map((r: any) => ({ id: r.id, formatted_address: r.formattedAddress || r.address || '', city: r.city || '', state: r.state || '', zip_code: r.zipCode || r.zip || '', county: r.county || '', price: r.price || null, bedrooms: r.bedrooms || null, bathrooms: r.bathrooms || null, square_footage: r.squareFootage || r.sqft || null, lot_size: r.lotSize || null, year_built: r.yearBuilt || null, property_type: r.propertyType || '', status: r.status || 'Active', listed_date: r.listedDate || '', days_on_market: r.daysOnMarket || r.daysListed || null, price_reduced: r.priceReduced || false, listing_type: r.listingType || 'sale', mls_number: r.mlsNumber || '', agent_name: r.listingAgent?.name || r.agentName || '', agent_phone: r.listingAgent?.phone || r.agentPhone || '', agent_email: r.listingAgent?.email || r.agentEmail || '', agent_website: r.listingAgent?.website || '', office_name: r.listingOffice?.name || r.officeName || '', office_phone: r.listingOffice?.phone || '', office_email: r.listingOffice?.email || '', latitude: r.latitude || null, longitude: r.longitude || null }));
    const BASE = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const DISPATCH_MAP: Record<string, string> = { mailchimp: 'send-to-mailchimp', hubspot: 'send-to-hubspot', sheets: 'send-to-sheets', google: 'send-to-sheets', sendgrid: 'send-to-sendgrid', twilio: 'send-to-twilio', zapier: 'webhook-push', make: 'webhook-push', webhook: 'webhook-push' };
    const fn = DISPATCH_MAP[integrationId];
    if (!fn) { toast.error(`Export to ${integrationId} is not yet supported`); return; }
    let payload: any = { listings };
    if (integrationId === 'mailchimp') { if (!config.list_id) { toast.error('No Mailchimp audience configured — open Integrations and save settings first.'); return; } payload = { ...payload, list_id: config.list_id, tags: config.tags ?? [], double_opt_in: config.double_opt_in ?? false }; }
    else if (integrationId === 'hubspot') { payload = { ...payload, object_type: config.object_type ?? 'contacts' }; }
    else if (integrationId === 'sheets' || integrationId === 'google') { if (!config.spreadsheet_id) { toast.error('No Google Sheets spreadsheet ID configured — open Integrations and save settings first.'); return; } payload = { ...payload, spreadsheet_id: config.spreadsheet_id, sheet_name: config.sheet_name ?? 'Sheet1', write_mode: config.write_mode ?? 'append' }; }
    else if (integrationId === 'sendgrid') { payload = { ...payload, mode: config.mode ?? 'contacts', list_ids: config.list_ids ?? [] }; }
    else if (integrationId === 'twilio') { payload = { ...payload, list_unique_name: config.list_unique_name ?? 'listingbug_contacts' }; }
    else if (['zapier', 'make', 'n8n', 'webhook'].includes(integrationId)) { if (!config.webhook_url) { toast.error('No webhook URL configured — open Integrations and save settings first.'); return; } payload = { ...payload, webhook_url: config.webhook_url, send_mode: config.send_mode ?? 'batch' }; }
    const integrationName = { mailchimp: 'Mailchimp', hubspot: 'HubSpot', sheets: 'Google Sheets', google: 'Google Sheets', sendgrid: 'SendGrid', twilio: 'Twilio', zapier: 'Zapier', make: 'Make', n8n: 'n8n', webhook: 'Webhook' }[integrationId] ?? integrationId;
    const toastId = toast.loading(`Sending ${results.length} listings to ${integrationName}…`);
    try {
      const res = await fetch(`${BASE}/${fn}`, { method: 'POST', headers, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(toastId);
      if (!res.ok) { toast.error(`Export failed: ${data.error ?? `HTTP ${res.status}`}`); return; }
      const sent = data.sent ?? data.written ?? data.accepted ?? 0;
      const failed = data.failed ?? 0;
      if (sent > 0) { toast.success(`${sent} listing${sent !== 1 ? 's' : ''} sent to ${integrationName}!`); openIntegrationTab(integrationId, config); }
      else if (failed > 0 && sent === 0) { const err = data.errors?.[0] ?? 'All contacts failed'; toast.error(`Export failed: ${typeof err === 'string' ? err : JSON.stringify(err)}`); }
      else { toast.success(`Listings sent to ${integrationName}!`); openIntegrationTab(integrationId, config); }
    } catch (e: any) { toast.dismiss(toastId); toast.error(e.message ?? 'Network error during export'); }
  };

  const handleAutomateFromResults = () => {
    if (!criteria.city && !criteria.state && !criteria.address && !criteria.zip) {
      toast.error('Please enter search criteria before creating an automation');
      return;
    }
    if (onNavigate) {
      sessionStorage.setItem('listingbug_automations_tab', 'create');
      const location = [criteria.city, criteria.state].filter(Boolean).join(', ') || 'Custom Search';
      sessionStorage.setItem('listingbug_prefill_automation', JSON.stringify({ criteria, location, name: location }));
      toast.success('Redirecting to create automation...', { duration: 2000 });
      onNavigate('automations');
    }
  };

  const handleAutomationCreated = (automation: any) => {
    const stored = localStorage.getItem('listingbug_automations');
    let automations = [];
    if (stored) { try { automations = JSON.parse(stored); } catch (e) { console.error('Failed to parse stored automations:', e); } }
    const newAutomation = { id: automation.id, name: automation.name, searchName: automation.searchName, schedule: automation.schedule + (automation.scheduleTime ? ` at ${automation.scheduleTime}` : ''), destination: { type: automation.destination.type, label: automation.destination.label, config: automation.destination.config }, searchCriteria: automation.searchCriteria, activeFilters: automation.activeFilters, active: true, nextRun: automation.schedule.includes('Real-time') ? 'When new matches appear' : 'Pending first run' };
    automations.unshift(newAutomation);
    localStorage.setItem('listingbug_automations', JSON.stringify(automations));
  };

  const handleSaveListing = async (listing: any) => {
    const isAlreadySaved = savedListings.some(l => l.id === listing.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (isAlreadySaved) {
      setSavedListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success('Listing removed from saved');
      if (user) { await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', String(listing.id)); const updated = savedListings.filter(l => l.id !== listing.id); localStorage.setItem('listingbug_saved_listings', JSON.stringify(updated)); window.dispatchEvent(new Event('savedListingsUpdated')); window.dispatchEvent(new Event('savedListingsChanged')); }
    } else {
      const savedListing = { ...listing, savedAt: new Date().toISOString() };
      setSavedListings(prev => [savedListing, ...prev]);
      toast.success('Listing saved successfully!');
      if (user) { const { error: saveErr } = await supabase.from('saved_listings').upsert({ user_id: user.id, listing_id: String(listing.id), listing_data_json: savedListing, saved_at: savedListing.savedAt }, { onConflict: 'user_id,listing_id' }); if (saveErr) { console.error('[SaveListing] upsert error:', saveErr.code, saveErr.message, saveErr.details); toast.error('Save failed: ' + saveErr.message); } else { const updated = [savedListing, ...savedListings.filter(l => l.id !== listing.id)]; localStorage.setItem('listingbug_saved_listings', JSON.stringify(updated)); window.dispatchEvent(new Event('savedListingsUpdated')); window.dispatchEvent(new Event('savedListingsChanged')); } }
    }
  };

  const isListingSaved = (listingId: any) => savedListings.some(l => l.id === listingId);
  const updateCriteria = (field: string, value: string | boolean) => setCriteria((prev) => ({ ...prev, [field]: value }));
  const addFilter = (filterKey: FilterKey) => { if (!(activeFilters || []).includes(filterKey)) { setActiveFilters([...(activeFilters || []), filterKey]); setCriteria((prev) => ({ ...prev, [filterKey]: '' })); } };
  const removeFilter = (filterKey: FilterKey) => { setActiveFilters((activeFilters || []).filter((f) => f !== filterKey)); const newCriteria = { ...criteria }; delete newCriteria[filterKey]; setCriteria(newCriteria); };
  const unusedFilters = availableFilters.filter((filter) => !(activeFilters || []).includes(filter.key));

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) { setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  const getSortedData = (data: any[]) => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortColumn]; let bVal = b[sortColumn];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getPaginatedData = (data: any[]) => { const startIndex = (currentPage - 1) * resultsPerPage; return data.slice(startIndex, startIndex + resultsPerPage); };
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const handlePageChange = (page: number) => { setCurrentPage(page); setTimeout(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); };
  const handleResultsPerPageChange = (perPage: number) => { setResultsPerPage(perPage); setCurrentPage(1); };
  const SortIcon = ({ column }: { column: SortColumn }) => { if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />; return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 text-primary" />; };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6" style={{ borderRadius: 0, border: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Search className="w-5 h-5 md:w-6 md:h-6 text-[#FFCE0A]" />
            <h1 className="mb-0 text-2xl font-bold">Listings</h1>
          </div>
          <p className="text-gray-600 text-[13px] md:text-sm">Search and manage property listings with custom criteria</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setActiveTab('history')}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
          >
            <Clock className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] text-sm font-semibold transition-colors"
          >
            <Heart className="w-4 h-4" />
            Saved
          </button>
        </div>
      </div>

      <div className="hidden">
        <nav className="flex gap-2 md:gap-0 overflow-x-auto scrollbar-hide -mb-px">
          {(['search', 'listings', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-2 md:px-4 border-b-2 transition-colors text-[14px] whitespace-nowrap flex-1 text-center ${activeTab === tab ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'search' ? 'Search' : tab === 'listings' ? 'Saved Listings' : 'History'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'search' ? (
        <>
          <div className="mb-4">
            <div className="space-y-3">
              <div className="space-y-3">
                <div data-walkthrough="location-section">
                  <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-primary" /><h3 className="text-[24px] font-bold">Location</h3></div>
                  <div className="mb-2">
                    <CityAutocomplete value={criteria.city} stateValue={criteria.state} onSelect={(city, state) => { updateCriteria('city', city); updateCriteria('state', state); }} onBlur={() => setLocationFieldBlurred(true)} error={fieldErrors.state} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4" data-walkthrough="search-criteria">
                  <div data-walkthrough="property-details">
                    <div className="flex items-center gap-2 mb-2"><Home className="w-4 h-4 text-primary" /><h3 className="text-[24px] font-bold">Property Details</h3></div>
                    <div className="grid grid-cols-2 gap-2">
                      <LBSelect className="mx-[0px] mt-[0px] mb-[12px]" label="Property Type" value={criteria.propertyType} onChange={(value) => updateCriteria('propertyType', value)} options={[{ value: '', label: 'All Types' }, { value: 'Single Family', label: 'Single Family' }, { value: 'Condo', label: 'Condo' }, { value: 'Townhouse', label: 'Townhouse' }, { value: 'Multi-Family', label: 'Multi-Family' }, { value: 'Land', label: 'Land' }, { value: 'Commercial', label: 'Commercial' }]} />
                      <LBSelect label="Listing Status" value={criteria.status} onChange={(value) => updateCriteria('status', value)} options={[{ value: '', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
                    </div>
                  </div>
                  <div data-walkthrough="price-range">
                    <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-primary" /><h3 className="text-[24px] font-bold">Price Range</h3></div>
                    <div className="grid grid-cols-2 gap-2">
                      <LBInput className="mx-[0px] mt-[0px] mb-[12px]" label="Min Price" value={criteria.minPrice} onChange={(e) => updateCriteria('minPrice', e.target.value)} placeholder="500000" />
                      <LBInput label="Max Price" value={criteria.maxPrice} onChange={(e) => updateCriteria('maxPrice', e.target.value)} placeholder="1000000" />
                    </div>
                  </div>
                  <div data-walkthrough="listing-details">
                    <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-primary" /><h3 className="text-[24px] font-bold">Listing Details</h3></div>
                    <div className="grid grid-cols-2 gap-2">
                      <LBInput className="mx-[0px] mt-[0px] mb-[12px]" label="Year Built" value={criteria.yearBuilt} onChange={(e) => updateCriteria('yearBuilt', e.target.value)} placeholder="2000-2020" />
                      <LBInput label="Days Listed" value={criteria.daysOld} onChange={(e) => updateCriteria('daysOld', e.target.value)} placeholder="30 or 10-30" />
                    </div>
                  </div>
                </div>
                {(activeFilters || []).length > 0 && (
                  <div className="border-t pt-3">
                    <h3 className="mb-2 text-[15px] font-bold">Additional Filters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(activeFilters || []).map((filterKey) => {
                        const filter = availableFilters.find((f) => f.key === filterKey);
                        if (!filter) return null;
                        return (
                          <div key={filterKey} className="relative">
                            <LBInput label={filter.label} type={filter.type} value={criteria[filterKey] || ''} onChange={(e) => updateCriteria(filterKey, e.target.value)} placeholder={filter.placeholder} />
                            <button onClick={() => removeFilter(filterKey)} className="absolute right-1 top-0 p-1 hover:bg-gray-100 rounded transition-colors" title="Remove filter"><X className="w-3.5 h-3.5 text-gray-500" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 mb-4 p-3 rounded-lg">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-gray-700 dark:text-gray-300"><span className="text-gray-900 dark:text-white font-medium">Search Tip:</span> Each search can only yield up to 500 listings.</p>
                </div>
                <div className="pt-3">
                  <div className="flex items-center justify-center">
                    {unusedFilters.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><LBButton variant="ghost" size="sm" className="border-0 hover:bg-transparent"><Plus className="w-4 h-4" /><span>Add Filter</span></LBButton></DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
                          {unusedFilters.map((filter) => (<DropdownMenuItem key={filter.key} onClick={() => addFilter(filter.key)} className="cursor-pointer">{filter.label}</DropdownMenuItem>))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <div className="pt-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 justify-center w-full">
                      <LBButton onClick={handleSearch} variant="primary" size="sm" className="flex-1 md:flex-initial min-w-[140px]" data-walkthrough="search-button"><Search className="w-4 h-4" />Search</LBButton>
                    </div>
                    <p className="text-[11px] text-gray-500 text-center">{listingsSynced.toLocaleString()} / {listingsCap.toLocaleString()} listings. {resetLabel}</p>
                    <div className="pb-[50px]" />
                    {isCappedAtMax && (<p className="text-[11px] text-amber-700 dark:text-amber-300 text-center mt-1">Showing up to 500 listings</p>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <LBCard elevation="sm" className="border-0 rounded-none" ref={resultsRef} data-walkthrough="results-section">
              <LBCardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <LBCardTitle className="text-base md:text-lg">Showing {((currentPage-1)*resultsPerPage)+1}–{Math.min(currentPage*resultsPerPage, results.length)} of {results.length} listings</LBCardTitle>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <LBButton onClick={handleAutomateFromResults} variant="ghost" size="sm" className="whitespace-nowrap flex-1 sm:flex-none min-w-0" data-walkthrough="create-automation-button"><Zap className="w-4 h-4" /><span>Automate</span></LBButton>
                    <ExportDropdown onExportCSV={handleDownloadCSV} onSendToIntegration={handleSendToIntegration} className="flex-1 sm:flex-none min-w-0" />
                  </div>
                </div>
              </LBCardHeader>
              <LBCardContent className="pt-0">
                <div className="overflow-x-auto -mx-6 md:mx-0">
                  <LBTable>
                    <LBTableHeader><SearchResultsTableHeader columns={searchResultsColumns} onSort={handleSort} SortIcon={SortIcon} onColumnsChange={setSearchResultsColumns} /></LBTableHeader>
                    <LBTableBody>{getPaginatedData(getSortedData(results)).map((result) => (<SearchResultsTableRow key={result.id} result={result} columns={searchResultsColumns} onSelect={setSelectedListing} onSave={handleSaveListing} isSaved={isListingSaved} />))}</LBTableBody>
                  </LBTable>
                </div>
                <div className="flex flex-col gap-3 mt-4 pt-3 border-t">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-600">Rows per page:</span>
                    <select value={resultsPerPage} onChange={(e) => handleResultsPerPageChange(Number(e.target.value))} className="h-8 px-2 pr-8 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd447] focus:border-[#ffd447]">
                      <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                    </select>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <LBButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="ghost" size="sm" className="h-8 px-3 text-white hover:bg-white/10">Previous</LBButton>
                      <div className="flex items-center gap-1">
                        {currentPage > 3 && (<>{<LBButton onClick={() => handlePageChange(1)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10">1</LBButton>}{currentPage > 4 && <span className="text-white/40 px-1">...</span>}</>)}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => page === currentPage || page === currentPage - 1 || page === currentPage - 2 || page === currentPage + 1 || page === currentPage + 2).map(page => (<LBButton key={page} onClick={() => handlePageChange(page)} variant={currentPage === page ? "primary" : "ghost"} size="sm" className={`h-8 w-8 p-0 ${currentPage !== page ? 'text-white hover:bg-white/10' : ''}`}>{page}</LBButton>))}
                        {currentPage < totalPages - 2 && (<>{currentPage < totalPages - 3 && <span className="text-white/40 px-1">...</span>}<LBButton onClick={() => handlePageChange(totalPages)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/10">{totalPages}</LBButton></>)}
                      </div>
                      <LBButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="ghost" size="sm" className="h-8 px-3 text-white hover:bg-white/10">Next</LBButton>
                      <span className="text-xs text-white/60 ml-2">Page {currentPage} of {totalPages}</span>
                    </div>
                  )}
                </div>
              </LBCardContent>
            </LBCard>
          )}
          {!isLoading && searchPerformed && results.length === 0 && (<div className="text-center py-12 border border-dashed border-gray-300 dark:border-white/20 rounded-lg mt-4"><p className="text-lg font-semibold text-gray-900 dark:text-white">No listings found for that location.</p><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Try a nearby city or different ZIP code.</p></div>)}
        </>
      ) : activeTab === 'listings' ? (
        <div className="space-y-4 pb-[100px]">
          {savedListings.length === 0 ? (
            <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10"><CardContent className="text-center py-12"><Save className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" /><p className="text-gray-900 dark:text-white font-medium mb-2">No saved listings yet</p><p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">Save listings from search results to review them later</p><LBButton onClick={() => setActiveTab('search')} size="sm">Go to Search</LBButton></CardContent></Card>
          ) : (
            <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-bold text-[24px]">Saved Listings ({savedListings.length})</CardTitle>
                  <LBButton variant="outline" size="sm" onClick={() => { if (window.confirm(`Are you sure you want to remove all ${savedListings.length} saved listings?`)) { setSavedListings([]); toast.success('All saved listings cleared'); } }}><Trash2 className="w-3.5 h-3.5 mr-1.5" />Clear</LBButton>
                </div>
              </CardHeader>
              <CardContent>
                <LBTable>
                  <LBTableHeader><LBTableRow><LBTableHead>Address</LBTableHead><LBTableHead>City</LBTableHead><LBTableHead>Price</LBTableHead><LBTableHead>Beds/Baths</LBTableHead><LBTableHead>Sq Ft</LBTableHead><LBTableHead>Status</LBTableHead><LBTableHead>Saved Date</LBTableHead><LBTableHead className="text-right">Actions</LBTableHead></LBTableRow></LBTableHeader>
                  <LBTableBody>
                    {savedListings.map((listing) => (
                      <LBTableRow key={listing.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5" onClick={() => setSelectedListing(listing)}>
                        <LBTableCell className="font-medium">{listing.address}</LBTableCell>
                        <LBTableCell>{listing.city}</LBTableCell>
                        <LBTableCell className="font-medium">${listing.price.toLocaleString()}</LBTableCell>
                        <LBTableCell>{listing.bedrooms} / {listing.bathrooms}</LBTableCell>
                        <LBTableCell>{listing.sqft.toLocaleString()} sf</LBTableCell>
                        <LBTableCell><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${listing.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : listing.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'}`}>{listing.status}</span></LBTableCell>
                        <LBTableCell className="text-[13px] text-gray-600 dark:text-gray-400">{new Date(listing.savedAt).toLocaleDateString()}</LBTableCell>
                        <LBTableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <LBButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedListing(listing); }} title="View details"><Eye className="w-3.5 h-3.5" /></LBButton>
                            <LBButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleSaveListing(listing); }} title="Remove from saved"><Trash2 className="w-3.5 h-3.5 text-red-600" /></LBButton>
                          </div>
                        </LBTableCell>
                      </LBTableRow>
                    ))}
                  </LBTableBody>
                </LBTable>
              </CardContent>
            </Card>
          )}
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4 pb-[100px]">
          {searchHistory.length === 0 ? (
            <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10"><CardContent className="text-center py-12"><Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" /><p className="text-gray-900 dark:text-white font-medium mb-2">No search history yet</p><p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">Run your first search to see your history here.</p><LBButton onClick={() => setActiveTab('search')} size="sm">Go to Search</LBButton></CardContent></Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-bold text-[24px]">Recent Searches ({searchHistory.length})</h3><span className="hidden md:block"><LBButton variant="outline" size="sm" onClick={() => { setSearchHistory([]); toast.success('Search history cleared'); }}><Trash2 className="w-3.5 h-3.5 mr-1.5" />Clear</LBButton></span></div>
              <div className="grid gap-4 pb-[100px]">
                {searchHistory.map((search) => (
                  <Card key={search.id} className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { if (onViewSearchResults) onViewSearchResults(search); }}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[14px] truncate">{search.automationName || search.searchName || search.location}</p>
                          {search.criteriaDescription && <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{search.criteriaDescription}</p>}
                          <p className="text-[12px] text-green-600 dark:text-green-400">{search.resultsCount} {search.resultsCount === 1 ? 'result' : 'results'}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <LBButton variant="primary" size="sm" className="hidden md:flex w-full justify-center" onClick={(e) => { e.stopPropagation(); if (onViewSearchResults) onViewSearchResults(search); }}><Eye className="w-3.5 h-3.5 mr-1" />View</LBButton>
                          <LBButton variant="outline" size="sm" className="w-full justify-center" onClick={(e) => { e.stopPropagation(); setCriteria(search.criteria); setActiveFilters(search.activeFilters || []); setActiveTab('search'); toast.success('Search criteria loaded'); }}><Play className="w-3.5 h-3.5 mr-1" />Run</LBButton>
                          <LBButton variant="ghost" size="sm" className="hidden md:flex w-full justify-center" onClick={(e) => { e.stopPropagation(); setSearchHistory(prev => prev.filter(s => s.id !== search.id)); toast.success('Removed from history'); }}><Trash2 className="w-3.5 h-3.5 text-red-500" /></LBButton>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {selectedListing && (<ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} onSaveListing={handleSaveListing} isSaved={isListingSaved(selectedListing.id)} />)}
      {selectedReport && selectedReportType === 'valuation' && (<PropertyValuationModal report={selectedReport} onClose={() => { setSelectedReport(null); setSelectedReportType(null); }} />)}
      {selectedReport && selectedReportType === 'property-history' && (<PropertyHistoryModal report={selectedReport} onClose={() => { setSelectedReport(null); setSelectedReportType(null); }} />)}

      <InteractiveWalkthroughOverlay isActive={isStepActive(2)} step={2} totalSteps={totalSteps} title="Add a location" description="Enter a city, ZIP, or address to narrow your search." highlightSelector="[data-walkthrough='location-section']" tooltipPosition="auto" mode="wait-for-blur" onSkip={skipWalkthrough} showSkip={true} />
      <InteractiveWalkthroughOverlay isActive={isStepActive(3)} step={3} totalSteps={totalSteps} title="Add search parameters" description="Set property type, price range, and listing details." highlightSelector="[data-walkthrough='search-criteria']" tooltipPosition="auto" mode="click-to-continue" onNext={() => completeStep(3)} onSkip={skipWalkthrough} showSkip={true} />
      <InteractiveWalkthroughOverlay isActive={isStepActive(4)} step={4} totalSteps={totalSteps} title="Search results" description="Results appear here. Use Save Search to reuse criteria, Automate to create a rule, or Export to download data." highlightSelector="[data-walkthrough='results-section']" tooltipPosition="auto" mode="click-to-continue" onNext={() => completeStep(4)} onSkip={skipWalkthrough} showSkip={true} />
      <InteractiveWalkthroughOverlay isActive={isStepActive(5)} step={5} totalSteps={totalSteps} title="Save a listing" description="Click Save, give it a name, and confirm." highlightSelector="[data-walkthrough='save-search-button']" tooltipPosition="auto" mode="wait-for-click" onSkip={skipWalkthrough} showSkip={true} />
      <InteractiveWalkthroughOverlay isActive={isStepActive(6)} step={6} totalSteps={totalSteps} title="Create your first automation" description="Click 'Create Automation' to set up automatic delivery of matching listings." highlightSelector="[data-walkthrough='create-automation-button']" tooltipPosition="auto" mode="wait-for-click" onSkip={skipWalkthrough} showSkip={true} />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Loader2 className="w-16 h-16 text-[#FFD447]" /></motion.div></div>
            <div className="space-y-4">
              {[{ icon: Database, label: 'Connecting to data sources', delay: 0 }, { icon: FileText, label: 'Fetching listing data', delay: 0.5 }, { icon: CheckCircle, label: 'Processing results', delay: 1 }].map((step) => (
                <motion.div key={step.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: step.delay, duration: 0.5 }} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ delay: step.delay + 0.5, duration: 1.5, repeat: Infinity, ease: "easeInOut" }}><step.icon className="w-6 h-6 text-[#342E37]" /></motion.div>
                  <div className="flex-1"><p className="text-[14px] font-medium text-gray-900">{step.label}</p></div>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: step.delay + 1, duration: 0.3 }}><div className="w-2 h-2 rounded-full bg-green-500" /></motion.div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><motion.div className="h-full bg-[#FFD447]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "easeInOut" }} /></div>
              <p className="text-center text-[12px] text-gray-600 mt-3">Searching {criteria.city ? `${criteria.city}${criteria.state ? `, ${criteria.state}` : ""}...` : "listings..."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
