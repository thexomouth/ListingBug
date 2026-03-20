import { Search, Clock, ChevronRight, Bookmark, MapPin, Filter } from 'lucide-react';
import { ManualSearchActivity } from '../RecentActivitySection';

interface ManualSearchActivityCardProps {
  activity: ManualSearchActivity;
  onClick: () => void;
}

export function ManualSearchActivityCard({ activity, onClick }: ManualSearchActivityCardProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateObj.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className="border border-purple-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer bg-purple-50/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="p-2 rounded-lg bg-purple-100">
            <Search className="w-5 h-5 text-purple-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-[15px] text-[#342E37]">
                {activity.searchName || 'Manual Search'}
              </h4>
              {activity.saved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800">
                  <Bookmark className="w-3 h-3" /> Saved
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{activity.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                <Filter className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{activity.criteria}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTimeAgo(activity.timestamp)}
              </div>
              <div className="font-medium text-purple-700">
                {activity.resultsCount} result{activity.resultsCount !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}