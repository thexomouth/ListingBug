import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { LBButton } from './design-system/LBButton';
import { 
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Target,
  Send
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

            {/* Results */}
            <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
              <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-3">Results</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-600" />
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Listings Found
                    </p>
                  </div>
                  <p className="font-bold text-[24px] text-[#342e37] dark:text-white">
                    {run.listingsFound || run.results || 0}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="w-4 h-4 text-green-600" />
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Exported
                    </p>
                  </div>
                  <p className="font-bold text-[24px] text-[#342e37] dark:text-white">
                    {run.exported || run.listingsFound || run.results || 0}
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

            {/* Search Details (if available) */}
            {run.searchName && (
              <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
                <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Saved Search</p>
                <p className="font-medium text-[15px] text-[#342e37] dark:text-white">
                  {run.searchName}
                </p>
              </div>
            )}

            {/* Details/Notes */}
            {run.details && (
              <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4">
                <p className="text-[12px] text-gray-600 dark:text-gray-400 mb-1">Details</p>
                <p className="text-[14px] text-[#342e37] dark:text-white">
                  {run.details}
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
