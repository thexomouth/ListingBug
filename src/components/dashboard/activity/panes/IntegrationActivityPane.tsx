import { Database, CheckCircle, XCircle, Link2, AlertCircle, RefreshCw, Settings, ExternalLink, Play } from 'lucide-react';
import { IntegrationActivity } from '../../RecentActivitySection';
import { LBButton } from '../../../design-system/LBButton';
import { Button } from '../../../ui/button';
import { toast } from 'sonner@2.0.3';

interface IntegrationActivityPaneProps {
  activity: IntegrationActivity;
}

export function IntegrationActivityPane({ activity }: IntegrationActivityPaneProps) {
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
        return 'Connection Established';
      case 'disconnected':
        return 'Connection Removed';
      case 'transfer':
        return 'Data Transfer';
      case 'sync':
        return 'Data Synchronization';
      case 'error':
        return 'Integration Error';
      default:
        return activity.action;
    }
  };

  const ActionIcon = getActionIcon();

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-4 rounded-lg border-2 ${
        activity.status === 'failed'
          ? 'bg-red-50 border-red-200'
          : activity.status === 'success'
          ? 'bg-green-50 border-green-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          <ActionIcon className={`w-6 h-6 flex-shrink-0 ${
            activity.status === 'failed'
              ? 'text-red-600'
              : activity.status === 'success'
              ? 'text-green-600'
              : 'text-blue-600'
          }`} />
          <div>
            <h3 className="font-bold text-[15px] mb-1">
              {getActionLabel()}
            </h3>
            <p className="text-[13px] text-gray-700">
              {activity.details}
            </p>
          </div>
        </div>
      </div>

      {/* Integration Details */}
      <div>
        <h4 className="font-bold text-[14px] text-gray-900 dark:text-white mb-3">Integration Details</h4>
        <div className="space-y-3 bg-gray-50 dark:bg-[#252525] rounded-lg p-4">
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Integration</div>
            <div className="text-[14px] font-medium text-gray-900">{activity.integrationName}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Action Type</div>
            <div className="text-[14px] font-medium text-gray-900 capitalize">{activity.action}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Timestamp</div>
            <div className="text-[14px] text-gray-900">{formatDateTime(activity.timestamp)}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-600 mb-1">Status</div>
            <div className="flex items-center gap-1">
              {activity.status === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-[14px] font-medium text-green-700">Success</span>
                </>
              ) : activity.status === 'failed' ? (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-[14px] font-medium text-red-700">Failed</span>
                </>
              ) : (
                <span className="text-[14px] font-medium text-blue-700">Info</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
        <div>
          <h4 className="font-bold text-[14px] text-gray-900 mb-3">
            {activity.action === 'transfer' ? 'Transfer Details' : 
             activity.action === 'sync' ? 'Sync Details' : 
             'Additional Information'}
          </h4>
          <div className="space-y-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            {Object.entries(activity.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-[12px] text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-[14px] font-medium text-gray-900 dark:text-white">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
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
              toast.info('Opening integration settings...');
              // TODO: Navigate to integrations page
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Integration Settings
          </Button>
          
          {activity.status === 'failed' && (
            <>
              <Button
                variant="outline"
                className="w-full justify-start border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => {
                  toast.info('Reconnecting integration...');
                  // TODO: Trigger reconnection flow
                }}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Reconnect Integration
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  toast.info('Opening help documentation...');
                  // TODO: Open troubleshooting guide
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Troubleshooting Guide
              </Button>
            </>
          )}

          {(activity.action === 'connected' || activity.action === 'transfer' || activity.action === 'sync') && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                toast.info('Viewing integration activity...');
                // TODO: Show full activity log
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              View All Integration Activity
            </Button>
          )}

          {activity.action === 'transfer' && activity.status === 'success' && (
            <LBButton
              className="w-full"
              onClick={() => {
                toast.success('Initiating new transfer...');
                // TODO: Start new transfer
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Transfer Data Again
            </LBButton>
          )}
        </div>
      </div>

      {/* Integration Info */}
      <div className={`rounded-lg p-4 border ${
        activity.status === 'failed'
          ? 'bg-red-50 border-red-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <h5 className={`font-bold text-[13px] mb-2 ${
          activity.status === 'failed' ? 'text-red-900' : 'text-blue-900'
        }`}>
          {activity.status === 'failed' ? '⚠️ Action Required' : 'ℹ️ About This Integration'}
        </h5>
        <p className={`text-[12px] ${
          activity.status === 'failed' ? 'text-red-800' : 'text-blue-800'
        }`}>
          {activity.status === 'failed'
            ? 'This integration requires attention. Please reconnect or check your settings to resume automated deliveries.'
            : `${activity.integrationName} is connected and ready to receive listing data from your automations.`}
        </p>
      </div>
    </div>
  );
}