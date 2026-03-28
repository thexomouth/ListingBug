import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Search, Calendar, Home, DollarSign, Loader2, Save, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBButton } from './design-system/LBButton';
import { ListingDetailModal } from './ListingDetailModal';
import { ExportDropdown } from './ExportDropdown';
import { toast } from 'react-toastify';

interface SearchResultsPageProps {
  searchRun: {
    id: string;
    location: string;
    criteriaDescription: string;
    searchDate: string;
    resultsCount: number;
    criteria: any;
    listings?: any[]; // present when coming from in-memory/localStorage history
  };
  onBack: () => void;
}

export function SearchResultsPage({ searchRun, onBack }: SearchResultsPageProps) {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 25;

  // Saved listings state
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  // Load saved listing IDs from Supabase
  const loadSavedListingIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id);
    if (data) {
      setSavedListingIds(new Set(data.map((row: any) => row.listing_id)));
    }
  };

  // Listen for savedListingsUpdated event
  useEffect(() => {
    loadSavedListingIds();
    const handler = () => { loadSavedListingIds(); };
    window.addEventListener('savedListingsUpdated', handler);
    return () => window.removeEventListener('savedListingsUpdated', handler);
  }, []);

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
      )
      setSavedListingIds(prev => new Set([...prev, listing.id]));
      toast.success('Listing saved');
    }
    // Dispatch sync event
    window.dispatchEvent(new Event('savedListingsUpdated'));
  };

  // Save search state
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);

      // Primary: load from results_json stored in search_runs
      const { data, error } = await supabase
        .from('search_runs')
        .select('results_json, criteria_json, location')
        .eq('id', searchRun.id)
        .single();

      if (data?.results_json && Array.isArray(data.results_json) && data.results_json.length > 0) {
        setResults(data.results_json);
      } else if (searchRun.listings && Array.isArray(searchRun.listings) && searchRun.listings.length > 0) {
        // Fallback: listings passed directly from in-memory/localStorage history entry
        setResults(searchRun.listings);
      }
      // If neither has data, this run predates persistent storage — show empty state.

      setIsLoading(false);
    };
    loadResults();
  }, [searchRun.id]);

  const totalPages = Math.ceil(results.length / resultsPerPage);
  const paginated = results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

  const handleExportCSV = () => {
    if (results.length === 0) { toast.error('No results to export'); return; }

    const q = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const row = (...cols: any[]) => cols.map(q).join(',');
    const blank = () => '';

    const exportDate = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const searchDate = new Date(searchRun.searchDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ── Build criteria summary ─────────────────────────────────────────────────
    const c = searchRun.criteria || {};
    const priceRange = c.minPrice && c.maxPrice ? `$${Number(c.minPrice).toLocaleString()} – $${Number(c.maxPrice).toLocaleString()}`
      : c.minPrice ? `$${Number(c.minPrice).toLocaleString()}+`
      : c.maxPrice ? `Up to $${Number(c.maxPrice).toLocaleString()}`
      : 'Any';

    const lines: string[] = [];

    // ── Section 1: Company Header ──────────────────────────────────────────────
    lines.push(row('LISTINGBUG', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''));
    lines.push(row('Real Estate Data Intelligence', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''));
    lines.push(row('thelistingbug.com', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''));
    lines.push(row(''));
    lines.push(row('Report Generated:', exportDate, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''));
    lines.push(row(''));

    // ── Section 2: Search Parameters ──────────────────────────────────────────
    lines.push(row('── SEARCH PARAMETERS ────────────────────────────────────────────'));
    lines.push(row('Location:', searchRun.location));
    lines.push(row('Search Run:', searchDate));
    lines.push(row('Property Type:', c.propertyType || 'All'));
    lines.push(row('Listing Status:', c.status || 'Active'));
    lines.push(row('Price Range:', priceRange));
    if (c.beds) lines.push(row('Min Bedrooms:', c.beds));
    if (c.baths) lines.push(row('Min Bathrooms:', c.baths));
    if (c.daysOld) lines.push(row('Listed Within (days):', c.daysOld));
    if (c.minPrice || c.maxPrice) lines.push(row('Price Range:', priceRange));
    lines.push(row(''));

    // ── Section 3: Results Summary ─────────────────────────────────────────────
    lines.push(row('── RESULTS SUMMARY ──────────────────────────────────────────────'));
    lines.push(row('Total Listings:', results.length));
    const noPhone = results.filter((r: any) => !r.agentPhone).length;
    const noEmail = results.filter((r: any) => !r.agentEmail).length;
    lines.push(row('No Agent Phone:', noPhone));
    lines.push(row('No Agent Email:', noEmail));
    lines.push(row(''));

    // ── Section 4: Column Headers ──────────────────────────────────────────────
    // Sort: price descending; records missing both phone AND email go to bottom
    const sorted = [...results].sort((a: any, b: any) => {
      const aContact = !!(a.agentPhone || a.agentEmail);
      const bContact = !!(b.agentPhone || b.agentEmail);
      if (aContact !== bContact) return aContact ? -1 : 1;
      return (b.price || 0) - (a.price || 0);
    });
    lines.push(row('── LISTINGS ─────────────────────────────────────────────────────'));
    lines.push([
      // Property Identity
      'MLS #', 'Status', 'Listed Date', 'Days on Market', 'Price Drop',
      // Address
      'Full Address', 'Street Address', 'City', 'State', 'ZIP', 'County',
      // Property Details
      'Property Type', 'Bedrooms', 'Bathrooms', 'Sq Ft', 'Lot Size (sq ft)', 'Year Built', 'HOA Fee/mo',
      // Financials
      'List Price', 'Price per Sq Ft',
      // Listing Agent
      'Agent Name', 'Agent Phone', 'Agent Email',
      // Brokerage
      'Brokerage', 'Brokerage Phone', 'Brokerage Email',
      // Location Data
      'Latitude', 'Longitude',
    ].map(q).join(','));

    // ── Section 5: Data Rows ───────────────────────────────────────────────────
    sorted.forEach((r: any) => {
      const pricePsf = r.price && r.sqft ? Math.round(r.price / r.sqft) : '';
      const listedDate = r.listedDate ? new Date(r.listedDate).toLocaleDateString('en-US') : '';
      lines.push([
        q(r.mlsNumber || ''),
        q(r.status || 'Active'),
        q(listedDate),
        q(r.daysListed || 0),
        q(r.priceDrop ? 'Yes' : 'No'),
        q(r.formattedAddress || `${r.address}, ${r.city}, ${r.state} ${r.zip}`),
        q(r.address || ''),
        q(r.city || ''),
        q(r.state || ''),
        q(r.zip || ''),
        q(r.county || ''),
        q(r.propertyType || ''),
        q(r.bedrooms || ''),
        q(r.bathrooms || ''),
        q(r.sqft || ''),
        q(r.lotSize || ''),
        q(r.yearBuilt || ''),
        q(r.hoaFee != null ? `$${r.hoaFee}` : ''),
        q(r.price ? `$${r.price.toLocaleString()}` : ''),
        q(pricePsf ? `$${pricePsf}` : ''),
        q(r.agentName || ''),
        q(r.agentPhone || ''),
        q(r.agentEmail || ''),
        q(r.brokerage || r.officeName || ''),
        q(r.officePhone || ''),
        q(r.officeEmail || ''),
        q(r.latitude || ''),
        q(r.longitude || ''),
      ].join(','));
    });

    lines.push(row(''));
    lines.push(row('── END OF REPORT ────────────────────────────────────────────────'));
    lines.push(row('Powered by ListingBug × RentCast', '', 'Data sourced from RentCast MLS feed'));

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ListingBug-${searchRun.location.replace(/[^a-z0-9]/gi, '-')}-${new Date(searchRun.searchDate).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${results.length} listings`);
  };

  const handleConfirmSave = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const id = crypto.randomUUID();
      await supabase.from('searches').upsert({
        id,
        user_id: user.id,
        name: saveSearchName.trim(),
        location: searchRun.location,
        filters_json: {
          criteria: searchRun.criteria,
          criteriaDescription: searchRun.criteriaDescription,
        },
        created_at: new Date().toISOString(),
        last_run_at: new Date().toISOString(),
        status: 'active',
      }, { onConflict: 'id' });

      setIsSaved(true);
      setShowSaveModal(false);
      setSaveSearchName('');
      toast.success(`Search "${saveSearchName.trim()}" saved!`);
    } catch (err: any) {
      toast.error('Failed to save search: ' + (err.message || 'unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToIntegration = async (integrationId: string) => {
    if (results.length === 0) { toast.error('No results to send'); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Sign in to send to integrations'); return; }

    const { data: conn } = await supabase
      .from('integration_connections')
      .select('config')
      .eq('integration_id', integrationId)
      .single();

    if (!conn) { toast.error(`${integrationId} is not connected`); return; }
    const cfg = conn.config || {};

    if (integrationId === 'mailchimp') {
      if (!cfg.list_id) {
        toast.error('Mailchimp audience not configured. Go to Integrations → Settings to choose an audience.');
        return;
      }
      const toastId = toast.info(`Sending ${results.length} listing${results.length !== 1 ? 's' : ''} to Mailchimp…`, { autoClose: false });
      try {
        // Normalize flat agentEmail → agent_email so send-to-mailchimp can find the email
        const normalized = results.map((r: any) => ({
          ...r,
          agent_email: r.agent_email || r.agentEmail || r.listingAgent?.email,
        }));
        const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/send-to-mailchimp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({
            listings: normalized,
            list_id: cfg.list_id,
            tags: cfg.tags ? cfg.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
            double_opt_in: cfg.double_opt_in || false,
          }),
        });
        const data = await res.json().catch(() => ({}));
        toast.dismiss(toastId);
        if (!res.ok) {
          toast.error(`Mailchimp error: ${data.error || `HTTP ${res.status}`}`);
          return;
        }
        const { sent = 0, failed = 0, skipped_no_email = 0 } = data;
        if (failed > 0 && sent === 0) {
          toast.error(`Mailchimp: ${failed} contacts failed. Check audience merge fields.`);
        } else if (sent === 0) {
          toast.warn(`Sent 0 contacts — ${skipped_no_email} listing${skipped_no_email !== 1 ? 's' : ''} had no agent email.`);
        } else {
          toast.success(`Sent ${sent} contact${sent !== 1 ? 's' : ''} to Mailchimp${failed > 0 ? ` (${failed} failed)` : ''}.`);
        }
      } catch (e: any) {
        toast.dismiss(toastId);
        toast.error(`Network error: ${e.message}`);
      }
    } else {
      toast.info(`Sending to ${integrationId} is coming soon.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-12">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search History
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-[#FFCE0A]" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{searchRun.location}</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{searchRun.criteriaDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (!isSaved) setShowSaveModal(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                isSaved
                  ? 'bg-[#FFCE0A] border-[#FFCE0A] text-[#0F1115]'
                  : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20'
              }`}
            >
              {isSaved
                ? <><Check className="w-4 h-4" />Saved</>
                : <><Save className="w-4 h-4" />Save Search</>
              }
            </button>
            <ExportDropdown
              onExportCSV={handleExportCSV}
              onSendToIntegration={handleSendToIntegration}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs text-gray-700 dark:text-gray-300">
            <Calendar className="w-3 h-3" />
            {new Date(searchRun.searchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFCE0A]/20 rounded-full text-xs text-[#342e37] dark:text-[#FFCE0A] font-medium">
            {searchRun.resultsCount} listing{searchRun.resultsCount !== 1 ? 's' : ''}
          </span>
          {searchRun.criteria?.propertyType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs text-gray-700 dark:text-gray-300">
              <Home className="w-3 h-3" />
              {searchRun.criteria.propertyType}
            </span>
          )}
          {(searchRun.criteria?.minPrice || searchRun.criteria?.maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs text-gray-700 dark:text-gray-300">
              <DollarSign className="w-3 h-3" />
              {searchRun.criteria.minPrice ? '$' + Number(searchRun.criteria.minPrice).toLocaleString() : ''}
              {searchRun.criteria.minPrice && searchRun.criteria.maxPrice ? ' – ' : ''}
              {searchRun.criteria.maxPrice ? '$' + Number(searchRun.criteria.maxPrice).toLocaleString() : ''}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFCE0A]" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No listing data for this run</p>
          <p className="text-sm text-gray-400 mt-1">Results are stored on new searches. Re-run this search to capture listings.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <LBTable>
              <LBTableHeader>
                <LBTableRow>
                  <LBTableHead>Address</LBTableHead>
                  <LBTableHead>City</LBTableHead>
                  <LBTableHead>Price</LBTableHead>
                  <LBTableHead>Beds/Baths</LBTableHead>
                  <LBTableHead>Sq Ft</LBTableHead>
                  <LBTableHead>Days Listed</LBTableHead>
                  <LBTableHead>Agent</LBTableHead>
                  <LBTableHead>Status</LBTableHead>
                </LBTableRow>
              </LBTableHeader>
              <LBTableBody>
                {paginated.map((listing: any, i: number) => (
                  <LBTableRow
                    key={listing.id || i}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                    onClick={() => setSelectedListing(listing)}
                  >
                    <LBTableCell className="font-medium max-w-[180px] truncate">{listing.address}</LBTableCell>
                    <LBTableCell>{listing.city}</LBTableCell>
                    <LBTableCell className="font-medium">${listing.price?.toLocaleString()}</LBTableCell>
                    <LBTableCell>{listing.bedrooms}bd / {listing.bathrooms}ba</LBTableCell>
                    <LBTableCell>{listing.sqft?.toLocaleString()} sf</LBTableCell>
                    <LBTableCell className={listing.daysListed > 14 ? 'text-orange-600 font-medium' : ''}>{listing.daysListed}d</LBTableCell>
                    <LBTableCell className="max-w-[140px] truncate">{listing.agentName || <span className="text-gray-400 italic text-xs">Not provided</span>}</LBTableCell>
                    <LBTableCell>
                      <span className={'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + (
                        listing.status === 'Active' ? 'bg-green-100 text-green-800' :
                        listing.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      )}>{listing.status}</span>
                    </LBTableCell>
                  </LBTableRow>
                ))}
              </LBTableBody>
            </LBTable>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <LBButton variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</LBButton>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages} · {results.length} listings</span>
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

      {/* Save Search Modal */}
      {showSaveModal && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Save Search</h3>
              <button onClick={() => { setShowSaveModal(false); setSaveSearchName(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Give this search a name so you can find it again later.
            </p>
            <input
              type="text"
              value={saveSearchName}
              onChange={e => setSaveSearchName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmSave(); }}
              placeholder={`e.g. Denver Single Family Under 500k`}
              className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFCE0A] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSaveModal(false); setSaveSearchName(''); }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving || !saveSearchName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-[#FFCE0A] text-[#0F1115] text-sm font-semibold hover:bg-[#FFCE0A]/90 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Search'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
