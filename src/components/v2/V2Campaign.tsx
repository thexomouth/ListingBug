import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
  listing_address: string | null;
  listing_city: string | null;
  listing_price: number | null;
  status: string;
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
  created_at: string;
  campaign_search_criteria: SearchCriteria[];
  campaign_sends: Send[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { setIsLoading(false); return; }
    setCampaignId(id);

    supabase
      .from('campaigns')
      .select(`
        id, campaign_name, status, channel, subject, body, forward_to,
        drip_delay_minutes, created_at,
        campaign_search_criteria (
          city, state, listing_type, property_type, days_old, price_min, price_max
        ),
        campaign_sends (
          id, agent_email, agent_name, listing_address, listing_city,
          listing_price, status, sent_at, opened_at, clicked_at, channel,
          campaign_replies ( id, replied_at )
        )
      `)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setCampaign(data as Campaign);
        setIsLoading(false);
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

  // Sort sends newest first
  const sortedSends = [...sends].sort((a, b) => {
    const at = a.sent_at ? new Date(a.sent_at).getTime() : 0;
    const bt = b.sent_at ? new Date(b.sent_at).getTime() : 0;
    return bt - at;
  });

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

          {/* Edit button */}
          <button
            onClick={() => { window.location.href = `/v2/editcampaign?id=${campaign.id}`; }}
            className="mt-4 w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Edit campaign
          </button>

          {/* Message body preview */}
          {campaign.body && (
            <div className="mt-4">
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Message body</div>
              <div className="rounded-lg p-3 text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
                {campaign.body}
              </div>
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
                  className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-3.5 flex items-start gap-3"
                >
                  {/* Status dot */}
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

      </div>
    </div>
  );
}
