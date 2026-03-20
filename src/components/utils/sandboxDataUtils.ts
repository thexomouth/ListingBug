/**
 * SANDBOX DATA UTILITIES
 * 
 * Pre-populates user account with sample data for returning users
 * Provides realistic demo data for testing and prototyping
 */

export interface SavedListing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number; // Changed from beds to bedrooms
  bathrooms: number; // Changed from baths to bathrooms
  sqft: number;
  status: 'Active' | 'Pending' | 'Foreclosure' | 'Pre-Foreclosure';
  listingType: 'Foreclosure' | 'Short Sale' | 'REO' | 'Standard';
  daysOnMarket: number;
  imageUrl?: string;
  listingPhoto?: string; // Primary photo URL for display
  photos?: string[]; // Array of photo URLs
  savedDate: string;
  notes?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  criteria: {
    state: string;
    city?: string;
    listingType: string[];
    priceMin?: number;
    priceMax?: number;
    bedsMin?: number;
    daysOnMarketMax?: number;
  };
  createdDate: string;
  lastRun?: string;
  resultsCount?: number;
}

export interface Automation {
  id: string;
  name: string;
  searchName: string;
  schedule: string;
  destination: { type: 'hubspot', label: 'HubSpot CRM' };
  active: boolean;
  lastRun: {
    date: string;
    status: 'success' | 'error';
    listingsSent: number;
  };
  nextRun: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'spreadsheet' | 'sms' | 'automation';
  status: 'connected' | 'disconnected' | 'error';
  connectedDate?: string;
  lastSync?: string;
  syncCount?: number;
}

/**
 * Generate sample saved listings
 */
export function generateSampleListings(count: number = 5): SavedListing[] {
  // Curated array of real house photos from Unsplash - each one is unique
  const housePhotos = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1762195804027-04a19d9d3ab6?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1659720879327-827462ca3942?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1674821770946-4f774b1907d7?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&q=80',
  ];
  
  const listings: SavedListing[] = [
    {
      id: 'listing-1',
      address: '2847 Riverside Drive',
      city: 'Austin',
      state: 'TX',
      zip: '78741',
      price: 675000,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      status: 'Foreclosure',
      listingType: 'Foreclosure',
      daysOnMarket: 12,
      listingPhoto: housePhotos[0],
      photos: [housePhotos[0]],
      savedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Great potential, needs minor repairs'
    },
    {
      id: 'listing-2',
      address: '1523 Oak Street',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      price: 425000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1850,
      status: 'Pre-Foreclosure',
      listingType: 'Pre-Foreclosure',
      daysOnMarket: 7,
      listingPhoto: housePhotos[1],
      photos: [housePhotos[1]],
      savedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Owner motivated to sell'
    },
    {
      id: 'listing-3',
      address: '892 Maple Avenue',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      price: 550000,
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 2100,
      status: 'Active',
      listingType: 'REO',
      daysOnMarket: 18,
      listingPhoto: housePhotos[2],
      photos: [housePhotos[2]],
      savedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'listing-4',
      address: '3456 Pine Lane',
      city: 'San Antonio',
      state: 'TX',
      zip: '78205',
      price: 385000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1650,
      status: 'Foreclosure',
      listingType: 'Foreclosure',
      daysOnMarket: 25,
      listingPhoto: housePhotos[3],
      photos: [housePhotos[3]],
      savedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Recently reduced price by $15k'
    },
    {
      id: 'listing-5',
      address: '789 Elm Court',
      city: 'Fort Worth',
      state: 'TX',
      zip: '76102',
      price: 725000,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      status: 'Active',
      listingType: 'Short Sale',
      daysOnMarket: 5,
      listingPhoto: housePhotos[4],
      photos: [housePhotos[4]],
      savedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Prime location, motivated seller'
    },
    {
      id: 'listing-6',
      address: '456 Cedar Drive',
      city: 'Plano',
      state: 'TX',
      zip: '75023',
      price: 495000,
      bedrooms: 4,
      bathrooms: 2.5,
      sqft: 2250,
      status: 'Pending',
      listingType: 'REO',
      daysOnMarket: 14,
      listingPhoto: housePhotos[5],
      photos: [housePhotos[5]],
      savedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'listing-7',
      address: '2109 Magnolia Boulevard',
      city: 'Arlington',
      state: 'TX',
      zip: '76001',
      price: 615000,
      bedrooms: 4,
      bathrooms: 3.5,
      sqft: 2850,
      status: 'Active',
      listingType: 'Foreclosure',
      daysOnMarket: 9,
      listingPhoto: housePhotos[6],
      photos: [housePhotos[6]],
      savedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Recently renovated kitchen'
    },
    {
      id: 'listing-8',
      address: '1876 Willow Creek Road',
      city: 'Frisco',
      state: 'TX',
      zip: '75034',
      price: 825000,
      bedrooms: 5,
      bathrooms: 4.5,
      sqft: 3600,
      status: 'Active',
      listingType: 'Standard',
      daysOnMarket: 3,
      listingPhoto: housePhotos[7],
      photos: [housePhotos[7]],
      savedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Pool and large backyard'
    }
  ];

  return listings.slice(0, count);
}

