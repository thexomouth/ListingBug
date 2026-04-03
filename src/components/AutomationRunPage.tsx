import { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Send, Download,
  Calendar, Zap, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBButton } from './design-system/LBButton';
import { ListingDetailModal } from './ListingDetailModal';
import { normalizeListing } from './utils/normalizeListing';
import { toast } from 'react-toastify';

interface AutomationRunPageProps {
  run: {
    id: string;
    automationName: string;
    runDate: string;
    status: string;
    listingsFound: number;
    listingsFetched?: number;
    listingsSent: number;
    destination: string;
    details?: string;
  };
  onBack: () => void;
}


export function AutomationRunPage({ run, onBack }: AutomationRunPageProps) {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());
  const resultsPerPage = 25;

  // Load saved listing IDs
  const loadSavedListingIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id);
    if (data) setSavedListingIds(new Set(data.map((r: any) => r.listing_id)));
  };

  useEffect(() => {
    loadSavedListingIds();
    const handler = () => loadSavedListingIds();
    window.addEventListener('savedListingsUpdated', handler);
    return () => window.removeEventListener('savedListingsUpdated', handler);
  }, []);

  // Fetch listings for this run
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('automation_run_listings')
        .select('listing_id, listing_data, transferred')
        .eq('automation_run_id', run.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setListings(data.map((r: any) => {
          const raw = { ...(r.listing_data || {}), _transferred: r.transferred };
          // Ensure id is set before normalizing
          if (!raw.id) raw.id = r.listing_id;
          const normalized = normalizeListing(raw);
          return normalized;
        }));
      }
      setIsLoading(false);
    };
    load();
  }, [run.id]);

  const handleSaveListing = async (listing: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sign in to save listings'); return; }
    const alreadySaved = savedListingIds.has(listing.id);
    if (alreadySaved) {
      await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', listing.id);
      setSavedListingIds(prev => { const n = new Set(prev); n.delete(listing.id); return n; });
      toast.success('Removed from saved listings');
    } else {
      await supabase.from('saved_listings').upsert(
        { user_id: user.id, listing_id: listing.id, listing_data_json: listing, saved_at: new Date().toISOString() },
        { onConflict: 'user_id,listing_id' }
      );
      setSavedListingIds(prev => new Set([...prev, listing.id]));
      toast.success('Listing saved');
    }
    window.dispatchEvent(new Event('savedListingsUpdated'));
  };

  const formatDate = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch { return ts; }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '—';
    return '$' + price.toLocaleString();
  };

  const isSuccess = run.status === 'success';
  const isFailed = run.status === 'failed' || run.status === 'error';

  const totalPages = Math.ceil(listings.length / resultsPerPage);
  const paginated = listings.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-12">

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Run History
      </button>

      {/* Run header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#FFCE0A]" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{run.automationName}</h1>
            </div>
            {run.details && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">{run.details}</p>
            )}
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium self-start ${
            isSuccess ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
            : isFailed ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
            : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
          }`}>
            {isSuccess ? <CheckCircle className="w-4 h-4" /> : isFailed ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {isSuccess ? 'Success' : isFailed ? 'Failed' : run.status}
          </span>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs text-gray-700 dark:text-gray-300">
            <Calendar className="w-3 h-3" />
            {formatDate(run.runDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFCE0A]/20 rounded-full text-xs text-[#342e37] dark:text-[#FFCE0A] font-medium">
            <Download className="w-3 h-3" />
            {run.listingsFetched ?? run.listingsFound} listing{(run.listingsFetched ?? run.listingsFound) !== 1 ? 's' : ''} fetched
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs text-gray-700 dark:text-gray-300">
            <Send className="w-3 h-3" />
            {run.listingsSent} confirmed → {run.destination || 'destination'}
          </span>
        </div>
      </div>

      {/* Listings table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFCE0A]" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg">
          <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No listing data stored for this run</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Listing-level detail is captured on runs after this feature was enabled.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Future runs will show a full per-listing breakdown here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <LBTable>
              <LBTableHeader>
                <LBTableRow>
                  <LBTableHead>Address</LBTableHead>
                  <LBTableHead>Type</LBTableHead>
                  <LBTableHead>Price</LBTableHead>
                  <LBTableHead>Bed / Bath</LBTableHead>
                  <LBTableHead>Exported</LBTableHead>
                </LBTableRow>
              </LBTableHeader>
              <LBTableBody>
                {paginated.map((listing: any, i: number) => {
                  // Address display: prefer formattedAddress, fall back to address + city
                  const streetAddress = listing.address || '—';
                  const cityStr = listing.city ? `, ${listing.city}` : '';
                  const displayAddress = listing.formattedAddress || `${streetAddress}${cityStr}`;
                  const propertyType = listing.propertyType || '—';
                  const price = listing.price;
                  const beds = listing.bedrooms ?? '—';
                  const baths = listing.bathrooms ?? '—';
                  const exported = listing._transferred;

                  return (
                    <LBTableRow
                      key={listing.id || i}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                      onClick={() => setSelectedListing(listing)}
                    >
                      <LBTableCell className="font-medium max-w-[220px]">
                        <div className="truncate" title={displayAddress}>{displayAddress}</div>
                      </LBTableCell>
                      <LBTableCell className="text-sm">{propertyType}</LBTableCell>
                      <LBTableCell className="font-medium">{formatPrice(price)}</LBTableCell>
                      <LBTableCell>{beds}bd / {baths}ba</LBTableCell>
                      <LBTableCell>
                        {exported ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 font-medium">
                            <CheckCircle className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                            No
                          </span>
                        )}
                      </LBTableCell>
                    </LBTableRow>
                  );
                })}
              </LBTableBody>
            </LBTable>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <LBButton variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</LBButton>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages} · {listings.length} listings</span>
              <LBButton variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</LBButton>
            </div>
          )}
        </>
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSaveListing={handleSaveListing}
          isSaved={savedListingIds.has(selectedListing?.id)}
        />
      )}
    </div>
  );
}
