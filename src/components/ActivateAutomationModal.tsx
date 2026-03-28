/**
 * ACTIVATE AUTOMATION MODAL
 * Goes straight to config — no preview/test step.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { LBButton } from './design-system/LBButton';
import { LBInput } from './design-system/LBInput';
import { Zap, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
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

export function ActivateAutomationModal({
  isOpen, onClose, automationName, searchName, destination,
  fieldMappings, syncFrequency, onActivate,
}: ActivateAutomationModalProps) {
  const [config, setConfig] = useState<Record<string, string>>({});

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

  const loadAudiences = useCallback(async () => {
    setAudiencesLoading(true);
    setAudiencesError(null);
    try {
      const token = await getFreshToken();
      if (!token) { setAudiencesError('Not signed in.'); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ integration: 'mailchimp' }) }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setAudiencesError(`Could not load audiences. ${data.error ?? `HTTP ${res.status}`}`);
      } else {
        setAudiences(data.options ?? []);
      }
    } catch (e: any) {
      setAudiencesError(`Network error: ${e.message}`);
    } finally {
      setAudiencesLoading(false);
    }
  }, [getFreshToken]);

  const loadSgLists = useCallback(async () => {
    setSgListsLoading(true);
    setSgListsError(null);
    try {
      const token = await getFreshToken();
      if (!token) { setSgListsError('Not signed in.'); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ integration: 'sendgrid' }) }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setSgListsError(`Could not load SendGrid lists. ${data.error ?? `HTTP ${res.status}`}`);
      } else {
        setSgLists(data.options ?? []);
      }
    } catch (e: any) {
      setSgListsError(`Network error: ${e.message}`);
    } finally {
      setSgListsLoading(false);
    }
  }, [getFreshToken]);

  const loadHsPipelines = useCallback(async () => {
    setHsPipelinesLoading(true);
    try {
      const token = await getFreshToken();
      if (!token) return;
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ integration: 'hubspot', resource: 'pipelines' }) }
      );
      const data = await res.json();
      if (res.ok && data.options) setHsPipelines(data.options);
    } catch { /* pipelines are optional */ }
    finally { setHsPipelinesLoading(false); }
  }, [getFreshToken]);

  const loadHsSegments = useCallback(async () => {
    setHsSegmentsLoading(true);
    setHsSegmentsError(null);
    try {
      const token = await getFreshToken();
      if (!token) { setHsSegmentsError('Not signed in.'); return; }
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/get-integration-options',
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ integration: 'hubspot', resource: 'segments' }) }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setHsSegmentsError(`Could not load HubSpot lists. ${data.error ?? `HTTP ${res.status}`}`);
      } else {
        setHsSegments(data.options ?? []);
      }
    } catch (e: any) {
      setHsSegmentsError(`Network error: ${e.message}`);
    } finally {
      setHsSegmentsLoading(false);
    }
  }, [getFreshToken]);

  useEffect(() => {
    if (isOpen && isMailchimp && audiences.length === 0) loadAudiences();
  }, [isOpen, isMailchimp]);

  useEffect(() => {
    if (isOpen && isSendGrid && sgLists.length === 0) loadSgLists();
  }, [isOpen, isSendGrid]);

  useEffect(() => {
    if (isOpen && isHubSpot && hsPipelines.length === 0) loadHsPipelines();
    if (isOpen && isHubSpot && hsSegments.length === 0) loadHsSegments();
  }, [isOpen, isHubSpot]);

  const handleReset = () => {
    setConfig({});
    onClose();
  };

  const getFields = (): Array<{ key: string; label: string; type?: string; placeholder: string; required?: boolean; hint?: string }> => {
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

  const handleActivate = () => {
    if (isMailchimp && !config.list_id) { toast.error('Select an audience first.'); return; }
    if (isSendGrid && !config.list_id) { toast.error('Select a SendGrid list first.'); return; }
    const missing = getFields().filter(f => f.required && !config[f.key]);
    if (missing.length) { toast.error(`Fill in: ${missing.map(f => f.label).join(', ')}`); return; }
    onActivate(config);
    toast.success('Automation activated!');
    handleReset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold text-white">Activate Automation</DialogTitle>
          <DialogDescription className="text-[14px] text-gray-500">
            Configure your {destination?.name} settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <h3 className="text-[15px] font-bold text-white">{destination?.name} Configuration</h3>

          {/* ── Mailchimp ── */}
          {isMailchimp && (
            <>
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
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3">
                <p className="text-[12px] text-amber-300">For PRICE, PROPTYPE, and BROKERAGE to sync, create matching merge fields in your Mailchimp audience settings.</p>
              </div>
            </>
          )}

          {/* ── SendGrid ── */}
          {isSendGrid && (
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
          )}

          {/* ── HubSpot ── */}
          {isHubSpot && (
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
                  <p className="text-[11px] text-gray-500">No lists found — make sure HubSpot is connected in Integrations.</p>
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
          )}

          {/* ── All other integrations (fields from getFields) ── */}
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
            <LBButton variant="outline" onClick={handleReset}>Cancel</LBButton>
            <LBButton onClick={handleActivate} disabled={(isMailchimp && !config.list_id) || (isSendGrid && !config.list_id)}>
              <Zap className="w-4 h-4 mr-2" />Activate
            </LBButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