/**
 * Generate sample saved searches
 */
export function generateSampleSearches(count: number = 2): SavedSearch[] {
  const searches: SavedSearch[] = [
    {
      id: 'search-1',
      name: 'Austin Foreclosures Under $700k',
      criteria: {
        state: 'TX',
        city: 'Austin',
        listingType: ['Foreclosure', 'Pre-Foreclosure'],
        priceMax: 700000,
        bedsMin: 3,
        daysOnMarketMax: 30
      },
      createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      resultsCount: 147
    },
    {
      id: 'search-2',
      name: 'Dallas REO Properties',
      criteria: {
        state: 'TX',
        city: 'Dallas',
        listingType: ['REO'],
        priceMin: 300000,
        priceMax: 600000,
        bedsMin: 3
      },
      createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resultsCount: 89
    },
    {
      id: 'search-3',
      name: 'Houston Short Sales',
      criteria: {
        state: 'TX',
        city: 'Houston',
        listingType: ['Short Sale'],
        priceMax: 500000,
        daysOnMarketMax: 20
      },
      createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      resultsCount: 56
    }
  ];

  return searches.slice(0, count);
}

/**
 * Generate sample automation
 */
export function generateSampleAutomation(): any {
  return {
    id: '1',
    name: 'Daily Active Listings to MailChimp',
    searchName: 'Foreclosures - Miami Area',
    schedule: 'Daily at 8:00 AM PST',
    destination: { type: 'mailchimp', label: 'MailChimp' },
    active: true,
    status: 'running',
    lastRun: {
      date: new Date().toISOString(),
      status: 'success',
      listingsSent: 12
    },
    nextRun: 'Tomorrow at 8:00 AM'
  };
}

/**
 * Generate sample integrations
 */
export function generateSampleIntegrations(): Integration[] {
  return [
    {
      id: 'integration-1',
      name: 'Mailchimp',
      type: 'email',
      status: 'connected',
      connectedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastSync: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      syncCount: 10
    }
  ];
}

/**
 * Populate account with sandbox data for returning users
 */
export function populateSandboxData(options?: {
  listingsCount?: number;
  searchesCount?: number;
  includeAutomation?: boolean;
  includeIntegrations?: boolean;
}): void {
  const {
    listingsCount = 5,
    searchesCount = 2,
    includeAutomation = true,
    includeIntegrations = true
  } = options || {};

  // Generate and save listings
  const listings = generateSampleListings(listingsCount);
  localStorage.setItem('listingbug_saved_listings', JSON.stringify(listings));

  // Generate and save searches
  const searches = generateSampleSearches(searchesCount);
  localStorage.setItem('listingbug_saved_searches', JSON.stringify(searches));

  // Generate and save automation
  if (includeAutomation) {
    const automation = generateSampleAutomation();
    localStorage.setItem('listingbug_automations', JSON.stringify([automation]));
  }

  // Generate and save integrations
  if (includeIntegrations) {
    const integrations = generateSampleIntegrations();
    localStorage.setItem('listingbug_integrations', JSON.stringify(integrations));
  }

  console.log('✅ Sandbox data populated successfully!');
}

