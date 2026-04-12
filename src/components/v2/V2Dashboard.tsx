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

  // Most recent sent_at
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
// Plan limits — TODO: wire to Stripe product metadata when billing is live
// ---------------------------------------------------------------------------
const PLAN_LIMITS: Record<string, number> = {
  trial: 100,
  home: 2500,
  market: 5000,
  region: 10000,
  // V1 plan names for backward compat
  starter: 2500,
  pro: 5000,
  enterprise: 10000,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function V2Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [planLimit, setPlanLimit] = useState(100);
  const [stripePeriodEnd, setStripePeriodEnd] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      setUserId(user.id);

      // Load user plan + stripe period
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

      // Load campaigns with sends + replies
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

      // Usage this billing period
      if (userData?.stripe_subscription_end) {
        // Derive period start: subtract 1 month from period end
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
        // No Stripe yet — count all usage_logs for this user
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#F3C302', borderTopColor: 'transparent' }}
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
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-[720px] mx-auto px-4 py-6">

        {/* Top bar */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-lg font-medium text-foreground">My campaigns</div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {campaigns.filter(c => c.status === 'active').length} active
            </div>
          </div>
          <button
            onClick={() => navigate('/v2/newcampaign')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#F3C302', color: '#2c2600' }}
          >
            + New campaign
          </button>
        </div>

        {/* Usage bar */}
        <div
          className="rounded-xl border p-4 mb-5"
          style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
        >
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium text-foreground">Account usage this period</span>
            <span className="text-sm text-muted-foreground">{usageCount.toLocaleString()} / {planLimit.toLocaleString()} messages</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usagePct}%`, background: isNearLimit ? '#EF9F27' : '#F3C302' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-muted-foreground/60">
              {periodEndLabel ? `Resets ${periodEndLabel}` : 'All time'} · {Math.max(0, planLimit - usageCount).toLocaleString()} remaining
            </span>
            {isNearLimit && (
              <span className="text-[11px] font-medium" style={{ color: '#BA7517' }}>
                Approaching limit
              </span>
            )}
          </div>
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-sm text-muted-foreground mb-4">No campaigns yet</div>
            <button
              onClick={() => navigate('/v2/newcampaign')}
              className="px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#F3C302', color: '#2c2600' }}
            >
              + Create your first campaign
            </button>
          </div>
        ) : (
          <>
            <div className="text-sm font-medium text-foreground mb-2.5">
              {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            </div>
            {campaigns.map(campaign => {
              const criteria = campaign.campaign_search_criteria?.[0];
              const stats = computeStats(campaign.campaign_sends ?? []);
              const isSelected = selectedId === campaign.id;

              return (
                <div
                  key={campaign.id}
                  onClick={() => setSelectedId(isSelected ? null : campaign.id)}
                  className="rounded-xl border p-4 mb-2.5 cursor-pointer transition-all"
                  style={{
                    borderColor: isSelected ? '#F3C302' : 'hsl(var(--border) / 0.4)',
                    borderWidth: isSelected ? '1.5px' : '0.5px',
                    background: 'hsl(var(--background))',
                  }}
                >
                  {/* Card top */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <div className="text-sm font-medium text-foreground">{campaign.campaign_name}</div>
                      <div className="text-xs text-muted-foreground/60 mt-0.5">
                        {criteria
                          ? `${criteria.city}, ${criteria.state}${criteria.property_type ? ` · ${criteria.property_type}` : ''} · ${criteria.listing_type}`
                          : '—'}
                      </div>
                    </div>
                    <span
                      className="text-[11px] px-2.5 py-0.5 rounded-full shrink-0 ml-2"
                      style={
                        campaign.status === 'active'
                          ? { background: '#F3C302', color: '#2c2600' }
                          : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '0.5px solid hsl(var(--border))' }
                      }
                    >
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Sent', value: String(stats.sent), sub: 'all time' },
                      { label: 'Open rate', value: `${stats.openRate}%`, sub: '' },
                      { label: 'Replies', value: String(stats.replies), sub: '' },
                      { label: 'Last send', value: stats.lastSendLabel, sub: stats.lastAddress ?? '' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-lg px-2.5 py-2" style={{ background: 'hsl(var(--muted))' }}>
                        <div className="text-[10px] text-muted-foreground/60 mb-0.5">{stat.label}</div>
                        <div
                          className="font-medium text-foreground leading-none"
                          style={{ fontSize: stat.label === 'Last send' ? '13px' : '16px' }}
                        >
                          {stat.value}
                        </div>
                        {stat.sub && (
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{stat.sub}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card footer */}
                  <div
                    className="flex items-center justify-between mt-2.5 pt-2.5 border-t"
                    style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
                  >
                    <div
                      className="text-[11px] text-muted-foreground/60 flex-1 mr-3 truncate"
                    >
                      {campaign.body
                        ? `"${campaign.body.slice(0, 80)}${campaign.body.length > 80 ? '...' : ''}"`
                        : '—'}
                    </div>
                    <div className="flex gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/v2/newcampaign?campaign_id=${campaign.id}`)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit →
                      </button>
                      <button
                        onClick={() => navigate(`/v2/campaign?id=${campaign.id}`)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Activity →
                      </button>
                    </div>
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
