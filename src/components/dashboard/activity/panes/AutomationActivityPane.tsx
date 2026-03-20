import { CheckCircle, XCircle, Zap, Clock, Send, ExternalLink, Settings, PlayCircle } from 'lucide-react';
import { AutomationActivity } from '../../RecentActivitySection';
import { LBButton } from '../../../design-system/LBButton';
import { Button } from '../../../ui/button';
import { toast } from 'sonner@2.0.3';

interface AutomationActivityPaneProps {
  activity: AutomationActivity;
}

export function AutomationActivityPane({ activity }: AutomationActivityPaneProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-4 rounded-lg border-2 ${
        activity.status === 'success'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {activity.status === 'success' ? (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-bold text-[15px] mb-1">
              {activity.status === 'success' ? 'Delivery Successful' : 'Delivery Failed'}
            </h3>
            <p className="text-[13px] text-gray-700">
              {activity.status === 'success'
                ? `${activity.listingsDelivered} listing${activity.listingsDelivered !== 1 ? 's were' : ' was'} delivered to ${activity.destination.label}`
                : activity.details || 'The automation failed to complete'}
            </p>
          </div>
        </div>
      </div>

      {/* Automation Details */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 dark:text-white mb-3">Automation Details</h4>
        <div className="space-y-3 bg-gray-50 dark:bg-[#252525] rounded-lg p-4">
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Automation Name</div>
            <div className="text-[14px] font-medium text-gray-900">{activity.automationName}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Search</div>
            <div className="text-[14px] font-medium text-gray-900">{activity.searchName}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Destination</div>
            <div className="text-[14px] font-medium text-gray-900">{activity.destination.label}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Execution Time</div>
            <div className="text-[14px] text-gray-900">{formatDateTime(activity.timestamp)}</div>
          </div>
        </div>
      </div>

      {/* Delivery Metrics */}
      {activity.status === 'success' && (
        <div>
          <h4 className="font-bold text-[14px] text-gray-900 mb-3">Delivery Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-[12px] text-blue-700 mb-1">Listings Delivered</div>
              <div className="text-[24px] font-bold text-blue-900">{activity.listingsDelivered}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-[12px] text-green-700 mb-1">Status</div>
              <div className="text-[14px] font-bold text-green-900 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Success
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {activity.status === 'failed' && activity.details && (
        <div>
          <h4 className="font-bold text-[14px] text-gray-900 mb-3">Error Details</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-[13px] text-red-800">{activity.details}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              toast.info('Opening automation settings...');
              // TODO: Navigate to automation edit
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Edit Automation Settings
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              toast.info('Running automation now...');
              // TODO: Trigger automation run
            }}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Run Automation Now
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              toast.info('Opening saved search...');
              // TODO: Navigate to search
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Search Criteria
          </Button>

          {activity.status === 'failed' && (
            <Button
              variant="outline"
              className="w-full justify-start border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => {
                toast.info('Opening integration settings...');
                // TODO: Navigate to integration reconnect
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Reconnect Integration
            </Button>
          )}
        </div>
      </div>

      {/* Data Flow */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 mb-3">Data Flow</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-[11px] text-purple-700 mb-1">SOURCE</div>
            <div className="text-[13px] font-medium text-purple-900">{activity.searchName}</div>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex-1 text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-[11px] text-blue-700 mb-1">AUTOMATION</div>
            <div className="text-[13px] font-medium text-blue-900">ListingBug</div>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex-1 text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-[11px] text-green-700 mb-1">DESTINATION</div>
            <div className="text-[13px] font-medium text-green-900">{activity.destination.label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}