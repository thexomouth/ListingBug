import { Zap, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { AutomationActivity } from '../RecentActivitySection';

interface AutomationActivityCardProps {
  activity: AutomationActivity;
  onClick: () => void;
}

export function AutomationActivityCard({ activity, onClick }: AutomationActivityCardProps) {
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
      className="border border-blue-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-blue-50/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${
            activity.status === 'success' ? 'bg-blue-100' : 'bg-red-100'
          }`}>
            <Zap className={`w-5 h-5 ${
              activity.status === 'success' ? 'text-blue-600' : 'text-red-600'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-[15px] text-[#342E37]">
                {activity.automationName}
              </h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                activity.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {activity.status === 'success' ? (
                  <><CheckCircle className="w-3 h-3" /> Success</>
                ) : (
                  <><XCircle className="w-3 h-3" /> Failed</>
                )}
              </span>
            </div>

            <p className="text-[13px] text-gray-700 mb-2">
              {activity.status === 'success' 
                ? `Delivered ${activity.listingsDelivered} listing${activity.listingsDelivered !== 1 ? 's' : ''} to ${activity.destination.label}`
                : activity.details || 'Delivery failed'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTimeAgo(activity.timestamp)}
              </div>
              <div>
                Search: <span className="font-medium">{activity.searchName}</span>
              </div>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}