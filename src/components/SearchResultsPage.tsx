import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, Home, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBButton } from './design-system/LBButton';
import { ListingDetailModal } from './ListingDetailModal';
import { ExportDropdown } from './ExportDropdown';
import { toast } from 'sonner';

interface SearchResultsPageProps {
  searchRun: {
    id: string;
    location: string;
    criteriaDescription: string;
    searchDate: string;
    resultsCount: number;
    criteria: any;
  };
  onBack: () => void;
}

export function SearchResultsPage({ searchRun, onBack }: SearchResultsPageProps) {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 25;

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('search_runs')
        .select('results_json')
        .eq('id', searchRun.id)
        .single();
      if (data?.results_json) {
        setResults(Array.isArray(data.results_json) ? data.results_json : []);
      }
      setIsLoading(false);
    };
    loadResults();
  }, [searchRun.id]);

  const totalPages = Math.ceil(results.length / resultsPerPage);
  const paginated = results.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage);

  const handleExportCSV = () => {
    if (results.length === 0) { toast.error('No results to export'); return; }
    const headers = ['Address', 'City', 'State', 'ZIP', 'Price', 'Beds', 'Baths', 'Sq Ft', 'Days Listed', 'Agent', 'Agent Phone', 'Agent Email'];
    const rows = results.map((r: any) => [
      r.address, r.city, r.state, r.zip,
      r.price, r.bedrooms, r.bathrooms, r.sqft,
      r.daysListed, r.agentName || '', r.agentPhone || '', r.agentEmail || ''
    ]);
    const csv = [headers, ...rows].map((row: any[]) => row.map((v: any) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search-' + searchRun.location.replace(/[^a-z0-9]/gi, '-') + '-' + new Date(searchRun.searchDate).toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
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
          <ExportDropdown
            onExportCSV={handleExportCSV}
            onSendToIntegration={(integration: string) => toast.success('Sending ' + results.length + ' listings to ' + integration + '...')}
          />
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
          <p className="text-gray-500 font-medium">No listings stored for this search run</p>
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
        />
      )}
    </div>
  );
}
