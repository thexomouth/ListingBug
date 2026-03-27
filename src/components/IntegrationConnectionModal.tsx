import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, ExternalLink, Loader2, CheckCircle2, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

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
  onConnect: (integrationId: string, credentials?: any) => void;
  onNavigate?: (page: string, tab?: string) => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export const INTEGRATION_CONFIGS: Record<string, any> = {
  google: {
    authType: 'oauth',
    description: 'Automatically append new listing data as rows in your Google Sheets spreadsheet.',
    bullets: [
      'New listings added as rows on each automation run',
      'Auto-creates column headers on first run',
      'Supports append or overwrite mode',
    ],
  },
  mailchimp: {
    authType: 'oauth',
    description: 'Push listing agent contacts directly into your Mailchimp audience. You control what campaigns to send.',
    bullets: [
      'Agent contacts upserted to your audience list',
      'Optional tags to segment your contacts',
      'You decide what to send from Mailchimp',
    ],
  },
  hubspot: {
    authType: 'oauth',
    description: 'Sync listing agent contacts into your HubSpot CRM as leads. Manage follow-up from HubSpot.',
    bullets: [
      'Agents created or updated as CRM contacts',
      'Tagged as leads with listing source data',
      'You manage outreach from HubSpot',
    ],
  },
  sendgrid: {
    authType: 'api-key',
    description: 'Push agent contacts to your SendGrid Marketing Contacts list. Send campaigns from SendGrid.',
    bullets: [
      'Agent contacts added to your marketing lists',
      'No emails sent by ListingBug',
      'You control campaigns in SendGrid',
    ],
    keyLabel: 'SendGrid API Key',
    keyPlaceholder: 'SG.xxxxxxxxxxxxxx',
    keyHint: 'Find this at sendgrid.com → Settings → API Keys. Key needs Marketing permissions.',
    keyLink: 'https://app.sendgrid.com/settings/api_keys',
    keyLinkLabel: 'Open SendGrid API Keys →',
  },
  twilio: {
    authType: 'api-key-twilio',
    description: 'Push agent contacts to a Twilio Sync List in your account. Use Studio flows to follow up.',
    bullets: [
      'Contacts stored in your Twilio Sync List',
      'No SMS sent by ListingBug',
      'Access contacts from Twilio Studio',
    ],
  },
  zapier: {
    authType: 'webhook',
    description: 'Send listing data to any Zapier workflow via a webhook trigger. Connect to 5,000+ apps.',
    bullets: [
      'Batch or individual listing delivery',
      'Zapier maps data to any action',
      'No account linking required',
    ],
    instructions: [
      'In Zapier, create a new Zap',
      'Choose "Webhooks by Zapier" as the trigger',
      'Select "Catch Hook" and copy the webhook URL',
      'Paste the URL below and save',
    ],
  },
  make: {
    authType: 'webhook',
    description: 'Send listing data to a Make.com scenario via a custom webhook. Build any automation.',
    bullets: [
      'Full listing JSON delivered to your scenario',
      'Make routes data to any module',
      'No account linking required',
    ],
    instructions: [
      'In Make, create a new scenario',
      'Add a "Webhooks" module as the trigger',
      'Select "Custom Webhook" and create a new webhook',
      'Copy the URL and paste it below',
    ],
  },
  n8n: {
    authType: 'webhook',
    description: 'Send listing data to an n8n workflow via a Webhook trigger node.',
    bullets: [
      'Full listing JSON delivered to your workflow',
      'n8n handles routing to any service',
      'No account linking required',
    ],
    instructions: [
      'In n8n, create a workflow with a "Webhook" trigger node',
      'Set the Method to POST',
      'Copy the webhook URL and paste it below',
      'Activate the workflow in n8n',
    ],
  },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function IntegrationConnectionModal({
  integration,
  isOpen,
  onClose,
  onConnect,
  onNavigate,
}: IntegrationConnectionModalProps) {
  const [step, setStep] = useState<'connect' | 'config'>('connect');
  const [isConnecting, setIsConnecting] = useState(false);

  // API key (SendGrid)
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Twilio
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [showAuthToken, setShowAuthToken] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sendMode, setSendMode] = useState<'batch' | 'individual'>('batch');

  // SendGrid lists (after key entry)
  const [sgLists, setSgLists] = useState<{id: string; name: string}[]>([]);
  const [sgListIds, setSgListIds] = useState<string[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Mailchimp post-OAuth config
  const [mcAudiences, setMcAudiences] = useState<{id: string; name: string}[]>([]);
  const [mcListId, setMcListId] = useState('');
  const [mcTags, setMcTags] = useState('');
  const [mcDoubleOptIn, setMcDoubleOptIn] = useState(false);
  const [loadingAudiences, setLoadingAudiences] = useState(false);

  // Google Sheets post-OAuth config
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [writeMode, setWriteMode] = useState<'append' | 'overwrite'>('append');

  // HubSpot post-OAuth config (minimal)
  const [hsObjectType] = useState('contacts');

  const config = integration ? INTEGRATION_CONFIGS[integration.id] ?? {} : {};
  const authType = config.authType ?? 'oauth';

  // Reset all state on close/open
  useEffect(() => {
    if (!isOpen) {
      setStep('connect');
      setApiKey(''); setShowApiKey(false);
      setAccountSid(''); setAuthToken(''); setShowAuthToken(false);
      setWebhookUrl(''); setSendMode('batch');
      setSgLists([]); setSgListIds([]); setLoadingLists(false);
      setMcAudiences([]); setMcListId(''); setMcTags(''); setMcDoubleOptIn(false);
      setSpreadsheetId(''); setSheetName('Sheet1'); setWriteMode('append');
      setIsConnecting(false);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // If returning from OAuth OR already connected and opening config, auto-load audiences
  useEffect(() => {
    if (isOpen && integration && authType === 'oauth') {
      const params = new URLSearchParams(window.location.search);
      const fromOAuth = params.get('connected') === integration.id;
      if (fromOAuth) {
        setStep('config');
        if (integration.id === 'mailchimp') loadMailchimpAudiences();
      } else if (step === 'config' && integration.id === 'mailchimp' && mcAudiences.length === 0) {
        loadMailchimpAudiences();
      }
    }
  }, [isOpen, integration, step]);

  // ── OAuth connect ──────────────────────────────────────────────────────────
  const handleOAuthConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const res = await fetch(
        `https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/oauth-connect?integration=${integration!.id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to get OAuth URL');
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message ?? 'OAuth connection failed');
      setIsConnecting(false);
    }
  };

  // ── Load Mailchimp audiences ───────────────────────────────────────────────
  const loadMailchimpAudiences = useCallback(async () => {
    setLoadingAudiences(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ integration: 'mailchimp' }),
        }
      );
      const data = await res.json();
      if (data.options) setMcAudiences(data.options);
      else toast.error(data.error ?? 'Could not load Mailchimp audiences');
    } catch {
      toast.error('Failed to load Mailchimp audiences');
    } finally {
      setLoadingAudiences(false);
    }
  }, []);

  // ── Load SendGrid lists ────────────────────────────────────────────────────
  const handleLoadSgLists = async () => {
    if (!apiKey.trim()) return;
    setLoadingLists(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ integration: 'sendgrid', credentials: { api_key: apiKey } }),
        }
      );
      const data = await res.json();
      if (data.options) setSgLists(data.options);
      else toast.error(data.error ?? 'Could not load SendGrid lists. Check your API key.');
    } catch {
      toast.error('Failed to load SendGrid lists');
    } finally {
      setLoadingLists(false);
    }
  };

  // ── Save API key integrations ──────────────────────────────────────────────
  const handleSaveApiKey = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const credentials: any = authType === 'api-key-twilio'
        ? { account_sid: accountSid.trim(), auth_token: authToken.trim() }
        : { api_key: apiKey.trim() };
      const config_data: any = authType === 'api-key' ? { list_ids: sgListIds } : {};
      await supabase.from('integration_connections').upsert({
        user_id: session.user.id,
        integration_id: integration!.id,
        credentials,
        config: config_data,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_id' });
      toast.success(`${integration!.name} connected!`);
      onConnect(integration!.id, credentials);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save credentials');
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Save webhook ───────────────────────────────────────────────────────────
  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim().startsWith('https://')) {
      toast.error('Webhook URL must start with https://');
      return;
    }
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      await supabase.from('integration_connections').upsert({
        user_id: session.user.id,
        integration_id: integration!.id,
        credentials: {},
        config: { webhook_url: webhookUrl.trim(), send_mode: sendMode },
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_id' });
      toast.success(`${integration!.name} connected!`);
      onConnect(integration!.id, { webhook_url: webhookUrl, send_mode: sendMode });
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save webhook');
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Save OAuth post-connect config ─────────────────────────────────────────
  const handleSaveOAuthConfig = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');

      let cfg: any = {};
      if (integration!.id === 'google') {
        if (!spreadsheetId.trim()) { toast.error('Spreadsheet ID is required'); setIsConnecting(false); return; }
        cfg = { spreadsheet_id: spreadsheetId.trim(), sheet_name: sheetName.trim() || 'Sheet1', write_mode: writeMode };
      } else if (integration!.id === 'mailchimp') {
        if (!mcListId) { toast.error('Please select an audience'); setIsConnecting(false); return; }
        cfg = { list_id: mcListId, tags: mcTags ? mcTags.split(',').map(t => t.trim()).filter(Boolean) : [], double_opt_in: mcDoubleOptIn };
      } else if (integration!.id === 'hubspot') {
        cfg = { object_type: hsObjectType };
      }

      await supabase.from('integration_connections').update({ config: cfg }).eq('user_id', session.user.id).eq('integration_id', integration!.id);
      // Clean the URL param
      window.history.replaceState({}, '', '/integrations');
      toast.success(`${integration!.name} ready to use!`);
      onConnect(integration!.id);
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save settings');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen || !integration) return null;

  // ─── Render ────────────────────────────────────────────────────────────────
  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] md:w-full max-w-lg bg-white dark:bg-[#1a1d24] rounded-xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-[#FFCE0A] px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl font-bold">
              {integration.logo}
            </div>
            <div>
              <h2 className="font-bold text-[#0d1b2a] text-lg">
                {step === 'config' ? `${integration.name} Settings` : `Connect ${integration.name}`}
              </h2>
              {authType === 'oauth' && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${step === 'connect' ? 'bg-[#0d1b2a]/40' : 'bg-[#0d1b2a]'}`} />
                  <ChevronRight className="w-3 h-3 text-[#0d1b2a]/60" />
                  <div className={`w-2 h-2 rounded-full ${step === 'config' ? 'bg-[#0d1b2a]' : 'bg-[#0d1b2a]/40'}`} />
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#0d1b2a]/10 flex items-center justify-center">
            <X className="w-5 h-5 text-[#0d1b2a]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── STEP 1: OAuth Connect ── */}
          {authType === 'oauth' && step === 'connect' && (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{config.description}</p>
              <ul className="space-y-2">
                {(config.bullets ?? []).map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0d1b2a] font-bold"
                size="lg"
                onClick={handleOAuthConnect}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                {isConnecting ? 'Redirecting...' : `Connect with ${integration.name}`}
              </Button>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                You'll be redirected to {integration.name} to authorize access. Your credentials stay with {integration.name}.
              </p>
            </>
          )}

          {/* ── STEP 2: OAuth Config — Google Sheets ── */}
          {authType === 'oauth' && step === 'config' && integration.id === 'google' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">Google connected. Configure your spreadsheet below.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spreadsheet-id">Spreadsheet ID <span className="text-red-500">*</span></Label>
                <Input
                  id="spreadsheet-id"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  value={spreadsheetId}
                  onChange={e => setSpreadsheetId(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Found in your Google Sheets URL between <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/d/</code> and <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/edit</code>.{' '}
                  <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Create a new sheet →</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sheet-name">Sheet Tab Name</Label>
                <Input id="sheet-name" placeholder="Sheet1" value={sheetName} onChange={e => setSheetName(e.target.value)} />
                <p className="text-xs text-gray-500 dark:text-gray-400">The name of the tab to write data to (bottom of your spreadsheet).</p>
              </div>

              <div className="space-y-2">
                <Label>Write Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['append', 'overwrite'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setWriteMode(m)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${writeMode === m ? 'border-[#FFCE0A] bg-[#FFCE0A]/10 text-[#0d1b2a] dark:text-white' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                    >
                      <div className="font-semibold capitalize">{m}</div>
                      <div className="text-xs mt-0.5 font-normal">{m === 'append' ? 'Add new rows each run' : 'Clear and rewrite each run'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: OAuth Config — Mailchimp ── */}
          {authType === 'oauth' && step === 'config' && integration.id === 'mailchimp' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">Mailchimp connected. Choose your audience below.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Audience / List <span className="text-red-500">*</span></Label>
                  <button onClick={loadMailchimpAudiences} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    {loadingAudiences ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {mcAudiences.length ? 'Refresh' : 'Load audiences'}
                  </button>
                </div>
                {loadingAudiences && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading your audiences...</div>}
                {!loadingAudiences && mcAudiences.length === 0 && (
                  <Button variant="outline" className="w-full" onClick={loadMailchimpAudiences}>Load My Audiences</Button>
                )}
                {mcAudiences.length > 0 && (
                  <select
                    className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white"
                    value={mcListId}
                    onChange={e => setMcListId(e.target.value)}
                  >
                    <option value="">Select an audience...</option>
                    {mcAudiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mc-tags">Tags (optional)</Label>
                <Input
                  id="mc-tags"
                  placeholder="ListingBug, Denver Agents"
                  value={mcTags}
                  onChange={e => setMcTags(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Comma-separated. Applied to every contact synced from this integration.</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Double opt-in</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mailchimp sends a confirmation email before subscribing</p>
                </div>
                <button
                  onClick={() => setMcDoubleOptIn(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors ${mcDoubleOptIn ? 'bg-[#FFCE0A]' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${mcDoubleOptIn ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Note: For PRICE, PROPTYPE, and BROKERAGE fields to sync, create matching merge fields in your Mailchimp audience settings.
              </p>
            </>
          )}

          {/* ── STEP 2: OAuth Config — HubSpot ── */}
          {authType === 'oauth' && step === 'config' && integration.id === 'hubspot' && (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">HubSpot connected successfully.</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">What gets synced:</p>
                <ul className="space-y-1">
                  {['Agent name, email, phone', 'Brokerage as company', 'Property address, price, type', 'Tagged as new lead'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFCE0A]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Want listing details as contact properties? Go to HubSpot → Settings → Properties and create custom properties starting with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">listingbug_</code>.
              </p>
            </>
          )}

          {/* ── SendGrid (API key) ── */}
          {authType === 'api-key' && (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{config.description}</p>
              <ul className="space-y-2">
                {(config.bullets ?? []).map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sg-key">{config.keyLabel ?? 'API Key'} <span className="text-red-500">*</span></Label>
                  {config.keyLink && (
                    <a href={config.keyLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />{config.keyLinkLabel}
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="sg-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={config.keyPlaceholder ?? 'Paste your API key'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button onClick={() => setShowApiKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{config.keyHint}</p>
              </div>

              {/* Load lists button + dropdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contact List (optional)</Label>
                  <Button variant="outline" size="sm" onClick={handleLoadSgLists} disabled={!apiKey.trim() || loadingLists}>
                    {loadingLists ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    {sgLists.length ? 'Reload lists' : 'Load my lists'}
                  </Button>
                </div>
                {sgLists.length > 0 && (
                  <div className="space-y-1">
                    {sgLists.map(list => (
                      <label key={list.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sgListIds.includes(list.id)}
                          onChange={e => setSgListIds(prev => e.target.checked ? [...prev, list.id] : prev.filter(id => id !== list.id))}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{list.name}</span>
                      </label>
                    ))}
                    <p className="text-xs text-gray-400 mt-1">If none selected, contacts go to your global list.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Twilio (api-key-twilio) ── */}
          {authType === 'api-key-twilio' && (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{config.description}</p>
              <ul className="space-y-2">
                {(config.bullets ?? []).map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#FFCE0A] flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twilio-sid">Account SID <span className="text-red-500">*</span></Label>
                  <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />Open Twilio Console →
                  </a>
                </div>
                <Input id="twilio-sid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={accountSid} onChange={e => setAccountSid(e.target.value)} />
                <p className="text-xs text-gray-500 dark:text-gray-400">Starts with AC. Found on your Twilio Console dashboard.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio-token">Auth Token <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="twilio-token"
                    type={showAuthToken ? 'text' : 'password'}
                    placeholder="Your auth token"
                    value={authToken}
                    onChange={e => setAuthToken(e.target.value)}
                    className="pr-10"
                  />
                  <button onClick={() => setShowAuthToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showAuthToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Found below your Account SID on the Twilio Console dashboard.</p>
              </div>
            </>
          )}

          {/* ── Webhook (Zapier / Make / n8n) ── */}
          {authType === 'webhook' && (
            <>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{config.description}</p>

              {config.instructions && (
                <div className="bg-gray-50 dark:bg-[#2F2F2F] rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Setup steps</p>
                  <ol className="space-y-1.5">
                    {config.instructions.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-5 h-5 rounded-full bg-[#FFCE0A] text-[#0d1b2a] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL <span className="text-red-500">*</span></Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Must start with https://</p>
              </div>

              <div className="space-y-2">
                <Label>Delivery Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['batch', 'individual'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setSendMode(m)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${sendMode === m ? 'border-[#FFCE0A] bg-[#FFCE0A]/10 text-[#0d1b2a] dark:text-white' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}
                    >
                      <div className="font-semibold capitalize">{m}</div>
                      <div className="text-xs mt-0.5 font-normal">{m === 'batch' ? 'One request with all listings' : 'One request per listing'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#2F2F2F] border-t dark:border-white/10 flex items-center justify-between rounded-b-xl flex-shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div className="flex items-center gap-2">
            {/* OAuth step 1 — connect button */}
            {authType === 'oauth' && step === 'connect' && null /* button is in body */}

            {/* OAuth step 2 — save config */}
            {authType === 'oauth' && step === 'config' && (
              <Button
                className="bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0d1b2a] font-bold"
                onClick={handleSaveOAuthConfig}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Settings
              </Button>
            )}

            {/* API key integrations */}
            {(authType === 'api-key' || authType === 'api-key-twilio') && (
              <Button
                className="bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0d1b2a] font-bold"
                onClick={handleSaveApiKey}
                disabled={isConnecting || (authType === 'api-key' ? !apiKey.trim() : !accountSid.trim() || !authToken.trim())}
              >
                {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Connect {integration.name}
              </Button>
            )}

            {/* Webhook integrations */}
            {authType === 'webhook' && (
              <Button
                className="bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0d1b2a] font-bold"
                onClick={handleSaveWebhook}
                disabled={isConnecting || !webhookUrl.trim()}
              >
                {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Webhook
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
