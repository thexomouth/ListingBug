import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { LBButton } from './design-system/LBButton';
import { LBToggle } from './design-system/LBToggle';
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

export function SearchListings({ onAddToMyReports, onNavigate }: SearchListingsProps = {}) {
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'listings' | 'history'>('search');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'valuation' | 'property-history' | null>(null);
  
  // Walkthrough integration
  const { isStepActive, completeStep, skipWalkthrough, totalSteps, previousStep, walkthroughActive, currentStep } = useWalkthrough();
  
  // Track if location field has been interacted with for Step 3 trigger
  const [locationFieldBlurred, setLocationFieldBlurred] = useState(false);
  
  // Track if search has been performed for Step 4 trigger  
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Check if we should open saved listings tab (from dashboard navigation)
  useEffect(() => {
    const shouldOpenSaved = sessionStorage.getItem('listingbug_open_saved_tab');
    if (shouldOpenSaved === 'true') {
      setActiveTab('saved');
      sessionStorage.removeItem('listingbug_open_saved_tab');
    }
  }, []);
  
  // Walkthrough: Auto-resume and advance on page load
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('listingbug_walkthrough_step') || '0');
    const completed = localStorage.getItem('listingbug_walkthrough_completed') === 'true';
    
    console.log('ðŸ” SearchListings mounted - Walkthrough state:', { 
      walkthroughActive, 
      currentStep, 
      savedStep,
      completed 
    });
    
    // If user just navigated here from Dashboard (step 1), advance to step 2
    if (!completed && currentStep === 1 && walkthroughActive) {
      console.log('âœ… Advancing from Step 1 â†’ Step 2 (user navigated to Search Listings)');
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
    propertyType: '',
    status: '',
    beds: '',
    baths: '',
    minPrice: '',
    maxPrice: '',
    pricePerSqFt: '',
    yearBuilt: '',
    daysOld: '',
    reListedProperty: false,
    priceDrop: false,
    newConstruction: false,
    foreclosure: false,
  });

  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [includeIncompleteData, setIncludeIncompleteData] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showComplexFilterModal, setShowComplexFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Listings synced tracking
  const [listingsSynced, setListingsSynced] = useState(3542);
  const [listingsCap] = useState(4000);
  const resetDate = '04/27/25';
  
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
    { id: 'sample-preview', address: 'â€”', city: 'â€”', price: 0, yearBuilt: 'â€”', agentName: 'â€”', daysListed: 'â€”', reList: false, priceDrop: false, status: 'â€”' },
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
    setSearchPerformed(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.style.overflow = 'hidden';
    setIsLoading(true);

    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const body: Record<string, any> = {
        listingType: 'sale',
        status: 'Active',
        limit: 50,
      };
      if (criteria.city) body.city = criteria.city;
      if (criteria.state) body.state = criteria.state;
      if (criteria.zip) body.zipCode = criteria.zip;
      if (criteria.address) body.address = criteria.address;
      if (criteria.propertyType) body.propertyType = criteria.propertyType;
      if (criteria.beds) body.bedrooms = criteria.beds;
      if (criteria.baths) body.bathrooms = criteria.baths;
      if (criteria.minPrice) body.minPrice = Number(criteria.minPrice);
      if (criteria.maxPrice) body.maxPrice = Number(criteria.maxPrice);
      if (criteria.radius) body.radius = Number(criteria.radius);
      if (criteria.latitude) body.latitude = Number(criteria.latitude);
      if (criteria.longitude) body.longitude = Number(criteria.longitude);

      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/search-listings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Search failed. Please try again.');
        setIsLoading(false);
        document.body.style.overflow = 'unset';
        return;
      }

      const finalResults = (data.listings || []).map((l: any, i: number) => ({
        id: l.id || i,
        address: l.addressLine1 || l.formattedAddress || '',
        city: l.city || '',
        state: l.state || '',
        zip: l.zipCode || '',
        propertyType: l.propertyType || 'Single Family',
        bedrooms: l.bedrooms || 0,
        bathrooms: l.bathrooms || 0,
        sqft: l.squareFootage || 0,
        lotSize: l.lotSize || 0,
        yearBuilt: l.yearBuilt || 0,
        status: l.status || 'Active',
        price: l.price || 0,
        daysListed: l.daysOnMarket || 0,
        agentName: l.agentName || '',
        agentPhone: l.agentPhone || '',
        agentEmail: l.agentEmail || '',
        brokerage: l.officeName || l.brokerName || '',
        reList: false,
        priceDrop: l.priceReduced || false,
        priceDropAmount: 0,
        priceDropPercent: 0,
        latitude: l.latitude || 0,
        longitude: l.longitude || 0,
        description: l.description || '',
        photos: l.photos || [],
        mlsNumber: l.mlsNumber || '',
        mlsSource: '',
      }));

      setResults(finalResults);
      setHasSearched(true);
      setIsLoading(false);
      setCurrentPage(1);
      setListingsSynced(prev => Math.min(prev + finalResults.length, listingsCap));
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
        id: Date.now().toString(),
        criteria: { ...criteria },
        activeFilters: [...(activeFilters || [])],
        location,
        criteriaDescription,
        resultsCount: finalResults.length,
        searchDate: new Date().toISOString(),
      };
      setSearchHistory(prev => [historyEntry, ...prev.slice(0, 49)]);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      toast.error('Search failed. Please try again.');
      setIsLoading(false);
      document.body.style.overflow = 'unset';
    }
  };

  const handleDownloadCSV = () => {
    // Generate CSV content
    const headers = ['Address', 'City', 'State', 'Zip', 'Price', 'Beds', 'Baths', 'Days Listed'];
    const rows = results.map(r => [
      r.address, r.city, r.state, r.zipCode, 
      `$${r.price.toLocaleString()}`, r.beds, r.baths, r.daysListed
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listing-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV downloaded successfully');
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

  const handleConfirmSaveSearch = () => {
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
      id: Date.now().toString(),
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

  const handleDeleteSavedSearch = (id: string) => {
    const search = savedSearches.find(s => s.id === id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
    toast.success(`Deleted search "${search?.name}"`);
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

  const handleSaveListing = (listing: any) => {
    const isAlreadySaved = savedListings.some(l => l.id === listing.id);
    
    if (isAlreadySaved) {
      // Remove from saved
      setSavedListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success('Listing removed from saved');
    } else {
      // Add to saved
      const savedListing = {
        ...listing,
        savedAt: new Date().toISOString()
      };
      setSavedListings(prev => [savedListing, ...prev]);
      toast.success('Listing saved successfully!');
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
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
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
              
              {/* Address - Full Width Row */}
              <div className="mb-2">
                <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                  label="Address"
                  value={criteria.address}
                  onChange={(e) => updateCriteria('address', e.target.value)}
                  onBlur={() => setLocationFieldBlurred(true)}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              
              {/* City, State, ZIP, Search Radius - Below Address */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                  label="City"
                  value={criteria.city}
                  onChange={(e) => updateCriteria('city', e.target.value)}
                  onBlur={() => setLocationFieldBlurred(true)}
                  placeholder="Los Angeles"
                />
                <LBInput
                  label="State"
                  value={criteria.state}
                  onChange={(e) => updateCriteria('state', e.target.value)}
                  onBlur={() => setLocationFieldBlurred(true)}
                  placeholder="CA"
                />
                <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                  label="ZIP Code"
                  value={criteria.zip}
                  onChange={(e) => updateCriteria('zip', e.target.value)}
                  onBlur={() => setLocationFieldBlurred(true)}
                  placeholder="90001"
                />
                <LBInput
                  label="Search Radius (mi)"
                  value={criteria.radius}
                  onChange={(e) => updateCriteria('radius', e.target.value)}
                  onBlur={() => setLocationFieldBlurred(true)}
                  placeholder="5"
                />
              </div>
              
              {/* Latitude, Longitude - Always Visible */}
              <div className="grid grid-cols-2 gap-2">
                <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                  label="Latitude"
                  value={criteria.latitude}
                  onChange={(e) => updateCriteria('latitude', e.target.value)}
                  placeholder="34.0522"
                />
                <LBInput
                  label="Longitude"
                  value={criteria.longitude}
                  onChange={(e) => updateCriteria('longitude', e.target.value)}
                  placeholder="-118.2437"
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
                  <div className="grid grid-cols-2 gap-2">
                    <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                      label="Bedrooms"
                      value={criteria.beds}
                      onChange={(e) => updateCriteria('beds', e.target.value)}
                      placeholder="3 or 3-5"
                    />
                    <LBInput
                      label="Bathrooms"
                      value={criteria.baths}
                      onChange={(e) => updateCriteria('baths', e.target.value)}
                      placeholder="2 or 2-3"
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
                  <LBInput className="mx-[0px] mt-[0px] mb-[12px]"
                    label="Price per Sq Ft"
                    value={criteria.pricePerSqFt}
                    onChange={(e) => updateCriteria('pricePerSqFt', e.target.value)}
                    placeholder="200-400"
                  />
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
                      Results: {results.length} listings
                    </span>
                  )}
                </div>
                {/* Listings synced footnote */}
                <p className="text-[11px] text-gray-500 text-center">
                  {listingsSynced.toLocaleString()} / {listingsCap.toLocaleString()} listings. Resets {resetDate}.
                </p>
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
                Results: {results.length} listings
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

        </>
      ) : activeTab === 'saved' ? (
        /* Saved Searches Tab */
        <div className="space-y-4">
          {savedSearches.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
              <Save className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No saved searches yet</p>
              <p className="text-[13px] text-gray-500 mb-4">
                Save your search criteria to quickly access them later or create automations
              </p>
              <LBButton onClick={() => setActiveTab('search')} size="sm">
                Go to Search
              </LBButton>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[24px]">Your Saved Searches ({savedSearches.length})</h3>
              </div>
              <div className="grid gap-4">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-[16px] mb-1">{search.name}</h4>
                        <p className="text-[13px] text-gray-600 mb-1">{search.location}</p>
                        <p className="text-[13px] text-gray-500">{search.criteriaDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-[12px] text-gray-500">
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'listings' ? (
        /* Saved Listings Tab */
        <div className="space-y-4">
          {savedListings.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
              <Save className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No saved listings yet</p>
              <p className="text-[13px] text-gray-500 mb-4">
                Save listings from search results to review them later
              </p>
              <LBButton onClick={() => setActiveTab('search')} size="sm">
                Go to Search
              </LBButton>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[24px]">Saved Listings ({savedListings.length})</h3>
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
                      className="cursor-pointer hover:bg-gray-50"
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
                              ? 'bg-green-100 text-green-800'
                              : listing.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </LBTableCell>
                      <LBTableCell className="text-[13px] text-gray-600">
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
            </>
          )}
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4">
          {searchHistory.length === 0 && reportHistory.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No search history yet</p>
              <p className="text-[13px] text-gray-500 mb-4">
                Your recent searches and reports will appear here
              </p>
              <LBButton onClick={() => setActiveTab('search')} size="sm">
                Go to Search
              </LBButton>
            </div>
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
                  <div className="grid gap-4">
                    {searchHistory.map((search) => (
                      <div
                        key={search.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-[16px] mb-1">{search.location}</p>
                            <p className="text-[13px] text-gray-600 mb-1">{search.criteriaDescription}</p>
                            <p className="text-[13px] text-green-600">
                              {search.resultsCount} {search.resultsCount === 1 ? 'result' : 'results'} found
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="text-[12px] text-gray-500">
                            {new Date(search.searchDate).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <LBButton
                              variant="outline"
                              size="sm"
                              onClick={() => {
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
                              onClick={() => {
                                setSearchHistory(prev => prev.filter(s => s.id !== search.id));
                                toast.success('Removed from history');
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </LBButton>
                          </div>
                        </div>
                      </div>
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
                {[criteria.city, criteria.state].filter(Boolean).join(', ') || 'Custom search'} â€¢ 
                {criteria.propertyType || 'All types'} â€¢ 
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
                  <div className="flex-1">\n                    <p className="text-[14px] font-medium text-gray-900">{step.label}</p>
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
                Searching for listings...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
