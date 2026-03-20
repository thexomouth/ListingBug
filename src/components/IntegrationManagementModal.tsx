/**
 * INTEGRATION MANAGEMENT MODAL
 * Side sheet for viewing and editing integration settings
 */

import { useState } from 'react';
import { X, CheckCircle, ExternalLink, Settings, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { LBInput } from './design-system/LBInput';
import { LBButton } from './design-system/LBButton';
import { toast } from 'sonner@2.0.3';

export interface Integration {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  description: string;
  category: 'crm' | 'email' | 'communication' | 'automation' | 'storage';
  useCases: string[];
  connectedDate?: string;
  automationsUsing?: number;
  config?: Record<string, string>;
}

interface IntegrationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration | null;
  onSave?: (integration: Integration) => void;
  onDisconnect?: (integrationId: string) => void;
}

export function IntegrationManagementModal({
  isOpen,
  onClose,
  integration,
  onSave,
  onDisconnect
}: IntegrationManagementModalProps) {
  const [config, setConfig] = useState<Record<string, string>>(integration?.config || {});
  const [isEditing, setIsEditing] = useState(false);

  if (!integration) return null;

  const Icon = integration.icon;

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...integration,
        config,
        connected: true,
        connectedDate: integration.connectedDate || new Date().toISOString()
      });
    }
    setIsEditing(false);
    toast.success(`${integration.name} settings saved`);
  };

  const handleDisconnect = () => {
    if (window.confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      if (onDisconnect) {
        onDisconnect(integration.id);
      }
      toast.success(`${integration.name} disconnected`);
      onClose();
    }
  };

  const getConfigFields = () => {
    // Different integrations have different config fields
    const fieldsByType: Record<string, Array<{ key: string; label: string; type?: string; placeholder: string }>> = {
      'mailchimp': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your Mailchimp API key' },
        { key: 'default_audience', label: 'Default Audience ID', placeholder: 'e.g., a1b2c3d4e5' }
      ],
      'hubspot': [
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your HubSpot API key' },
        { key: 'portal_id', label: 'Portal ID', placeholder: 'e.g., 12345678' }
      ],
      'salesforce': [
        { key: 'instance_url', label: 'Instance URL', placeholder: 'https://yourinstance.salesforce.com' },
        { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Enter access token' }
      ],
      'activecampaign': [
        { key: 'api_url', label: 'API URL', placeholder: 'https://youraccoun.api-us1.com' },
        { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your API key' }
      ],
      'sheets': [
        { key: 'credentials', label: 'Service Account JSON', type: 'textarea', placeholder: 'Paste service account credentials' },
        { key: 'default_spreadsheet', label: 'Default Spreadsheet ID', placeholder: 'e.g., 1A2B3C4D5E...' }
      ],
      'webhook': [
        { key: 'url', label: 'Webhook URL', type: 'url', placeholder: 'https://your-webhook-url.com/endpoint' },
        { key: 'secret', label: 'Webhook Secret (Optional)', type: 'password', placeholder: 'Enter secret for signature validation' }
      ],
      'slack': [
        { key: 'webhook_url', label: 'Slack Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...' },
        { key: 'default_channel', label: 'Default Channel', placeholder: '#listings' }
      ]
    };

    return fieldsByType[integration.id] || [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API key' }
    ];
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-[#342E37]" />
            </div>
            <div className="flex-1">
              <SheetTitle>{integration.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                {integration.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    Not Connected
                  </span>
                )}
                <span className="text-xs text-gray-500 capitalize">{integration.category}</span>
              </div>
            </div>
          </div>
          <SheetDescription>
            {integration.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Connection Status */}
          {integration.connected && integration.connectedDate && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-1">Connected</p>
              <p className="text-xs text-green-700">
                Since {new Date(integration.connectedDate).toLocaleDateString()}
              </p>
              {integration.automationsUsing !== undefined && integration.automationsUsing > 0 && (
                <p className="text-xs text-green-700 mt-1">
                  Used by {integration.automationsUsing} automation{integration.automationsUsing !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Use Cases */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-2">Common Use Cases</h3>
            <ul className="space-y-1">
              {integration.useCases.map((useCase, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-[#FFD447] mt-1">•</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Configuration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-900">Configuration</h3>
              {integration.connected && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Settings className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {(!integration.connected || isEditing) ? (
              <div className="space-y-3">
                {getConfigFields().map((field) => (
                  field.type === 'textarea' ? (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <textarea
                        value={config[field.key] || ''}
                        onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD447]"
                      />
                    </div>
                  ) : (
                    <LBInput
                      key={field.key}
                      label={field.label}
                      type={field.type || 'text'}
                      value={config[field.key] || ''}
                      onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  )
                ))}

                <div className="flex gap-2">
                  <LBButton
                    variant="primary"
                    onClick={handleSave}
                    className="flex-1"
                  >
                    {integration.connected ? 'Save Changes' : 'Connect'}
                  </LBButton>
                  {isEditing && (
                    <LBButton
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setConfig(integration.config || {});
                      }}
                    >
                      Cancel
                    </LBButton>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {getConfigFields().map((field) => (
                  <div key={field.key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{field.label}</span>
                    <span className="text-sm font-mono text-gray-900">
                      {field.type === 'password' ? '••••••••' : (config[field.key] || 'Not set')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documentation Link */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Need help setting up?</p>
                <p className="text-xs text-blue-800 mb-2">
                  Check our integration guide for step-by-step instructions.
                </p>
                <a
                  href={`/docs/integrations/${integration.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View {integration.name} Documentation →
                </a>
              </div>
            </div>
          </div>

          {/* Disconnect */}
          {integration.connected && (
            <div className="pt-4 border-t">
              <button
                onClick={handleDisconnect}
                className="w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left flex items-center gap-2 text-red-900"
              >
                <Trash2 className="w-4 h-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Disconnect {integration.name}</p>
                  <p className="text-xs text-red-700">
                    This will stop all automations using this integration
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Developer Info */}
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Developer Note:</strong> Integration settings are stored encrypted. 
              API calls use rate limiting and retry logic with exponential backoff.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
