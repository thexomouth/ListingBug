/**
 * ACTIVATE AUTOMATION MODAL
 * Step 1: Preview & Test (real test — no fake spinner)
 * Step 2: Activate — config + activate
 *
 * Error codes ERR_01–ERR_13 printed on failure for fast triage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { LBButton } from './design-system/LBButton';
import { LBInput } from './design-system/LBInput';
import { Play, CheckCircle, ArrowRight, FileJson, Zap, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabase';

interface ActivateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  automationName: string;
  searchName: string;
  destination?: { id: string; name: string; icon: any };
  fieldMappings: Array<{ source: string; destination: string }>;
  syncFrequency: string;
  onActivate: (config: any) => void;
}

const ERR: Record<string, string> = {
  NOT_SIGNED_IN:   'ERR_01 — Not signed in. Refresh and sign in again.',
  NOT_CONNECTED:   'ERR_02 — Mailchimp not connected. Go to Integrations and connect your account.',
  NO_LIST_ID:      'ERR_03 — No audience selected. Pick one from the dropdown.',
  MC_401:          'ERR_04 — Mailchimp rejected the token (401). Reconnect your account in Integrations.',
  MC_403:          'ERR_05 — Mailchimp permission denied (403). Check your account permissions.',
  MC_404:          'ERR_06 — Audience not found (404). It may have been deleted in Mailchimp.',
  MC_API_ERROR:    'ERR_07 — Mailchimp API error. See detail below.',
  NO_EMAIL:        'ERR_08 — Test contact has no email. Mailchimp requires a valid email address.',
  ZERO_SYNCED:     'ERR_09 — Mailchimp accepted the request but reported 0 contacts synced. Check merge fields in your audience settings.',
  NETWORK_ERROR:   'ERR_10 — Network error reaching edge function. Check your connection.',
  EDGE_FN_ERROR:   'ERR_11 — Edge function returned an unexpected error.',
  RUN_FAILED:      'ERR_12 — Automation run reported failure.',
  AUDIENCES_FAIL:  'ERR_13 — Could not load audiences.',
};

export function ActivateAutomationModal({
  isOpen, onClose, automationName, searchName, destination,
  fieldMappings, syncFrequency, onActivate,
}: ActivateAutomationModalProps) {
  const [step, setStep] = useState<'preview' | 'activate'>('preview');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [testLoading, setTestLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testDetail, setTestDetail] = useState<string | null>(null);

  // Mailchimp audience state
  const [audiences, setAudiences] = useState<Array<{ id: string; name: string }>>([]);
  const [audiencesLoading, setAudiencesLoading] = useState(false);
  const [audiencesError, setAudiencesError] = useState<string | null>(null);

  // SendGrid list state
  const [sgLists, setSgLists] = useState<Array<{ id: string; name: string }>>([]);
  const [sgListsLoading, setSgListsLoading] = useState(false);
  const [sgListsError, setSgListsError] = useState<string | null>(null);

  // HubSpot pipeline state
  const [hsPipelines, setHsPipelines] = useState<Array<{ id: string; name: string }>>([]);
  const [hsPipelinesLoading, setHsPipelinesLoading] = useState(false);

  // HubSpot segment state
  const [hsSegments, setHsSegments] = useState<Array<{ id: string; name: string }>>([]);
  const [hsSegmentsLoading, setHsSegmentsLoading] = useState(false);
  const [hsSegmentsError, setHsSegmentsError] = useState<string | null>(null);

  const destType = (destination?.id ?? '').toLowerCase();
  const isMailchimp = destType === 'mailchimp';
  const isSendGrid = destType === 'sendgrid';
  const isHubSpot = destType === 'hubspot';
  const isSheets = destType === 'google' || destType === 'sheets';
  const isTwilio = destType === 'twilio';

  // Returns a valid access token, refreshing if the JWT exp claim is expired.
  // On rotation-race (refreshSession returns null), re-reads session for the background-rotated token.
  const getFreshToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    try {
      const b64 = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const { exp } = JSON.parse(atob(b64));
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp > now + 10) return session.access_token;
    } catch { /* fall through to refresh */ }
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) return refreshed.session.access_token;
    const { data: { session: latest } } = await supabase.auth.getSession();
    return latest?.access_token ?? null;
  }, []);

  // Load Mailchimp audiences from get-integration-options edge fn
  const loadAudiences = useCallback(async () => {
    setAudiencesLoading(true);
    setAudiencesError(null);
    try {
      const token = await getFreshToken();
      if (!token) { setAudiencesError(ERR.NOT_SIGNED_IN); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ integration: 'mailchimp' }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setAudiencesError(`${ERR.AUDIENCES_FAIL} ${data.error ?? `HTTP ${res.status}`}`);
      } else {
        setAudiences(data.options ?? []);
      }
    } catch (e: any) {
      setAudiencesError(`${ERR.NETWORK_ERROR} ${e.message}`);
    } finally {
      setAudiencesLoading(false);
    }
  }, [getFreshToken]);

  // Load SendGrid lists from get-integration-options
  const loadSgLists = useCallback(async () => {
    setSgListsLoading(true);
    setSgListsError(null);
    try {
      const token = await getFreshToken();
      if (!token) { setSgListsError(ERR.NOT_SIGNED_IN); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ integration: 'sendgrid' }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setSgListsError(`Could not load SendGrid lists. ${data.error ?? `HTTP ${res.status}`}`);
      } else {
        setSgLists(data.options ?? []);
      }
    } catch (e: any) {
      setSgListsError(`${ERR.NETWORK_ERROR} ${e.message}`);
    } finally {
      setSgListsLoading(false);
    }
  }, [getFreshToken]);

  // Load HubSpot pipelines from get-integration-options
  const loadHsPipelines = useCallback(async () => {
    setHsPipelinesLoading(true);
    try {
      const token = await getFreshToken();
      if (!token) return;
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ integration: 'hubspot', resource: 'pipelines' }),
        }
      );
      const data = await res.json();
      if (res.ok && data.options) setHsPipelines(data.options);
    } catch { /* pipelines are optional — silently ignore */ }
    finally { setHsPipelinesLoading(false); }
  }, [getFreshToken]);

  // Load HubSpot contact lists/segments
  const loadHsSegments = useCallback(async () => {
    setHsSegmentsLoading(true);
    setHsSegmentsError(null);
    try {
      const token = await getFreshToken();
      if (!token) { setHsSegmentsError(ERR.NOT_SIGNED_IN); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ integration: 'hubspot', resource: 'segments' }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setHsSegmentsError(`Could not load HubSpot lists. ${data.error ?? `HTTP ${res.status}`}`);
      } else {
        setHsSegments(data.options ?? []);
      }
    } catch (e: any) {
      setHsSegmentsError(`${ERR.NETWORK_ERROR} ${e.message}`);
    } finally {
      setHsSegmentsLoading(false);
    }
  }, [getFreshToken]);

  // Auto-load audiences when Mailchimp modal opens
  useEffect(() => {
    if (isOpen && isMailchimp && audiences.length === 0) loadAudiences();
  }, [isOpen, isMailchimp]);

  // Auto-load SendGrid lists when SendGrid modal opens
  useEffect(() => {
    if (isOpen && isSendGrid && sgLists.length === 0) loadSgLists();
  }, [isOpen, isSendGrid]);

  // Auto-load HubSpot pipelines + segments when HubSpot modal opens
  useEffect(() => {
    if (isOpen && isHubSpot && hsPipelines.length === 0) loadHsPipelines();
    if (isOpen && isHubSpot && hsSegments.length === 0) loadHsSegments();
  }, [isOpen, isHubSpot]);

  const handleReset = () => {
    setStep('preview'); setConfig({}); setTestSent(false);
    setTestError(null); setTestDetail(null); onClose();
  };

  // ── Sample listing (used for preview + real test) ──────────────────────────
  const sample = {
    id: '8e3f1a2b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
    formattedAddress: '2412 Maple Ave, Denver, CO 80205',
    addressLine1: '2412 Maple Ave', city: 'Denver', state: 'CO', zipCode: '80205',
    county: 'Denver County', latitude: 39.7392, longitude: -104.9903,
    status: 'Active', price: 485000, priceReduced: false, listedDate: '2026-03-20',
    daysOnMarket: 6, propertyType: 'Single Family', bedrooms: 3, bathrooms: 2,
    squareFootage: 1820, lotSize: 6200, yearBuilt: 1998, garage: true,
    garageSpaces: 2, pool: false, stories: 2, mlsNumber: '4781029',
    mlsName: 'REColorado', listingType: 'Standard', hoa: { fee: 125 },
    description: 'Updated 3-bed, 2-bath home in central Denver.',
    virtualTourUrl: null, photos: ['https://photos.rentcast.io/sample1.jpg'],
    listingAgent: { name: 'Jane Smith', phone: '(303) 555-0192', email: 'jane.smith@recolorado.com', website: 'https://janesmith.recolorado.com' },
    listingOffice: { name: 'RE/MAX Alliance', phone: '(303) 555-0100', email: 'info@remaxalliance.com', website: 'https://remaxalliance.com' },
    history: [{ date: '2026-03-20', event: 'Listed', price: 485000 }],
  };

  // ── Preview payload (reflects config choices live) ─────────────────────────
  const previewPayload = (() => {
    if (['zapier', 'make', 'n8n', 'webhook', 'custom-webhook'].includes(destType)) {
      return { metadata: { automation_name: automationName, search_name: searchName, run_id: 'run_abc123', run_date: new Date().toISOString(), listings_count: 1 }, listings: [sample] };
    }
    if (isMailchimp) {
      return {
        list_id: config.list_id || '[select audience above]',
        tags: config.tags ? config.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        members: [{ email_address: sample.listingAgent.email, status: 'subscribed', merge_fields: { FNAME: 'Jane', LNAME: 'Smith', PHONE: sample.listingAgent.phone, ADDRESS: sample.formattedAddress, CITY: sample.city, STATE: sample.state, ZIP: sample.zipCode, PRICE: `$${sample.price.toLocaleString()}`, PROPTYPE: sample.propertyType, BROKERAGE: sample.listingOffice.name } }],
      };
    }
    if (['google', 'sheets'].includes(destType)) {
      return { spreadsheet_id: config.spreadsheet_id || '[your_spreadsheet_id]', sheet_name: config.sheet_name || 'Listings', write_mode: 'append', rows: [{ address: sample.formattedAddress, price: sample.price, beds: sample.bedrooms, baths: sample.bathrooms, agent_email: sample.listingAgent.email }] };
    }
    if (destType === 'hubspot') {
      const objType = config.object_type || 'contacts';
      return { object_type: objType, pipeline_id: config.pipeline_id || 'default', records: [{ properties: { email: sample.listingAgent.email, firstname: 'Jane', lastname: 'Smith', company: sample.listingOffice.name, address: sample.formattedAddress } }] };
    }
    if (destType === 'sendgrid') {
      return { list_id: config.list_id || '[select list above]', contacts: [{ email: sample.listingAgent.email, first_name: 'Jane', last_name: 'Smith', address_line_1: sample.addressLine1, city: sample.city, state_province_region: sample.state, postal_code: sample.zipCode }] };
    }
    if (destType === 'twilio') {
      return { body: `New listing: ${sample.formattedAddress} — $${sample.price.toLocaleString()}, ${sample.bedrooms}bd/${sample.bathrooms}ba. MLS# ${sample.mlsNumber}` };
    }
    return { listings: [sample] };
  })();

  // ── REAL test — no fake spinner, only success when confirmed ──────────────
  const handleSendTest = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestDetail(null);
    setTestSent(false);
    try {
      const token = await getFreshToken();
      if (!token) { setTestError(ERR.NOT_SIGNED_IN); return; }
      // Shim so existing code below can reference session.access_token unchanged
      const session = { access_token: token };

      if (isMailchimp) {
        if (!config.list_id) { setTestError(ERR.NO_LIST_ID); return; }
        const tags = config.tags ? config.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

        let res: Response;
        try {
          res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/send-to-mailchimp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ listings: [sample], list_id: config.list_id, tags }),
          });
        } catch (e: any) { setTestError(`${ERR.NETWORK_ERROR}\n${e.message}`); return; }

        let data: any = {};
        try { data = await res.json(); } catch { data = {}; }

        if (res.status === 401) { setTestError(ERR.MC_401); return; }
        if (res.status === 403) { setTestError(ERR.MC_403); return; }
        if (res.status === 400 && (data.error ?? '').toLowerCase().includes('not connected')) {
          setTestError(`${ERR.NOT_CONNECTED}\n${data.error}`); return;
        }
        if (!res.ok) { setTestError(`${ERR.EDGE_FN_ERROR}\nHTTP ${res.status}: ${data.error ?? JSON.stringify(data).slice(0, 200)}`); return; }

        const { sent = 0, failed = 0, skipped_no_email = 0, errors = [] } = data;
        if (skipped_no_email > 0 && sent === 0) { setTestError(ERR.NO_EMAIL); return; }
        if (Array.isArray(errors) && errors.length > 0 && sent === 0) {
          const e0 = String(errors[0]);
          setTestError(`${e0.includes('404') ? ERR.MC_404 : ERR.MC_API_ERROR}\n${e0}`); return;
        }
        if (sent === 0) { setTestError(`${ERR.ZERO_SYNCED}\nRaw: ${JSON.stringify(data).slice(0, 300)}`); return; }

        const audienceName = audiences.find(a => a.id === config.list_id)?.name ?? config.list_id;
        setTestSent(true);
        setTestDetail(`Contact synced to "${audienceName}".${failed > 0 ? ` ${failed} failed.` : ''}`);
        toast.success(`Test confirmed — contact added to "${audienceName}".`);
        return;
      }

      // Non-Mailchimp: run-automation with Denver sample criteria
      let res: Response;
      try {
        res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/run-automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ automation: { id: null, name: automationName, searchCriteria: { city: 'Denver', state: 'CO', status: 'Active' }, destination: { type: destination?.id, label: destination?.name, config } } }),
        });
      } catch (e: any) { setTestError(`${ERR.NETWORK_ERROR}\n${e.message}`); return; }

      let data: any = {};
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok || data.error) { setTestError(`${ERR.EDGE_FN_ERROR}\n${data.error ?? `HTTP ${res.status}`}`); return; }
      if (data.status === 'failed') { setTestError(`${ERR.RUN_FAILED}\n${data.details ?? 'Unknown'}`); return; }

      setTestSent(true);
      setTestDetail(data.details ?? `${data.listings_sent ?? 0} listings sent to ${destination?.name}.`);
      toast.success(`Test confirmed — ${data.listings_sent ?? 0} listings sent to ${destination?.name}.`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleActivate = () => {
    if (isMailchimp && !config.list_id) { toast.error('Select an audience first.'); return; }
    if (isSendGrid && !config.list_id) { toast.error('Select a SendGrid list first.'); return; }
    const missing = getFields().filter(f => f.required && !config[f.key]);
    if (missing.length) { toast.error(`Fill in: ${missing.map(f => f.label).join(', ')}`); return; }
    onActivate(config);
    toast.success('Automation activated!');
    handleReset();
  };

  const getFields = (): Array<{ key: string; label: string; type?: string; placeholder: string; required?: boolean; hint?: string }> => {
    // Mailchimp, SendGrid, HubSpot handled by dedicated pickers below
    if (isMailchimp || isSendGrid || isHubSpot) return [];
    const map: Record<string, any[]> = {
      constantcontact: [{ key: 'list_id', label: 'Contact List ID', placeholder: 'Enter list ID', required: true }],
      salesforce: [{ key: 'object_type', label: 'Salesforce Object', placeholder: 'Lead', required: true }, { key: 'lead_source', label: 'Lead Source', placeholder: 'ListingBug' }],
      sheets: [
        { key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms', required: true, hint: 'From the URL: docs.google.com/spreadsheets/d/[ID]/edit' },
        { key: 'sheet_name', label: 'Sheet Tab Name', placeholder: 'Listings', hint: 'The tab name at the bottom of your spreadsheet' },
      ],
      google: [
        { key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms', required: true, hint: 'From the URL: docs.google.com/spreadsheets/d/[ID]/edit' },
        { key: 'sheet_name', label: 'Sheet Tab Name', placeholder: 'Listings', hint: 'The tab name at the bottom of your spreadsheet' },
      ],
      airtable: [{ key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX', required: true }, { key: 'table_id', label: 'Table ID', placeholder: 'tblXXXXXXXXXXXXXX', required: true }],
      twilio: [{ key: 'from_number', label: 'From Number (E.164 format)', placeholder: '+15005550006', required: true, hint: 'Must start with + and country code, e.g. +15005550006' }],
      zapier: [{ key: 'webhook_url', label: 'Zapier Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/...', required: true }],
      make: [{ key: 'webhook_url', label: 'Make Webhook URL', type: 'url', placeholder: 'https://hook.integromat.com/...', required: true }],
      webhook: [{ key: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://api.example.com/webhook', required: true }, { key: 'auth_header', label: 'Authorization Header (optional)', placeholder: 'Bearer token123' }],
    };
    return map[destination?.id || ''] || [];
  };

  // ── SendGrid list picker ───────────────────────────────────────────────────
  const SendGridPicker = () => (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white">
          Contact List <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <select
            className="flex-1 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white"
            value={config.list_id ?? ''}
            onChange={e => setConfig(p => ({ ...p, list_id: e.target.value }))}
            disabled={sgListsLoading}
          >
            <option value="">
              {sgListsLoading ? 'Loading…' : sgLists.length === 0 ? 'Click ↻ to load' : 'Select a list…'}
            </option>
            {sgLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <LBButton variant="outline" size="sm" onClick={loadSgLists} disabled={sgListsLoading} title="Refresh">
            {sgListsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </LBButton>
        </div>
        {sgListsError && <p className="text-[12px] text-red-400">{sgListsError}</p>}
        {!sgListsError && sgLists.length === 0 && !sgListsLoading && (
          <p className="text-[11px] text-gray-500">No lists found — make sure SendGrid is connected in Integrations.</p>
        )}
      </div>
    </div>
  );

  // ── HubSpot object type + segments + optional pipeline picker ──────────────
  const HubSpotPicker = () => (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white">Object Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['contacts', 'deals'] as const).map(type => (
            <button
              key={type}
              onClick={() => setConfig(p => ({ ...p, object_type: type }))}
              className={`p-3 rounded-lg border-2 text-[13px] font-medium capitalize transition-colors ${
                (config.object_type ?? 'contacts') === type
                  ? 'border-[#FFCE0A] bg-[#FFCE0A]/10 text-white'
                  : 'border-white/10 text-gray-400'
              }`}
            >
              {type === 'contacts' ? 'Contacts' : 'Deals'}
              <div className="text-[11px] font-normal mt-0.5 text-gray-500">
                {type === 'contacts' ? 'Agent emails as CRM contacts' : 'Listing as a deal record'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white">
          Contact List / Segment <span className="text-[11px] text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <select
            className="flex-1 border border-white/10 rounded-lg px-3 py-2 text-[13px] bg-[#2F2F2F] text-white"
            value={config.list_id ?? ''}
            onChange={e => setConfig(p => ({ ...p, list_id: e.target.value }))}
            disabled={hsSegmentsLoading}
          >
            <option value="">
              {hsSegmentsLoading ? 'Loading…' : hsSegments.length === 0 ? 'Click ↻ to load' : 'No list filter (all contacts)'}
            </option>
            {hsSegments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <LBButton variant="outline" size="sm" onClick={loadHsSegments} disabled={hsSegmentsLoading} title="Refresh">
            {hsSegmentsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </LBButton>
        </div>
        {hsSegmentsError && <p className="text-[12px] text-red-400">{hsSegmentsError}</p>}
        {!hsSegmentsError && hsSegments.length === 0 && !hsSegmentsLoading && (
          <p className="text-[11px] text-gray-500">No lists found — make sure HubSpot is connected in Integrations. • = dynamic list</p>
        )}
        {hsSegments.length > 0 && (
          <p className="text-[11px] text-gray-500">• = dynamic list. Leave blank to sync without list assignment.</p>
        )}
      </div>

      {hsPipelines.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-white">
            Pipeline <span className="text-[11px] text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 border border-white/10 rounded-lg px-3 py-2 text-[13px] bg-[#2F2F2F] text-white"
              value={config.pipeline_id ?? ''}
              onChange={e => setConfig(p => ({ ...p, pipeline_id: e.target.value }))}
            >
              <option value="">Default pipeline</option>
              {hsPipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <LBButton variant="outline" size="sm" onClick={loadHsPipelines} disabled={hsPipelinesLoading} title="Refresh">
              {hsPipelinesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </LBButton>
          </div>
        </div>
      )}
    </div>
  );

  // ── Mailchimp audience + tags picker (reused on both steps) ───────────────
  const AudiencePicker = () => (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white">
          Audience <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <select
            className="flex-1 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white"
            value={config.list_id ?? ''}
            onChange={e => setConfig(p => ({ ...p, list_id: e.target.value }))}
            disabled={audiencesLoading}
          >
            <option value="">
              {audiencesLoading ? 'Loading…' : audiences.length === 0 ? 'Click ↻ to load' : 'Select an audience…'}
            </option>
            {audiences.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <LBButton variant="outline" size="sm" onClick={loadAudiences} disabled={audiencesLoading} title="Refresh">
            {audiencesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </LBButton>
        </div>
        {audiencesError && <p className="text-[12px] text-red-400">{audiencesError}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-white">
          Tags <span className="text-[11px] text-gray-400 font-normal">(optional)</span>
        </label>
        <LBInput
          placeholder="listingbug, denver-agents"
          value={config.tags ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(p => ({ ...p, tags: e.target.value }))}
        />
        <p className="text-[11px] text-gray-500">Comma-separated. Applied to every contact synced.</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold text-white">
            {step === 'preview' ? 'Preview & Test' : 'Activate Automation'}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-gray-500">
            {step === 'preview' ? 'Review the payload and optionally send a real test before activating' : `Configure your ${destination?.name} settings`}
          </DialogDescription>
        </DialogHeader>

        {step === 'preview' ? (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
              <h3 className="text-[14px] font-bold text-white mb-3">Automation Summary</h3>
              <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                {[['Name', automationName], ['Search', searchName], ['Destination', destination?.name], ['Frequency', syncFrequency]].map(([label, value]) => (
                  <>
                    <span key={`l-${label}`} className="text-gray-500">{label}</span>
                    <span key={`v-${label}`} className="font-medium text-white text-right">{value}</span>
                  </>
                ))}
              </div>
            </div>

            {/* Payload preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-gray-400" />
                  <span className="text-[14px] font-bold text-white">Payload — {destination?.name}</span>
                </div>
                <span className="text-[11px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">sample data</span>
              </div>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-auto max-h-[260px] font-mono text-[11px]">
                <pre>{JSON.stringify(previewPayload, null, 2)}</pre>
              </div>
            </div>

            {/* Test section */}
            <div className="border border-gray-200 dark:border-white/10 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-[14px] font-bold text-white mb-1">Send Test</h3>
                <p className="text-[12px] text-gray-400">
                  Sends a real sample contact to {destination?.name}. Only shows success when {destination?.name} confirms receipt — no fake results.
                </p>
              </div>

              {isMailchimp && <AudiencePicker />}
              {isSendGrid && <SendGridPicker />}
              {isHubSpot && <HubSpotPicker />}

              {isMailchimp && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-[12px] text-amber-300">For PRICE, PROPTYPE, and BROKERAGE to sync, create matching merge fields in your Mailchimp audience settings first.</p>
                </div>
              )}

              {isSheets && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-[12px] text-blue-300">
                    You'll configure the Spreadsheet ID on the next step.{' '}
                    <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                      Create a new sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              )}

              {isTwilio && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-[12px] text-blue-300">You'll set your Twilio From Number (E.164 format, e.g. +15005550006) on the next step.</p>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <LBButton
                  onClick={handleSendTest}
                  disabled={testLoading || (isMailchimp && !config.list_id) || (isSendGrid && !config.list_id)}
                  size="sm"
                >
                  {testLoading
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending…</>
                    : testSent
                    ? <><CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-400" />Sent</>
                    : <><Play className="w-3.5 h-3.5 mr-1.5" />Send Test</>}
                </LBButton>
                {testSent && testDetail && (
                  <span className="text-[12px] text-green-400">✓ {testDetail}</span>
                )}
                {testSent && (
                  <button
                    onClick={() => { setTestSent(false); setTestDetail(null); setTestError(null); }}
                    className="text-[11px] text-gray-500 hover:text-gray-300 underline"
                  >
                    Send again
                  </button>
                )}
              </div>

              {testError && (
                <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 min-w-0">
                      {testError.split('\n').map((line, i) => (
                        <p key={i} className={`text-[12px] break-words ${i === 0 ? 'text-red-300 font-medium' : 'text-red-400/80 font-mono'}`}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-white/10">
              <LBButton variant="outline" onClick={onClose}>Cancel</LBButton>
              <LBButton onClick={() => setStep('activate')}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </LBButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-white">{destination?.name} Configuration</h3>

            {isMailchimp && (
              <>
                <AudiencePicker />
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-[12px] text-amber-300">For PRICE, PROPTYPE, and BROKERAGE to sync, create matching merge fields in your Mailchimp audience settings.</p>
                </div>
              </>
            )}

            {isSendGrid && <SendGridPicker />}
            {isHubSpot && <HubSpotPicker />}

            {!isMailchimp && !isSendGrid && !isHubSpot && (
              getFields().length > 0 ? (
                <div className="space-y-4">
                  {getFields().map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <LBInput
                        label={field.label}
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={config[field.key] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(p => ({ ...p, [field.key]: e.target.value }))}
                      />
                      {field.hint && <p className="text-[11px] text-gray-500">{field.hint}</p>}
                      {isSheets && field.key === 'spreadsheet_id' && (
                        <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1">
                          Create a new Google Sheet <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                  <p className="text-[13px] text-gray-500">No additional configuration required for {destination?.name}.</p>
                </div>
              )
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-white/10">
              <LBButton variant="outline" onClick={() => setStep('preview')}>Back</LBButton>
              <div className="flex gap-3">
                <LBButton variant="outline" onClick={handleReset}>Cancel</LBButton>
                <LBButton onClick={handleActivate} disabled={(isMailchimp && !config.list_id) || (isSendGrid && !config.list_id)}>
                  <Zap className="w-4 h-4 mr-2" />Activate
                </LBButton>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
