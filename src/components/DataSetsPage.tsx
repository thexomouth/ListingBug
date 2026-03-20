import { Code, Database, Search, FileJson, Zap, ArrowRight, TrendingDown, RefreshCw, Building2, Sparkles, Filter } from "lucide-react";
import { LBCard, LBCardContent, LBButton } from "./design-system";
import React from "react";

interface QueryParameter {
  name: string;
  type: "string" | "float" | "boolean" | "enum";
  description: string;
  default?: string;
  allowedValues?: string[];
  example?: string;
}

interface ResponseField {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  example?: string;
}

const queryParameters: QueryParameter[] = [
  {
    name: "address",
    type: "string",
    description: "Full address in format: Street, City, State, Zip. Use alone or with radius for circular search.",
    example: "123 Main St, Austin, TX 78701"
  },
  {
    name: "city",
    type: "string",
    description: "City name for location-based search. Case-sensitive.",
    default: "Austin"
  },
  {
    name: "state",
    type: "string",
    description: "2-character state abbreviation. Case-sensitive.",
    default: "TX"
  },
  {
    name: "zipCode",
    type: "string",
    description: "5-digit zip code for location-based search.",
    example: "78701"
  },
  {
    name: "latitude",
    type: "float",
    description: "Latitude coordinate. Use with longitude and radius for circular area search.",
    example: "30.2672"
  },
  {
    name: "longitude",
    type: "float",
    description: "Longitude coordinate. Use with latitude and radius for circular area search.",
    example: "-97.7431"
  },
  {
    name: "radius",
    type: "float",
    description: "Search radius in miles (max 100). Combine with lat/long or address.",
    example: "25"
  },
  {
    name: "propertyType",
    type: "enum",
    description: "Property type filter. Supports multiple comma-separated values.",
    allowedValues: ["Single Family", "Condo", "Townhouse", "Manufactured", "Multi-Family", "Apartment", "Land"],
    example: "Single Family"
  },
  {
    name: "bedrooms",
    type: "string",
    description: "Number of bedrooms. Supports ranges (3-4) and multiple values. Use 0 for studio.",
    example: "3-4"
  },
  {
    name: "bathrooms",
    type: "string",
    description: "Number of bathrooms. Supports fractions (2.5), ranges, and multiple values.",
    example: "2.5-3"
  },
  {
    name: "squareFootage",
    type: "string",
    description: "Living area in square feet. Supports ranges and multiple values.",
    example: "1500-2500"
  },
  {
    name: "lotSize",
    type: "string",
    description: "Lot size in square feet. Supports ranges and multiple values.",
    example: "5000-10000"
  },
  {
    name: "yearBuilt",
    type: "string",
    description: "Year of construction. Supports ranges and multiple values.",
    example: "2010-2020"
  },
  {
    name: "status",
    type: "enum",
    description: "Current listing status.",
    default: "Active",
    allowedValues: ["Active", "Inactive"]
  },
  {
    name: "price",
    type: "string",
    description: "Listed price. Supports ranges and multiple values.",
    example: "300000-500000"
  },
  {
    name: "daysOld",
    type: "string",
    description: "Days since listed (minimum 1). Supports ranges.",
    example: "1-30"
  },
  {
    name: "reListedProperty",
    type: "boolean",
    description: "Filter for properties that have been re-listed on the market.",
    allowedValues: ["true", "false"],
    example: "true"
  }
];

