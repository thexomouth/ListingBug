import { useState, useEffect } from 'react';
import { IntegrationConnectionModal, INTEGRATION_CONFIGS } from './IntegrationConnectionModal';
import { LBButton } from './design-system/LBButton';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle,
  Settings,
  Zap,
  Mail,
  Database,
  FileSpreadsheet,
  MessageSquare,
  Webhook,
  X,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Shield,
  AlertCircle,
  CheckCheck,
  Clock,
  Bell,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { VisuallyHidden } from './ui/visually-hidden';

interface Integration {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  description: string;
  category: 'connected' | 'available' | 'future';
}

interface AccountIntegrationsTabProps {
  onConnect?: (integrationId: string) => void;
  onManage?: (integrationId: string) => void;
  onRequestIntegration?: () => void;
}

export function AccountIntegrationsTab({ onConnect, onManage, onRequestIntegration }: AccountIntegrationsTabProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionModalIntegration, setConnectionModalIntegration] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Quick action states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'failed' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState('2 hours ago');
  const [connectedIntegrationIds, setConnectedIntegrationIds] = useState<string[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  // Settings modal states
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('15');
  const [defaultAudience, setDefaultAudience] = useState('main-list');
  const [autoTagging, setAutoTagging] = useState(true);
  const [doubleOptIn, setDoubleOptIn] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [emailOnSync, setEmailOnSync] = useState(false);
  const [emailOnError, setEmailOnError] = useState(true);
  const [webhookNotifications, setWebhookNotifications] = useState(false);

  useEffect(() => {
    const loadConnectedIntegrations = async () => {
      setLoadingIntegrations(true);
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setConnectedIntegrationIds([]);
        setLoadingIntegrations(false);
        return;
      }

      const { data, error } = await supabase
        .from('integration_connections')
        .select('integration_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to load integrations:', error);
        toast.error('Unable to load your integrations');
        setConnectedIntegrationIds([]);
      } else {
        setConnectedIntegrationIds((data || []).map((row: any) => row.integration_id));
      }

      setLoadingIntegrations(false);
    };

    loadConnectedIntegrations();
  }, []);

  const allIntegrations: Integration[] = [
    { 
      id: 'mailchimp', 
      name: 'Mailchimp', 
      icon: Mail, 
      connected: false, 
      description: 'Sync contacts and trigger campaigns',
      category: 'available'
    },

    { 
      id: 'salesforce', 
      name: 'Salesforce', 
      icon: Database, 
      connected: false, 
      description: 'Enterprise CRM integration',
      category: 'available'
    },
    { 
      id: 'hubspot', 
      name: 'HubSpot', 
      icon: Database, 
      connected: false, 
      description: 'All-in-one CRM platform',
      category: 'available'
    },
    { 
      id: 'constantcontact', 
      name: 'Constant Contact', 
      icon: Mail, 
      connected: false, 
      description: 'Email marketing made easy',
      category: 'available'
    }, 
    { 
      id: 'sheets', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: false, 
      description: 'Spreadsheet automation',
      category: 'available'
    },
    { 
      id: 'airtable', 
      name: 'Airtable', 
      icon: Database, 
      connected: false, 
      description: 'Visual database platform',
      category: 'available'
    },
    { 
      id: 'twilio', 
      name: 'Twilio', 
      icon: MessageSquare, 
      connected: false, 
      description: 'SMS notifications',
      category: 'available'
    },
    { 
      id: 'zapier', 
      name: 'Zapier', 
      icon: Zap, 
      connected: false, 
      description: 'Connect 5,000+ apps',
      category: 'available'
    },
    { 
      id: 'make', 
      name: 'Make', 
      icon: Zap, 
      connected: false, 
      description: 'Advanced automation',
      category: 'available'
    },
    { 
      id: 'webhook', 
      name: 'Webhooks', 
      icon: Webhook, 
      connected: false, 
      description: 'Custom API endpoints',
      category: 'available'
    },

    // Future Integrations
    { 
      id: 'slack', 
      name: 'Slack', 
      icon: MessageSquare, 
      connected: false, 
      description: 'Team notifications',
      category: 'future'
    },
    { 
      id: 'notion', 
      name: 'Notion', 
      icon: Database, 
      connected: false, 
      description: 'All-in-one workspace',
      category: 'future'
    },
    { 
      id: 'monday', 
      name: 'Monday.com', 
      icon: Database, 
      connected: false, 
      description: 'Work management',
      category: 'future'
    },
    { 
      id: 'asana', 
      name: 'Asana', 
      icon: Database, 
      connected: false, 
      description: 'Project management',
      category: 'future'
    },
    { 
      id: 'trello', 
      name: 'Trello', 
      icon: Database, 
      connected: false, 
      description: 'Visual task boards',
      category: 'future'
    },
    { 
      id: 'pipedrive', 
      name: 'Pipedrive', 
      icon: Database, 
      connected: false, 
      description: 'Sales CRM',
      category: 'future'
    }
  ];

  const integrations = allIntegrations.map((integration) => ({
    ...integration,
    connected: connectedIntegrationIds.includes(integration.id),
  }));

  const connectedIntegrations = integrations.filter(i => i.connected);
  const availableIntegrations = integrations.filter(i => !i.connected && i.category === 'available');
  const futureIntegrations = integrations.filter(i => i.category === 'future');

  const handleOpenSettings = (integration: Integration) => {
    setSelectedIntegration(integration);
    setSettingsOpen(true);
  };

  const handleOpenDisconnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setDisconnectOpen(true);
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration) {
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      toast.error('Unable to disconnect integration: not signed in');
      return;
    }

    const { error } = await supabase
      .from('integration_connections')
      .delete()
      .eq('user_id', userId)
      .eq('integration_id', selectedIntegration.id);

    if (error) {
      console.error('Failed to disconnect integration:', error);
      toast.error('Unable to disconnect integration');
      return;
    }

    setConnectedIntegrationIds((prev) => prev.filter((id) => id !== selectedIntegration.id));
    toast.success(`${selectedIntegration.name} disconnected`);
    setDisconnectOpen(false);
    setSelectedIntegration(null);
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => {
    const Icon = integration.icon;
    const isConnected = integration.connected;
    const isFuture = integration.category === 'future';

    return (
      <div className={`border rounded-lg p-3 transition-all ${
  isConnected 
    ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm' 
    : isFuture
    ? 'border-gray-200 bg-gray-50 opacity-60'
    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}>
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
  isFuture ? 'bg-gray-200' : 'bg-gray-100'
}`}>
  <Icon className={`w-5 h-5 ${
    isFuture ? 'text-gray-400' : 'text-gray-600'
  }`} />
        </div>

        {/* Name & Status */}
        <div className="mb-1">
          <h5 className="font-bold text-[13px] text-[#342e37] dark:text-white mb-0.5">{integration.name}</h5>
          {isConnected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700">
              <CheckCircle className="w-3 h-3" />
              Connected
            </span>
          )}
          {isFuture && (
            <span className="text-[10px] text-gray-500">Coming Soon</span>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {integration.description}
        </p>

        {/* Actions */}
        {isConnected ? (
          <>
            {/* Mobile: Single View Button */}
            <button
              onClick={() => {
                setSelectedIntegration(integration);
                setEditModalOpen(true);
              }}
              className="md:hidden w-full flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-[#342e37] bg-[#ffd447] rounded hover:bg-[#ffd447]/90 transition-colors"
            >
              <Edit className="w-3 h-3" />
              View
            </button>
            
            {/* Desktop: Two Buttons */}
            <div className="hidden md:flex gap-1.5">
              <button
                onClick={() => handleOpenSettings(integration)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3 h-3" />
                Settings
              </button>
              <button
                onClick={() => handleOpenDisconnect(integration)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-red-700 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          </>
        ) : !isFuture ? (
          <button
            onClick={() => {
              onConnect?.(integration.id);
              toast.success(`Connecting to ${integration.name}...`);
            }}
            className="w-full px-2 py-1.5 text-[11px] font-bold text-[#342e37] bg-[#ffd447] rounded hover:bg-[#ffd447]/90 transition-colors"
          >
            Connect
          </button>
        ) : (
          <button
            disabled
            className="w-full px-2 py-1.5 text-[11px] font-medium text-gray-400 bg-gray-100 rounded cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-bold text-2xl text-[#342e37] dark:text-white mb-2">Connect your favorite tools</h2>
        <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA]">
          Set it and forget it - Let ListingBug transfer data to the tools you use most totally on autopilot.
        </p>
      </div>

      {/* Connected Integrations */}
      <div>
        <h3 className="font-bold text-[16px] text-[#342e37] dark:text-white mb-3">
          Connected Integrations ({connectedIntegrations.length})
        </h3>
        {loadingIntegrations ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading integrations...</p>
        ) : connectedIntegrations.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-600 dark:text-[#EBF2FA]">No integrations connected yet</p>
            <p className="text-sm text-gray-500 dark:text-[#EBF2FA]/60 mt-1">Connect an integration to automate your workflow.</p>
            <Button
              onClick={() => {
                const container = document.getElementById('integration-available-section');
                if (container) {
                  container.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="mt-4"
            >
              Browse Integrations
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {connectedIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        )}
      </div>

      {/* Available Integrations */}
      <div id="integration-available-section">
        <h3 className="font-bold text-[16px] text-[#342e37] dark:text-white mb-3">
          Available Integrations ({availableIntegrations.length})
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      {/* Future Integrations */}
      <div>
        <h3 className="font-bold text-[16px] text-[#342e37] dark:text-white mb-3">
          Future Integrations ({futureIntegrations.length})
        </h3>
        <p className="text-[13px] text-gray-600 mb-3">
          These integrations are planned for future releases. Vote for your favorites!
        </p>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {futureIntegrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      {/* Request Integration CTA */}
      <div className="pt-4 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-[16px] text-gray-900 dark:text-white mb-1">
                Don't see what you need?
              </h3>
              <p className="text-[13px] text-gray-600">
                Request a custom integration and we'll prioritize it in our roadmap.
              </p>
            </div>
            <button
              onClick={() => {
                if (onRequestIntegration) {
                  onRequestIntegration();
                } else {
                  window.open('mailto:integrations@listingbug.com?subject=Integration Request', '_blank', 'noopener,noreferrer');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD447] text-[#342E37] rounded-lg font-bold text-sm hover:bg-[#FFD447]/90 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Request an Integration
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIntegration?.name} Settings</DialogTitle>
            <DialogDescription>
              Configure how ListingBug syncs data with {selectedIntegration?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Connection Information */}
            <div>
              <h4 className="font-medium text-[#342e37] mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Connection Information
              </h4>
              <Separator className="mb-4" />
              <div className="space-y-3">
                {/* API Key - Mailchimp specific */}
                {selectedIntegration?.id === 'mailchimp' && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          value="mc_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                          readOnly
                          className="pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            {showApiKey ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('mc_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                              toast.success('API key copied to clipboard');
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copiedKey ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Your API key is encrypted and securely stored
                    </p>
                  </div>
                )}

                {/* Audience/List ID - Mailchimp specific */}
                {selectedIntegration?.id === 'mailchimp' && (
                  <div className="space-y-2">
                    <Label htmlFor="audience-id">Primary Audience ID</Label>
                    <Input
                      id="audience-id"
                      value="a1b2c3d4e5"
                      readOnly
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      The default audience for new contacts
                    </p>
                  </div>
                )}

                {/* Account Email */}
                <div className="space-y-2">
                  <Label htmlFor="account-email">Connected Account</Label>
                  <Input
                    id="account-email"
                    value="sarah@realestatepros.com"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Sync Settings */}
            <div>
              <h4 className="font-medium text-[#342e37] mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sync Settings
              </h4>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {/* Sync Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="sync-frequency">Sync Frequency</Label>
                  <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                    <SelectTrigger id="sync-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="180">Every 3 hours</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="720">Every 12 hours</SelectItem>
                      <SelectItem value="1440">Once daily</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    How often ListingBug checks for new data to sync
                  </p>
                </div>

                {/* Default Audience - Mailchimp/Email specific */}
                {['mailchimp', 'constantcontact', 'sendgrid'].includes(selectedIntegration?.id || '') && (
                  <div className="space-y-2">
                    <Label htmlFor="default-audience">Default Audience/List</Label>
                    <Select value={defaultAudience} onValueChange={setDefaultAudience}>
                      <SelectTrigger id="default-audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main-list">Main Contact List</SelectItem>
                        <SelectItem value="leads">New Leads</SelectItem>
                        <SelectItem value="hot-prospects">Hot Prospects</SelectItem>
                        <SelectItem value="buyers">Buyer List</SelectItem>
                        <SelectItem value="sellers">Seller List</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Where new contacts are added by default
                    </p>
                  </div>
                )}

                {/* Update Existing Contacts */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="update-existing" className="cursor-pointer">
                      Update Existing Contacts
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Overwrite contact data if they already exist
                    </p>
                  </div>
                  <Switch
                    id="update-existing"
                    checked={updateExisting}
                    onCheckedChange={setUpdateExisting}
                  />
                </div>
              </div>
            </div>

            {/* Field Mapping */}
            <div>
              <h4 className="font-medium text-[#342e37] mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Field Mapping
              </h4>
              <Separator className="mb-4" />
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Map ListingBug fields to {selectedIntegration?.name} fields
                </p>
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                  {/* Field mappings */}
                  <div className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-[#342e37] font-medium">email</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">First Name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-[#342e37] font-medium">FNAME</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Last Name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-[#342e37] font-medium">LNAME</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Phone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-[#342e37] font-medium">PHONE</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-[#342e37] font-medium">ADDRESS</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Property Type</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-[#342e37] font-medium">PROPERTY_TYPE</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Custom Field Mapping
                </Button>
              </div>
            </div>

            {/* Integration-Specific Settings */}
            {selectedIntegration?.id === 'mailchimp' && (
              <div>
                <h4 className="font-medium text-[#342e37] mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Mailchimp Options
                </h4>
                <Separator className="mb-4" />
                <div className="space-y-3">
                  {/* Auto Tagging */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="auto-tagging" className="cursor-pointer">
                        Automatic Tagging
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Auto-tag contacts with property type and status
                      </p>
                    </div>
                    <Switch
                      id="auto-tagging"
                      checked={autoTagging}
                      onCheckedChange={setAutoTagging}
                    />
                  </div>

                  {/* Double Opt-in */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="double-opt-in" className="cursor-pointer">
                        Double Opt-in Required
                      </Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Send confirmation email before adding to list
                      </p>
                    </div>
                    <Switch
                      id="double-opt-in"
                      checked={doubleOptIn}
                      onCheckedChange={setDoubleOptIn}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Preferences */}
            <div>
              <h4 className="font-medium text-[#342e37] mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notification Preferences
              </h4>
              <Separator className="mb-4" />
              <div className="space-y-3">
                {/* Email on successful sync */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="email-on-sync" className="cursor-pointer">
                      Email on Successful Sync
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Get notified when data syncs successfully
                    </p>
                  </div>
                  <Switch
                    id="email-on-sync"
                    checked={emailOnSync}
                    onCheckedChange={setEmailOnSync}
                  />
                </div>

                {/* Email on errors */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="email-on-error" className="cursor-pointer">
                      Email on Sync Errors
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Get notified when syncs fail or encounter errors
                    </p>
                  </div>
                  <Switch
                    id="email-on-error"
                    checked={emailOnError}
                    onCheckedChange={setEmailOnError}
                  />
                </div>

                {/* Webhook notifications */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor="webhook-notifications" className="cursor-pointer">
                      Webhook Notifications
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Send sync events to webhook endpoint
                    </p>
                  </div>
                  <Switch
                    id="webhook-notifications"
                    checked={webhookNotifications}
                    onCheckedChange={setWebhookNotifications}
                  />
                </div>

                {webhookNotifications && (
                  <div className="space-y-2 pl-3 border-l-2 border-gray-200">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://your-app.com/webhooks/listingbug"
                    />
                    <p className="text-xs text-gray-500">
                      Events will be sent via POST request
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <h4 className="font-medium text-[#342e37] mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Options
              </h4>
              <Separator className="mb-4" />
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Data Sync Information</p>
                      <p className="text-xs">
                        All data is synced securely over HTTPS. Changes may take up to 
                        {' '}{syncFrequency === 'manual' ? 'manual trigger' : `${syncFrequency} minutes`} to appear 
                        in {selectedIntegration?.name}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Clock className="w-3 h-3 mr-1" />
                    View Sync History
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Test Connection
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success(`${selectedIntegration?.name} settings saved successfully!`);
              setSettingsOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {selectedIntegration?.name}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {selectedIntegration?.name}? This will stop all active automations using this integration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Edit Integration Modal - Comprehensive */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Hidden Title and Description for Screen Readers */}
          <VisuallyHidden>
            <DialogTitle>{selectedIntegration?.name} Integration Details</DialogTitle>
            <DialogDescription>
              View connection details, quick actions, usage statistics, and manage your {selectedIntegration?.name} integration
            </DialogDescription>
          </VisuallyHidden>

          {/* Yellow Header - Matching Connect Modal */}
          <div className="bg-[#ffd447] px-4 md:px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedIntegration && (
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  {selectedIntegration.icon && <selectedIntegration.icon className="w-5 h-5 text-[#342e37]" />}
                </div>
              )}
              <div>
                <h2 className="font-bold text-[#342e37]">{selectedIntegration?.name}</h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-6 py-4 space-y-4">
            {/* Connection Details */}
            <div>
              <h4 className="text-sm font-medium text-[#342e37] mb-3">Connection Details</h4>
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Account</span>
                  <span className="font-medium text-[#342e37]">sarah@realestatepros.com</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Connected</span>
                  <span className="font-medium text-[#342e37]">Dec 1, 2024</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Sync</span>
                  <span className="font-medium text-[#342e37]">{lastSyncTime}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div>
              <h4 className="text-sm font-medium text-[#342e37] mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsSyncing(true);
                    toast.success(`Syncing ${selectedIntegration?.name}...`);
                    setTimeout(() => {
                      setIsSyncing(false);
                      setLastSyncTime('Just now');
                      toast.success('Sync completed successfully!');
                    }, 2000);
                  }}
                  disabled={isSyncing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setTimeout(() => {
                      handleOpenSettings(selectedIntegration!);
                    }, 100);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configure Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsTestingConnection(true);
                    setConnectionTestResult(null);
                    toast.info('Testing connection...');
                    // Simulate connection test
                    setTimeout(() => {
                      setIsTestingConnection(false);
                      setConnectionTestResult('success');
                      toast.success('Connection test successful!');
                    }, 2000);
                  }}
                  disabled={isTestingConnection}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingConnection ? (
                    <Shield className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
                
                {/* Connection Test Result */}
                {connectionTestResult && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    connectionTestResult === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {connectionTestResult === 'success' ? (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        <span>Connection is working properly</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Connection test failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Usage Stats */}
            <div>
              <h4 className="text-sm font-medium text-[#342e37] mb-3">Usage Statistics</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-[#342e37]">1,247</div>
                  <div className="text-xs text-gray-600 mt-1">Records Synced</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-[#342e37]">3</div>
                  <div className="text-xs text-gray-600 mt-1">Active Automations</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div>
              <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  handleOpenDisconnect(selectedIntegration!);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Disconnect Integration</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                This will stop all automations using this integration. You can reconnect anytime.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Integration Connection Modal */}
      {connectionModalOpen && connectionModalIntegration && (() => {
        const integ = integrations.find(i => i.id === connectionModalIntegration);
        const config = INTEGRATION_CONFIGS[connectionModalIntegration] || {};
        if (!integ) return null;
        return (
          <IntegrationConnectionModal
            integration={{
              id: connectionModalIntegration,
              name: integ.name,
              authType: (config.authType || "oauth") as "oauth" | "api-key",
              logo: "??",
              description: config.description || integ.description,
            }}
            isOpen={connectionModalOpen}
            onClose={() => { setConnectionModalOpen(false); setConnectionModalIntegration(null); }}
            onConnect={(id) => {
              setConnectedIntegrationIds(prev => [...prev, id]);
              onConnect?.(id);
              setConnectionModalOpen(false);
              setConnectionModalIntegration(null);
            }}
          />
        );
      })()}
    </div>
  );
}
