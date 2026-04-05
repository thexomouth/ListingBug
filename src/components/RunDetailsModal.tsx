import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { LBButton } from './design-system/LBButton';
import { supabase } from '../lib/supabase';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Target,
  Send,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';

interface RunDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: any; // The automation run data
  onViewListings?: () => void;
}

export function RunDetailsModal({
  isOpen,
  onClose,
  run,
  onViewListings
}: RunDetailsModalProps) {
  const [showCriteria, setShowCriteria] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [runListings, setRunListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && run?.id) {
      setShowCriteria(false);
      setShowResults(false);
      setRunListings([]);
    }
  }, [isOpen, run?.id]);

  const fetchRunListings = async () => {
    if (!run?.id || runListings.length > 0) return;
    setListingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('automation_run_listings')
        .select('listing_id, listing_data, transferred')
        .eq('automation_run_id', run.id)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!error && data) setRunListings(data);
    } catch (e) {
      console.error('Failed to fetch run listings:', e);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleToggleResults = () => {
    if (!showResults) fetchRunListings();
    setShowResults(prev => !prev);
  };

  if (!run) return null;

  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
      case 'error':
        return 'bg-red-500';
      case 'partial':
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-[#FFD447] -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6">
          <DialogTitle className="text-[#342E37] flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Run Details
          </DialogTitle>
          <DialogDescription className="text-[#342E37]/80">
            View automation run results and configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Run Overview */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Date & Time</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="font-medium text-[15px] text-[#342e37] dark:text-white">
                  {formatTime(run.date || run.timestamp)}
                </p>
              </div>
            </div>

            {/* Automation Name */}
            <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Automation Name</p>
              <p className="font-medium text-[15px] text-[#342e37] dark:text-white">
                {run.automation || run.name}
              </p>
            </div>

            {/* Status */}
            <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(run.status)}
                <div className={`w-2 h-2 rounded-full ${getStatusColor(run.status)}`} />
                <p className="font-medium text-[15px] text-[#342e37] dark:text-white capitalize">
                  {run.status}
                </p>
              </div>
            </div>

            {/* Results metrics */}
            <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">Results</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-blue-600" />
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Listings Fetched
                    </p>
                  </div>
                  <p className="font-bold text-[24px] text-[#342e37] dark:text-white">
                    {run.listingsFetched ?? run.listingsFound ?? 0}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Upload className="w-4 h-4 text-green-600" />
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Confirmed Exported
                    </p>
                  </div>
                  <p className="font-bold text-[24px] text-[#342e37] dark:text-white">
                    {run.exported ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Destination</p>
              <p className="font-medium text-[15px] text-[#342e37] dark:text-white">
                {run.destination || 'Unknown'}
              </p>
            </div>

            {/* Reason — shown whenever exports were missed */}
            {run.details && (run.status !== 'success' || (run.contactsSkipped ?? 0) > 0 || ((run.listingsFetched ?? run.listingsFound ?? 0) > (run.exported ?? 0))) && (
              <div className={`rounded-lg p-4 border ${run.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${run.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  <p className={`text-[12px] font-medium uppercase tracking-wide ${run.status === 'failed' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {run.status === 'failed' ? 'Export Failed' : 'Partial Export — Reason'}
                  </p>
                </div>
                <p className={`text-[14px] leading-relaxed ${run.status === 'failed' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                  {run.details}
                </p>
              </div>
            )}

            {/* Search Details (if available) */}
            {run.searchName && (
              <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
                <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Saved Search</p>
                <p className="font-medium text-[15px] text-[#342e37] dark:text-white">
                  {run.searchName}
                </p>
              </div>
            )}

            {/* Search Criteria Section (if available) */}
            {run.searchCriteria && Object.keys(run.searchCriteria).length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  onClick={() => setShowCriteria(!showCriteria)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2F2F2F] transition-colors"
                >
                  <span className="font-medium text-[14px] text-[#342e37] dark:text-white">
                    View search criteria
                  </span>
                  {showCriteria ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {showCriteria && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {Object.entries(run.searchCriteria).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;

                      const displayValue = Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value);

                      const displayKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();

                      return (
                        <div key={key} className="flex flex-col">
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {displayKey}
                          </span>
                          <span className="text-[13px] text-gray-900 dark:text-white">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Expandable Results Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={handleToggleResults}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#2F2F2F] transition-colors"
              >
                <span className="font-medium text-[14px] text-[#342e37] dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  Results
                </span>
                {showResults ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showResults && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {listingsLoading ? (
                    <div className="p-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
                      Loading listings...
                    </div>
                  ) : runListings.length === 0 ? (
                    <div className="p-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
                      No listing data available for this run. Detailed results are stored for automations run after this feature was added.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-medium">Address</th>
                            <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-medium hidden sm:table-cell">Type</th>
                            <th className="text-right px-3 py-2 text-gray-500 dark:text-gray-400 font-medium">Price</th>
                            <th className="text-center px-3 py-2 text-gray-500 dark:text-gray-400 font-medium hidden sm:table-cell">Bed/Bath</th>
                            <th className="text-center px-3 py-2 text-gray-500 dark:text-gray-400 font-medium">Exported</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runListings.map((item, idx) => {
                            const d = item.listing_data ?? {};
                            return (
                              <tr key={item.listing_id ?? idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2F2F2F]">
                                <td className="px-3 py-2 text-[#342e37] dark:text-white">
                                  <div className="max-w-[180px] truncate" title={d.formatted_address ?? '—'}>
                                    {d.formatted_address ?? '—'}
                                  </div>
                                  {d.city && (
                                    <div className="text-gray-400 text-[11px]">{d.city}{d.state ? `, ${d.state}` : ''}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell capitalize">
                                  {d.property_type ?? '—'}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-[#342e37] dark:text-white">
                                  {formatPrice(d.price)}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                  {d.bedrooms != null ? `${d.bedrooms}bd` : '—'}{d.bathrooms != null ? ` / ${d.bathrooms}ba` : ''}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {item.transferred ? (
                                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {runListings.length === 100 && (
                        <p className="text-center text-[11px] text-gray-400 py-2">Showing first 100 results</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <LBButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </LBButton>
            {onViewListings && run.listingsFound > 0 && (
              <LBButton
                variant="primary"
                onClick={() => {
                  onViewListings();
                  onClose();
                }}
                className="flex-1"
              >
                View Listings
              </LBButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
