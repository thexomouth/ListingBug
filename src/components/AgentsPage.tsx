import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, Mail, Globe, Search, ChevronUp, ChevronDown, Users, TrendingDown, Building2, MapPin, X } from 'lucide-react';
import { ListingDetailModal } from './ListingDetailModal';

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

      // Pull all listings with agent data from the cached listings table
      const { data, error } = await supabase
        .from('listings')
        .select('id,agent_name,agent_phone,agent_email,agent_website,office_name,office_phone,office_email,price,days_on_market,price_reduced,zip_code,listed_date,address_line1,formatted_address,city,state,bedrooms,bathrooms,square_footage,status,property_type,year_built,lot_size,latitude,longitude,description,photos_json,history_json,mls_number,mls_name,hoa_fee,virtual_tour_url,listing_type_detail,garage,garage_spaces,pool,stories,created_date,last_seen_date,removed_date')
        .not('agent_name', 'is', null)
        .neq('agent_name', '');

      if (error || !data) { setIsLoading(false); return; }

      // Aggregate by agent name
      const map = new Map<string, Agent>();
      for (const l of data) {
        const key = l.agent_name;
        if (!map.has(key)) {
          map.set(key, {
            agentName: l.agent_name,
            agentPhone: l.agent_phone,
            agentEmail: l.agent_email,
            agentWebsite: l.agent_website,
            officeName: l.office_name,
            officePhone: l.office_phone,
            officeEmail: l.office_email,
            listingCount: 0, avgPrice: 0, avgDom: 0, priceDrops: 0,
            zipCodes: [], lastListed: null, listings: [],
          });
        }
        const a = map.get(key)!;
        a.listingCount++;
        a.listings.push({
          id: l.id,
          address: l.address_line1 || l.formatted_address || '',
          formattedAddress: l.formatted_address || '',
          city: l.city || '', state: l.state || '', zip: l.zip_code || '',
          price: l.price || 0, bedrooms: l.bedrooms || 0,
          bathrooms: l.bathrooms || 0, sqft: l.square_footage || 0,
          daysListed: l.days_on_market || 0, status: l.status || 'Active',
          propertyType: l.property_type || '', yearBuilt: l.year_built || 0,
          lotSize: l.lot_size || 0, latitude: l.latitude || 0,
          longitude: l.longitude || 0, description: l.description || '',
          photos: l.photos_json || [], history: l.history_json || null,
          mlsNumber: l.mls_number || '', mlsName: l.mls_name || '',
          hoaFee: l.hoa_fee, virtualTourUrl: l.virtual_tour_url || '',
          listingTypeDetail: l.listing_type_detail || '',
          garage: l.garage, garageSpaces: l.garage_spaces,
          pool: l.pool, stories: l.stories,
          priceDrop: l.price_reduced || false, priceDropAmount: 0, priceDropPercent: 0,
          listedDate: l.listed_date || '', removedDate: l.removed_date || '',
          createdDate: l.created_date || '', lastSeenDate: l.last_seen_date || '',
          agentName: l.agent_name || '', agentPhone: l.agent_phone || '',
          agentEmail: l.agent_email || '', agentWebsite: l.agent_website || '',
          brokerage: l.office_name || '', officeName: l.office_name || '',
          officePhone: l.office_phone || '', officeEmail: l.office_email || '',
          reList: false,
        });
        if (l.price) a.avgPrice += l.price;
        if (l.days_on_market) a.avgDom += l.days_on_market;
        if (l.price_reduced) a.priceDrops++;
        if (l.zip_code && !a.zipCodes.includes(l.zip_code)) a.zipCodes.push(l.zip_code);
        if (l.listed_date && (!a.lastListed || l.listed_date > a.lastListed)) a.lastListed = l.listed_date;
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
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#FFCE0A] border-t-transparent rounded-full animate-spin" />
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
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-white/10">
              <div className="col-span-4">Agent / Brokerage</div>
              <div className="col-span-2 text-center cursor-pointer hover:text-gray-700 dark:hover:text-white" onClick={() => handleSort('listingCount')}>Listings<SortIcon k="listingCount" /></div>
              <div className="col-span-2 text-center cursor-pointer hover:text-gray-700 dark:hover:text-white" onClick={() => handleSort('avgPrice')}>Avg Price<SortIcon k="avgPrice" /></div>
              <div className="col-span-1 text-center cursor-pointer hover:text-gray-700 dark:hover:text-white" onClick={() => handleSort('avgDom')}>DOM<SortIcon k="avgDom" /></div>
              <div className="col-span-1 text-center cursor-pointer hover:text-gray-700 dark:hover:text-white" onClick={() => handleSort('priceDrops')}>Drops<SortIcon k="priceDrops" /></div>
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
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedAgent(isExpanded ? null : agent.agentName)}
                    >
                      {/* Agent name + contact */}
                      <div className="col-span-4 min-w-0">
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
                          <div className="flex gap-1 flex-wrap ml-9 mt-1">
                            {agent.zipCodes.slice(0, 4).map(z => (
                              <span key={z} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{z}</span>
                            ))}
                            {agent.zipCodes.length > 4 && <span className="text-[10px] text-gray-400">+{agent.zipCodes.length - 4}</span>}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="col-span-2 text-center">
                        <span className="font-bold text-[15px] text-gray-900 dark:text-white">{agent.listingCount}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-[13px] text-gray-700 dark:text-gray-300">{agent.avgPrice > 0 ? `$${agent.avgPrice.toLocaleString()}` : '--'}</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-[13px] font-medium ${agent.avgDom > 30 ? 'text-orange-500' : agent.avgDom > 14 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {agent.avgDom > 0 ? `${agent.avgDom}d` : '--'}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        {agent.priceDrops > 0
                          ? <span className="inline-flex items-center gap-0.5 text-[12px] font-medium text-red-500"><TrendingDown className="w-3 h-3" />{agent.priceDrops}</span>
                          : <span className="text-[13px] text-gray-400">0</span>
                        }
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
