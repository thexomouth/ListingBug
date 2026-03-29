import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, Mail, Globe, Search, ChevronUp, ChevronDown, Users, TrendingDown, Building2, MapPin, X } from 'lucide-react';
import { ListingDetailModal } from './ListingDetailModal';
import { SkeletonAgentRow } from './SkeletonLoader';

interface Agent {
  agentName: string;
  agentPhone: string | null;
  agentEmail: string | null;
  agentWebsite: string | null;
  officeName: string | null;
  officePhone: string | null;
  officeEmail: string | null;
  listingCount: number;
  avgPrice: number;
  avgDom: number;
  priceDrops: number;
  zipCodes: string[];
  lastListed: string | null;
  listings: any[];
}

type SortKey = 'listingCount' | 'avgPrice' | 'avgDom' | 'priceDrops' | 'lastListed';
type SortDir = 'asc' | 'desc';

interface AgentsPageProps {
  onNavigate?: (page: any) => void;
}

export function AgentsPage({ onNavigate }: AgentsPageProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const resultsPerPageOptions = [10, 25, 50, 100];
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [zipFilter, setZipFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('listingCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      // Load saved listing IDs for this user so saved state renders correctly
      const { data: savedRows } = await supabase
        .from('saved_listings')
        .select('listing_id')
        .eq('user_id', user.id);
      if (savedRows) {
        setSavedListingIds(new Set(savedRows.map((r: any) => r.listing_id).filter(Boolean)));
      }

      // Build agent leaderboard from this user's own search runs only —
      // the global `listings` table is a shared cache (no user_id) so we
      // must use search_runs to keep data user-scoped
      const { data: runs, error } = await supabase
        .from('search_runs')
        .select('results_json')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(20);

      if (error || !runs) { setIsLoading(false); return; }

      // Flatten all listings across runs, deduplicate by id
      const seen = new Set<string>();
      const allListings: any[] = [];
      for (const run of runs) {
        const arr: any[] = run.results_json || [];
        for (const l of arr) {
          const lid = String(l.id || '');
          if (lid && !seen.has(lid)) { seen.add(lid); allListings.push(l); }
        }
      }

      // Aggregate by agent name — listings already use camelCase from search results
      const map = new Map<string, Agent>();
      for (const l of allListings) {
        if (!l.agentName) continue;
        const key = l.agentName;
        if (!map.has(key)) {
          map.set(key, {
            agentName: l.agentName,
            agentPhone: l.agentPhone || null,
            agentEmail: l.agentEmail || null,
            agentWebsite: l.agentWebsite || null,
            officeName: l.officeName || null,
            officePhone: l.officePhone || null,
            officeEmail: l.officeEmail || null,
            listingCount: 0, avgPrice: 0, avgDom: 0, priceDrops: 0,
            zipCodes: [], lastListed: null, listings: [],
          });
        }
        const a = map.get(key)!;
        a.listingCount++;
        a.listings.push(l);
        if (l.price) a.avgPrice += l.price;
        if (l.daysListed) a.avgDom += l.daysListed;
        if (l.priceDrop) a.priceDrops++;
        if (l.zip && !a.zipCodes.includes(l.zip)) a.zipCodes.push(l.zip);
        if (l.listedDate && (!a.lastListed || l.listedDate > a.lastListed)) a.lastListed = l.listedDate;
      }

      const result: Agent[] = [];
      for (const a of map.values()) {
        a.avgPrice = a.listingCount > 0 ? Math.round(a.avgPrice / a.listingCount) : 0;
        a.avgDom = a.listingCount > 0 ? Math.round(a.avgDom / a.listingCount) : 0;
        a.listings.sort((x, y) => (y.price || 0) - (x.price || 0));
        result.push(a);
      }
      setAgents(result);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...agents];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(a =>
        a.agentName.toLowerCase().includes(s) ||
        (a.officeName || '').toLowerCase().includes(s) ||
        (a.agentEmail || '').toLowerCase().includes(s)
      );
    }
    if (zipFilter.trim()) {
      list = list.filter(a => a.zipCodes.some(z => z.includes(zipFilter.trim())));
    }
    list.sort((a, b) => {
      let av = a[sortKey] as any;
      let bv = b[sortKey] as any;
      if (sortKey === 'lastListed') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      if (av === null || av === undefined) av = 0;
      if (bv === null || bv === undefined) bv = 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [agents, search, zipFilter, sortKey, sortDir]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / resultsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filtered.slice(start, start + resultsPerPage);
  }, [filtered, currentPage, resultsPerPage]);

  // Reset to page 1 if filters or resultsPerPage change
  useEffect(() => { setCurrentPage(1); }, [search, zipFilter, resultsPerPage]);

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />)
    : <ChevronDown className="w-3 h-3 inline ml-1 opacity-30" />;

  const handleSaveListing = async (listing: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const already = savedListingIds.has(listing.id);
    if (already) {
      await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', listing.id);
      setSavedListingIds(prev => { const n = new Set(prev); n.delete(listing.id); return n; });
    } else {
      await supabase.from('saved_listings').upsert({ user_id: user.id, listing_id: listing.id, listing_data: listing });
      setSavedListingIds(prev => new Set([...prev, listing.id]));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F1115] border-b dark:border-white/10 px-4 md:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Leaderboard</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ranked by listing activity from your searches. {agents.length} agents tracked.
          </p>
        </div>
      </div>

      {/* Results per page selector */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex justify-end">
        <label className="text-[13px] text-gray-600 dark:text-gray-300 mr-2">Results per page:</label>
        <select
          className="border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-[13px] bg-white dark:bg-[#1a1a1a] dark:text-white"
          value={resultsPerPage}
          onChange={e => setResultsPerPage(Number(e.target.value))}
        >
          {resultsPerPageOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0F1115] border-b dark:border-white/10 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search agent name, brokerage, or email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#1a1a1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFCE0A]"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="relative w-full sm:w-40">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Filter by ZIP..."
              value={zipFilter} onChange={e => setZipFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#1a1a1a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFCE0A]"
            />
            {zipFilter && <button onClick={() => setZipFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="grid grid-cols-8 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-white/10">
              <div className="col-span-5">Agent / Brokerage</div>
              <div className="col-span-1 text-center">Listings</div>
              <div className="col-span-2 text-right">Last Listed</div>
            </div>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonAgentRow key={i} />)}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-24">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-500 dark:text-white text-lg">No agent data yet</p>
            <p className="text-sm text-gray-400 mt-1">Run searches in Listings to populate the agent leaderboard.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-500 dark:text-white">No agents match your filters</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-8 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-white/10">
              <div className="col-span-5">Agent / Brokerage</div>
              <div className="col-span-1 text-center cursor-pointer hover:text-gray-700 dark:hover:text-white" onClick={() => handleSort('listingCount')}>Listings<SortIcon k="listingCount" /></div>
              <div className="col-span-2 text-right cursor-pointer hover:text-gray-700 dark:hover:text-white" onClick={() => handleSort('lastListed')}>Last Listed<SortIcon k="lastListed" /></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {paginated.map((agent, idx) => {
                const isExpanded = expandedAgent === agent.agentName;
                return (
                  <div key={agent.agentName}>
                    {/* Agent row */}
                    <div
                      className="grid grid-cols-8 gap-2 px-4 py-3 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedAgent(isExpanded ? null : agent.agentName)}
                    >
                      {/* Agent name + contact */}
                      <div className="col-span-5 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#FFCE0A] flex items-center justify-center text-[#342e37] font-bold text-[11px] flex-shrink-0">
                            {agent.agentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[13px] text-gray-900 dark:text-white truncate">{agent.agentName}</p>
                            {agent.officeName && <p className="text-[11px] text-gray-400 truncate">{agent.officeName}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-0 md:gap-3 mt-1.5 ml-9">
                          {agent.agentPhone && (
                            <a href={`tel:${agent.agentPhone}`} onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] text-[#342e37] dark:text-[#FFCE0A] font-medium hover:underline">
                              <Phone className="w-3 h-3" />{agent.agentPhone}
                            </a>
                          )}
                          {agent.agentEmail && (
                            <a href={`mailto:${agent.agentEmail}`} onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] text-[#342e37] dark:text-[#FFCE0A] font-medium hover:underline mt-1 md:mt-0">
                              <Mail className="w-3 h-3" />{agent.agentEmail}
                            </a>
                          )}
                        </div>
                        {agent.zipCodes.length > 0 && (
                          <div className="hidden sm:flex gap-1 flex-wrap ml-9 mt-1">
                            {agent.zipCodes.slice(0, 4).map(z => (
                              <span key={z} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{z}</span>
                            ))}
                            {agent.zipCodes.length > 4 && <span className="text-[10px] text-gray-400">+{agent.zipCodes.length - 4}</span>}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="col-span-1 text-center">
                        <span className="font-bold text-[15px] text-gray-900 dark:text-white">{agent.listingCount}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">
                          {agent.lastListed ? new Date(agent.lastListed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded listings */}
                    {isExpanded && (
                      <div className="bg-gray-50 dark:bg-[#111] border-t border-gray-200 dark:border-white/10 px-4 py-4">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          {agent.listings.length} Listing{agent.listings.length !== 1 ? 's' : ''} — click to open
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {agent.listings.map(listing => (
                            <div key={listing.id}
                              onClick={() => setSelectedListing(listing)}
                              className="flex items-center justify-between gap-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 cursor-pointer hover:border-[#FFCE0A] hover:shadow-sm transition-all"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-[13px] text-gray-900 dark:text-white truncate">{listing.address}</p>
                                <p className="text-[11px] text-gray-400">{listing.city}, {listing.state} {listing.zip}</p>
                                <div className="flex gap-2 mt-0.5 text-[11px] text-gray-500">
                                  <span>{listing.bedrooms}bd / {listing.bathrooms}ba</span>
                                  {listing.sqft > 0 && <span>· {listing.sqft.toLocaleString()} sf</span>}
                                  <span>· {listing.daysListed}d DOM</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-[14px] text-gray-900 dark:text-white">${listing.price?.toLocaleString()}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${listing.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{listing.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results count */}
        {/* Pagination controls */}
        {!isLoading && filtered.length > 0 && (
          <>
            <p className="text-[12px] text-gray-400 mt-3 text-right">{filtered.length} agent{filtered.length !== 1 ? 's' : ''} shown</p>
            <div className="flex justify-center items-center gap-2 mt-2">
              <button
                className="px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-[13px] disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="text-[13px] text-gray-600 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-[13px] disabled:opacity-50"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Listing detail modal */}
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
