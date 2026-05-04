import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { formatSenderName } from '../../lib/senderName';
import { Pencil, Check, AlertCircle, Send as SendIcon, MessageSquare, Reply, MousePointer } from 'lucide-react';
import { EmailPerformanceTimeline, type RangeKey } from './EmailPerformanceTimeline';
import { AgentActivityModal } from './AgentActivityModal';
import { CityAutocomplete } from '../CityAutocomplete';

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
  preview_text: string | null;
  body: string;
  forward_to: string | null;
  drip_delay_minutes: number;
  sender_id: string | null;
  city: string;
  state: string;
  created_at: string;
  campaign_search_criteria: SearchCriteria[];
  campaign_sends: Send[];
}

interface Draft {
  campaign_name: string;
  subject: string;
  preview_text: string;
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

const RANGE_CYCLE: RangeKey[] = [7, 14, 30, 0];
const RANGE_PILL: Record<RangeKey, string> = { 7: '7d', 14: '14d', 30: '30d', 0: 'all' };

const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhouse', 'Manufactured', 'Multi-Family', 'Apartment', 'Land'];
const VARS = ['{{agent_name}}', '{{address}}', '{{price}}', '{{city}}', '{{listing_date}}'];
const FROM_EMAIL_DISPLAY = 'hello@listingping.com';

function senderLabel(s: { integration_id: string; from_email: string }): string {
  const type = s.integration_id === 'gmail' ? 'Gmail'
    : s.integration_id === 'outlook' ? 'Outlook'
    : 'SMTP';
  return `${type}: ${s.from_email}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getWindowedSends(sends: Send[], days: RangeKey): Send[] {
  if (days === 0) return sends;
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return sends.filter(s => s.sent_at && new Date(s.sent_at) >= cutoff);
}

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

function activityDate(send: Send): string | null {
  const reply = send.campaign_replies?.[0];
  if (reply?.replied_at) return reply.replied_at;
  if (send.clicked_at) return send.clicked_at;
  if (send.opened_at) return send.opened_at;
  return send.sent_at;
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

  // Autosave
  const [draft, setDraft] = useState<Draft | null>(null);
  type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stat bubble cycling
  const [currentRange, setCurrentRange] = useState<RangeKey>(7);
  const [statOpacity, setStatOpacity] = useState(1);
  const [userPinned, setUserPinned] = useState(false);

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
  const [senderInfo, setSenderInfo] = useState<{ display_name: string; from_email: string; from_name?: string } | null>(null);
  const [allSenders, setAllSenders] = useState<Array<{ id: string; integration_id: string; from_email: string; display_name: string }>>([]);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const cursorPos = useRef(0);

  const loadCampaign = (id: string) =>
    supabase
      .from('campaigns')
      .select(`
        id, campaign_name, status, channel, subject, preview_text, body, forward_to,
        drip_delay_minutes, sender_id, created_at,
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
      supabase
        .from('integration_connections')
        .select('id, integration_id, from_email, display_name')
        .eq('user_id', user.id)
        .eq('is_sender', true)
        .then(({ data }) => { if (data) setAllSenders(data as any); });
    });
  }, []);

  // Initialize draft when campaign first loads
  useEffect(() => {
    if (!campaign) return;
    const c = campaign.campaign_search_criteria?.[0];
    setDraft({
      campaign_name: campaign.campaign_name,
      subject: campaign.subject ?? '',
      preview_text: campaign.preview_text ?? '',
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
  }, [campaign?.id]);

  // Auto-resize body textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto';
      bodyRef.current.style.height = bodyRef.current.scrollHeight + 'px';
    }
  }, [draft?.body]);

  useEffect(() => {
    if (!campaign?.sender_id) { setSenderInfo(null); return; }
    supabase
      .from('integration_connections')
      .select('display_name, from_email, from_name')
      .eq('id', campaign.sender_id)
      .single()
      .then(({ data }) => { if (data) setSenderInfo(data as any); });
  }, [campaign?.sender_id]);

  // ---------------------------------------------------------------------------
  // Bubble range cycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (userPinned) return;
    let idx = 0, alive = true;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!alive) return;
      setCurrentRange(RANGE_CYCLE[idx]);
      setStatOpacity(1);
      t = setTimeout(() => {
        if (!alive) return;
        setStatOpacity(0);
        t = setTimeout(() => {
          if (!alive) return;
          idx = (idx + 1) % RANGE_CYCLE.length;
          tick();
        }, 500);
      }, 5500);
    };
    tick();
    return () => { alive = false; clearTimeout(t); };
  }, [userPinned]);

  const handleRangeChange = (range: RangeKey) => {
    setCurrentRange(range);
    setUserPinned(true);
  };

  // ---------------------------------------------------------------------------
  // Autosave
  // ---------------------------------------------------------------------------
  const persistDraft = async (d: Draft) => {
    if (!campaignId) return;
    setSaveStatus('saving');
    try {
      const { error: campErr } = await supabase
        .from('campaigns')
        .update({
          campaign_name: d.campaign_name.trim(),
          subject: d.subject.trim() || null,
          preview_text: d.preview_text.trim() || null,
          body: d.body,
          forward_to: d.forward_to.trim() || null,
          drip_delay_minutes: Number(d.drip_delay_minutes) || 2,
        })
        .eq('id', campaignId);
      if (campErr) throw new Error(campErr.message);

      const { error: critErr } = await supabase
        .from('campaign_search_criteria')
        .update({
          city: d.city,
          state: d.state,
          property_type: d.property_type || null,
          days_old: d.days_old ? parseInt(d.days_old, 10) : null,
          price_min: d.price_min ? parseInt(d.price_min, 10) : null,
          price_max: d.price_max ? parseInt(d.price_max, 10) : null,
        })
        .eq('campaign_id', campaignId);
      if (critErr) throw new Error(critErr.message);

      setCampaign(c => c ? {
        ...c,
        campaign_name: d.campaign_name.trim(),
        subject: d.subject.trim() || null,
        preview_text: d.preview_text.trim() || null,
        body: d.body,
        forward_to: d.forward_to.trim() || null,
        drip_delay_minutes: Number(d.drip_delay_minutes) || 2,
      } : c);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  // Debounced update — use for text inputs (1 s idle)
  const updateText = (updates: Partial<Draft>) => {
    if (!draft) return;
    const next = { ...draft, ...updates };
    setDraft(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persistDraft(next), 1000);
  };

  // Immediate update — use for selects and city autocomplete
  const updateImmediate = (updates: Partial<Draft>) => {
    if (!draft) return;
    const next = { ...draft, ...updates };
    setDraft(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    persistDraft(next);
  };

  const insertVar = (v: string) => {
    if (!draft) return;
    const pos = cursorPos.current;
    const newBody = draft.body.slice(0, pos) + v + draft.body.slice(pos);
    const newPos = pos + v.length;
    cursorPos.current = newPos;
    updateText({ body: newBody });
    requestAnimationFrame(() => {
      const ta = bodyRef.current;
      if (ta) { ta.setSelectionRange(newPos, newPos); ta.focus(); }
    });
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleToggle = async (next: boolean) => {
    if (!campaign || isToggling) return;
    setIsToggling(true);
    const newStatus = next ? 'active' : 'paused';
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaign.id);
    setCampaign(c => c ? { ...c, status: newStatus } : c);
    setIsToggling(false);
  };

  const handleSenderChange = async (senderId: string) => {
    if (!campaignId) return;
    await supabase.from('campaigns').update({ sender_id: senderId }).eq('id', campaignId);
    setCampaign(c => c ? { ...c, sender_id: senderId } : c);
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
      subject: draft?.subject ?? campaign.subject,
      body: draft?.body ?? campaign.body,
    });
    if (error) {
      setTemplateModal(m => ({ ...m, saving: false, error: error.message }));
    } else {
      setTemplateModal(m => ({ ...m, saving: false, saved: true }));
      setTimeout(() => setTemplateModal({ open: false, name: '', saving: false, error: null, saved: false }), 1500);
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
          <a
            href="/v2/dashboard"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to dashboard
          </a>
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
  const totalReplies = sends.reduce((acc, s) => acc + (s.campaign_replies?.length ?? 0), 0);

  const sortedSends = [...sends].sort((a, b) => {
    const at = a.sent_at ? new Date(a.sent_at).getTime() : 0;
    const bt = b.sent_at ? new Date(b.sent_at).getTime() : 0;
    return bt - at;
  });

  const fromName = senderInfo?.from_name || (senderInfo ? formatSenderName(userContactName, userBusinessName) : null);
  const fromEmail = senderInfo?.from_email ?? null;
  const senderMailbox = senderInfo?.display_name ?? null;

  // Windowed stats for animated bubbles
  const windowedSends = getWindowedSends(sends, currentRange);
  const wsSent = windowedSends.filter(s => s.status === 'sent' || s.status === 'opened' || s.status === 'replied').length;
  const wsOpens = windowedSends.filter(s => s.opened_at !== null).length;
  const wsClicks = windowedSends.filter(s => s.clicked_at !== null).length;
  const wsReplies = windowedSends.reduce((acc, s) => acc + (s.campaign_replies?.length ?? 0), 0);
  const wsOpenRate = wsSent > 0 ? Math.round((wsOpens / wsSent) * 100) : 0;
  const bubbleTransition = 'opacity 0.5s ease, border-color 0.15s ease, transform 0.15s ease';

  const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';
  const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50';

  // Shared classes for inline editable inputs in the overview rows
  const rowInputClass = 'text-sm text-gray-900 dark:text-white font-medium text-right bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-white/20 focus:border-[#FFCE0A] dark:focus:border-[#FFCE0A] rounded-md px-2 py-0.5 outline-none transition-colors';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-12">

        {/* Back link */}
        <a
          href="/v2/dashboard"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-5 flex items-center gap-1 no-underline"
        >
          ← Dashboard
        </a>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 mr-4">
            {/* Editable campaign name */}
            <div className="group flex items-center gap-2 mb-1">
              <input
                value={draft?.campaign_name ?? campaign.campaign_name}
                onChange={e => updateText({ campaign_name: e.target.value })}
                className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-transparent focus:border-[#FFCE0A] outline-none transition-colors w-full min-w-0"
              />
              <Pencil className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {draft?.city || criteria?.city || '—'}{draft?.state ? `, ${draft.state}` : criteria?.state ? `, ${criteria.state}` : ''}
              {campaign.channel === 'sms' ? ' · SMS' : ' · Email'}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 mt-1">
            {/* Save status indicator */}
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Saving…</span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="w-3 h-3" /> Save failed
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{isActive ? 'On' : 'Off'}</span>
              <StatusToggle active={isActive} onChange={handleToggle} />
            </div>
          </div>
        </div>

        {/* Stat bubbles */}
        <div className="flex gap-2 md:gap-3 mb-1">

          {/* Sent */}
          <div
            className="relative flex-1 border hover:border-[3px] border-gray-200 dark:border-white/10 hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] rounded-lg bg-white dark:bg-transparent p-3 md:p-4 flex flex-col items-center hover:scale-[1.04]"
            style={{ opacity: statOpacity, transition: bubbleTransition }}
          >
            <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
              {RANGE_PILL[currentRange]}
            </span>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
              <SendIcon className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-0.5">{wsSent.toLocaleString()}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Sent</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 min-h-[14px]">
              {wsSent > 0 ? `${wsOpenRate}% open rate` : '—'}
            </div>
          </div>

          {/* Opens */}
          <div
            className="relative flex-1 border hover:border-[3px] border-gray-200 dark:border-white/10 hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] rounded-lg bg-white dark:bg-transparent p-3 md:p-4 flex flex-col items-center hover:scale-[1.04]"
            style={{ opacity: statOpacity, transition: bubbleTransition }}
          >
            <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
              {RANGE_PILL[currentRange]}
            </span>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-0.5">{wsOpens.toLocaleString()}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Opens</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 min-h-[14px]">
              {wsSent > 0 ? `${wsOpenRate}% of sent` : '—'}
            </div>
          </div>

          {/* Replies */}
          <div
            className="relative flex-1 border hover:border-[3px] border-gray-200 dark:border-white/10 hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] rounded-lg bg-white dark:bg-transparent p-3 md:p-4 flex flex-col items-center hover:scale-[1.04]"
            style={{ opacity: statOpacity, transition: bubbleTransition }}
          >
            <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
              {RANGE_PILL[currentRange]}
            </span>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
              <Reply className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-0.5">{wsReplies.toLocaleString()}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Replies</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 min-h-[14px]">
              {wsSent > 0 ? `${Math.round((wsReplies / wsSent) * 100)}% reply rate` : '—'}
            </div>
          </div>

          {/* Clicks */}
          <div
            className="relative flex-1 border hover:border-[3px] border-gray-200 dark:border-white/10 hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] rounded-lg bg-white dark:bg-transparent p-3 md:p-4 flex flex-col items-center hover:scale-[1.04]"
            style={{ opacity: statOpacity, transition: bubbleTransition }}
          >
            <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
              {RANGE_PILL[currentRange]}
            </span>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
              <MousePointer className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-[#342e37] dark:text-white mb-0.5">{wsClicks.toLocaleString()}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Clicks</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 min-h-[14px]">
              {wsSent > 0 ? `${Math.round((wsClicks / wsSent) * 100)}% click rate` : '—'}
            </div>
          </div>
        </div>

        {/* Range label */}
        <div className="flex justify-end mb-4" style={{ opacity: statOpacity, transition: 'opacity 0.5s ease' }}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wide uppercase">
            {currentRange === 0 ? 'All-Time' : `Last ${currentRange} Days`}
          </span>
        </div>

        {/* Main two-column container */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">

          {/* Left: Campaign Overview */}
          <div className="lg:w-[360px] shrink-0 bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 flex flex-col">
            <div className="font-bold text-[#342e37] dark:text-white mb-3">Campaign Overview</div>
            <div className="space-y-0 flex-1">

              {/* Location (City + State) */}
              {draft && (
                <div className="group flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/10 gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Location</span>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <CityAutocomplete
                      value={draft.city}
                      stateValue={draft.state}
                      onSelect={(city, state) => updateImmediate({ city, state })}
                      className="flex-1 min-w-0"
                    />
                    <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
                  </div>
                </div>
              )}

              {/* Listing type — read-only */}
              {criteria?.listing_type && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-white/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Listing type</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{criteria.listing_type}</span>
                </div>
              )}

              {/* Property type */}
              {draft && (
                <div className="group flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/10 gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Property type</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <select
                      value={draft.property_type}
                      onChange={e => updateImmediate({ property_type: e.target.value })}
                      className={`${rowInputClass} cursor-pointer`}
                    >
                      {PROPERTY_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                    <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
                  </div>
                </div>
              )}

              {/* Days listed */}
              {draft && (
                <div className="group flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/10 gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Days listed</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="number"
                      min="1"
                      value={draft.days_old}
                      onChange={e => updateText({ days_old: e.target.value })}
                      placeholder="e.g. 1"
                      className={`${rowInputClass} w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
                  </div>
                </div>
              )}

              {/* Price range */}
              {draft && (
                <div className="group flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/10 gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Price range</span>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.price_min}
                      onChange={e => updateText({ price_min: e.target.value })}
                      placeholder="Min"
                      className={`${rowInputClass} w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <span className="text-xs text-gray-400">–</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.price_max}
                      onChange={e => updateText({ price_max: e.target.value })}
                      placeholder="Max"
                      className={`${rowInputClass} w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
                  </div>
                </div>
              )}

              {/* From name — read-only */}
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-white/10">
                <span className="text-sm text-gray-600 dark:text-gray-400">From name</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium text-right max-w-[60%] truncate">{fromName || '—'}</span>
              </div>

              {/* From email — read-only */}
              {fromEmail != null && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-white/10">
                  <span className="text-sm text-gray-600 dark:text-gray-400">From email</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium text-right max-w-[60%] truncate">{fromEmail}</span>
                </div>
              )}

              {/* Sending mailbox — editable dropdown */}
              <div className="group flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/10 gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Sending mailbox</span>
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {allSenders.length === 0 ? (
                    <span className="text-sm text-gray-900 dark:text-white font-medium text-right truncate">{senderMailbox || '—'}</span>
                  ) : (
                    <select
                      value={campaign.sender_id || ''}
                      onChange={e => handleSenderChange(e.target.value)}
                      className={`${rowInputClass} cursor-pointer min-w-0 max-w-full flex-1`}
                    >
                      {allSenders.map(s => (
                        <option key={s.id} value={s.id}>{senderLabel(s)}</option>
                      ))}
                    </select>
                  )}
                  <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
                </div>
              </div>

              {/* Reply-to */}
              {draft && (
                <div className="group flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/10 gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">Reply-to</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input
                      type="email"
                      value={draft.forward_to}
                      onChange={e => updateText({ forward_to: e.target.value })}
                      placeholder="you@example.com"
                      className={`${rowInputClass} w-40`}
                    />
                    <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-30 group-hover:opacity-70 shrink-0 transition-opacity" />
                  </div>
                </div>
              )}

              {/* Created — read-only */}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">{formatDate(campaign.created_at)}</span>
              </div>

            </div>

            {/* Save As Template button pushed to bottom */}
            <button
              onClick={() => setTemplateModal({ open: true, name: draft?.campaign_name ?? campaign.campaign_name, saving: false, error: null, saved: false })}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-[#FFCE0A] hover:text-[#342e37] hover:border-[#FFCE0A] transition-colors"
            >
              Save As Template
            </button>
          </div>

          {/* Right: Message details */}
          <div className="flex-1 bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 flex flex-col">
            <div className="font-bold text-[#342e37] dark:text-white mb-3">Message Details</div>

            {campaign.channel === 'email' && draft && (
              <>
                <div className="mb-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Subject</div>
                  <input
                    value={draft.subject}
                    onChange={e => updateText({ subject: e.target.value })}
                    placeholder="Email subject line"
                    className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#FFCE0A] transition-colors"
                  />
                </div>
                <div className="mb-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Preview text <span className="text-gray-300 dark:text-gray-600">(shown after subject in inbox)</span></div>
                  <input
                    value={draft.preview_text}
                    onChange={e => updateText({ preview_text: e.target.value })}
                    placeholder="Short teaser shown in inbox..."
                    className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#FFCE0A] transition-colors"
                  />
                </div>
              </>
            )}

            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Body</div>

            {/* Variable insertion chips */}
            <div className="flex flex-wrap gap-1 mb-2">
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

            {draft ? (
              <textarea
                ref={bodyRef}
                value={draft.body}
                onChange={e => updateText({ body: e.target.value })}
                onSelect={e => { cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart; }}
                onBlur={e => { cursorPos.current = e.target.selectionStart; }}
                className="w-full rounded-lg p-3 text-sm text-gray-900 dark:text-white leading-relaxed bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#FFCE0A] transition-colors resize-none overflow-hidden"
                style={{ minHeight: 140 }}
              />
            ) : (
              <div className="rounded-lg p-3 text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex-1">
                {campaign.body || '—'}
              </div>
            )}

            {campaign.channel === 'email' && (
              <button
                onClick={() => setTestModal({ open: true, address: draft?.forward_to || campaign.forward_to || '', sending: false, sent: false, error: null })}
                className="mt-2 w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-[#FFCE0A] hover:text-[#342e37] hover:border-[#FFCE0A] transition-colors"
              >
                Send Test Email
              </button>
            )}
          </div>
        </div>

        {/* Send activity */}
        <div className="mb-3">
          <div className="font-bold text-lg text-[#342e37] dark:text-white">Activity</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {totalSent} sent · {totalReplies} repl{totalReplies !== 1 ? 'ies' : 'y'}
          </div>
        </div>

        {/* Email performance timeline */}
        <EmailPerformanceTimeline
          campaigns={[campaign]}
          currentRange={currentRange}
          onRangeChange={handleRangeChange}
          subtitle="This campaign"
        />

        {sortedSends.length === 0 ? (
          <div className="bg-white dark:bg-[#2F2F2F] text-center py-12 rounded-lg border border-gray-200 dark:border-white/10 mb-8">
            <div className="text-sm text-gray-600 dark:text-gray-400">No sends yet — the campaign will run tonight.</div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10 mb-8">
            <table className="w-full text-sm">
              <thead className="bg-white dark:bg-[#2F2F2F] border-b border-gray-200 dark:border-white/10">
                <tr>
                  <th className="h-10 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agent</th>
                  <th className="hidden sm:table-cell h-10 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Listing</th>
                  <th className="hidden sm:table-cell h-10 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</th>
                  <th className="h-10 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Activity</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {sortedSends.map(send => {
                  const hasReply = (send.campaign_replies?.length ?? 0) > 0;
                  const badge = statusBadge(send.status, hasReply);
                  return (
                    <tr
                      key={send.id}
                      onClick={() => setSelectedSend(send)}
                      className="group border-b border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 group-hover:py-4 transition-[padding] duration-150">
                        <div className="font-medium text-gray-900 dark:text-white leading-tight">
                          {send.agent_name || send.agent_email}
                        </div>
                        {send.agent_name && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{send.agent_email}</div>
                        )}
                      </td>
                      <td className="hidden sm:table-cell py-3 px-3 group-hover:py-4 transition-[padding] duration-150 text-gray-700 dark:text-gray-300">
                        {send.listing_address || '—'}
                      </td>
                      <td className="hidden sm:table-cell py-3 px-3 group-hover:py-4 transition-[padding] duration-150 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {send.listing_price != null ? `$${send.listing_price.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-3 group-hover:py-4 transition-[padding] duration-150">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 group-hover:py-4 transition-[padding] duration-150 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {(() => { const d = activityDate(send); return d ? `${formatDate(d)} · ${formatTime(d)}` : '—'; })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete campaign */}
        <div className="mb-2">
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
      {/* Send test email modal                                                */}
      {/* ------------------------------------------------------------------ */}
      {testModal.open && (() => {
        const senderDisplayName = formatSenderName(userContactName, userBusinessName);
        const emailData = draft || { subject: campaign?.subject || '', body: campaign?.body || '', city: criteria?.city || '' };
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('Not authenticated. Please refresh the page and try again.');
            }

            const { error } = await supabase.functions.invoke('send-test-email', {
              body: {
                to: testModal.address.trim(),
                subject: emailData.subject,
                body: emailData.body,
                from_name: senderDisplayName,
                user_id: userId
              },
            });
            if (error) throw new Error(error.message);
            setTestModal(m => ({ ...m, sending: false, sent: true }));
          } catch (e: any) {
            setTestModal(m => ({ ...m, sending: false, error: e.message ?? 'Send failed' }));
          }
        };

        return createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            onClick={() => setTestModal(m => ({ ...m, open: false }))}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative w-full sm:max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl overflow-hidden flex flex-col"
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
                    <span className="text-gray-700 dark:text-gray-300">{senderDisplayName} &lt;{FROM_EMAIL_DISPLAY}&gt;</span>
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
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
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
        , document.body);
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* Send detail modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      {selectedSend && campaign && (
        <AgentActivityModal
          send={selectedSend}
          campaign={{
            campaign_name: campaign.campaign_name,
            channel: campaign.channel,
            subject: campaign.subject,
            body: campaign.body,
            city: criteria?.city ?? '',
            state: criteria?.state ?? '',
          }}
          onClose={() => setSelectedSend(null)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Save as template modal                                               */}
      {/* ------------------------------------------------------------------ */}
      {templateModal.open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setTemplateModal(m => ({ ...m, open: false }))}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-sm bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl p-5"
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
      , document.body)}
    </div>
  );
}
