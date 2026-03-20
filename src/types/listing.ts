// Comprehensive listing interface with all 37 data fields from our data sources
export interface ComprehensiveListing {
  // Location Information (9 fields)
  id: string;                      // Unique ID
  formattedAddress: string;        // Formatted Address
  addressLine1: string;            // Address Line 1
  city: string;                    // City
  state: string;                   // State
  zipCode: string;                 // ZIP Code
  county: string;                  // County
  latitude: number;                // Latitude
  longitude: number;               // Longitude

  // Property Details (6 fields)
  propertyType: string;            // Property Type
  bedrooms: number;                // Bedrooms
  bathrooms: number;               // Bathrooms
  squareFeet: number;              // Square Footage
  lotSize: number;                 // Lot Size (in sq ft)
  yearBuilt: number;               // Year Built

  // Listing Information (7 fields)
  price: number;                   // Price
  status: string;                  // Status
  daysOnMarket: number;            // Days on Market
  listingDate: string;             // Listing Date
  lastSeenDate: string;            // Last Seen Date
  removedDate: string | null;      // Removed Date
  createdDate: string;             // Created Date

  // Agent Information (4 fields)
  agentName: string;               // Agent Name
  agentEmail: string;              // Agent Email
  agentPhone: string;              // Agent Phone
  agentWebsite: string;            // Agent Website

  // Office Information (5 fields)
  officeName: string;              // Office Name
  officeEmail: string;             // Office Email
  officePhone: string;             // Office Phone
  officeWebsite: string;           // Office Website
  brokerName: string;              // Broker Name

  // MLS Information (2 fields)
  mlsNumber: string;               // MLS Number
  mlsName: string;                 // MLS Name

  // Builder Information (3 fields)
  builderName: string | null;      // Builder Name
  builderPhone: string | null;     // Builder Phone
  builderEmail: string | null;     // Builder Email
}

// Sample listing for display (excludes contact emails and phones)
export interface SampleListing {
  // Location Information
  id: string;
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  latitude: number;
  longitude: number;

  // Property Details
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;

  // Listing Information
  price: number;
  status: string;
  daysOnMarket: number;
  listingDate: string;
  lastSeenDate: string;
  removedDate: string | null;
  createdDate: string;

  // Agent Information (name and website only - no email/phone)
  agentName: string;
  agentWebsite: string;

  // Office Information (name and website only - no email/phone)
  officeName: string;
  officeWebsite: string;
  brokerName: string;

  // MLS Information
  mlsNumber: string;
  mlsName: string;

  // Builder Information (name only - no email/phone)
  builderName: string | null;
}
