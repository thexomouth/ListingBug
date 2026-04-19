import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { CityAutocomplete } from '../CityAutocomplete';
import { formatSenderName } from '../../lib/senderName';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SearchCriteria {
  city: string;
  state: string;
  listing_type: string;
  property_type: string | null;
  days_old: number | null;
  price_min: number | null;
  price_max: number | null;
}

interface Send {
  id: string;
  agent_email: string;
  agent_name: string | null;
  agent_phone: string | null;
  listing_address: string | null;
  listing_city: string | null;
  listing_state: string | null;
  listing_price: number | null;
  listing_type: string | null;
  listing_property_type: string | null;
  listing_beds: number | null;
  listing_baths: number | null;
  listing_sqft: number | null;
  listing_brokerage: string | null;
  listing_mls_number: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  channel: string;
  campaign_replies: { id: string; replied_at: string }[];
}

interface Campaign {
  id: string;
  campaign_name: string;
  status: string;
  channel: string;
  subject: string | null;
  body: string;
  forward_to: string | null;
  drip_delay_minutes: number;
  city: string;
  state: string;
  created_at: string;
  campaign_search_criteria: SearchCriteria[];
  campaign_sends: Send[];
}

interface EditDraft {
  campaign_name: string;
  subject: string;
  body: string;
  forward_to: string;
  drip_delay_minutes: number;
  city: string;
  state: string;
  days_old: string;
  price_min: string;
  price_max: string;
  property_type: string;
}

