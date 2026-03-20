import { Database, CheckCircle, XCircle, Clock, ChevronRight, Link2, AlertCircle, RefreshCw } from 'lucide-react';
import { IntegrationActivity } from '../RecentActivitySection';

interface IntegrationActivityCardProps {
  activity: IntegrationActivity;
  onClick: () => void;
}

export function IntegrationActivityCard({ activity, onClick }: IntegrationActivityCardProps) {
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

  const getActionIcon = () => {
    switch (activity.action) {
      case 'connected':
      case 'disconnected':
        return Link2;
      case 'transfer':
        return Database;
      case 'sync':
        return RefreshCw;
      case 'error':
        return AlertCircle;
      default:
        return Database;
    }
  };

  const getActionLabel = () => {
    switch (activity.action) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'transfer':
        return 'Data Transfer';
      case 'sync':
        return 'Synced';
      case 'error':
        return 'Error';
      default:
        return activity.action;
    }
  };

  const ActionIcon = getActionIcon();

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
        activity.status === 'failed'
          ? 'border-red-200 bg-red-50/30 hover:border-red-300'
          : 'border-green-200 bg-green-50/30 hover:border-green-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${
            activity.status === 'failed' ? 'bg-red-100' : 'bg-green-100'
          }`}>
            <ActionIcon className={`w-5 h-5 ${
              activity.status === 'failed' ? 'text-red-600' : 'text-green-600'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-[15px] text-[#342E37]">
                {activity.integrationName}
              </h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                activity.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : activity.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {activity.status === 'failed' ? (
                  <><XCircle className="w-3 h-3" /> {getActionLabel()}</>
                ) : activity.status === 'success' ? (
                  <><CheckCircle className="w-3 h-3" /> {getActionLabel()}</>
                ) : (
                  <>{getActionLabel()}</>
                )}
              </span>
            </div>

            <p className="text-[13px] text-gray-700 mb-2">
              {activity.details}
            </p>

            <div className="flex items-center gap-1 text-[12px] text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              {formatTimeAgo(activity.timestamp)}
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}