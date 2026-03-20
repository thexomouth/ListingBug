/**
 * API SETUP PAGE - Consent-First Destination Setup
 * 
 * PURPOSE: Central hub for connecting third-party destinations with consent compliance
 * 
 * API ENDPOINTS:
 * - GET /api/destinations - Fetch available destinations with risk tiers
 * - POST /api/destinations/connect - Initiate OAuth connection
 * - POST /api/destinations/{id}/template - Create Google Sheets template
 * - GET /api/consent/ledger - View consent provenance records
 * 
 * DATA BINDINGS:
 * - destination_id → Unique identifier for each integration
 * - risk_tier → 'low' | 'medium' | 'high' (Tier A/B/C)
 * - oauth_token → OAuth 2.0 access token after authorization
 * - oauth_scopes → Required scopes for each destination
 * - sheet_template_id → Google Sheets spreadsheet ID when auto-created
 * - connected_at → ISO timestamp of connection
 * - last_sync_at → ISO timestamp of last successful sync
 */

import { useState } from 'react';
import { 
  Mail, 
  Send, 
  Database, 
  Webhook, 
  FileSpreadsheet, 
  MessageSquare,
  Shield,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Zap,
  FileText,
  Lock,
  Sparkles,
  Plus
} from 'lucide-react';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { LBButton } from './design-system/LBButton';
import { toast } from 'sonner@2.0.3';

interface Destination {
  id: string;
  name: string;
  description: string;
  icon: any;
  riskTier: 'low' | 'medium' | 'high'; // Tier A = low, Tier B = medium, Tier C = high
  connected: boolean;
  requiresOAuth: boolean;
  oauthScopes?: string[];
  features?: string[];
  connectedAt?: string;
  lastSyncAt?: string;
  supportsTemplate?: boolean; // For Google Sheets auto-template creation
}

