import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, ExternalLink, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';

/**
 * INTEGRATION CONNECTION MODAL
 *
 * Auth types:
 * - 'api-key-listingbug': Zapier, Make, n8n — use ListingBug API key
 * - 'api-key-own': SendGrid — user pastes their own API key
 * - 'oauth-pending': Mailchimp, HubSpot, Salesforce, Constant Contact, Zoho — OAuth apps not yet registered
 *
 * OAuth integrations will show a "coming soon" state until OAuth apps are registered
 * with each provider and client IDs are configured as environment variables.
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

// Provider developer portal URLs — where users can sign up to get ready
const PROVIDER_DEV_PORTALS: Record<string, string> = {
  mailchimp: 'https://mailchimp.com/developer/',
  hubspot: 'https://developers.hubspot.com/',
  salesforce: 'https://developer.salesforce.com/',
  'constant-contact': 'https://developer.constantcontact.com/',
  'zoho-crm': 'https://www.zoho.com/crm/developer/',
};

export function IntegrationConnectionModal({
  integration,
  isOpen,
  onClose,
  onConnect,
  onNavigate,
}: IntegrationConnectionModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setApiKey('');
      setIsConnecting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const handleApiKeyConnect = async () => {
    if (!apiKey.trim()) return;
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('integration_connections').upsert({
          user_id: session.user.id,
          integration_id: integration!.id,
          credentials: { apiKey },
          connected_at: new Date().toISOString(),
        });
      }
      onConnect(integration!.id, { apiKey });
    } catch (err) {
      console.error('API key connection failed:', err);
    } finally {
      setIsConnecting(false);
      setApiKey('');
    }
  };

  const handleGoToAPISettings = () => {
    onClose();
    if (onNavigate) onNavigate('account', 'integrations');
  };

  if (!isOpen || !integration) return null;

  const config = INTEGRATION_CONFIGS[integration.id] || {};
  const isListingBugAPIKey = ['zapier', 'make', 'n8n'].includes(integration.id);
  const isSendGrid = integration.id === 'sendgrid';
  const isOAuthPending = integration.authType === 'oauth';

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in" onClick={onClose} />
      <div className="fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] w-[calc(100%-2rem)] md:w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200 flex flex-col">

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
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#342e37]/10 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-[#342e37]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4">
          <p className="text-gray-600 dark:text-[#EBF2FA]">{config.description}</p>

          {/* OAuth — not yet available */}
          {isOAuthPending && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    OAuth connection coming soon
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    The {integration.name} OAuth integration is being set up. Once live, you'll be redirected to {integration.name} to authorize access securely.
                  </p>
                </div>
              </div>
              {PROVIDER_DEV_PORTALS[integration.id] && (
                <a
                  href={PROVIDER_DEV_PORTALS[integration.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit {integration.name} Developer Portal to get ready
                </a>
              )}
            </div>
          )}

          {/* API Key — ListingBug key (Zapier, Make, n8n) */}
          {!isOAuthPending && isListingBugAPIKey && (
            <div className="space-y-4 pt-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  To connect {integration.name}, generate a ListingBug API key in your Account Settings, then paste it into {integration.name}.
                </p>
              </div>
              <Button className="w-full" size="lg" onClick={handleGoToAPISettings}>
                <Key className="w-4 h-4 mr-2" />
                Go to API Settings
              </Button>
            </div>
          )}

          {/* API Key — user's own key (SendGrid) */}
          {!isOAuthPending && isSendGrid && (
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
                  Find this in your SendGrid account under Settings › API Keys
                </p>
              </div>
              <Button className="w-full" size="lg" onClick={handleApiKeyConnect} disabled={isConnecting || !apiKey.trim()}>
                {isConnecting ? 'Connecting...' : `Connect ${integration.name}`}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 bg-gray-50 dark:bg-[#2F2F2F] rounded-b-lg border-t dark:border-white/10 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

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
