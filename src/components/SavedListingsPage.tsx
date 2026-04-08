import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LBButton } from './design-system/LBButton';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBCard, LBCardHeader, LBCardTitle, LBCardDescription, LBCardContent } from './design-system/LBCard';
import { 
  Save, 
  Trash2, 
  Eye, 
  MapPin,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ListingDetailModal } from './ListingDetailModal';
import { TableColumnCustomizer, ColumnConfig } from './TableColumnCustomizer';
import { SavedListingsTableRow } from './SavedListingsTableRow';
import { SkeletonSavedListingRow } from './SkeletonLoader';

export function SavedListingsPage() {
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  
  // Column customization state
  const [savedListingsColumns, setSavedListingsColumns] = useState<ColumnConfig[]>([
    { id: 'address', label: 'Address', visible: true, required: true },
    { id: 'city', label: 'City', visible: true },
    { id: 'price', label: 'Price', visible: true },
    { id: 'bedsBaths', label: 'Beds/Baths', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'savedOn', label: 'Saved On', visible: true },
    { id: 'actions', label: 'Actions', visible: true, required: true },
  ]);

  // Load saved listings from Supabase (with localStorage fallback)
  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('saved_listings')
          .select('listing_data_json, saved_at')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false });
        // Always use Supabase as source of truth for authenticated users — never fall back
        // to localStorage which may contain a different user's listings
        const listings = (data ?? []).map((r: any) => r.listing_data_json).filter(Boolean);
        setSavedListings(listings);
        localStorage.setItem('listingbug_saved_listings', JSON.stringify(listings));
        setIsLoading(false);
        return;
      }
      // Unauthenticated fallback only
      const stored = localStorage.getItem('listingbug_saved_listings');
      if (stored) {
        try { setSavedListings(JSON.parse(stored)); } catch (e) {}
      }
      setIsLoading(false);
    };
    loadListings();
  }, []);

  // Save to localStorage whenever changed and dispatch event to update dashboard
  useEffect(() => {
    localStorage.setItem('listingbug_saved_listings', JSON.stringify(savedListings));
    // Dispatch event to update dashboard count
    window.dispatchEvent(new Event('savedListingsUpdated'));
  }, [savedListings]);

  const handleRemoveListing = (id: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const listing = savedListings.find(l => l.id === id);
    setSavedListings(prev => prev.filter(l => l.id !== id));
    toast.success(`Removed "${listing?.address}" from saved listings`);
  };

  const handleSaveListing = (listing: any) => {
    const isAlreadySaved = savedListings.some(l => l.id === listing.id);
    
    if (isAlreadySaved) {
      setSavedListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success('Listing removed from saved');
      setSelectedListing(null);
    } else {
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Save className="w-5 h-5 md:w-6 md:h-6 text-[#342e37]" />
          <h1 className="mb-0 text-2xl md:text-4xl font-bold text-[27px]">Saved Listings</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-[13px] md:text-sm">
          Your saved listings for quick access
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonSavedListingRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : savedListings.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <Save className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">No saved listings yet</p>
          <p className="text-[13px] text-gray-500 mb-4">
            Save listings from search results to keep track of properties you're interested in
          </p>
          <LBButton onClick={() => window.location.href = '/search-listings'} size="sm">
            Go to Search
          </LBButton>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <LBCard>
              <LBCardHeader className="pb-2">
                <LBCardTitle className="text-[16px] flex items-center gap-2">
                  <Save className="w-4 h-4 text-primary" />
                  Total Saved
                </LBCardTitle>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-3xl font-bold text-[#342E37]">{savedListings.length}</p>
              </LBCardContent>
            </LBCard>

            <LBCard>
              <LBCardHeader className="pb-2">
                <LBCardTitle className="text-[16px] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Avg Price
                </LBCardTitle>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-3xl font-bold text-[#342E37]">
                  ${Math.round(savedListings.reduce((sum, l) => sum + l.price, 0) / savedListings.length).toLocaleString()}
                </p>
              </LBCardContent>
            </LBCard>

            <LBCard>
              <LBCardHeader className="pb-2">
                <LBCardTitle className="text-[16px] flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  Price Drops
                </LBCardTitle>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-3xl font-bold text-[#342E37]">
                  {savedListings.filter(l => l.priceDrop).length}
                </p>
              </LBCardContent>
            </LBCard>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 text-[14px]">
              Showing {savedListings.length} {savedListings.length === 1 ? 'listing' : 'listings'}
            </p>
            <div className="flex items-center gap-2">
              <TableColumnCustomizer
                tableId="saved-listings"
                columns={savedListingsColumns}
                onColumnsChange={setSavedListingsColumns}
              />
              <LBButton
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to remove all saved listings?')) {
                    setSavedListings([]);
                    toast.success('All saved listings removed');
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear All
              </LBButton>
            </div>
          </div>

          {/* Listings Table */}
          <LBTable>
            <LBTableHeader>
              <LBTableRow>
                {savedListingsColumns.filter(col => col.visible).map(col => (
                  <LBTableHead key={col.id} className={col.id === 'actions' ? 'w-[120px]' : ''}>
                    {col.label}
                  </LBTableHead>
                ))}
              </LBTableRow>
            </LBTableHeader>
            <LBTableBody>
              {savedListings.map((listing) => (
                <SavedListingsTableRow
                  key={listing.id}
                  listing={listing}
                  columns={savedListingsColumns}
                  onSelect={setSelectedListing}
                  onRemove={handleRemoveListing}
                />
              ))}
            </LBTableBody>
          </LBTable>
        </>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSaveListing={handleSaveListing}
          isSaved={isListingSaved(selectedListing.id)}
        />
      )}
    </div>
  );
}