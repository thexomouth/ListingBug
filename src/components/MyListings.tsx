import { useState } from 'react';
import { Search, Filter, Eye, Trash2, Download, BookmarkX, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { LBButton } from './design-system/LBButton';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { ListingDetailModal } from './ListingDetailModal';

export function MyListings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReList, setFilterReList] = useState('all');
  const [filterPriceDrop, setFilterPriceDrop] = useState('all');
  const [filterYearBuilt, setFilterYearBuilt] = useState('all');
  const [filterDaysOnMarket, setFilterDaysOnMarket] = useState('all');
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(25);

  // Mock saved listings data
  const [savedListings] = useState([
    {
      id: 1,
      address: '123 Main St',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      propertyType: 'Single Family',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1850,
      lotSize: 5000,
      yearBuilt: 2005,
      status: 'Active',
      price: 750000,
      daysListed: 12,
      agentName: 'Sarah Johnson',
      agentPhone: '(555) 123-4567',
      agentEmail: 'sarah.j@realty.com',
      brokerage: 'Premier Realty Group',
      reList: false,
      priceDrop: true,
      priceDropAmount: 25000,
      priceDropPercent: 3.2,
      latitude: 34.0522,
      longitude: -118.2437,
      description: 'Beautiful single-family home in prime Los Angeles location. Recently updated kitchen and bathrooms.',
      photos: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      mlsNumber: 'LA12345678',
      mlsSource: 'CRMLS',
      savedDate: '2024-11-20',
    },
    {
      id: 2,
      address: '789 Pine Rd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90003',
      propertyType: 'Single Family',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      lotSize: 7500,
      yearBuilt: 1998,
      status: 'Active',
      price: 895000,
      daysListed: 22,
      agentName: 'Jennifer Martinez',
      agentPhone: '(555) 345-6789',
      agentEmail: 'jmartinez@homeexperts.com',
      brokerage: 'Home Experts Realty',
      reList: true,
      priceDrop: true,
      priceDropAmount: 50000,
      priceDropPercent: 5.3,
      latitude: 34.0522,
      longitude: -118.2437,
      description: 'Spacious family home on large lot. Needs some updates but great bones.',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      mlsNumber: 'LA34567890',
      mlsSource: 'CRMLS',
      savedDate: '2024-11-19',
    },
    {
      id: 3,
      address: '321 Elm Blvd',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      propertyType: 'Townhouse',
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1650,
      lotSize: 2000,
      yearBuilt: 2015,
      status: 'Pending',
      price: 675000,
      daysListed: 8,
      agentName: 'David Thompson',
      agentPhone: '(555) 456-7890',
      agentEmail: 'dthompson@coastalrealty.com',
      brokerage: 'Coastal Realty Partners',
      reList: false,
      priceDrop: false,
      latitude: 32.7157,
      longitude: -117.1611,
      description: 'Charming townhouse in downtown San Diego. Walk to restaurants and shops.',
      photos: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'],
      mlsNumber: 'SD12345678',
      mlsSource: 'SDMLS',
      savedDate: '2024-11-18',
    },
    {
      id: 4,
      address: '555 Beach Way',
      city: 'Santa Monica',
      state: 'CA',
      zip: '90401',
      propertyType: 'Condo',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1100,
      lotSize: 0,
      yearBuilt: 2020,
      status: 'Active',
      price: 1250000,
      daysListed: 3,
      agentName: 'Amanda Wilson',
      agentPhone: '(555) 567-8901',
      agentEmail: 'awilson@beachfront.com',
      brokerage: 'Beachfront Properties',
      reList: false,
      priceDrop: false,
      latitude: 34.0195,
      longitude: -118.4912,
      description: 'Stunning ocean-view condo steps from the beach. Brand new construction.',
      photos: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800'],
      mlsNumber: 'SM12345678',
      mlsSource: 'CRMLS',
      savedDate: '2024-11-22',
    },
    {
      id: 5,
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90002',
      propertyType: 'Condo',
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      lotSize: 0,
      yearBuilt: 2018,
      status: 'Sold',
      price: 525000,
      daysListed: 5,
      agentName: 'Michael Chen',
      agentPhone: '(555) 234-5678',
      agentEmail: 'mchen@luxuryprops.com',
      brokerage: 'Luxury Properties Inc',
      reList: false,
      priceDrop: false,
      latitude: 34.0522,
      longitude: -118.2437,
      description: 'Modern condo with amazing views. HOA includes gym and pool access.',
      photos: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
      mlsNumber: 'LA23456789',
      mlsSource: 'CRMLS',
      savedDate: '2024-11-15',
    },
  ]);

  // Filter listings based on search and filters
  const filteredListings = savedListings.filter((listing) => {
    const matchesSearch = 
      listing.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReList = filterReList === 'all' || 
      (filterReList === 'yes' && listing.reList) || 
      (filterReList === 'no' && !listing.reList);
    
    const matchesPriceDrop = filterPriceDrop === 'all' || 
      (filterPriceDrop === 'yes' && listing.priceDrop) || 
      (filterPriceDrop === 'no' && !listing.priceDrop);
    
    const matchesYearBuilt = filterYearBuilt === 'all' ||
      (filterYearBuilt === '2020+' && listing.yearBuilt >= 2020) ||
      (filterYearBuilt === '2010-2019' && listing.yearBuilt >= 2010 && listing.yearBuilt <= 2019) ||
      (filterYearBuilt === '2000-2009' && listing.yearBuilt >= 2000 && listing.yearBuilt <= 2009) ||
      (filterYearBuilt === 'pre-2000' && listing.yearBuilt < 2000);
    
    const matchesDaysOnMarket = filterDaysOnMarket === 'all' ||
      (filterDaysOnMarket === '0-7' && listing.daysListed <= 7) ||
      (filterDaysOnMarket === '8-14' && listing.daysListed >= 8 && listing.daysListed <= 14) ||
      (filterDaysOnMarket === '15-30' && listing.daysListed >= 15 && listing.daysListed <= 30) ||
      (filterDaysOnMarket === '30+' && listing.daysListed > 30);

    return matchesSearch && matchesReList && matchesPriceDrop && matchesYearBuilt && matchesDaysOnMarket;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredListings.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to remove this listing from your saved items?')) {
      // Implementation for delete would go here
      console.log('Delete listing', id);
    }
  };

  const handleExport = () => {
    console.log('Export listings');
    // Export functionality would go here
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Header - Tighter spacing */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-6 h-6 md:w-7 md:h-7 text-[#342e37]" />
            <h1 className="mb-0 text-2xl md:text-4xl font-bold text-[27px]">My Listings</h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base max-w-3xl">
            View and manage all your saved property listings. Track changes, monitor opportunity scores, and access detailed reports.
          </p>
        </section>

        {/* Search and Filter Section - Borderless */}
        <section className="mb-6">
          <div className="bg-gray-50/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2">
                <LBInput
                  placeholder="Search by address, city, or agent..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="w-4 h-4 text-gray-400" />}
                />
              </div>

              {/* Re-Listed Filter - HIDDEN */}
              {/* <LBSelect
                value={filterReList}
                onChange={handleFilterChange(setFilterReList)}
                options={[
                  { value: 'all', label: 'All Re-Lists' },
                  { value: 'yes', label: 'Re-Listed Only' },
                  { value: 'no', label: 'Not Re-Listed' },
                ]}
              /> */}

              {/* Price Drop Filter - HIDDEN */}
              {/* <LBSelect
                value={filterPriceDrop}
                onChange={handleFilterChange(setFilterPriceDrop)}
                options={[
                  { value: 'all', label: 'All Prices' },
                  { value: 'yes', label: 'Price Drops' },
                  { value: 'no', label: 'No Price Change' },
                ]}
              /> */}

              {/* Year Built Filter */}
              <LBSelect
                value={filterYearBuilt}
                onChange={handleFilterChange(setFilterYearBuilt)}
                options={[
                  { value: 'all', label: 'All Years' },
                  { value: '2020+', label: '2020+' },
                  { value: '2010-2019', label: '2010-2019' },
                  { value: '2000-2009', label: '2000-2009' },
                  { value: 'pre-2000', label: 'Pre-2000' },
                ]}
              />
            </div>

            {/* Second Row - Days on Market + Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
              {/* Days on Market Filter */}
              <LBSelect
                value={filterDaysOnMarket}
                onChange={handleFilterChange(setFilterDaysOnMarket)}
                options={[
                  { value: 'all', label: 'All DOM' },
                  { value: '0-7', label: '0-7 days' },
                  { value: '8-14', label: '8-14 days' },
                  { value: '15-30', label: '15-30 days' },
                  { value: '30+', label: '30+ days' },
                ]}
              />
              
              <div className="lg:col-span-4"></div>
            </div>

            {/* Results Count and Export */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
                {filteredListings.length > resultsPerPage && (
                  <span className="text-gray-400"> • Showing {startIndex + 1}-{Math.min(endIndex, filteredListings.length)}</span>
                )}
              </p>
              <LBButton variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </LBButton>
            </div>
          </div>
        </section>

        {/* Results Table Section */}
        <section>
          {filteredListings.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <BookmarkX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-[21px] font-bold text-gray-900 mb-2">No Saved Listings</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterReList !== 'all' || filterPriceDrop !== 'all' || filterYearBuilt !== 'all' || filterDaysOnMarket !== 'all'
                  ? 'No listings match your search criteria. Try adjusting your filters.'
                  : 'You haven\'t saved any listings yet. Start searching to find properties and save them here.'}
              </p>
              {(searchTerm || filterReList !== 'all' || filterPriceDrop !== 'all' || filterYearBuilt !== 'all' || filterDaysOnMarket !== 'all') && (
                <LBButton
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterReList('all');
                    setFilterPriceDrop('all');
                    setFilterYearBuilt('all');
                    setFilterDaysOnMarket('all');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </LBButton>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <LBTable>
                    <LBTableHeader>
                      <LBTableRow>
                        <LBTableHead className="min-w-[140px]">Address</LBTableHead>
                        <LBTableHead className="min-w-[90px]">City</LBTableHead>
                        <LBTableHead className="min-w-[100px]">Price</LBTableHead>
                        <LBTableHead>Type</LBTableHead>
                        <LBTableHead>Beds/Baths</LBTableHead>
                        <LBTableHead>Year</LBTableHead>
                        <LBTableHead>Agent</LBTableHead>
                        <LBTableHead className="text-center">DOM</LBTableHead>
                        <LBTableHead className="text-center">Status</LBTableHead>
                        <LBTableHead>Saved</LBTableHead>
                        <LBTableHead className="w-[100px]"></LBTableHead>
                      </LBTableRow>
                    </LBTableHeader>
                    <LBTableBody>
                      {currentListings.map((listing) => (
                        <LBTableRow 
                          key={listing.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedListing(listing)}
                        >
                          <LBTableCell className="font-medium py-2">
                            <div className="flex flex-col">
                              <span>{listing.address}</span>
                              {listing.reList && (
                                <span className="text-xs text-orange-600 font-medium">Re-Listed</span>
                              )}
                            </div>
                          </LBTableCell>
                          <LBTableCell className="py-2">{listing.city}</LBTableCell>
                          <LBTableCell className="font-medium py-2">
                            <div className="flex flex-col">
                              <span>${(listing.price / 1000).toFixed(0)}k</span>
                              {listing.priceDrop && (
                                <span className="text-xs text-green-600 font-medium">
                                  ↓ ${(listing.priceDropAmount / 1000).toFixed(0)}k
                                </span>
                              )}
                            </div>
                          </LBTableCell>
                          <LBTableCell className="py-2 text-sm">{listing.propertyType}</LBTableCell>
                          <LBTableCell className="py-2 text-sm">
                            {listing.bedrooms} / {listing.bathrooms}
                          </LBTableCell>
                          <LBTableCell className="py-2">{listing.yearBuilt}</LBTableCell>
                          <LBTableCell className="py-2 text-sm">{listing.agentName}</LBTableCell>
                          <LBTableCell className="text-center py-2">
                            <span className={`${listing.daysListed > 14 ? 'text-orange-600 font-medium' : ''}`}>
                              {listing.daysListed}
                            </span>
                          </LBTableCell>
                          <LBTableCell className="text-center py-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
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
                          <LBTableCell className="py-2 text-sm text-gray-600">
                            {new Date(listing.savedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </LBTableCell>
                          <LBTableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <LBButton
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedListing(listing);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </LBButton>
                              <LBButton
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(listing.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </LBButton>
                            </div>
                          </LBTableCell>
                        </LBTableRow>
                      ))}
                    </LBTableBody>
                  </LBTable>
                </div>
              </div>

              {/* Pagination Controls */}
              {filteredListings.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  {/* Results per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Results per page:</span>
                    <button
                      onClick={() => {
                        setResultsPerPage(25);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded ${
                        resultsPerPage === 25
                          ? 'bg-[#ffd447] text-[#342e37] font-medium'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      25
                    </button>
                    <button
                      onClick={() => {
                        setResultsPerPage(50);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded ${
                        resultsPerPage === 50
                          ? 'bg-[#ffd447] text-[#342e37] font-medium'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      50
                    </button>
                    <button
                      onClick={() => {
                        setResultsPerPage(100);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded ${
                        resultsPerPage === 100
                          ? 'bg-[#ffd447] text-[#342e37] font-medium'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      100
                    </button>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 disabled:hover:bg-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 disabled:hover:bg-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}