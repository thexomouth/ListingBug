import { X, RefreshCw, Trash2, CheckCircle, AlertCircle, Settings, ExternalLink, Calendar, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useState } from 'react';

/**
 * INTEGRATION DETAILS PANEL
 * 
 * PURPOSE: Manage connected integration settings and view sync status
 * 
 * FEATURES:
 * - View connection status and last sync time
 * - Configure sync settings (auto-sync, frequency)
 * - Test connection
 * - View sync history
 * - Disconnect integration
 * 
 * BACKEND INTEGRATION:
 * - GET /api/integrations/{service}/details - Get integration details
 * - PATCH /api/integrations/{service}/settings - Update settings
 * - POST /api/integrations/{service}/sync - Manual sync
 * - DELETE /api/integrations/{service} - Disconnect
 */

interface IntegrationDetails {
  id: string;
  name: string;
  logo: string;
  category: string;
  status: 'connected' | 'error' | 'syncing';
  connectedAt: string;
  lastSync?: string;
  nextSync?: string;
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  syncedItems: {
    label: string;
    count: number;
  }[];
  recentActivity: {
    timestamp: string;
    action: string;
    status: 'success' | 'error';
  }[];
  settings?: {
    [key: string]: any;
  };
}

interface IntegrationDetailsPanelProps {
  integration: IntegrationDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: (integrationId: string) => void;
  onSync: (integrationId: string) => void;
  onUpdateSettings: (integrationId: string, settings: any) => void;
}

export function IntegrationDetailsPanel({
  integration,
  isOpen,
  onClose,
  onDisconnect,
  onSync,
  onUpdateSettings,
}: IntegrationDetailsPanelProps) {
  const [autoSync, setAutoSync] = useState(integration?.autoSync || false);
  const [syncFrequency, setSyncFrequency] = useState(integration?.syncFrequency || 'hourly');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  if (!isOpen || !integration) return null;

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled);
    onUpdateSettings(integration.id, { autoSync: enabled, syncFrequency });
  };

  const handleSyncFrequencyChange = (frequency: string) => {
    setSyncFrequency(frequency as any);
    onUpdateSettings(integration.id, { autoSync, syncFrequency: frequency });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onSync(integration.id);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const handleDisconnect = () => {
    onDisconnect(integration.id);
    setShowDisconnectConfirm(false);
    onClose();
  };

  const getStatusBadge = () => {
    switch (integration.status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Syncing
          </Badge>
        );
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-[calc(100%-12px)] md:w-[600px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300">
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <div className="bg-[#ffd447] px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
                {integration.logo}
              </div>
              <div>
                <h2 className="font-bold text-[#342e37]">{integration.name}</h2>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors flex-shrink-0 ml-4"
            >
              <X className="w-5 h-5 text-[#342e37]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* Connection Info */}
              <div>
                <h3 className="font-bold text-[#342e37] mb-3">Connection Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Connected Since</span>
                    <span className="font-medium text-[#342e37]">
                      {new Date(integration.connectedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  
                  {integration.lastSync && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Last Synced</span>
                      <span className="font-medium text-[#342e37]">
                        {new Date(integration.lastSync).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {integration.nextSync && autoSync && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Next Sync
                      </span>
                      <span className="font-medium text-[#342e37]">
                        {new Date(integration.nextSync).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Synced Data */}
              {integration.syncedItems && integration.syncedItems.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#342e37] mb-3">Synced Data</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {integration.syncedItems.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#342e37] mb-1">
                          {item.count.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Sync Settings */}
              <div>
                <h3 className="font-bold text-[#342e37] mb-4">Sync Settings</h3>
                
                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3">
                  <div className="flex-1">
                    <Label htmlFor="auto-sync" className="font-medium text-[#342e37]">
                      Automatic Sync
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically sync data on a schedule
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={handleAutoSyncToggle}
                  />
                </div>

                {/* Sync Frequency */}
                {autoSync && (
                  <div className="space-y-2">
                    <Label>Sync Frequency</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {['realtime', 'hourly', 'daily', 'manual'].map((freq) => (
                        <button
                          key={freq}
                          onClick={() => handleSyncFrequencyChange(freq)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            syncFrequency === freq
                              ? 'border-[#342e37] bg-blue-50 text-[#342e37]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Sync Button */}
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>

              <Separator />

              {/* Recent Activity */}
              {integration.recentActivity && integration.recentActivity.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#342e37] mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </h3>
                  <div className="space-y-2">
                    {integration.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {activity.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{activity.action}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Quick Actions */}
              <div>
                <h3 className="font-bold text-[#342e37] mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in {integration.name}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Disconnect */}
              <div>
                {!showDisconnectConfirm ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => setShowDisconnectConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Disconnect Integration
                  </Button>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="mt-2">
                      <p className="mb-3">
                        Are you sure you want to disconnect {integration.name}? 
                        This will stop all data syncing.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDisconnect}
                        >
                          Yes, Disconnect
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDisconnectConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Help */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Need help?</strong>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  View our integration guide for {integration.name} or contact support.
                </p>
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * MOCK DATA EXAMPLE
 */
export const MOCK_INTEGRATION_DETAILS: { [key: string]: IntegrationDetails } = {
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    logo: '🌩️',
    category: 'CRM',
    status: 'connected',
    connectedAt: '2024-11-15T10:30:00Z',
    lastSync: '2024-11-23T08:15:00Z',
    nextSync: '2024-11-23T09:15:00Z',
    autoSync: true,
    syncFrequency: 'hourly',
    syncedItems: [
      { label: 'Leads', count: 1247 },
      { label: 'Contacts', count: 3891 },
      { label: 'Opportunities', count: 156 },
      { label: 'Accounts', count: 892 },
    ],
    recentActivity: [
      {
        timestamp: '2024-11-23T08:15:00Z',
        action: 'Synced 47 new leads from report "Austin Single Family"',
        status: 'success',
      },
      {
        timestamp: '2024-11-23T07:15:00Z',
        action: 'Synced 23 contacts',
        status: 'success',
      },
      {
        timestamp: '2024-11-23T06:15:00Z',
        action: 'Created 5 new opportunities',
        status: 'success',
      },
    ],
  },
  mailchimp: {
    id: 'mailchimp',
    name: 'Mailchimp',
    logo: '🐵',
    category: 'Email Marketing',
    status: 'connected',
    connectedAt: '2024-11-10T14:20:00Z',
    lastSync: '2024-11-23T07:30:00Z',
    nextSync: '2024-11-24T07:30:00Z',
    autoSync: true,
    syncFrequency: 'daily',
    syncedItems: [
      { label: 'Subscribers', count: 5634 },
      { label: 'Campaigns Sent', count: 47 },
      { label: 'Lists', count: 8 },
    ],
    recentActivity: [
      {
        timestamp: '2024-11-23T07:30:00Z',
        action: 'Added 127 new subscribers to "New Listings" list',
        status: 'success',
      },
      {
        timestamp: '2024-11-22T07:30:00Z',
        action: 'Sent campaign "Weekly Market Update"',
        status: 'success',
      },
    ],
  },
};

/**
 * BACKEND API ENDPOINTS
 * 
 * GET /api/integrations/{service}/details
 * Returns detailed integration information
 * 
 * PATCH /api/integrations/{service}/settings
 * Body: { autoSync: true, syncFrequency: "hourly" }
 * Updates integration settings
 * 
 * POST /api/integrations/{service}/sync
 * Triggers manual sync
 * 
 * DELETE /api/integrations/{service}
 * Disconnects integration
 */