const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhouse', 'Manufactured', 'Multi-Family', 'Apartment', 'Land'];
const VARS = ['{{agent_name}}', '{{address}}', '{{price}}', '{{city}}', '{{listing_date}}'];
const FROM_EMAIL_DISPLAY = 'hello@listingping.com';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderBodyPreview(text: string, city: string): string {
  let s = text
    .replace(/\{\{agent_name\}\}/g, '[AGENT NAME]')
    .replace(/\{\{address\}\}/g, '[LISTING ADDRESS]')
    .replace(/\{\{city\}\}/g, city || '[CITY]')
    .replace(/\{\{price\}\}/g, '[LISTING PRICE]')
    .replace(/\{\{listing_date\}\}/g, '[LISTING DATE]');
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline" target="_blank" rel="noopener noreferrer">${t}</a>`);
  s = s.replace(/\n/g, '<br>');
  return s;
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function statusBadge(status: string, hasReply: boolean) {
  if (hasReply) return { label: 'Replied', bg: '#dcfce7', color: '#15803d' };
  switch (status) {
    case 'sent':    return { label: 'Sent', bg: '#f3f4f6', color: '#6b7280' };
    case 'opened':  return { label: 'Opened', bg: '#eff6ff', color: '#1d4ed8' };
    case 'failed':  return { label: 'Failed', bg: '#fef2f2', color: '#dc2626' };
    case 'queued':  return { label: 'Queued', bg: '#f3f4f6', color: '#6b7280' };
    default:        return { label: status, bg: '#f3f4f6', color: '#6b7280' };
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------
function StatusToggle({ active, onChange }: { active: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none"
      style={{ background: active ? '#FFCE0A' : '#d1d5db' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: active ? 'translateX(16px)' : 'translateX(0px)' }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function V2Campaign() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [selectedSend, setSelectedSend] = useState<Send | null>(null);

  // Edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save as template
  const [templateModal, setTemplateModal] = useState({ open: false, name: '', saving: false, error: null as string | null, saved: false });

  // Test email modal
  const [testModal, setTestModal] = useState({ open: false, address: '', sending: false, sent: false, error: null as string | null });
  const [userContactName, setUserContactName] = useState<string | null>(null);
  const [userBusinessName, setUserBusinessName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const cursorPos = useRef(0);

  const loadCampaign = (id: string) =>
    supabase
      .from('campaigns')
      .select(`
        id, campaign_name, status, channel, subject, body, forward_to,
        drip_delay_minutes, created_at,
        campaign_search_criteria (
          city, state, listing_type, property_type, days_old, price_min, price_max
        ),
        campaign_sends (
          id, agent_email, agent_name, agent_phone,
          listing_address, listing_city, listing_state, listing_price,
          listing_type, listing_property_type, listing_beds, listing_baths,
          listing_sqft, listing_brokerage, listing_mls_number,
          status, error_message, sent_at, opened_at, clicked_at, channel,
          campaign_replies ( id, replied_at )
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setCampaign(data as Campaign);
        setIsLoading(false);
      });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { setIsLoading(false); return; }
    setCampaignId(id);
    loadCampaign(id);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase.from('users').select('business_name, contact_name').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setUserContactName(data.contact_name || null);
            setUserBusinessName(data.business_name || null);
          }
        });
    });
  }, []);

  const handleToggle = async (next: boolean) => {
    if (!campaign || isToggling) return;
    setIsToggling(true);
    const newStatus = next ? 'active' : 'paused';
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaign.id);
    setCampaign(c => c ? { ...c, status: newStatus } : c);
    setIsToggling(false);
  };

  const handleDelete = async () => {
    if (!campaign || isDeleting) return;
    setIsDeleting(true);
    await supabase.from('campaigns').delete().eq('id', campaign.id);
    window.location.href = '/v2/dashboard';
  };

  const handleSaveTemplate = async () => {
    if (!campaign || !templateModal.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setTemplateModal(m => ({ ...m, saving: true, error: null }));
    const { error } = await supabase.from('marketing_templates').insert({
      user_id: user.id,
      template_name: templateModal.name.trim(),
      channel: campaign.channel,
      subject: campaign.subject,
      body: campaign.body,
    });
    if (error) {
      setTemplateModal(m => ({ ...m, saving: false, error: error.message }));
    } else {
      setTemplateModal(m => ({ ...m, saving: false, saved: true }));
      setTimeout(() => setTemplateModal({ open: false, name: '', saving: false, error: null, saved: false }), 1500);
    }
  };

  const openEdit = () => {
    if (!campaign) return;
    const c = campaign.campaign_search_criteria?.[0];
    setEditDraft({
      campaign_name: campaign.campaign_name,
      subject: campaign.subject ?? '',
      body: campaign.body,
      forward_to: campaign.forward_to ?? '',
      drip_delay_minutes: campaign.drip_delay_minutes ?? 2,
      days_old: c?.days_old != null ? String(c.days_old) : '',
      price_min: c?.price_min != null ? String(c.price_min) : '',
      price_max: c?.price_max != null ? String(c.price_max) : '',
      property_type: c?.property_type ?? 'Single Family',
      city: c?.city ?? '',
      state: c?.state ?? '',
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const insertVar = (v: string) => {
    if (!editDraft) return;
    const pos = cursorPos.current;
    const newBody = editDraft.body.slice(0, pos) + v + editDraft.body.slice(pos);
    const newPos = pos + v.length;
    cursorPos.current = newPos;
    setEditDraft(d => d ? { ...d, body: newBody } : d);
    requestAnimationFrame(() => {
      const ta = bodyRef.current;
      if (ta) { ta.setSelectionRange(newPos, newPos); ta.focus(); }
    });
  };

  const handleSave = async () => {
    if (!campaign || !editDraft || !campaignId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const { error: campErr } = await supabase
        .from('campaigns')
        .update({
          campaign_name: editDraft.campaign_name.trim(),
          subject: editDraft.subject.trim() || null,
          body: editDraft.body,
          forward_to: editDraft.forward_to.trim() || null,
          drip_delay_minutes: Number(editDraft.drip_delay_minutes) || 2,
        })
        .eq('id', campaignId);
      if (campErr) throw new Error(campErr.message);

      const { error: critErr } = await supabase
        .from('campaign_search_criteria')
        .update({
          city: editDraft.city,
          state: editDraft.state,
          property_type: editDraft.property_type || null,
          days_old: editDraft.days_old ? parseInt(editDraft.days_old, 10) : null,
          price_min: editDraft.price_min ? parseInt(editDraft.price_min, 10) : null,
          price_max: editDraft.price_max ? parseInt(editDraft.price_max, 10) : null,
        })
        .eq('campaign_id', campaignId);
      if (critErr) throw new Error(critErr.message);

      setIsEditing(false);
      setIsLoading(true);
      await loadCampaign(campaignId);
    } catch (e: any) {
      setSaveError(e.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#FFCE0A', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Campaign not found.</div>
          <button
            onClick={() => { window.location.href = '/v2/dashboard'; }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------------------
  const sends = campaign.campaign_sends ?? [];
  const criteria = campaign.campaign_search_criteria?.[0];
  const isActive = campaign.status === 'active';

  const totalSent = sends.filter(s => s.status === 'sent' || s.status === 'opened' || s.status === 'replied').length;
  const totalOpened = sends.filter(s => s.opened_at !== null).length;
  const totalClicks = sends.filter(s => s.clicked_at !== null).length;
  const totalReplies = sends.reduce((acc, s) => acc + (s.campaign_replies?.length ?? 0), 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  const sortedSends = [...sends].sort((a, b) => {
    const at = a.sent_at ? new Date(a.sent_at).getTime() : 0;
    const bt = b.sent_at ? new Date(b.sent_at).getTime() : 0;
    return bt - at;
  });

  const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
  const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-[720px] mx-auto px-4 py-6">

        {/* Back link */}
        <button
          onClick={() => { window.location.href = '/v2/dashboard'; }}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-5 flex items-center gap-1"
        >
          ← Dashboard
        </button>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {campaign.campaign_name}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {criteria ? `${criteria.city}, ${criteria.state}` : '—'}
              {campaign.channel === 'sms' ? ' · SMS' : ' · Email'}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">{isActive ? 'On' : 'Off'}</span>
            <StatusToggle active={isActive} onChange={handleToggle} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {[
            { label: 'Sent', value: String(totalSent) },
            { label: 'Open rate', value: `${openRate}%` },
            { label: 'Clicks', value: String(totalClicks) },
            { label: 'Replies', value: String(totalReplies) },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
              <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{stat.label}</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white leading-none">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Campaign details */}
        <div className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 mb-6">
          <div className="font-bold text-[#342e37] dark:text-white mb-3">Campaign Overview</div>
          <div className="space-y-2">
            {[
              criteria && { label: 'Location', value: `${criteria.city}, ${criteria.state}` },
              criteria?.property_type && { label: 'Property type', value: criteria.property_type },
              criteria?.listing_type && { label: 'Listing type', value: criteria.listing_type },
              criteria?.days_old != null && { label: 'Days listed', value: String(criteria.days_old) },
              (criteria?.price_min || criteria?.price_max) && {
                label: 'Price range',
                value: `$${(criteria.price_min ?? 0).toLocaleString()} – $${(criteria.price_max ?? 0).toLocaleString()}`,
              },
              campaign.subject && { label: 'Subject', value: campaign.subject },
              { label: 'Reply-to', value: campaign.forward_to || '—' },
              { label: 'Created', value: formatDate(campaign.created_at) },
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-100 dark:border-white/10">
                <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium text-right max-w-[60%] truncate">{row.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={openEdit}
            className="mt-4 w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Edit campaign
          </button>

          <button
            onClick={() => setTemplateModal({ open: true, name: campaign.campaign_name, saving: false, error: null, saved: false })}
            className="mt-2 w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Save as template
          </button>

          {campaign.body && (
            <div className="mt-4">
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Message body</div>
              <div className="rounded-lg p-3 text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
                {campaign.body}
              </div>
              {campaign.channel === 'email' && (
                <button
                  onClick={() => setTestModal({ open: true, address: campaign.forward_to || '', sending: false, sent: false, error: null })}
                  className="mt-2 w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  Send test email
                </button>
              )}
            </div>
          )}
        </div>

        {/* Send activity */}
        <div className="mb-3">
          <div className="font-bold text-lg text-[#342e37] dark:text-white">Activity</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {totalSent} sent · {totalReplies} repl{totalReplies !== 1 ? 'ies' : 'y'}
          </div>
        </div>

        {sortedSends.length === 0 ? (
          <div className="bg-white dark:bg-[#2F2F2F] text-center py-12 rounded-lg border border-gray-200 dark:border-white/10">
            <div className="text-sm text-gray-600 dark:text-gray-400">No sends yet — the campaign will run tonight.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSends.map(send => {
              const hasReply = (send.campaign_replies?.length ?? 0) > 0;
              const badge = statusBadge(send.status, hasReply);
              return (
                <div
                  key={send.id}
                  onClick={() => setSelectedSend(send)}
                  className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-3.5 flex items-start gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-white/20 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: badge.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {send.agent_name || send.agent_email}
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {send.listing_address
                        ? `${send.listing_address}${send.listing_price ? ` · $${send.listing_price.toLocaleString()}` : ''}`
                        : send.agent_email}
                    </div>
                    {send.sent_at && (
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(send.sent_at)} at {formatTime(send.sent_at)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete campaign — own row at bottom */}
        <div className="mt-6 mb-2">
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Delete campaign
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Edit campaign modal                                                  */}
      {/* ------------------------------------------------------------------ */}
      {isEditing && editDraft && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-start sm:pt-6 justify-center"
          onClick={() => setIsEditing(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-lg bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10">
              <span className="font-semibold text-gray-900 dark:text-white">Edit campaign</span>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className={labelClass}>Campaign name</label>
                <input
                  className={inputClass}
                  value={editDraft.campaign_name}
                  onChange={e => setEditDraft(d => d ? { ...d, campaign_name: toTitleCase(e.target.value) } : d)}
                />
              </div>

              {campaign.channel === 'email' && (
                <div>
                  <label className={labelClass}>Subject line</label>
                  <input
                    className={inputClass}
                    value={editDraft.subject}
                    onChange={e => setEditDraft(d => d ? { ...d, subject: e.target.value } : d)}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Message body</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {VARS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVar(v)}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-400/20 transition-colors font-mono"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={bodyRef}
                  className={`${inputClass} min-h-[120px] resize-y`}
                  value={editDraft.body}
                  onChange={e => setEditDraft(d => d ? { ...d, body: e.target.value } : d)}
                  onSelect={e => { cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart; }}
                  onBlur={e => { cursorPos.current = e.target.selectionStart; }}
                />
              </div>

              <div>
                <label className={labelClass}>Reply-to email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={editDraft.forward_to}
                  onChange={e => setEditDraft(d => d ? { ...d, forward_to: e.target.value } : d)}
                />
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Search criteria</div>
                <div className="mb-3">
                  <label className={labelClass}>City</label>
                  <CityAutocomplete
                    value={editDraft.city}
                    stateValue={editDraft.state}
                    onSelect={(city, state) => setEditDraft(d => d ? { ...d, city, state } : d)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Property type</label>
                    <select
                      className={inputClass}
                      value={editDraft.property_type}
                      onChange={e => setEditDraft(d => d ? { ...d, property_type: e.target.value } : d)}
                    >
                      {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Days listed</label>
                    <input
                      className={inputClass}
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={editDraft.days_old}
                      onChange={e => setEditDraft(d => d ? { ...d, days_old: e.target.value } : d)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Min price</label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      placeholder="e.g. 200000"
                      value={editDraft.price_min}
                      onChange={e => setEditDraft(d => d ? { ...d, price_min: e.target.value } : d)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Max price</label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      placeholder="e.g. 800000"
                      value={editDraft.price_max}
                      onChange={e => setEditDraft(d => d ? { ...d, price_max: e.target.value } : d)}
                    />
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="text-sm text-red-600 dark:text-red-400">{saveError}</div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10 flex gap-2">
              {campaign?.channel === 'email' && (
                <button
                  onClick={() => setTestModal({ open: true, address: editDraft?.forward_to || '', sending: false, sent: false, error: null })}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Send test
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-[#342e37] transition-colors disabled:opacity-50"
                style={{ background: '#FFCE0A' }}
              >
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Send test email modal                                                */}
      {/* ------------------------------------------------------------------ */}
      {testModal.open && (() => {
        const fromName = formatSenderName(userContactName, userBusinessName);
        const emailData = editDraft || { subject: campaign?.subject || '', body: campaign?.body || '', city: criteria?.city || '' };
        const previewSubject = emailData.subject
          ? emailData.subject
              .replace(/\{\{agent_name\}\}/g, 'Sarah')
              .replace(/\{\{address\}\}/g, '1842 Maple St')
              .replace(/\{\{city\}\}/g, emailData.city || 'your city')
              .replace(/\{\{price\}\}/g, '$485,000')
              .replace(/\{\{listing_date\}\}/g, 'today')
          : '(no subject)';
        const sampleBody = emailData.body
          .replace(/\{\{agent_name\}\}/g, 'Sarah')
          .replace(/\{\{address\}\}/g, '1842 Maple St')
          .replace(/\{\{city\}\}/g, emailData.city || 'Austin')
          .replace(/\{\{price\}\}/g, '$485,000')
          .replace(/\{\{listing_date\}\}/g, 'today');
        const sampleBodyHtml = sampleBody
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline">${t}</a>`)
          .replace(/\n/g, '<br/>');
        const previewHtml = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:580px;color:#222">${sampleBodyHtml}</div>`;

        const handleSendTest = async () => {
          if (!testModal.address.trim()) return;
          setTestModal(m => ({ ...m, sending: true, error: null }));
          try {
            // Ensure we have a valid session before calling the edge function
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('Not authenticated. Please refresh the page and try again.');
            }

            const { error } = await supabase.functions.invoke('send-test-email', {
              body: {
                to: testModal.address.trim(),
                subject: emailData.subject,
                body: emailData.body,
                from_name: fromName,
                user_id: userId
              },
            });
            if (error) throw new Error(error.message);
            setTestModal(m => ({ ...m, sending: false, sent: true }));
          } catch (e: any) {
            setTestModal(m => ({ ...m, sending: false, error: e.message ?? 'Send failed' }));
          }
        };

        return (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => setTestModal(m => ({ ...m, open: false }))}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative w-full sm:max-w-lg bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
              style={{ maxHeight: '85svh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                <span className="font-semibold text-gray-900 dark:text-white">Send test email</span>
                <button
                  onClick={() => setTestModal(m => ({ ...m, open: false }))}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                >×</button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* From / Subject */}
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-14 shrink-0">From</span>
                    <span className="text-gray-700 dark:text-gray-300">{fromName} &lt;{FROM_EMAIL_DISPLAY}&gt;</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-14 shrink-0">Subject</span>
                    <span className="text-gray-700 dark:text-gray-300">{previewSubject}</span>
                  </div>
                </div>

                {/* Body preview */}
                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] p-4">
                  <div
                    className="text-sm text-gray-900 dark:text-white leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderBodyPreview(emailData.body, emailData.city) }}
                  />
                </div>

                {/* Address input / success */}
                {!testModal.sent ? (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Send to</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={testModal.address}
                      onChange={e => setTestModal(m => ({ ...m, address: e.target.value, error: null }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendTest(); }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]"
                    />
                    {testModal.error && (
                      <p className="text-xs text-red-500 mt-1">{testModal.error}</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    Test email sent to {testModal.address}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-5 pb-5 shrink-0">
                {!testModal.sent ? (
                  <>
                    <button
                      onClick={() => setTestModal(m => ({ ...m, open: false }))}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendTest}
                      disabled={testModal.sending || !testModal.address.trim()}
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-90"
                      style={{ background: '#FFCE0A', color: '#342e37' }}
                    >
                      {testModal.sending ? 'Sending…' : 'Send test'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setTestModal(m => ({ ...m, open: false }))}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* Send detail modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      {selectedSend && (() => {
        const send = selectedSend;
        const hasReply = (send.campaign_replies?.length ?? 0) > 0;
        const badge = statusBadge(send.status, hasReply);
        const isFailed = send.status === 'failed';
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectedSend(null)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative w-full sm:max-w-md bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {send.channel}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSend(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {isFailed && send.error_message && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3">
                    <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Send failed</div>
                    <div className="text-sm text-red-700 dark:text-red-300 font-mono break-all">{send.error_message}</div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Agent</div>
                  <div className="space-y-1.5">
                    {send.agent_name && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{send.agent_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{send.agent_email}</span>
                    </div>
                    {send.agent_phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{send.agent_phone}</span>
                      </div>
                    )}
                    {send.listing_brokerage && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Brokerage</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{send.listing_brokerage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {send.listing_address && (
                  <div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Listing</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Address</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                          {send.listing_address}{send.listing_city ? `, ${send.listing_city}` : ''}{send.listing_state ? `, ${send.listing_state}` : ''}
                        </span>
                      </div>
                      {send.listing_price != null && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">${send.listing_price.toLocaleString()}</span>
                        </div>
                      )}
                      {send.listing_property_type && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{send.listing_property_type}</span>
                        </div>
                      )}
                      {(send.listing_beds != null || send.listing_baths != null) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Bed / Bath</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {send.listing_beds ?? '—'} bd · {send.listing_baths ?? '—'} ba
                          </span>
                        </div>
                      )}
                      {send.listing_sqft != null && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Sq ft</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{send.listing_sqft.toLocaleString()}</span>
                        </div>
                      )}
                      {send.listing_mls_number && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">MLS #</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{send.listing_mls_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Timeline</div>
                  <div className="space-y-1.5">
                    {send.sent_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Sent</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(send.sent_at)} at {formatTime(send.sent_at)}</span>
                      </div>
                    )}
                    {send.opened_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Opened</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(send.opened_at)} at {formatTime(send.opened_at)}</span>
                      </div>
                    )}
                    {send.clicked_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Clicked</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(send.clicked_at)} at {formatTime(send.clicked_at)}</span>
                      </div>
                    )}
                    {hasReply && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Replied</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatDate(send.campaign_replies[0].replied_at)} at {formatTime(send.campaign_replies[0].replied_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* Save as template modal                                               */}
      {/* ------------------------------------------------------------------ */}
      {templateModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setTemplateModal(m => ({ ...m, open: false }))}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-sm bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-xl p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="font-semibold text-gray-900 dark:text-white mb-1">Save as template</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Name this template to load it into future campaigns</div>
            <label className={labelClass}>Template name</label>
            <input
              className={inputClass}
              value={templateModal.name}
              onChange={e => setTemplateModal(m => ({ ...m, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); }}
              placeholder="e.g. Denver Email Outreach"
              autoFocus
            />
            {templateModal.error && <p className="text-xs text-red-500 mt-1">{templateModal.error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSaveTemplate}
                disabled={templateModal.saving || !templateModal.name.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                style={{ background: '#FFCE0A', color: '#342e37' }}
              >
                {templateModal.saved ? 'Saved!' : templateModal.saving ? 'Saving…' : 'Save template'}
              </button>
              <button
                onClick={() => setTemplateModal(m => ({ ...m, open: false }))}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