/**
 * Check if user should be treated as returning user
 */
export function isReturningUser(): boolean {
  return localStorage.getItem('listingbug_returning_user') === 'true';
}

/**
 * Mark user as returning user
 */
export function markAsReturningUser(): void {
  localStorage.setItem('listingbug_returning_user', 'true');
}

/**
 * Check if sandbox data should be loaded
 */
export function shouldLoadSandboxData(): boolean {
  // Check if user has returning flag but no data
  const isReturning = isReturningUser();
  const hasListings = localStorage.getItem('listingbug_saved_listings');
  const hasSearches = localStorage.getItem('listingbug_saved_searches');
  const hasAutomations = localStorage.getItem('listingbug_automations');
  
  // If returning user but no data exists, load sandbox data
  return isReturning && (!hasListings || !hasSearches || !hasAutomations);
}

/**
 * Initialize user data - either empty or with sandbox data
 */
export function initializeUserData(isFirstTime: boolean = false): void {
  if (isFirstTime) {
    // First-time user - initialize with empty data
    if (!localStorage.getItem('listingbug_saved_searches')) {
      localStorage.setItem('listingbug_saved_searches', JSON.stringify([]));
    }
    if (!localStorage.getItem('listingbug_saved_listings')) {
      localStorage.setItem('listingbug_saved_listings', JSON.stringify([]));
    }
    if (!localStorage.getItem('listingbug_automations')) {
      localStorage.setItem('listingbug_automations', JSON.stringify([]));
    }
    if (!localStorage.getItem('listingbug_integrations')) {
      localStorage.setItem('listingbug_integrations', JSON.stringify([]));
    }
    console.log('✅ Empty user data initialized for first-time user');
  } else {
    // Returning user - populate with sandbox data
    populateSandboxData({
      listingsCount: 5,
      searchesCount: 2,
      includeAutomation: true,
      includeIntegrations: true
    });
    console.log('✅ Sandbox data loaded for returning user');
  }
}

/**
 * Data version for migrations
 */
const CURRENT_DATA_VERSION = 2; // Incremented for unique photos fix

/**
 * Migrate existing saved listings to have unique photos
 */
export function migrateSavedListings(): void {
  const storedVersion = localStorage.getItem('listingbug_data_version');
  const currentVersion = storedVersion ? parseInt(storedVersion) : 0;
  
  if (currentVersion < CURRENT_DATA_VERSION) {
    console.log('🔄 Migrating saved listings data...');
    
    // Get existing saved listings
    const savedListingsStr = localStorage.getItem('listingbug_saved_listings');
    if (savedListingsStr) {
      try {
        const savedListings = JSON.parse(savedListingsStr);
        
        // Unique photos array
        const housePhotos = [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1762195804027-04a19d9d3ab6?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1659720879327-827462ca3942?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1674821770946-4f774b1907d7?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&q=80',
        ];
        
        // Update each listing with unique photo and fix property names
        const updatedListings = savedListings.map((listing: any, index: number) => ({
          ...listing,
          listingPhoto: housePhotos[index % housePhotos.length],
          photos: [housePhotos[index % housePhotos.length]],
          // Fix property names if needed
          bedrooms: listing.bedrooms || listing.beds,
          bathrooms: listing.bathrooms || listing.baths,
          // Remove old property names
          beds: undefined,
          baths: undefined,
        }));
        
        // Save updated listings
        localStorage.setItem('listingbug_saved_listings', JSON.stringify(updatedListings));
        console.log('✅ Saved listings migrated with unique photos');
      } catch (e) {
        console.error('❌ Error migrating saved listings:', e);
      }
    }
    
    // Update data version
    localStorage.setItem('listingbug_data_version', CURRENT_DATA_VERSION.toString());
    console.log('✅ Data migration complete');
  }
}