import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

/**
 * INTEGRATION CONNECTION MODAL
 * 
 * Simplified, minimal authentication flow for all 9 integrations:
 * - Zapier, Make.com, n8n: API Key (generated in ListingBug Account Settings)
 * - SendGrid: API Key (user's own SendGrid key)
 * - Mailchimp, HubSpot, Constant Contact, Salesforce, Zoho CRM: OAuth 2.0
 */

interface IntegrationData {
  id: string;
  name: string;
  authType: 'oauth' | 'api-key';
  logo: string;
  description: string;
}

interface IntegrationConnectionModalProps {
  integration: IntegrationData | null;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (integrationId: string, credentials?: { apiKey?: string }) => void;
  onNavigate?: (page: string, tab?: string) => void;
}

export function IntegrationConnectionModal({
  integration,
  isOpen,
  onClose,
  onConnect,
  onNavigate,
}: IntegrationConnectionModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setApiKey('');
      setIsConnecting(false);
    }
  }, [isOpen]);

  const handleOAuthConnect = async () => {
    setIsConnecting(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/integrations/${integration.id}/oauth/authorize`, {
      //   method: 'POST',
      // });
      // const data = await response.json();
      // window.location.href = data.authorizationUrl;

      // MOCK: Simulate OAuth redirect
      console.log(`Redirecting to ${integration.name} OAuth...`);
      
      setTimeout(() => {
        onConnect(integration.id);
        setIsConnecting(false);
      }, 1500);
    } catch (err) {
      console.error('OAuth connection failed:', err);
      setIsConnecting(false);
    }
  };

  const handleApiKeyConnect = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setIsConnecting(true);

    try {
      // TODO: Replace with actual API call for SendGrid
      // const response = await fetch(`/api/integrations/${integration.id}/api-key`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ apiKey }),
      // });

      // MOCK: Simulate API key validation
      console.log(`Validating API key for ${integration.name}...`);
      
      setTimeout(() => {
        onConnect(integration.id, { apiKey });
        setIsConnecting(false);
        setApiKey('');
      }, 1500);
    } catch (err) {
      console.error('API key connection failed:', err);
      setIsConnecting(false);
    }
  };

  const handleGoToAPISettings = () => {
    onClose();
    if (onNavigate) {
      onNavigate('account', 'integrations');
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !integration) return null;

  const config = INTEGRATION_CONFIGS[integration.id] || {};
  const isListingBugAPIKey = ['zapier', 'make', 'n8n'].includes(integration.id);
  const isSendGrid = integration.id === 'sendgrid';

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] w-[calc(100%-2rem)] md:w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col"
        style={{ margin: 0 }}
      >
        
        {/* Header */}
        <div className="bg-[#FFCE0A] px-4 md:px-6 py-4 rounded-t-lg flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl">
              {integration.logo}
            </div>
            <div>
              <h2 className="font-bold text-[#342e37]">Connect {integration.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#342e37]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4">
          
          {/* Description */}
          <p className="text-gray-600 dark:text-[#EBF2FA]">{config.description}</p>

          {/* Authentication Type */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-[#EBF2FA]/60">
              <strong>Authentication type:</strong>{' '}
              {integration.authType === 'oauth' 
                ? `OAuth 2.0 — you'll be redirected to ${integration.name} to authorize access`
                : 'API Key'
              }
            </p>
          </div>

          {/* OAuth Flow */}
          {integration.authType === 'oauth' && (
            <div className="pt-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleOAuthConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  'Redirecting...'
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to {integration.name}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* API Key Flow - ListingBug API Keys (Zapier, Make, n8n) */}
          {integration.authType === 'api-key' && isListingBugAPIKey && (
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  To connect {integration.name}, you'll need a ListingBug API key. Generate one in your Account Settings, then paste it into {integration.name}.
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGoToAPISettings}
              >
                <Key className="w-4 h-4 mr-2" />
                Go to API Settings
              </Button>
            </div>
          )}

          {/* API Key Flow - SendGrid */}
          {integration.authType === 'api-key' && isSendGrid && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="sendgrid-api-key">Your SendGrid API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="sendgrid-api-key"
                    type="password"
                    placeholder="SG.xxxx..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#EBF2FA]/60">
                  Find this in your SendGrid account under Settings &gt; API Keys
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleApiKeyConnect}
                disabled={isConnecting || !apiKey.trim()}
              >
                {isConnecting ? 'Connecting...' : `Connect ${integration.name}`}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-[#2F2F2F] rounded-b-lg border-t dark:border-white/10 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

/**
 * INTEGRATION-SPECIFIC CONFIGURATIONS
 */

export const INTEGRATION_CONFIGS: { [key: string]: Partial<IntegrationData> } = {
  salesforce: {
    authType: 'oauth',
    description: 'Sync contacts and leads to your Salesforce CRM for pipeline management.',
  },
  hubspot: {
    authType: 'oauth',
    description: 'Connect your HubSpot CRM to manage contacts, companies, and deals.',
  },
  'zoho-crm': {
    authType: 'oauth',
    description: 'Integrate with Zoho CRM to sync leads, contacts, and opportunities.',
  },
  mailchimp: {
    authType: 'oauth',
    description: 'Send marketing emails and manage audience lists in Mailchimp.',
  },
  'constant-contact': {
    authType: 'oauth',
    description: 'Build email campaigns and manage contact lists with Constant Contact.',
  },
  sendgrid: {
    authType: 'api-key',
    description: 'Use your SendGrid account to send transactional and marketing emails.',
  },
  zapier: {
    authType: 'api-key',
    description: 'Connect ListingBug to 5,000+ apps with Zapier automation workflows.',
  },
  make: {
    authType: 'api-key',
    description: 'Build advanced automation scenarios with Make.com (formerly Integromat).',
  },
  n8n: {
    authType: 'api-key',
    description: 'Create custom workflow automations with the open-source n8n platform.',
  },
};

/**
 * BACKEND API CALLS
 * 
 * OAuth Flow:
 * 1. POST /api/integrations/{service}/oauth/authorize
 *    Returns: { authorizationUrl: "https://..." }
 * 
 * 2. User authorizes on provider's site
 * 
 * 3. Provider redirects to: /integrations/callback/{service}?code=xxx
 * 
 * 4. Frontend calls: POST /api/integrations/{service}/oauth/callback
 *    Body: { code: "xxx" }
 *    Returns: { success: true, integration: {...} }
 * 
 * API Key Flow (SendGrid):
 * 1. POST /api/integrations/sendgrid/api-key
 *    Body: { apiKey: "SG.xxx" }
 *    Returns: { success: true, integration: {...} }
 * 
 * ListingBug API Keys (Zapier, Make, n8n):
 * - Generated in Account Settings > API & Integrations
 * - Used by external tools to authenticate with ListingBug API
 */