const responseFields: ResponseField[] = [
  // Property Information
  {
    name: "id",
    type: "string",
    description: "Unique identifier for the listing",
    example: "abc123xyz"
  },
  {
    name: "formattedAddress",
    type: "string",
    description: "Complete formatted property address",
    example: "123 Main St, Austin, TX 78701"
  },
  {
    name: "addressLine1",
    type: "string",
    description: "Street address",
    example: "123 Main St"
  },
  {
    name: "city",
    type: "string",
    description: "City name",
    example: "Austin"
  },
  {
    name: "state",
    type: "string",
    description: "State abbreviation",
    example: "TX"
  },
  {
    name: "zipCode",
    type: "string",
    description: "5-digit ZIP code",
    example: "78701"
  },
  {
    name: "county",
    type: "string",
    description: "County name",
    example: "Travis County"
  },
  {
    name: "latitude",
    type: "number",
    description: "Geographic latitude coordinate",
    example: "30.2672"
  },
  {
    name: "longitude",
    type: "number",
    description: "Geographic longitude coordinate",
    example: "-97.7431"
  },
  // Property Details
  {
    name: "propertyType",
    type: "string",
    description: "Type of property",
    example: "Single Family"
  },
  {
    name: "bedrooms",
    type: "number",
    description: "Number of bedrooms",
    example: "3"
  },
  {
    name: "bathrooms",
    type: "number",
    description: "Number of bathrooms",
    example: "2.5"
  },
  {
    name: "squareFootage",
    type: "number",
    description: "Total living area in square feet",
    example: "2100"
  },
  {
    name: "lotSize",
    type: "number",
    description: "Lot size in square feet",
    example: "7500"
  },
  {
    name: "yearBuilt",
    type: "number",
    description: "Year the property was constructed",
    example: "2015"
  },
  // Listing Information
  {
    name: "price",
    type: "number",
    description: "Current listing price",
    example: "450000"
  },
  {
    name: "status",
    type: "string",
    description: "Current listing status",
    example: "Active"
  },
  {
    name: "daysOnMarket",
    type: "number",
    description: "Number of days the property has been listed",
    example: "14"
  },
  {
    name: "listingDate",
    type: "string",
    description: "Date when property was listed (ISO format)",
    example: "2024-11-01"
  },
  {
    name: "lastSeenDate",
    type: "string",
    description: "Date when listing was last updated (ISO format)",
    example: "2024-11-15"
  },
  {
    name: "removedDate",
    type: "string",
    description: "Date when listing was removed (if applicable)",
    example: "2024-11-20"
  },
  {
    name: "createdDate",
    type: "string",
    description: "Date when record was created in system",
    example: "2024-11-01"
  },
  // Agent Information
  {
    name: "agentName",
    type: "string",
    description: "Name of listing agent",
    example: "Jane Smith"
  },
  {
    name: "agentEmail",
    type: "string",
    description: "Email address of listing agent",
    example: "jane.smith@realty.com"
  },
  {
    name: "agentPhone",
    type: "string",
    description: "Phone number of listing agent",
    example: "(512) 555-1234"
  },
  {
    name: "agentWebsite",
    type: "string",
    description: "Website URL of listing agent",
    example: "https://janesmith.realty.com"
  },
  {
    name: "brokerName",
    type: "string",
    description: "Name of brokerage/company",
    example: "Premier Realty Group"
  },
  {
    name: "officeName",
    type: "string",
    description: "Name of the real estate office",
    example: "Premier Realty - Downtown Office"
  },
  {
    name: "officeEmail",
    type: "string",
    description: "Email address of the office",
    example: "downtown@premierrealty.com"
  },
  {
    name: "officePhone",
    type: "string",
    description: "Phone number of the office",
    example: "(512) 555-5000"
  },
  {
    name: "officeWebsite",
    type: "string",
    description: "Website URL of the office",
    example: "https://premierrealty.com/downtown"
  },
  // MLS Information
  {
    name: "mlsNumber",
    type: "string",
    description: "MLS listing number",
    example: "MLS-987654"
  },
  {
    name: "mlsName",
    type: "string",
    description: "Name of MLS source",
    example: "Austin Board of Realtors"
  },
  // Builder & Development Data
  {
    name: "builderName",
    type: "string",
    description: "Name of the property builder/developer",
    example: "Lennar Homes"
  },
  {
    name: "builderPhone",
    type: "string",
    description: "Phone number of the builder",
    example: "(512) 555-8000"
  },
  {
    name: "builderEmail",
    type: "string",
    description: "Email address of the builder",
    example: "info@lennarhomes.com"
  },
  {
    name: "builderWebsite",
    type: "string",
    description: "Website URL of the builder",
    example: "https://lennarhomes.com"
  },
  {
    name: "builderDevelopmentName",
    type: "string",
    description: "Name of the development or community",
    example: "Sunset Ridge Estates"
  },
  // Additional Details
  {
    name: "description",
    type: "string",
    description: "Property description/listing remarks",
    example: "Beautiful home with modern updates..."
  },
  {
    name: "photoUrl",
    type: "string",
    description: "URL to primary property photo",
    example: "https://..."
  },
  {
    name: "virtualTourUrl",
    type: "string",
    description: "URL to virtual tour (if available)",
    example: "https://..."
  }
];

