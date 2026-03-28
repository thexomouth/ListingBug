import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LBButton } from './design-system/LBButton';
import {
  Eye, CheckCircle,
  Settings,
  Zap,
  Plug,
  Key,
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
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  UserPlus,
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
import { IntegrationConnectionModal, INTEGRATION_CONFIGS } from './IntegrationConnectionModal';
import { IntegrationDetailsPanel } from './IntegrationDetailsPanel';

interface Integration {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  description: string;
  category: 'connected' | 'available' | 'future';
}

interface IntegrationsPageProps {
  onConnect?: (integrationId: string) => void;
  onManage?: (integrationId: string) => void;
  onNavigate?: (page: string) => void;
}

export function IntegrationsPage({ onConnect, onManage, onNavigate }: IntegrationsPageProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Connection modal states
  const [connectedInfo, setConnectedInfo] = useState<Record<string, {connectedAt: string; config: any}>>({});
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionModalIntegration, setConnectionModalIntegration] = useState<string | null>(null);
  
  // Collapsible section states
  const [availableExpanded, setAvailableExpanded] = useState(true);
  const [futureExpanded, setFutureExpanded] = useState(false);
  
  // Quick action states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'failed' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState('2 hours ago');

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
  // Mailchimp audience state for settings modal
  const [settingsAudiences, setSettingsAudiences] = useState<{id:string;name:string}[]>([]);
  const [settingsAudiencesLoading, setSettingsAudiencesLoading] = useState(false);
  const [settingsListId, setSettingsListId] = useState('');
  const [settingsTags, setSettingsTags] = useState('');
  const [settingsDoubleOptIn, setSettingsDoubleOptIn] = useState(false);
  // Google Sheets state for settings modal
  const [settingsSpreadsheetId, setSettingsSpreadsheetId] = useState('');
  const [settingsSheetName, setSettingsSheetName] = useState('');
  // Send Test Contact state
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testContactResult, setTestContactResult] = useState<'success' | 'failed' | null>(null);
  const [testContactDetail, setTestContactDetail] = useState<string | null>(null);

  // Returns a valid access token, refreshing if the JWT is expired or missing.
  // On rotation-race (refreshSession returns null), re-reads session which has the background-rotated token.
  const getEdgeToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    // Decode the JWT payload to check actual exp claim (more reliable than session.expires_at)
    try {
      const b64 = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(b64));
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp > now + 10) return session.access_token; // Token is genuinely valid
    } catch { /* fall through to refresh */ }
    // Token is expired or undecodable — try explicit refresh
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) return refreshed.session.access_token;
    // refreshSession() failed (background auto-refresh already rotated the token) —
    // re-read session which now has the rotated token
    const { data: { session: latest } } = await supabase.auth.getSession();
    return latest?.access_token ?? null;
  };

  const loadSettingsAudiences = async () => {
    setSettingsAudiencesLoading(true);
    try {
      const token = await getEdgeToken();
      if (!token) { toast.error('Not signed in — please refresh the page.'); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ integration: 'mailchimp' }),
        }
      );
      let data: any = {};
      try { data = await res.json(); } catch {}
      if (res.status === 401) {
        setSettingsAudiences([]);
        toast.error('Session expired — please sign out and sign back in.');
        return;
      }
      if (!res.ok) { toast.error(data.error ?? `Could not load audiences (HTTP ${res.status})`); return; }
      if (data.options) setSettingsAudiences(data.options);
    } catch (e: any) {
      toast.error('Network error loading audiences — check your connection.');
    } finally {
      setSettingsAudiencesLoading(false);
    }
  };

  // Send a single test contact through the integration's dispatch function
  const sendTestContact = async () => {
    if (!selectedIntegration) return;
    setIsSendingTest(true);
    setTestContactResult(null);
    setTestContactDetail(null);
    try {
      const token = await getEdgeToken();
      if (!token) { toast.error('Not signed in'); return; }

      // Use the authenticated user's own email/name so the test contact is easy to identify
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email ?? 'test.contact@listingbug.com';
      const rawName = session?.user?.user_metadata?.full_name ?? session?.user?.user_metadata?.name ?? '';
      const agentName = rawName || 'ListingBug Test';

      // Realistic test listing matching the exact fields the dispatch functions expect
      const testListing = {
        id: `listingbug-test-${Date.now()}`,
        formatted_address: '742 Evergreen Terrace, Denver, CO 80203',
        city: 'Denver',
        state: 'CO',
        zip_code: '80203',
        price: 485000,
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 1850,
        property_type: 'Single Family',
        status: 'Active',
        listed_date: new Date().toISOString().split('T')[0],
        days_on_market: 5,
        listing_type: 'sale',
        agent_name: agentName,
        agent_phone: '(720) 555-0192',
        agent_email: userEmail,
        office_name: 'ListingBug Test Realty',
        mls_number: 'TEST-LB-' + new Date().getFullYear(),
        latitude: 39.7392,
        longitude: -104.9903,
      };

      const integId = selectedIntegration.id;
      const config = connectedInfo[integId]?.config ?? {};
      const BASE = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      let fnUrl = '';
      let payload: any = { listings: [testListing] };

      if (integId === 'mailchimp') {
        const listId = settingsListId || config.list_id;
        if (!listId) { toast.error('Select a Mailchimp audience first, then try again.'); return; }
        fnUrl = `${BASE}/send-to-mailchimp`;
        payload = { ...payload, list_id: listId, tags: ['listingbug-test', ...(config.tags ?? [])], double_opt_in: false };
      } else if (integId === 'hubspot') {
        fnUrl = `${BASE}/send-to-hubspot`;
        payload = { ...payload, object_type: config.object_type ?? 'contacts' };
      } else if (integId === 'sendgrid') {
        fnUrl = `${BASE}/send-to-sendgrid`;
        payload = { ...payload, list_ids: config.list_ids ?? [] };
      } else if (integId === 'google' || integId === 'sheets' || integId === 'google-sheets') {
        if (!config.spreadsheet_id) { toast.error('No spreadsheet ID configured — edit the integration first.'); return; }
        fnUrl = `${BASE}/send-to-sheets`;
        payload = { ...payload, spreadsheet_id: config.spreadsheet_id, sheet_name: config.sheet_name ?? 'Sheet1', write_mode: 'append' };
      } else if (integId === 'twilio') {
        fnUrl = `${BASE}/send-to-twilio`;
        payload = { ...payload, list_unique_name: config.list_unique_name ?? 'listingbug_contacts' };
      } else if (['zapier', 'make', 'n8n', 'webhook', 'custom-webhook'].includes(integId)) {
        if (!config.webhook_url) { toast.error('No webhook URL configured — save settings first.'); return; }
        fnUrl = `${BASE}/webhook-push`;
        payload = { ...payload, webhook_url: config.webhook_url, send_mode: 'batch', metadata: { automation_name: 'ListingBug Test', run_id: 'test-' + Date.now() } };
      } else {
        toast.error(`Send test contact is not yet supported for ${selectedIntegration.name}`);
        return;
      }

      const res = await fetch(fnUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = data.error ?? data.details ?? `HTTP ${res.status}`;
        setTestContactResult('failed');
        setTestContactDetail(detail);
        toast.error(`Test failed: ${detail}`);
        return;
      }

      const sent = data.sent ?? data.accepted ?? data.written ?? 0;
      const failed = data.failed ?? 0;
      const skipped = data.skipped_no_email ?? 0;
      // Surface the first per-contact error from Mailchimp (e.g. "already subscribed", "invalid email")
      const firstError: string | null = data.errors?.[0]
        ? `${data.errors[0].email_address ?? ''}: ${data.errors[0].error ?? data.errors[0]}`.trim().replace(/^: /, '')
        : null;

      if (skipped > 0 && sent === 0 && failed === 0) {
        setTestContactResult('failed');
        setTestContactDetail(`Email ${userEmail} was skipped — check the address is valid for ${selectedIntegration.name}.`);
        toast.error('Test contact skipped — email may be invalid for this platform.');
      } else if (failed > 0 && sent === 0) {
        // Mailchimp accepted the request but rejected the contact (e.g. invalid email, fake email, already cleaned)
        const detail = firstError ?? data.error ?? `${selectedIntegration.name} rejected the contact (${failed} error${failed > 1 ? 's' : ''})`;
        setTestContactResult('failed');
        setTestContactDetail(detail);
        toast.error(`Test failed: ${detail}`);
      } else if (sent > 0) {
        setTestContactResult('success');
        setTestContactDetail(`Test contact (${userEmail}) sent — check ${selectedIntegration.name} to confirm it arrived.`);
        toast.success(`Test contact sent to ${selectedIntegration.name}!`);
      } else {
        // sent=0 failed=0 skipped=0 — treat as success (contact already existed, update_existing may have been a no-op)
        setTestContactResult('success');
        setTestContactDetail(`Test contact (${userEmail}) processed by ${selectedIntegration.name} — verify it appears in your list.`);
        toast.success(`Test contact sent to ${selectedIntegration.name}!`);
      }
    } catch (e: any) {
      setTestContactResult('failed');
      setTestContactDetail(e.message ?? 'Network error');
      toast.error(e.message ?? 'Network error during test');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Map integration IDs to modal integration IDs
  const getModalIntegrationId = (integrationId: string): string => {
    const mapping: { [key: string]: string } = {
      'zoho': 'zoho-crm',
      'constantcontact': 'constant-contact',
    };
    return mapping[integrationId] || integrationId;
  };

  // Get integration data for modal
  const getIntegrationData = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return null;

    const modalId = getModalIntegrationId(integrationId);
    const config = INTEGRATION_CONFIGS[modalId];
    
    return {
      id: modalId,
      name: integration.name,
      authType: config?.authType || 'oauth',
      logo: '🔗', // Simple emoji for logo
      description: config?.description || integration.description,
    };
  };

  const handleConnectClick = (integrationId: string) => {
    // Close any open modal first
    setConnectionModalOpen(false);
    
    // Small delay to ensure clean transition
    setTimeout(() => {
      setConnectionModalIntegration(integrationId);
      setConnectionModalOpen(true);
    }, 100);
  };

  const handleConnectionComplete = (integrationId: string, credentials?: any) => {
    setConnectionModalOpen(false);
    setConnectionModalIntegration(null);
    loadConnectedIntegrations().then((infoMap) => {
      const integ = integrations.find(i => i.id === integrationId);
      if (integ) {
        setTimeout(() => {
          // Use freshly-loaded infoMap directly — React state (connectedInfo) is still stale here
          const cfg = infoMap[integrationId]?.config ?? {};
          setSelectedIntegration({ ...integ, connected: true, category: 'connected' });
          setConnectionTestResult(null);
          setTestContactResult(null);
          setTestContactDetail(null);
          setSettingsListId(cfg.list_id ?? '');
          setSettingsTags(Array.isArray(cfg.tags) ? cfg.tags.join(', ') : (cfg.tags ?? ''));
          setSettingsDoubleOptIn(cfg.double_opt_in ?? false);
          setSettingsOpen(true);
          if (integrationId === 'mailchimp') setTimeout(() => loadSettingsAudiences(), 50);
        }, 400);
      }
    });
    onConnect?.(integrationId);
  };

  const handleConnectionModalClose = () => {
    setConnectionModalOpen(false);
    setConnectionModalIntegration(null);
  };

  // ── Load real connected state from Supabase ──────────────────────────────
  const loadConnectedIntegrations = async (): Promise<Record<string, { connectedAt: string; config: any }>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return {};
    const { data, error } = await supabase
      .from('integration_connections')
      .select('integration_id, connected_at, config')
      .eq('user_id', session.user.id);
    if (error || !data) return {};
    const connectedIds = new Set(data.map((r: any) => r.integration_id));
    const infoMap: Record<string, { connectedAt: string; config: any }> = {};
    data.forEach((r: any) => {
      infoMap[r.integration_id] = { connectedAt: r.connected_at, config: r.config };
    });
    setConnectedInfo(infoMap);
    setIntegrations(prev => prev.map(i => ({
      ...i,
      connected: connectedIds.has(i.id),
      category: connectedIds.has(i.id) ? 'connected' : (i.category === 'connected' ? 'available' : i.category),
    })));
    // Collapse "Available" section when user already has connected integrations
    if (connectedIds.size > 0) setAvailableExpanded(false);
    return infoMap;
  };

  useEffect(() => {
    loadConnectedIntegrations();
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      window.history.replaceState({}, '', window.location.pathname);
      toast.error(`Connection failed: ${oauthError}`);
    }
    const justConnected = params.get('connected');
    if (justConnected) {
      window.history.replaceState({}, '', window.location.pathname);
      // Reload connected state from DB then show success and auto-open settings
      loadConnectedIntegrations().then((infoMap) => {
        const names: Record<string, string> = {
          google: 'Google Sheets', mailchimp: 'Mailchimp', hubspot: 'HubSpot',
          sendgrid: 'SendGrid', twilio: 'Twilio',
        };
        toast.success(`${names[justConnected] ?? justConnected} connected successfully!`);
        setIntegrations(prev => {
          const integ = prev.find(i => i.id === justConnected);
          if (integ) {
            setTimeout(() => {
              const cfg = infoMap[justConnected]?.config ?? {};
              setSelectedIntegration({ ...integ, connected: true, category: 'connected' });
              setConnectionTestResult(null);
              setTestContactResult(null);
              setTestContactDetail(null);
              setSettingsListId(cfg.list_id ?? '');
              setSettingsTags(Array.isArray(cfg.tags) ? cfg.tags.join(', ') : (cfg.tags ?? ''));
              setSettingsDoubleOptIn(cfg.double_opt_in ?? false);
              setSettingsOpen(true);
              if (justConnected === 'mailchimp') setTimeout(() => loadSettingsAudiences(), 50);
            }, 600);
          }
          return prev;
        });
      });
    }
  }, []);

  const handleDisconnect = async (integrationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    await supabase.from('integration_connections').delete().eq('user_id', session.user.id).eq('integration_id', integrationId);
    setIntegrations(prev => prev.map(i =>
      i.id === integrationId ? { ...i, connected: false, category: 'available' } : i
    ));
    setDisconnectOpen(false);
    toast.success('Integration disconnected');
  };

  const [integrations, setIntegrations] = useState<Integration[]>([
    // Connected (only Mailchimp for returning users)
    { 
      id: 'mailchimp', 
      name: 'Mailchimp', 
      icon: Mail, 
      connected: false,
      description: 'Sync contacts and trigger campaigns',
      category: 'available'
    },

    // Available Integrations - Launch List
    // CRM
    { 
      id: 'hubspot', 
      name: 'HubSpot', 
      icon: Database, 
      connected: false, 
      description: 'All-in-one CRM platform',
      category: 'available'
    },
    // Email Marketing
    { 
      id: 'sendgrid', 
      name: 'SendGrid', 
      icon: Mail, 
      connected: false, 
      description: 'Email delivery platform',
      category: 'available'
    },
    // Automation
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
      name: 'Make.com', 
      icon: Zap, 
      connected: false, 
      description: 'Advanced automation',
      category: 'available'
    },
    { 
      id: 'n8n', 
      name: 'n8n', 
      icon: Zap, 
      connected: false, 
      description: 'Self-hosted automation',
      category: 'available'
    },
    // Google Sheets now available
    { 
      id: 'google', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: false, 
      description: 'Append listing data as rows in a spreadsheet',
      category: 'available'
    },

    // Future Integrations - Coming Soon
    { 
      id: 'salesforce', 
      name: 'Salesforce', 
      icon: Plug, 
      connected: false, 
      description: 'Enterprise CRM integration',
      category: 'future'
    },
    { 
      id: 'zoho', 
      name: 'Zoho CRM', 
      icon: Database, 
      connected: false, 
      description: 'Complete CRM solution',
      category: 'future'
    },
    { 
      id: 'constantcontact', 
      name: 'Constant Contact', 
      icon: Mail, 
      connected: false, 
      description: 'Email marketing made easy',
      category: 'future'
    },
    { 
      id: 'airtable', 
      name: 'Airtable', 
      icon: Database, 
      connected: false, 
      description: 'Visual database platform',
      category: 'future'
    },
    { 
      id: 'twilio', 
      name: 'Twilio', 
      icon: MessageSquare, 
      connected: false, 
      description: 'Push agent contacts to your Twilio Sync List',
      category: 'available'
    },
    { 
      id: 'webhook', 
      name: 'Webhooks', 
      icon: Webhook, 
      connected: false, 
      description: 'Custom API endpoints',
      category: 'future'
    },
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
  ]);

  const connectedIntegrations = integrations.filter(i => i.category === 'connected');
  const availableIntegrations = integrations.filter(i => i.category === 'available');
  const futureIntegrations = integrations.filter(i => i.category === 'future');

  const handleOpenSettings = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConnectionTestResult(null);
    setTestContactResult(null);
    setTestContactDetail(null);
    // Pre-populate saved settings so user doesn't have to re-configure each time
    const cfg = connectedInfo[integration.id]?.config ?? {};
    setSettingsListId(cfg.list_id ?? '');
    setSettingsTags(Array.isArray(cfg.tags) ? cfg.tags.join(', ') : (cfg.tags ?? ''));
    setSettingsDoubleOptIn(cfg.double_opt_in ?? false);
    setSettingsSpreadsheetId(cfg.spreadsheet_id ?? '');
    setSettingsSheetName(cfg.sheet_name ?? '');
    setSettingsOpen(true);
    // Auto-load Mailchimp audiences so the saved audience is visible immediately
    if (integration.id === 'mailchimp') {
      setTimeout(() => loadSettingsAudiences(), 50);
    }
  };

  const handleOpenDisconnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setDisconnectOpen(true);
  };



  const handleRequestIntegration = () => {
    if (onNavigate) {
      onNavigate('request-integration');
    } else {
      window.open('mailto:integrations@listingbug.com?subject=Integration Request', '_blank', 'noopener,noreferrer');
    }
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => {
    const Icon = integration.icon;
    const isConnected = integration.connected;
    const isFuture = integration.category === 'future';

    return (
      <div className={`bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-4 transition-all ${
        isConnected 
          ? 'hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm' 
          : isFuture 
          ? 'opacity-60'
          : 'hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm'
      }`}>
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 bg-white dark:bg-[#0F1115]">
          <Icon className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
        </div>

        {/* Name & Status */}
        <div className="mb-1">
          <h5 className="font-bold text-[13px] text-[#342e37] dark:text-white mb-0.5">{integration.name}</h5>
          {isConnected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-500">
              <CheckCircle className="w-3 h-3" />
              Connected
            </span>
          )}
          {isConnected && connectedInfo[integration.id]?.connectedAt && (
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
              Since {new Date(connectedInfo[integration.id].connectedAt).toLocaleDateString()}
            </p>
          )}
          {isFuture && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Coming Soon</span>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-gray-600 dark:text-[#EBF2FA] mb-3 line-clamp-2 leading-relaxed">
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
            
            {/* Desktop: View + Disconnect */}
            <div className="hidden md:flex gap-1.5">
              <button
                onClick={() => { setSelectedIntegration(integration); setEditModalOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-gray-700 dark:text-white bg-white dark:bg-[#0F1115] border border-gray-200 dark:border-white/20 rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Eye className="w-3 h-3" />
                View
              </button>
              <button
                onClick={() => handleOpenDisconnect(integration)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium text-red-700 dark:text-red-400 bg-white dark:bg-[#0F1115] border border-red-200 dark:border-red-800/40 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          </>
        ) : !isFuture ? (
          <button
            onClick={() => handleConnectClick(integration.id)}
            className="w-full px-2 py-1.5 text-[11px] font-bold text-gray-700 dark:text-white/90 bg-white dark:bg-[#0F1115] border border-gray-200 dark:border-white/20 rounded hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Connect
          </button>
        ) : (
          <button
            disabled
            className="w-full px-2 py-1.5 text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0F1115] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-[50px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Plug className="w-7 h-7 text-[#342e37] dark:text-[#FFCE0A]" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('account_default_tab', 'integrations');
                if (onNavigate) onNavigate('account');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] text-sm font-semibold transition-colors"
            >
              <Key className="w-4 h-4" />
              Get API Key
            </button>
          </div>
          <p className="text-[14px] text-gray-600 dark:text-[#EBF2FA]">
            Set it and forget it - Let ListingBug transfer data to the tools you use most totally on autopilot.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Connected Integrations */}
          {connectedIntegrations.length > 0 && (
            <div>
              <h3 className="font-bold text-[22px] text-[#342e37] dark:text-white mb-4">
                Connected Integrations ({connectedIntegrations.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {connectedIntegrations.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <div>
            <button
              onClick={() => setAvailableExpanded(!availableExpanded)}
              className="flex items-center justify-between w-full mb-4 group"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-white text-[13px] font-medium rounded">
                  {availableExpanded ? 'Hide' : 'Show'}
                </span>
                <h3 className="font-bold text-[22px] text-[#342e37] dark:text-white">
                  Available Integrations ({availableIntegrations.length})
                </h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${availableExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {availableExpanded && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableIntegrations.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            )}
          </div>

          {/* Future Integrations */}
          <div>
            <button
              onClick={() => setFutureExpanded(!futureExpanded)}
              className="flex items-center justify-between w-full mb-4 group"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-white text-[13px] font-medium rounded">
                  {futureExpanded ? 'Hide' : 'Show'}
                </span>
                <h3 className="font-bold text-[22px] text-[#342e37] dark:text-white">
                  Future Integrations ({futureIntegrations.length})
                </h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${futureExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {futureExpanded && (
              <>
                <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA] mb-3">
                  These integrations are planned for future releases. Vote for your favorites!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {futureIntegrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Request Integration CTA */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[22px] text-[#342e37] dark:text-white mb-1">
                    Don't see what you need?
                  </h3>
                  <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">
                    Request a custom integration and we'll prioritize it in our roadmap.
                  </p>
                </div>
                <button
                  onClick={handleRequestIntegration}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD447] text-[#342E37] rounded-lg font-bold text-sm hover:bg-[#FFD447]/90 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Request an Integration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal - Full from AccountIntegrationsTab */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedIntegration?.name} Settings</DialogTitle>
            <DialogDescription>Configure how ListingBug syncs data with {selectedIntegration?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Connected Account */}
            <div className="space-y-2">
              <Label>Connected Account</Label>
              <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-sm">
                {selectedIntegration && (connectedInfo[selectedIntegration.id]?.config?.email || connectedInfo[selectedIntegration.id]?.config?.account_name)
                  ? <span className="text-gray-800 dark:text-gray-200">{connectedInfo[selectedIntegration.id].config.email ?? connectedInfo[selectedIntegration.id].config.account_name}</span>
                  : <span className="text-gray-400 italic">Not available — reconnect to refresh</span>}
              </div>
            </div>

            {/* Mailchimp specific: real audience dropdown + tags */}
            {selectedIntegration?.id === "mailchimp" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Audience <span className="text-red-500">*</span></Label>
                    <button onClick={loadSettingsAudiences} disabled={settingsAudiencesLoading} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      {settingsAudiencesLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      {settingsAudiences.length ? "Refresh" : "Load"}
                    </button>
                  </div>
                  {settingsAudiencesLoading && <div className="flex items-center gap-2 text-sm text-gray-400 py-1"><Loader2 className="w-4 h-4 animate-spin" /> Loading your audiences…</div>}
                  {!settingsAudiencesLoading && settingsAudiences.length === 0 && (
                    <button onClick={loadSettingsAudiences} className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-white/20 rounded-lg text-sm text-gray-500 hover:border-gray-400 transition-colors">
                      Click to load your Mailchimp audiences
                    </button>
                  )}
                  {settingsAudiences.length > 0 && (
                    <select
                      className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white"
                      value={settingsListId}
                      onChange={e => setSettingsListId(e.target.value)}
                    >
                      <option value="">Select an audience…</option>
                      {settingsAudiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                  <p className="text-xs text-gray-400">Contacts will be added to this audience when automations run.</p>
                </div>
                <div className="space-y-2">
                  <Label>Add Custom Tag(s) <span className="text-xs text-gray-400 font-normal">(optional)</span></Label>
                  <Input placeholder="listingbug, denver-agents" value={settingsTags} onChange={e => setSettingsTags(e.target.value)} />
                  <p className="text-xs text-gray-400">Comma-separated. Applied to every contact synced via this integration.</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
                  <div>
                    <p className="text-sm font-medium dark:text-white">Double Opt-in</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mailchimp sends a confirmation email before subscribing</p>
                  </div>
                  <button onClick={() => setSettingsDoubleOptIn(v => !v)} className={`w-11 h-6 rounded-full transition-colors ${settingsDoubleOptIn ? "bg-[#FFCE0A]" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${settingsDoubleOptIn ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </>
            )}

            {/* Google Sheets specific: spreadsheet URL/ID + sheet name */}
            {selectedIntegration?.id === "google" && (
              <>
                <div className="space-y-2">
                  <Label>Spreadsheet URL or ID <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Paste the Google Sheets URL or spreadsheet ID"
                    value={settingsSpreadsheetId}
                    onChange={e => {
                      const val = e.target.value.trim();
                      // Extract ID from full URL if pasted
                      const match = val.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
                      setSettingsSpreadsheetId(match ? match[1] : val);
                    }}
                  />
                  <p className="text-xs text-gray-400">You can paste the full URL — we'll extract the ID automatically. Make sure the sheet is shared with your Google account.</p>
                </div>
                <div className="space-y-2">
                  <Label>Sheet (Tab) Name <span className="text-xs text-gray-400 font-normal">(optional)</span></Label>
                  <Input
                    placeholder="Sheet1"
                    value={settingsSheetName}
                    onChange={e => setSettingsSheetName(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">Defaults to "Sheet1". Must match the tab name exactly.</p>
                </div>
              </>
            )}

            {/* Send Test Contact */}
            <div className="space-y-1.5">
              <Button
                variant="outline"
                className="w-full"
                disabled={isSendingTest}
                onClick={sendTestContact}
              >
                {isSendingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {isSendingTest ? "Sending test contact…" : "Send Test Contact"}
              </Button>
              {testContactResult === "success" && (
                <p className="text-xs text-green-600 flex items-center gap-1 flex-wrap">
                  <CheckCircle className="w-3 h-3 shrink-0" /> {testContactDetail}
                </p>
              )}
              {testContactResult === "failed" && (
                <p className="text-xs text-red-500 flex items-center gap-1 flex-wrap">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {testContactDetail}
                </p>
              )}
              <p className="text-xs text-gray-400">Sends a test listing agent contact using your account email. Safe to delete afterwards.</p>
            </div>

            {/* View Run History */}
            <Button variant="outline" className="w-full" onClick={() => {
              setSettingsOpen(false);
              if (onNavigate) onNavigate("automations");
              sessionStorage.setItem("listingbug_automations_last_tab", "history");
            }}>
              <Clock className="w-4 h-4 mr-2" /> View Run History
            </Button>

            {/* Disconnect */}
            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-400 mb-2">Removing this integration will stop all automations that use it.</p>
              <button
                onClick={() => {
                  setSettingsOpen(false);
                  setTimeout(() => handleOpenDisconnect(selectedIntegration!), 100);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-4 h-4" />
                Remove Integration
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button
              disabled={
                (selectedIntegration?.id === "mailchimp" && !settingsListId) ||
                (selectedIntegration?.id === "google" && !settingsSpreadsheetId)
              }
              onClick={async () => {
                if (!selectedIntegration) return;
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) { toast.error("Not signed in"); return; }
                  const tags = settingsTags ? settingsTags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
                  const isGoogle = selectedIntegration.id === "google";
                  const newConfig = isGoogle
                    ? { ...connectedInfo[selectedIntegration.id]?.config, spreadsheet_id: settingsSpreadsheetId, sheet_name: settingsSheetName || 'Sheet1' }
                    : { ...connectedInfo[selectedIntegration.id]?.config, list_id: settingsListId, tags, double_opt_in: settingsDoubleOptIn };
                  await supabase.from("integration_connections").update({ config: newConfig }).eq("user_id", session.user.id).eq("integration_id", selectedIntegration.id);
                  setConnectedInfo(prev => ({ ...prev, [selectedIntegration.id]: { ...prev[selectedIntegration.id], config: newConfig } }));
                  toast.success("Settings saved");
                  setSettingsOpen(false);
                } catch (e: any) { toast.error(e.message ?? "Failed to save"); }
              }}
            >Save Settings</Button>
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
            <Button variant="destructive" onClick={() => selectedIntegration && handleDisconnect(selectedIntegration.id)}>
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
              <h4 className="text-sm font-medium text-[#342e37] dark:text-white mb-3">Connection Details</h4>
              <div className="space-y-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="font-medium text-green-600 dark:text-green-500">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Account</span>
                  {selectedIntegration && (connectedInfo[selectedIntegration.id]?.config?.email || connectedInfo[selectedIntegration.id]?.config?.account_name) ? <span className="font-medium text-[#342e37] dark:text-white">{connectedInfo[selectedIntegration.id].config.email ?? connectedInfo[selectedIntegration.id].config.account_name}</span> : <span className="font-medium text-gray-400">—</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Connected</span>
                  {selectedIntegration && connectedInfo[selectedIntegration.id]?.connectedAt ? <span className="font-medium text-[#342e37] dark:text-white">{new Date(connectedInfo[selectedIntegration.id].connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="font-medium text-gray-400">Unknown</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                  {selectedIntegration && connectedInfo[selectedIntegration.id]?.config?.last_used_at ? <span className="font-medium text-[#342e37] dark:text-white">{new Date(connectedInfo[selectedIntegration.id].config.last_used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="font-medium text-gray-400">{lastSyncTime}</span>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div>
              <h4 className="text-sm font-medium text-[#342e37] dark:text-white mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setTimeout(() => {
                      handleOpenSettings(selectedIntegration!);
                    }, 100);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-white bg-white dark:bg-[#0F1115] border border-gray-200 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configure Settings</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="px-4 md:px-6 pb-4">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection Modal */}
      <IntegrationConnectionModal
        integration={connectionModalIntegration ? getIntegrationData(connectionModalIntegration) : null}
        isOpen={connectionModalOpen}
        onClose={handleConnectionModalClose}
        onConnect={handleConnectionComplete}
        onNavigate={onNavigate}
      />
    </div>
  );
}
