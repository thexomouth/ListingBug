import { ComprehensiveListing, SampleListing } from '../types/listing';
import { mockListings } from '../data/mockListings';

// Convert comprehensive listing to sample listing (removes contact emails and phones)
export function convertToSampleListing(listing: ComprehensiveListing): SampleListing {
  return {
    // Location Information
    id: listing.id,
    formattedAddress: listing.formattedAddress,
    addressLine1: listing.addressLine1,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    county: listing.county,
    latitude: listing.latitude,
    longitude: listing.longitude,

    // Property Details
    propertyType: listing.propertyType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    squareFeet: listing.squareFeet,
    lotSize: listing.lotSize,
    yearBuilt: listing.yearBuilt,

    // Listing Information
    price: listing.price,
    status: listing.status,
    daysOnMarket: listing.daysOnMarket,
    listingDate: listing.listingDate,
    lastSeenDate: listing.lastSeenDate,
    removedDate: listing.removedDate,
    createdDate: listing.createdDate,

    // Agent Information (name and website only - no email/phone)
    agentName: listing.agentName,
    agentWebsite: listing.agentWebsite,

    // Office Information (name and website only - no email/phone)
    officeName: listing.officeName,
    officeWebsite: listing.officeWebsite,
    brokerName: listing.brokerName,

    // MLS Information
    mlsNumber: listing.mlsNumber,
    mlsName: listing.mlsName,

    // Builder Information (name only - no email/phone)
    builderName: listing.builderName,
  };
}

// Generate sample listings based on ZIP code
export function generateSampleListingsByZip(zipcode: string): SampleListing[] {
  // Filter listings by ZIP code or use all if no exact match
  const filtered = mockListings.filter(l => l.zipCode === zipcode);
  const listingsToUse = filtered.length > 0 ? filtered : mockListings.slice(0, 8);
  
  return listingsToUse.map(convertToSampleListing);
}

// Generate comprehensive listings based on report filters
export function generateComprehensiveListings(filters: {
  zipCode?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  beds?: string;
  baths?: string;
}): ComprehensiveListing[] {
  let filtered = [...mockListings];

  // Apply filters
  if (filters.zipCode) {
    filtered = filtered.filter(l => l.zipCode === filters.zipCode);
  }

  if (filters.city) {
    filtered = filtered.filter(l => 
      l.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  if (filters.state) {
    filtered = filtered.filter(l => 
      l.state.toLowerCase() === filters.state!.toLowerCase()
    );
  }

  if (filters.minPrice) {
    const minPrice = typeof filters.minPrice === 'string' 
      ? parseFloat(filters.minPrice) 
      : filters.minPrice;
    filtered = filtered.filter(l => l.price >= minPrice);
  }

  if (filters.maxPrice) {
    const maxPrice = typeof filters.maxPrice === 'string'
      ? parseFloat(filters.maxPrice)
      : filters.maxPrice;
    filtered = filtered.filter(l => l.price <= maxPrice);
  }

  if (filters.propertyType) {
    filtered = filtered.filter(l => 
      l.propertyType.toLowerCase().includes(filters.propertyType!.toLowerCase())
    );
  }

  if (filters.beds) {
    const bedsNum = parseInt(filters.beds.replace('+', ''));
    if (!isNaN(bedsNum)) {
      filtered = filtered.filter(l => l.bedrooms >= bedsNum);
    }
  }

  if (filters.baths) {
    const bathsNum = parseFloat(filters.baths.replace('+', ''));
    if (!isNaN(bathsNum)) {
      filtered = filtered.filter(l => l.bathrooms >= bathsNum);
    }
  }

  // Return filtered results or a subset of mock data if no matches
  return filtered.length > 0 ? filtered : mockListings.slice(0, 12);
}