interface PageSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const sections: PageSection[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Quick introduction to our comprehensive data integration",
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: "search-parameters",
    title: "Search Parameters",
    description: "Filter criteria you can use to query listings",
    icon: <Search className="w-5 h-5" />
  },
  {
    id: "response-data",
    title: "Response Data",
    description: "All fields returned for each listing result",
    icon: <FileJson className="w-5 h-5" />
  },
  {
    id: "get-started",
    title: "Get Started",
    description: "Ready to access real listing data",
    icon: <ArrowRight className="w-5 h-5" />
  }
];

interface DataSetsPageProps {
  onNavigate?: (page: string) => void;
}

export function DataSetsPage({ onNavigate }: DataSetsPageProps = {}) {
  const locationParams = queryParameters.filter(p => 
    ["address", "city", "state", "zipCode", "latitude", "longitude", "radius"].includes(p.name)
  );
  
  const propertyParams = queryParameters.filter(p => 
    ["propertyType", "bedrooms", "bathrooms", "squareFootage", "lotSize", "yearBuilt"].includes(p.name)
  );
  
  const listingParams = queryParameters.filter(p => 
    ["status", "price", "daysOld", "reListedProperty"].includes(p.name)
  );

  const handleScrollTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-[32px] px-[12px]">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-8 h-8 md:w-9 md:h-9 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="mb-0 text-4xl font-bold text-[33px] text-[#342e37] dark:text-white">Data Sets Reference</h1>
          </div>
          <p className="text-gray-600 dark:text-[#EBF2FA] max-w-2xl leading-relaxed text-[13px]">
            Complete data endpoint reference. Learn what you can search and what data you'll receive.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-8 bg-[#fafafa] dark:bg-[#2F2F2F] border-l-4 border-[#ffd447] dark:border-[#FFCE0A] rounded-r-lg p-6 px-[12px] py-[9px]">
          <h2 className="text-gray-900 dark:text-white mb-4 font-bold text-[18px]">Skip to Section</h2>
          <nav className="space-y-2">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => handleScrollTo(section.id)}
                className="flex items-center gap-3 w-full text-left py-[3px] px-[12px] rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors group"
              >
                <span className="text-[#342e37]/50 dark:text-[#EBF2FA]/50 font-medium text-[14px] w-6">
                  {index + 1}.
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="text-[#342e37] dark:text-[#FFCE0A] group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A]">
                    {React.cloneElement(section.icon as React.ReactElement, {
                      className: 'w-4 h-4'
                    })}
                  </div>
                  <span className="text-gray-900 dark:text-white group-hover:text-[#342e37] dark:group-hover:text-[#FFCE0A] transition-colors text-[14px]">
                    {section.title}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Section */}
        <section id="overview" className="mb-12 scroll-mt-56">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#342e37] dark:bg-[#FFCE0A] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white dark:text-[#0F1115]" />
            </div>
            <div>
              <h2 className="text-[#342e37] dark:text-white mb-0 font-bold text-[27px]">Overview</h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">About our comprehensive data integration</p>
            </div>
          </div>
          
          <LBCard elevation="md" padding="lg" className="bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 !p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl text-[#342e37] dark:text-white mb-2 text-[18px]">100K+</div>
                <p className="text-gray-700 dark:text-[#EBF2FA] text-[13px]">Active property listings across major markets</p>
              </div>
              <div>
                <div className="text-2xl text-[#342e37] dark:text-white mb-2 text-[18px]">Daily</div>
                <p className="text-gray-700 dark:text-[#EBF2FA] text-[13px]">Real-time updates from MLS sources nationwide</p>
              </div>
              <div>
                <div className="text-2xl text-[#342e37] dark:text-white mb-2 text-[18px]">31+</div>
                <p className="text-gray-700 dark:text-[#EBF2FA] text-[13px]">Data fields per listing including agent contacts</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#ffd447]/30">
              <p className="text-gray-700 dark:text-[#EBF2FA] text-[12px]">
                ListingBug aggregates comprehensive real estate data from trusted online sources to provide you with 
                actionable property intelligence. Search by location, property characteristics, listing details, 
                and more to find opportunities that match your business needs.
              </p>
            </div>
          </LBCard>
        </section>

        {/* Section Divider */}
        <div className="mb-12">
          <div className="h-3 w-1/2 bg-gradient-to-r from-[#ffd447] via-[#ffd447] via-70% to-transparent rounded-r-full"></div>
        </div>

        {/* Search Parameters Section */}
        <section id="search-parameters" className="mb-12 scroll-mt-56">
          <div className="flex items-center gap-3 mb-[16px] mt-[0px] mr-[0px] ml-[0px] px-[2px] py-[0px]">
            <div className="w-10 h-10 rounded-full bg-[#342e37] dark:bg-[#FFCE0A] flex items-center justify-center">
              <Search className="w-5 h-5 text-white dark:text-[#0F1115]" />
            </div>
            <div>
              <h2 className="text-[#342e37] dark:text-white mb-0 font-bold text-[24px]">Search Parameters</h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[13px]">Use these filters to query and refine your listing searches</p>
            </div>
          </div>

          {/* Location Parameters */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-normal font-bold italic">Location Filters</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px]">Define geographic boundaries using addresses, cities, coordinates, or radius searches</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {locationParams.map((param) => (
                <ParameterCard key={param.name} parameter={param} />
              ))}
            </div>
          </div>

          {/* Property Characteristics */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-normal font-bold">Property Information</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">Filter by physical attributes like type, size, bedrooms, and construction year</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {propertyParams.map((param) => (
                <ParameterCard key={param.name} parameter={param} />
              ))}
            </div>
          </div>

          {/* Listing Details */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] px-[0px] py-[9px] font-normal font-bold">Listing Details</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">Search by status, price range, market timing, and re-listing information</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {listingParams.map((param) => (
                <ParameterCard key={param.name} parameter={param} />
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="mb-12">
          <div className="h-3 w-1/2 bg-gradient-to-r from-[#ffd447] via-[#ffd447] via-70% to-transparent rounded-r-full"></div>
        </div>

        {/* Response Data Section */}
        <section id="response-data" className="mb-12 scroll-mt-56">
          <div className="mb-6">
            <div className="mb-4 text-center">
              <h2 className="text-[#342e37] dark:text-white mb-0 font-bold text-[27px]">Response Data</h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px]">Complete list of data fields returned for each listing in your results</p>
            </div>
          </div>

          {/* Property Information */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-bold">Property Information</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px]">Core property identifiers, addresses, and geographic coordinates</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(0, 9).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>

          {/* Property Details */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] not-italic no-underline font-bold">Property Details</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[15px]">Physical characteristics including type, rooms, square footage, and construction</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(9, 15).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>

          {/* Listing Information */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-bold">Listing Information</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA]">Market data including price, status, days on market, and timeline details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(15, 22).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>

          {/* Agent & Broker Information */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-bold">Agent & Broker Information</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA]">Direct contact details for listing agents, brokerages, and office locations</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(22, 31).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>

          {/* MLS Information */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-bold">MLS Information</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA]">Multiple Listing Service source and listing number</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(31, 33).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>

          {/* Builder & Development Data */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-bold">Builder & Development Data</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA]">Builder contact information and development community details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(33, 38).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="text-[#342e37] dark:text-white mb-1 text-[18px] font-bold">Additional Details</h3>
              <p className="text-gray-600 dark:text-[#EBF2FA]">Property descriptions, photos, and virtual tour links</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {responseFields.slice(38).map((field) => (
                <ResponseFieldCard key={field.name} field={field} />
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="mb-12">
          <div className="h-3 w-1/2 bg-gradient-to-r from-[#ffd447] via-[#ffd447] via-70% to-transparent rounded-r-full"></div>
        </div>

        {/* Get Started Section */}
        <section id="get-started" className="scroll-mt-56 px-[0px] py-[33px] mx-[0px] my-[33px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#342e37] dark:bg-[#FFCE0A] flex items-center justify-center p-[0px] pt-[1px] pr-[0px] pb-[0px] pl-[0px]">
              <ArrowRight className="w-5 h-5 text-white dark:text-[#0F1115]" />
            </div>
            <div>
              <h2 className="text-[#342e37] dark:text-white mb-0 font-bold text-[27px]">Get Started</h2>
              <p className="text-gray-600 dark:text-[#EBF2FA] pt-[0px] pr-[0px] pb-[12px] pl-[0px]">Access real listing data</p>
            </div>
          </div>

          <LBCard elevation="lg" padding="lg" className="bg-gradient-to-br from-[#ffd447] to-[#ffc520] border-2 border-[#ffd447]">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-[#342e37] mb-4 text-3xl font-bold text-[33px]">Search for Listings Today</h2>
              <p className="text-[#342e37] text-lg mb-6 text-[16px]">
                Access our complete database with all search parameters and response fields. 
                Create targeted searches, export data, and connect with agents and sellers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button 
                  onClick={() => onNavigate?.('pricing')}
                   className="px-8 py-3 bg-transparent border-2 border-[#252525] text-[#252525] rounded-lg hover:bg-[#252525] hover:text-white transition-colors font-medium"                >
                  View Pricing
                </button>
                <button 
                  onClick={() => onNavigate?.('signup')}
                  className="px-8 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#333333] transition-colors font-medium"
                >
                  Start Free Trial
                </button>
              </div>
              <p className="text-[#342e37]/80">
                7-day free trial • No credit card required • Cancel anytime • <strong>Bonus:</strong> Free month of extra reports
              </p>
            </div>
          </LBCard>
        </section>
      </div>
    </div>
  );
}

// Parameter Card Component
interface ParameterCardProps {
  parameter: QueryParameter;
}

function ParameterCard({ parameter }: ParameterCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "bg-blue-100 text-blue-700";
      case "float":
        return "bg-purple-100 text-purple-700";
      case "boolean":
        return "bg-orange-100 text-orange-700";
      case "enum":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <LBCard elevation="sm" padding="sm" hover>
      <LBCardContent className="p-0">
        <div className="space-y-1.5">
          {/* Icon, Name, and Type in a Row */}
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" />
            <span className="text-[#342e37] dark:text-white text-[14px] font-medium break-words flex-1">{parameter.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ${getTypeColor(parameter.type)}`}>
              {parameter.type}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[12px] leading-relaxed">{parameter.description}</p>
          
          {/* Details Section */}
          <div className="space-y-1 pl-0 sm:pl-5">
            {parameter.default && (
              <div className="text-gray-600 dark:text-[#EBF2FA] text-[11px]">
                <span className="font-medium">Default:</span>{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 text-[11px] break-all">
                  {parameter.default}
                </code>
              </div>
            )}
            
            {parameter.example && (
              <div className="text-gray-600 dark:text-[#EBF2FA] text-[11px]">
                <span className="font-medium">Example:</span>{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 text-[11px] break-all">
                  {parameter.example}
                </code>
              </div>
            )}
            
            {parameter.allowedValues && parameter.allowedValues.length > 0 && (
              <div className="space-y-1">
                <div className="text-gray-600 dark:text-[#EBF2FA] text-[11px] font-medium">Allowed values:</div>
                <div className="flex flex-wrap gap-1.5">
                  {parameter.allowedValues.map((value) => (
                    <span
                      key={value}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200 text-[11px]"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </LBCardContent>
    </LBCard>
  );
}

// Response Field Card Component
interface ResponseFieldCardProps {
  field: ResponseField;
}

function ResponseFieldCard({ field }: ResponseFieldCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "bg-blue-100 text-blue-700";
      case "number":
        return "bg-purple-100 text-purple-700";
      case "boolean":
        return "bg-orange-100 text-orange-700";
      case "object":
        return "bg-pink-100 text-pink-700";
      case "array":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <LBCard elevation="sm" padding="sm" hover>
      <LBCardContent className="p-0">
        <div className="space-y-1.5">
          {/* Icon, Name, and Type in a Row */}
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" />
            <span className="text-[#342e37] dark:text-white text-[14px] font-medium break-words flex-1">{field.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ${getTypeColor(field.type)}`}>
              {field.type}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-[#EBF2FA] text-[12px] leading-relaxed">{field.description}</p>
          
          {/* Example Section */}
          {field.example && (
            <div className="pl-0 sm:pl-5">
              <div className="text-gray-600 dark:text-[#EBF2FA] text-[11px]">
                <span className="font-medium">Example:</span>{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 text-[11px] break-all">
                  {field.example}
                </code>
              </div>
            </div>
          )}
        </div>
      </LBCardContent>
    </LBCard>
  );
}