export function APISetupPage() {
  const [connectingDestination, setConnectingDestination] = useState<string | null>(null);

  /**
   * DESTINATION CONFIGURATIONS
   * DATA BINDING: destination_id, risk_tier, oauth_scopes
   * 
   * RISK TIERS:
   * - Tier A (low): Technical destinations, data export, notifications
   * - Tier B (medium): CRM platforms, business tools
   * - Tier C (high): Marketing platforms, email campaigns
   */
  const destinations: Destination[] = [
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Export listings to a spreadsheet for analysis and sharing',
      icon: FileSpreadsheet,
      riskTier: 'low', // Tier A
      connected: false,
      requiresOAuth: true,
      oauthScopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
      features: [
        'Auto-formatted template',
        'Real-time data sync',
        'Custom column mapping',
        'Share with team'
      ],
      supportsTemplate: true
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Send listing data to any custom endpoint in real-time',
      icon: Webhook,
      riskTier: 'low', // Tier A
      connected: false,
      requiresOAuth: false,
      features: [
        'Custom JSON payload',
        'Retry logic',
        'HMAC signature',
        'Event filtering'
      ]
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get instant notifications in your team channels',
      icon: MessageSquare,
      riskTier: 'low', // Tier A
      connected: true,
      requiresOAuth: true,
      oauthScopes: [
        'incoming-webhook',
        'channels:read',
        'chat:write'
      ],
      features: [
        'Channel notifications',
        'Custom message format',
        'Rich media cards',
        'Thread support'
      ],
      connectedAt: '2024-12-01T10:30:00Z',
      lastSyncAt: '2024-12-06T08:15:00Z'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync agent contacts to your CRM for pipeline management',
      icon: Database,
      riskTier: 'medium', // Tier B
      connected: true,
      requiresOAuth: true,
      oauthScopes: [
        'contacts',
        'crm.objects.contacts.write',
        'crm.objects.deals.write'
      ],
      features: [
        'Contact creation',
        'Deal tracking',
        'Activity logging',
        'Custom properties'
      ],
      connectedAt: '2024-11-28T14:20:00Z',
      lastSyncAt: '2024-12-06T07:00:00Z'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Connect to Salesforce CRM for lead and opportunity management',
      icon: Database,
      riskTier: 'medium', // Tier B
      connected: false,
      requiresOAuth: true,
      oauthScopes: [
        'api',
        'refresh_token',
        'full'
      ],
      features: [
        'Lead creation',
        'Opportunity tracking',
        'Custom objects',
        'Apex triggers'
      ]
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Visual sales pipeline for real estate professionals',
      icon: Database,
      riskTier: 'medium', // Tier B
      connected: false,
      requiresOAuth: true,
      oauthScopes: [
        'deals:write',
        'persons:write',
        'activities:write'
      ],
      features: [
        'Deal management',
        'Person records',
        'Activity tracking',
        'Pipeline automation'
      ]
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Send marketing emails to verified opt-in contacts only',
      icon: Send,
      riskTier: 'high', // Tier C
      connected: false,
      requiresOAuth: true,
      oauthScopes: [
        'lists:read',
        'lists:write',
        'campaigns:write'
      ],
      features: [
        'Audience segmentation',
        'Campaign automation',
        'Template library',
        'Analytics tracking'
      ]
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Transactional and marketing email delivery platform',
      icon: Mail,
      riskTier: 'high', // Tier C
      connected: false,
      requiresOAuth: false, // Uses API key
      features: [
        'Email templates',
        'List management',
        'Delivery analytics',
        'Suppression lists'
      ]
    },
    {
      id: 'activecampaign',
      name: 'ActiveCampaign',
      description: 'Marketing automation with CRM and email campaigns',
      icon: Zap,
      riskTier: 'high', // Tier C
      connected: false,
      requiresOAuth: true,
      oauthScopes: [
        'contacts:read',
        'contacts:write',
        'lists:read',
        'campaigns:write'
      ],
      features: [
        'Contact tagging',
        'Email sequences',
        'Landing pages',
        'CRM integration'
      ]
    }
  ];

  /**
   * HANDLE CONNECT
   * API ENDPOINT: POST /api/destinations/connect
   * REQUEST BODY: { destination_id, oauth_scopes }
   * RESPONSE: { authorization_url, state_token }
   * 
   * For OAuth destinations, redirect to authorization_url
   * After authorization, callback URL will receive oauth_token
   */
  const handleConnect = async (destination: Destination) => {
    setConnectingDestination(destination.id);

    console.log('📡 POST /api/destinations/connect', {
      destination_id: destination.id,
      oauth_scopes: destination.oauthScopes,
      risk_tier: destination.riskTier,
      requires_consent_validation: destination.riskTier === 'high'
    });

    // Simulate OAuth flow
    setTimeout(() => {
      if (destination.requiresOAuth) {
        toast.success(`Opening ${destination.name} authorization...`, {
          description: `Required scopes: ${destination.oauthScopes?.join(', ')}`
        });
        
        // In production, redirect to OAuth provider:
        // window.location.href = authorizationUrl;
        
        console.log('🔐 OAuth Scopes Required:', destination.oauthScopes);
        console.log('📍 Redirect URL: /api/oauth/callback');
      } else {
        toast.success(`${destination.name} connected successfully!`);
      }
      
      setConnectingDestination(null);
    }, 1500);
  };

  /**
   * HANDLE CREATE GOOGLE SHEETS TEMPLATE
   * API ENDPOINT: POST /api/destinations/google-sheets/template
   * REQUEST BODY: { template_type: 'listings', include_columns: [...] }
   * RESPONSE: { sheet_template_id, sheet_url }
   */
  const handleCreateSheetsTemplate = async () => {
    toast.info('Creating Google Sheets template...', {
      description: 'Setting up pre-formatted columns and formulas'
    });

    console.log('📝 POST /api/destinations/google-sheets/template', {
      template_type: 'listings',
      include_columns: [
        'address', 'city', 'state', 'price', 'beds', 'baths',
        'sqft', 'agent_name', 'agent_email', 'agent_phone',
        'listing_status', 'days_on_market', 'consent_verified'
      ],
      auto_format: true,
      share_with_team: false
    });

    setTimeout(() => {
      const mockSheetId = '1AbC2DeF3GhI4JkL5MnO';
      const mockSheetUrl = `https://docs.google.com/spreadsheets/d/${mockSheetId}`;
      
      console.log('✅ Template created:', {
        sheet_template_id: mockSheetId,
        sheet_url: mockSheetUrl
      });

      toast.success('Template created successfully!', {
        description: 'Opening in new tab...',
        action: {
          label: 'Open',
          onClick: () => window.open(mockSheetUrl, '_blank')
        }
      });
    }, 2000);
  };

  /**
   * HANDLE OPEN CONSENT LEDGER
   * Navigates to ConsentLedgerTable component
   */
  const handleOpenConsentLedger = () => {
    // In production, navigate to consent ledger route
    window.open('/settings/consent-ledger', '_blank');
    console.log('📊 Opening Consent Ledger');
  };

  const getRiskTierBadge = (tier: 'low' | 'medium' | 'high') => {
    const configs = {
      low: {
        label: 'Tier A',
        color: 'bg-green-100 text-green-900 border-green-300',
        icon: '🟢'
      },
      medium: {
        label: 'Tier B',
        color: 'bg-yellow-100 text-yellow-900 border-yellow-300',
        icon: '🟡'
      },
      high: {
        label: 'Tier C',
        color: 'bg-red-100 text-red-900 border-red-300',
        icon: '🔴'
      }
    };

    const config = configs[tier];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 border-2 rounded text-xs font-bold ${config.color}`}>
        <Shield className="w-3 h-3" />
        {config.icon} {config.label}
      </span>
    );
  };

  const getRiskTierDescription = (tier: 'low' | 'medium' | 'high') => {
    const descriptions = {
      low: 'Low risk — auto sync allowed',
      medium: 'Medium risk — confirm provenance',
      high: 'High risk — requires opt-in confirmation'
    };
    return descriptions[tier];
  };

  // Group destinations by connection status
  const connectedDestinations = destinations.filter(d => d.connected);
  const availableDestinations = destinations.filter(d => !d.connected);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#342E37]">API Setup & Destinations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Connect destinations with consent-first compliance
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <LBButton
                variant="outline"
                size="sm"
                onClick={handleOpenConsentLedger}
                className="w-full sm:w-auto"
              >
                <FileText className="w-4 h-4 mr-2" />
                Open Consent Ledger
              </LBButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Developer Notes Banner */}
        <div className="mb-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-sm mb-1">Developer Notes</h3>
              <div className="text-xs text-blue-800 space-y-1 font-mono">
                <p><strong>Field Bindings:</strong> destination_id, risk_tier, oauth_token, sheet_template_id</p>
                <p><strong>Connect Endpoint:</strong> POST /api/destinations/connect</p>
                <p><strong>OAuth Callback:</strong> /api/oauth/callback?state={'{'}&code={'{'}</p>
                <p><strong>Template Endpoint:</strong> POST /api/destinations/google-sheets/template</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Tier Legend */}
        <div className="mb-6 bg-white border-2 border-gray-300 rounded-lg p-4">
          <h3 className="font-bold text-[#342E37] text-sm mb-3">Risk Tier Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-3 bg-green-50 border-2 border-green-300 rounded">
              <Shield className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-xs text-green-900">Tier A - Low Risk</p>
                <p className="text-xs text-green-800 mt-0.5">
                  Technical destinations, data export, notifications. Auto sync allowed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded">
              <Shield className="w-4 h-4 text-yellow-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-xs text-yellow-900">Tier B - Medium Risk</p>
                <p className="text-xs text-yellow-800 mt-0.5">
                  CRM platforms, business tools. Requires consent provenance confirmation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-300 rounded">
              <Shield className="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-xs text-red-900">Tier C - High Risk</p>
                <p className="text-xs text-red-800 mt-0.5">
                  Marketing platforms, email campaigns. Requires explicit opt-in validation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Destinations */}
        {connectedDestinations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#342E37] mb-4">Connected Destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedDestinations.map((destination) => {
                const Icon = destination.icon;
                return (
                  <LBCard key={destination.id} className="border-2 border-green-300 bg-green-50">
                    <LBCardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-[#342E37]" />
                          </div>
                          <div className="flex-1">
                            <LBCardTitle className="text-base">{destination.name}</LBCardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getRiskTierBadge(destination.riskTier)}
                            </div>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0" />
                      </div>
                    </LBCardHeader>
                    <LBCardContent>
                      <p className="text-sm text-gray-700 mb-3">{destination.description}</p>
                      
                      <div className="text-xs text-gray-600 mb-3 space-y-1">
                        <p>
                          <strong>Connected:</strong>{' '}
                          {destination.connectedAt ? new Date(destination.connectedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p>
                          <strong>Last Sync:</strong>{' '}
                          {destination.lastSyncAt ? new Date(destination.lastSyncAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>

                      {/* Risk Tier Description */}
                      <div className="mb-3 p-2 bg-white border border-gray-300 rounded text-xs text-gray-700">
                        <strong className="text-[#342E37]">{getRiskTierDescription(destination.riskTier)}</strong>
                      </div>

                      <div className="flex gap-2">
                        <LBButton variant="outline" size="sm" className="flex-1">
                          <Lock className="w-4 h-4 mr-1" />
                          Manage
                        </LBButton>
                        <LBButton variant="outline" size="sm" className="flex-1">
                          Test Sync
                        </LBButton>
                      </div>
                    </LBCardContent>
                  </LBCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Destinations */}
        <div>
          <h2 className="text-lg font-bold text-[#342E37] mb-4">Available Destinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDestinations.map((destination) => {
              const Icon = destination.icon;
              const isConnecting = connectingDestination === destination.id;

              return (
                <LBCard key={destination.id} className="border-2 border-gray-300 hover:border-[#FFD447] transition-all">
                  <LBCardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <LBCardTitle className="text-base">{destination.name}</LBCardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getRiskTierBadge(destination.riskTier)}
                        </div>
                      </div>
                    </div>
                  </LBCardHeader>
                  <LBCardContent>
                    <p className="text-sm text-gray-700 mb-3">{destination.description}</p>

                    {/* Risk Tier Description */}
                    <div className="mb-3 p-2 bg-gray-50 border border-gray-300 rounded text-xs text-gray-700">
                      <strong className="text-[#342E37]">{getRiskTierDescription(destination.riskTier)}</strong>
                    </div>

                    {/* Features */}
                    {destination.features && destination.features.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-700 mb-1">Features:</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {destination.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-green-600">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* OAuth Scopes */}
                    {destination.requiresOAuth && destination.oauthScopes && (
                      <details className="mb-3">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                          View Required OAuth Scopes
                        </summary>
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs font-mono text-blue-900 space-y-1">
                            {destination.oauthScopes.map((scope, idx) => (
                              <div key={idx}>• {scope}</div>
                            ))}
                          </p>
                        </div>
                      </details>
                    )}

                    {/* Connect Button */}
                    <div className="space-y-2">
                      {destination.supportsTemplate && (
                        <LBButton
                          variant="outline"
                          size="sm"
                          onClick={handleCreateSheetsTemplate}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Sheet Template
                        </LBButton>
                      )}
                      
                      <LBButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleConnect(destination)}
                        disabled={isConnecting}
                        className="w-full"
                      >
                        {isConnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Connecting...
                          </>
                        ) : destination.supportsTemplate ? (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect with One Click
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect
                          </>
                        )}
                      </LBButton>
                    </div>

                    {/* Developer Note */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-mono">
                        POST /api/destinations/connect
                        <br />
                        destination_id: "{destination.id}"
                      </p>
                    </div>
                  </LBCardContent>
                </LBCard>
              );
            })}
          </div>
        </div>

        {/* Bottom Banner - Consent Ledger CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-700 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Consent Compliance</h3>
                <p className="text-sm text-blue-800">
                  Before syncing to marketing destinations (Tier C), verify that all contacts have explicit opt-in consent. 
                  View full provenance records in the Consent Ledger.
                </p>
              </div>
            </div>
            <LBButton
              variant="primary"
              size="sm"
              onClick={handleOpenConsentLedger}
              className="whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Consent Ledger
              <ExternalLink className="w-3 h-3 ml-2" />
            </LBButton>
          </div>
        </div>
      </div>
    </div>
  );
}
