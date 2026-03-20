// Mock data representing property listing data from online sources
import { ComprehensiveListing } from '../types/listing';

export { type ComprehensiveListing };

export const mockListings: ComprehensiveListing[] = [
  {
    // Location Information
    id: "LST-2024-001",
    formattedAddress: "123 Oak Street, San Francisco, CA 94102",
    addressLine1: "123 Oak Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    county: "San Francisco County",
    latitude: 37.7749,
    longitude: -122.4194,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    lotSize: 4500,
    yearBuilt: 2015,
    
    // Listing Information
    price: 1250000,
    status: "Active",
    daysOnMarket: 8,
    listingDate: "2024-11-15",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-15",
    
    // Agent Information
    agentName: "Sarah Johnson",
    agentEmail: "sarah.johnson@realty.com",
    agentPhone: "(415) 555-0123",
    agentWebsite: "https://sarahjohnson.realty.com",
    
    // Office Information
    officeName: "Bay Area Realty",
    officeEmail: "info@bayarearealty.com",
    officePhone: "(415) 555-0100",
    officeWebsite: "https://bayarearealty.com",
    brokerName: "Michael Thompson",
    
    // MLS Information
    mlsNumber: "MLS-98765432",
    mlsName: "San Francisco MLS",
    
    // Builder Information
    builderName: "Pacific Coast Builders",
    builderPhone: "(415) 555-0200",
    builderEmail: "info@pacificcoastbuilders.com"
  },
  {
    // Location Information
    id: "LST-2024-002",
    formattedAddress: "456 Maple Avenue, Austin, TX 78701",
    addressLine1: "456 Maple Avenue",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    county: "Travis County",
    latitude: 30.2672,
    longitude: -97.7431,
    
    // Property Details
    propertyType: "Condo",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    lotSize: 0,
    yearBuilt: 2020,
    
    // Listing Information
    price: 575000,
    status: "Active",
    daysOnMarket: 13,
    listingDate: "2024-11-10",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-10",
    
    // Agent Information
    agentName: "Michael Chen",
    agentEmail: "m.chen@austinrealty.com",
    agentPhone: "(512) 555-0456",
    agentWebsite: "https://michaelchen.austinrealty.com",
    
    // Office Information
    officeName: "Austin Premier Realty",
    officeEmail: "contact@austinpremier.com",
    officePhone: "(512) 555-0400",
    officeWebsite: "https://austinpremierrealty.com",
    brokerName: "Jennifer Martinez",
    
    // MLS Information
    mlsNumber: "MLS-87654321",
    mlsName: "Austin Board of Realtors",
    
    // Builder Information
    builderName: null,
    builderPhone: null,
    builderEmail: null
  },
  {
    // Location Information
    id: "LST-2024-003",
    formattedAddress: "789 Pine Boulevard, Seattle, WA 98101",
    addressLine1: "789 Pine Boulevard",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    county: "King County",
    latitude: 47.6062,
    longitude: -122.3321,
    
    // Property Details
    propertyType: "Townhouse",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2100,
    lotSize: 2200,
    yearBuilt: 2018,
    
    // Listing Information
    price: 925000,
    status: "Active",
    daysOnMarket: 5,
    listingDate: "2024-11-18",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-18",
    
    // Agent Information
    agentName: "Emily Rodriguez",
    agentEmail: "emily.r@seattlehomes.com",
    agentPhone: "(206) 555-0789",
    agentWebsite: "https://emilyrodriguez.seattlehomes.com",
    
    // Office Information
    officeName: "Seattle Homes Group",
    officeEmail: "info@seattlehomesgroup.com",
    officePhone: "(206) 555-0700",
    officeWebsite: "https://seattlehomesgroup.com",
    brokerName: "Robert Wilson",
    
    // MLS Information
    mlsNumber: "MLS-76543210",
    mlsName: "Northwest Multiple Listing Service",
    
    // Builder Information
    builderName: "Emerald City Construction",
    builderPhone: "(206) 555-0800",
    builderEmail: "contact@emeraldcityconst.com"
  },
  {
    // Location Information
    id: "LST-2024-004",
    formattedAddress: "321 Elm Court, Denver, CO 80202",
    addressLine1: "321 Elm Court",
    city: "Denver",
    state: "CO",
    zipCode: "80202",
    county: "Denver County",
    latitude: 39.7392,
    longitude: -104.9903,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    lotSize: 6000,
    yearBuilt: 2017,
    
    // Listing Information
    price: 685000,
    status: "Active",
    daysOnMarket: 11,
    listingDate: "2024-11-12",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-12",
    
    // Agent Information
    agentName: "David Martinez",
    agentEmail: "david.martinez@denverrealty.com",
    agentPhone: "(303) 555-0321",
    agentWebsite: "https://davidmartinez.denverrealty.com",
    
    // Office Information
    officeName: "Denver Real Estate Co",
    officeEmail: "info@denverrealestateco.com",
    officePhone: "(303) 555-0300",
    officeWebsite: "https://denverrealestateco.com",
    brokerName: "Amanda Davis",
    
    // MLS Information
    mlsNumber: "MLS-65432109",
    mlsName: "REcolorado",
    
    // Builder Information
    builderName: "Rocky Mountain Homes",
    builderPhone: "(303) 555-0900",
    builderEmail: "info@rockymountainhomes.com"
  },
  {
    // Location Information
    id: "LST-2024-005",
    formattedAddress: "555 Birch Lane, Portland, OR 97201",
    addressLine1: "555 Birch Lane",
    city: "Portland",
    state: "OR",
    zipCode: "97201",
    county: "Multnomah County",
    latitude: 45.5152,
    longitude: -122.6784,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1950,
    lotSize: 5500,
    yearBuilt: 2016,
    
    // Listing Information
    price: 795000,
    status: "Active",
    daysOnMarket: 15,
    listingDate: "2024-11-08",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-08",
    
    // Agent Information
    agentName: "Jennifer Wu",
    agentEmail: "jwu@portlandrealty.com",
    agentPhone: "(503) 555-0555",
    agentWebsite: "https://jenniferwu.portlandrealty.com",
    
    // Office Information
    officeName: "Portland Properties",
    officeEmail: "info@portlandproperties.com",
    officePhone: "(503) 555-0500",
    officeWebsite: "https://portlandproperties.com",
    brokerName: "Christopher Lee",
    
    // MLS Information
    mlsNumber: "MLS-54321098",
    mlsName: "Regional Multiple Listing Service",
    
    // Builder Information
    builderName: "Rose City Builders",
    builderPhone: "(503) 555-1000",
    builderEmail: "contact@rosecitybuilders.com"
  },
  {
    // Location Information
    id: "LST-2024-006",
    formattedAddress: "888 Cedar Drive, San Francisco, CA 94103",
    addressLine1: "888 Cedar Drive",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103",
    county: "San Francisco County",
    latitude: 37.7699,
    longitude: -122.4098,
    
    // Property Details
    propertyType: "Condo",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1500,
    lotSize: 0,
    yearBuilt: 2021,
    
    // Listing Information
    price: 1450000,
    status: "Active",
    daysOnMarket: 4,
    listingDate: "2024-11-19",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-19",
    
    // Agent Information
    agentName: "Robert Taylor",
    agentEmail: "rtaylor@sfhomes.com",
    agentPhone: "(415) 555-0888",
    agentWebsite: "https://roberttaylor.sfhomes.com",
    
    // Office Information
    officeName: "San Francisco Luxury Homes",
    officeEmail: "info@sfluxuryhomes.com",
    officePhone: "(415) 555-0850",
    officeWebsite: "https://sfluxuryhomes.com",
    brokerName: "Patricia Anderson",
    
    // MLS Information
    mlsNumber: "MLS-43210987",
    mlsName: "San Francisco MLS",
    
    // Builder Information
    builderName: null,
    builderPhone: null,
    builderEmail: null
  },
  {
    // Location Information
    id: "LST-2024-007",
    formattedAddress: "234 Willow Street, Austin, TX 78702",
    addressLine1: "234 Willow Street",
    city: "Austin",
    state: "TX",
    zipCode: "78702",
    county: "Travis County",
    latitude: 30.2584,
    longitude: -97.7289,
    
    // Property Details
    propertyType: "Townhouse",
    bedrooms: 2,
    bathrooms: 1.5,
    squareFeet: 1100,
    lotSize: 1500,
    yearBuilt: 2019,
    
    // Listing Information
    price: 425000,
    status: "Active",
    daysOnMarket: 9,
    listingDate: "2024-11-14",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-14",
    
    // Agent Information
    agentName: "Lisa Anderson",
    agentEmail: "l.anderson@austinproperties.com",
    agentPhone: "(512) 555-0234",
    agentWebsite: "https://lisaanderson.austinproperties.com",
    
    // Office Information
    officeName: "Austin Properties Group",
    officeEmail: "contact@austinpropertiesgroup.com",
    officePhone: "(512) 555-0230",
    officeWebsite: "https://austinpropertiesgroup.com",
    brokerName: "Thomas Garcia",
    
    // MLS Information
    mlsNumber: "MLS-32109876",
    mlsName: "Austin Board of Realtors",
    
    // Builder Information
    builderName: "Texas Hill Country Homes",
    builderPhone: "(512) 555-1100",
    builderEmail: "info@texashillcountryhomes.com"
  },
  {
    // Location Information
    id: "LST-2024-008",
    formattedAddress: "777 Spruce Avenue, Denver, CO 80203",
    addressLine1: "777 Spruce Avenue",
    city: "Denver",
    state: "CO",
    zipCode: "80203",
    county: "Denver County",
    latitude: 39.7294,
    longitude: -104.9692,
    
    // Property Details
    propertyType: "Condo",
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1300,
    lotSize: 0,
    yearBuilt: 2020,
    
    // Listing Information
    price: 515000,
    status: "Active",
    daysOnMarket: 7,
    listingDate: "2024-11-16",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-16",
    
    // Agent Information
    agentName: "James Wilson",
    agentEmail: "jwilson@denverproperties.com",
    agentPhone: "(303) 555-0777",
    agentWebsite: "https://jameswilson.denverproperties.com",
    
    // Office Information
    officeName: "Denver Metro Realty",
    officeEmail: "info@denvermetrorealty.com",
    officePhone: "(303) 555-0750",
    officeWebsite: "https://denvermetrorealty.com",
    brokerName: "Michelle Brown",
    
    // MLS Information
    mlsNumber: "MLS-21098765",
    mlsName: "REcolorado",
    
    // Builder Information
    builderName: null,
    builderPhone: null,
    builderEmail: null
  },
  {
    // Location Information
    id: "LST-2024-009",
    formattedAddress: "999 Redwood Place, Seattle, WA 98102",
    addressLine1: "999 Redwood Place",
    city: "Seattle",
    state: "WA",
    zipCode: "98102",
    county: "King County",
    latitude: 47.6299,
    longitude: -122.3206,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 2800,
    lotSize: 7500,
    yearBuilt: 2014,
    
    // Listing Information
    price: 1125000,
    status: "Active",
    daysOnMarket: 12,
    listingDate: "2024-11-11",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-11",
    
    // Agent Information
    agentName: "Amanda Clark",
    agentEmail: "aclark@seattlerealty.com",
    agentPhone: "(206) 555-0999",
    agentWebsite: "https://amandaclark.seattlerealty.com",
    
    // Office Information
    officeName: "Seattle Elite Properties",
    officeEmail: "info@seattleelite.com",
    officePhone: "(206) 555-0950",
    officeWebsite: "https://seattleeliteproperties.com",
    brokerName: "Daniel Kim",
    
    // MLS Information
    mlsNumber: "MLS-10987654",
    mlsName: "Northwest Multiple Listing Service",
    
    // Builder Information
    builderName: "Puget Sound Builders",
    builderPhone: "(206) 555-1200",
    builderEmail: "info@pugetsoundbuilders.com"
  },
  {
    // Location Information
    id: "LST-2024-010",
    formattedAddress: "432 Aspen Way, Portland, OR 97202",
    addressLine1: "432 Aspen Way",
    city: "Portland",
    state: "OR",
    zipCode: "97202",
    county: "Multnomah County",
    latitude: 45.4845,
    longitude: -122.6399,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1750,
    lotSize: 4800,
    yearBuilt: 2019,
    
    // Listing Information
    price: 635000,
    status: "Active",
    daysOnMarket: 6,
    listingDate: "2024-11-17",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-17",
    
    // Agent Information
    agentName: "Christopher Lee",
    agentEmail: "clee@portlandhomes.com",
    agentPhone: "(503) 555-0432",
    agentWebsite: "https://christopherlee.portlandhomes.com",
    
    // Office Information
    officeName: "Portland Dream Homes",
    officeEmail: "info@portlanddreamhomes.com",
    officePhone: "(503) 555-0430",
    officeWebsite: "https://portlanddreamhomes.com",
    brokerName: "Laura White",
    
    // MLS Information
    mlsNumber: "MLS-09876543",
    mlsName: "Regional Multiple Listing Service",
    
    // Builder Information
    builderName: "Cascadia Home Builders",
    builderPhone: "(503) 555-1300",
    builderEmail: "info@cascadiahomebuilders.com"
  },
  {
    // Location Information
    id: "LST-2024-011",
    formattedAddress: "654 Cypress Street, San Francisco, CA 94104",
    addressLine1: "654 Cypress Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94104",
    county: "San Francisco County",
    latitude: 37.7915,
    longitude: -122.4037,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3200,
    lotSize: 6500,
    yearBuilt: 2013,
    
    // Listing Information
    price: 2100000,
    status: "Active",
    daysOnMarket: 10,
    listingDate: "2024-11-13",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-13",
    
    // Agent Information
    agentName: "Michelle Brown",
    agentEmail: "mbrown@bayrealty.com",
    agentPhone: "(415) 555-0654",
    agentWebsite: "https://michellebrown.bayrealty.com",
    
    // Office Information
    officeName: "Bay Area Premier Real Estate",
    officeEmail: "info@bayareapremier.com",
    officePhone: "(415) 555-0650",
    officeWebsite: "https://bayareapremier.com",
    brokerName: "Steven Harris",
    
    // MLS Information
    mlsNumber: "MLS-98765432",
    mlsName: "San Francisco MLS",
    
    // Builder Information
    builderName: "Golden Gate Construction",
    builderPhone: "(415) 555-1400",
    builderEmail: "info@goldengateconstruction.com"
  },
  {
    // Location Information
    id: "LST-2024-012",
    formattedAddress: "876 Magnolia Drive, Austin, TX 78703",
    addressLine1: "876 Magnolia Drive",
    city: "Austin",
    state: "TX",
    zipCode: "78703",
    county: "Travis County",
    latitude: 30.2919,
    longitude: -97.7667,
    
    // Property Details
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2200,
    lotSize: 5200,
    yearBuilt: 2018,
    
    // Listing Information
    price: 825000,
    status: "Active",
    daysOnMarket: 14,
    listingDate: "2024-11-09",
    lastSeenDate: "2024-11-23",
    removedDate: null,
    createdDate: "2024-11-09",
    
    // Agent Information
    agentName: "Kevin Patel",
    agentEmail: "kpatel@austinhomes.com",
    agentPhone: "(512) 555-0876",
    agentWebsite: "https://kevinpatel.austinhomes.com",
    
    // Office Information
    officeName: "Austin Home Solutions",
    officeEmail: "info@austinhomesolutions.com",
    officePhone: "(512) 555-0870",
    officeWebsite: "https://austinhomesolutions.com",
    brokerName: "Rachel Green",
    
    // MLS Information
    mlsNumber: "MLS-87654321",
    mlsName: "Austin Board of Realtors",
    
    // Builder Information
    builderName: "Lone Star Custom Homes",
    builderPhone: "(512) 555-1500",
    builderEmail: "info@lonestarcustomhomes.com"
  }
];

// Helper functions for filtering
export const getUniqueZipCodes = (): string[] => {
  return Array.from(new Set(mockListings.map(listing => listing.zipCode))).sort();
};

export const getUniquePropertyTypes = (): string[] => {
  return Array.from(new Set(mockListings.map(listing => listing.propertyType))).sort();
};

export const filterListings = (
  listings: ComprehensiveListing[],
  filters: {
    zipCode?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    searchQuery?: string;
  }
): ComprehensiveListing[] => {
  return listings.filter(listing => {
    // Zip code filter
    if (filters.zipCode && listing.zipCode !== filters.zipCode) {
      return false;
    }

    // Price range filter
    if (filters.minPrice && listing.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && listing.price > filters.maxPrice) {
      return false;
    }

    // Property type filter
    if (filters.propertyType && listing.propertyType !== filters.propertyType) {
      return false;
    }

    // Search query filter (searches address, city, state)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = `${listing.formattedAddress} ${listing.city} ${listing.state}`.toLowerCase();
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
};