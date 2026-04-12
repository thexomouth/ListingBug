import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CampaignSend {
  id: string;
  status: string;
  opened_at: string | null;
  sent_at: string | null;
  listing_address: string | null;
  campaign_replies: { id: string }[];
}

interface CampaignSearchCriteria {
  city: string;
  state: string;
  listing_type: string;
  property_type: string | null;
}

interface Campaign {
  id: string;
  campaign_name: string;
  status: string;
  channel: string;
  body: string;
  created_at: string;
  campaign_search_criteria: CampaignSearchCriteria[];
  campaign_sends: CampaignSend[];
}

interface CampaignStats {
  sent: number;
  openRate: number;
  replies: number;
  lastSendLabel: string;
  lastAddress: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function computeStats(sends: CampaignSend[]): CampaignStats {
  const sent = sends.filter(s => s.status === 'sent' || s.status === 'replied').length;
  const opened = sends.filter(s => s.opened_at !== null).length;
  const replies = sends.reduce((acc, s) => acc + (s.campaign_replies?.length ?? 0), 0);
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;

  const sentSends = sends
    .filter(s => s.sent_at)
    .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime());

  let lastSendLabel = '—';
  let lastAddress: string | null = null;

  if (sentSends.length > 0) {
    const latest = sentSends[0];
    lastAddress = latest.listing_address;
    const diffMs = Date.now() - new Date(latest.sent_at!).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) lastSendLabel = 'Today';
    else if (diffDays === 1) lastSendLabel = 'Yesterday';
    else lastSendLabel = `${diffDays} days ago`;
  }

  return { sent, openRate, replies, lastSendLabel, lastAddress };
}

// ---------------------------------------------------------------------------
// Plan limits
// ---------------------------------------------------------------------------
const PLAN_LIMITS: Record<string, number> = {
  trial: 100,
  home: 2500,
  market: 5000,
  region: 10000,
  starter: 2500,
  pro: 5000,
  enterprise: 10000,
};

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------
function StatusToggle({ active, onChange }: { active: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={e => { e.stopPropagation(); onChange(!active); }}
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
export function V2Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [planLimit, setPlanLimit] = useState(100);
  const [stripePeriodEnd, setStripePeriodEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('plan, stripe_subscription_end')
        .eq('id', user.id)
        .single();

      if (userData) {
        const plan = (userData.plan || 'trial').toLowerCase();
        setPlanLimit(PLAN_LIMITS[plan] ?? 100);
        setStripePeriodEnd(userData.stripe_subscription_end || null);
      }

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select(`
          id, campaign_name, status, channel, body, created_at,
          campaign_search_criteria ( city, state, listing_type, property_type ),
          campaign_sends (
            id, status, opened_at, sent_at, listing_address,
            campaign_replies ( id )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignData) setCampaigns(campaignData as Campaign[]);

      if (userData?.stripe_subscription_end) {
        const periodEnd = new Date(userData.stripe_subscription_end);
        const periodStart = new Date(periodEnd);
        periodStart.setMonth(periodStart.getMonth() - 1);
        const { data: usageLogs } = await supabase
          .from('usage_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('logged_at', periodStart.toISOString());
        setUsageCount(usageLogs?.length ?? 0);
      } else {
        const { count } = await supabase
          .from('usage_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setUsageCount(count ?? 0);
      }

      setIsLoading(false);
    };
    load();
  }, []);

  const navigate = (path: string) => { window.location.href = path; };

  const handleToggle = async (campaign: Campaign, next: boolean) => {
    setTogglingId(campaign.id);
    const newStatus = next ? 'active' : 'paused';
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaign.id);
    setCampaigns(cs => cs.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
    setTogglingId(null);
  };

  // ---------------------------------------------------------------------------
  // Render
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

  const usagePct = planLimit > 0 ? Math.min((usageCount / planLimit) * 100, 100) : 0;
  const isNearLimit = usagePct >= 80;
  const periodEndLabel = stripePeriodEnd
    ? new Date(stripePeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-[720px] mx-auto px-4 py-6">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your active campaigns and send activity</p>
          </div>
          <button
            onClick={() => navigate('/v2/newcampaign')}
            className="px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            + New campaign
          </button>
        </div>

        {/* Usage bar */}
        <div className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Account usage this period</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{usageCount.toLocaleString()} / {planLimit.toLocaleString()} messages</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usagePct}%`, background: isNearLimit ? '#EF9F27' : '#FFCE0A' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {periodEndLabel ? `Resets ${periodEndLabel}` : 'All time'} · {Math.max(0, planLimit - usageCount).toLocaleString()} remaining
            </span>
            {isNearLimit && (
              <span className="text-[11px] font-medium" style={{ color: '#BA7517' }}>Approaching limit</span>
            )}
          </div>
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-12 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">No campaigns yet</div>
            <button
              onClick={() => navigate('/v2/newcampaign')}
              className="px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: '#FFCE0A', color: '#342e37' }}
            >
              + Create your first campaign
            </button>
          </div>
        ) : (
          <>
            {/* Section heading */}
            <div className="mb-3">
              <div className="font-bold text-lg text-[#342e37] dark:text-white">My Campaigns</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} · {campaigns.filter(c => c.status === 'active').length} active
              </div>
            </div>

            {campaigns.map(campaign => {
              const criteria = campaign.campaign_search_criteria?.[0];
              const stats = computeStats(campaign.campaign_sends ?? []);
              const isActive = campaign.status === 'active';
              const isToggling = togglingId === campaign.id;

              return (
                <div
                  key={campaign.id}
                  onClick={() => navigate(`/v2/campaign?id=${campaign.id}`)}
                  className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 mb-2.5 cursor-pointer transition-colors hover:border-[#FFCE0A]/60"
                >
                  {/* Card top */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{campaign.campaign_name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {criteria
                          ? `${criteria.city}, ${criteria.state}${criteria.property_type ? ` · ${criteria.property_type}` : ''} · ${criteria.listing_type}`
                          : '—'}
                      </div>
                    </div>
                    {/* On/off toggle */}
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{isActive ? 'On' : 'Off'}</span>
                      <StatusToggle
                        active={isActive}
                        onChange={next => !isToggling && handleToggle(campaign, next)}
                      />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Sent', value: String(stats.sent), sub: 'all time' },
                      { label: 'Open rate', value: `${stats.openRate}%`, sub: '' },
                      { label: 'Replies', value: String(stats.replies), sub: '' },
                      { label: 'Last send', value: stats.lastSendLabel, sub: stats.lastAddress ?? '' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-lg px-2.5 py-2 bg-gray-50 dark:bg-[#1a1a1a]">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{stat.label}</div>
                        <div
                          className="font-medium text-gray-900 dark:text-white leading-none"
                          style={{ fontSize: stat.label === 'Last send' ? '13px' : '16px' }}
                        >
                          {stat.value}
                        </div>
                        {stat.sub && (
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{stat.sub}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-200 dark:border-white/10">
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 flex-1 mr-3 truncate">
                      {campaign.body
                        ? `"${campaign.body.slice(0, 80)}${campaign.body.length > 80 ? '...' : ''}"`
                        : '—'}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">View →</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
