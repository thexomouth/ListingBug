import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Send, MessageSquare, Zap, Reply, AlertTriangle, X, Trophy, MousePointer2 } from 'lucide-react';
import { normalizePlan, PLAN_CONFIG, canActivateCampaign, type PlanType } from '../utils/planLimits';
import { EmailPerformanceTimeline, type RangeKey } from './EmailPerformanceTimeline';
import { buildGmailAuthUrl } from '../../utils/gmailOAuth';
import { buildOutlookAuthUrl } from '../../utils/outlookOAuth';
import { AgentActivityModal } from './AgentActivityModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CampaignSend {
  id: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  sent_at: string | null;
  listing_address: string | null;
  listing_city: string | null;
  listing_state: string | null;
  listing_price: number | null;
  listing_type: string | null;
  listing_property_type: string | null;
  listing_beds: number | null;
  listing_baths: number | null;
  listing_sqft: number | null;
  listing_mls_number: string | null;
  listing_brokerage: string | null;
  agent_name: string | null;
  agent_email: string | null;
  agent_phone: string | null;
  error_message: string | null;
  campaign_replies: { id: string; replied_at: string }[];
}

interface AgentSend {
  send: CampaignSend & { agent_email: string; channel: string };
  campaign: { campaign_name: string; channel: string; subject: string | null; body: string; city: string; state: string };
}

interface AgentRow {
  key: string;
  agentName: string;
  agentEmail: string | null;
  brokerage: string | null;
  sent: number;
  opens: number;
  replies: number;
  recentSends: AgentSend[];
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
  subject: string | null;
  body: string;
  created_at: string;
  campaign_search_criteria: CampaignSearchCriteria[];
  campaign_sends: CampaignSend[];
}

interface CampaignStats {
  sent: number;
  opens: number;
  clicks: number;
  openRate: number;
  replies: number;
  lastSendLabel: string;
  lastAddress: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RANGE_CYCLE: RangeKey[] = [7, 14, 30, 0];
const RANGE_PILL: Record<RangeKey, string> = { 7: '7d', 14: '14d', 30: '30d', 0: 'all' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function computeStats(sends: CampaignSend[]): CampaignStats {
  const sent = sends.filter(s => s.status === 'sent' || s.status === 'replied').length;
  const opens = sends.filter(s => s.opened_at !== null).length;
  const clicks = sends.filter(s => s.clicked_at !== null).length;
  const replies = sends.reduce((acc, s) => acc + (s.campaign_replies?.length ?? 0), 0);
  const openRate = sent > 0 ? Math.round((opens / sent) * 100) : 0;

  const sentSends = sends
    .filter(s => s.sent_at)
    .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime());

  let lastSendLabel = '—';
  let lastAddress: string | null = null;

  if (sentSends.length > 0) {
    const latest = sentSends[0];
    lastAddress = latest.listing_address;
    const diffDays = Math.floor((Date.now() - new Date(latest.sent_at!).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) lastSendLabel = 'Today';
    else if (diffDays === 1) lastSendLabel = 'Yesterday';
    else lastSendLabel = `${diffDays} days ago`;
  }

  return { sent, opens, clicks, openRate, replies, lastSendLabel, lastAddress };
}

function getWindowSends(campaigns: Campaign[], days: RangeKey): CampaignSend[] {
  if (days === 0) return campaigns.flatMap(c => c.campaign_sends ?? []);
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return campaigns.flatMap(c =>
    (c.campaign_sends ?? []).filter(s => s.sent_at && new Date(s.sent_at) >= cutoff)
  );
}

function buildLeaderboard(campaigns: Campaign[]): AgentRow[] {
  const map = new Map<string, AgentRow>();
  for (const campaign of campaigns) {
    const criteria = campaign.campaign_search_criteria?.[0];
    const campaignCtx = {
      campaign_name: campaign.campaign_name,
      channel: campaign.channel,
      subject: campaign.subject ?? null,
      body: campaign.body,
      city: criteria?.city ?? '',
      state: criteria?.state ?? '',
    };
    for (const s of (campaign.campaign_sends ?? [])) {
      if (!s.agent_name && !s.agent_email) continue;
      const key = s.agent_email || s.agent_name!;
      if (!map.has(key)) {
        map.set(key, {
          key,
          agentName: s.agent_name || s.agent_email!,
          agentEmail: s.agent_email,
          brokerage: s.listing_brokerage,
          sent: 0, opens: 0, replies: 0,
          recentSends: [],
        });
      }
      const row = map.get(key)!;
      const wasSent = s.status === 'sent' || s.status === 'opened' || s.status === 'replied';
      if (wasSent) row.sent++;
      if (s.opened_at) row.opens++;
      row.replies += s.campaign_replies?.length ?? 0;
      if (!row.brokerage && s.listing_brokerage) row.brokerage = s.listing_brokerage;
      row.recentSends.push({
        send: { ...s, agent_email: s.agent_email ?? '', channel: campaign.channel },
        campaign: campaignCtx,
      });
    }
  }
  for (const row of map.values()) {
    row.recentSends.sort((a, b) => {
      const at = a.send.sent_at ? new Date(a.send.sent_at).getTime() : 0;
      const bt = b.send.sent_at ? new Date(b.send.sent_at).getTime() : 0;
      return bt - at;
    });
    row.recentSends = row.recentSends.slice(0, 6);
  }
  return Array.from(map.values()).sort((a, b) => b.sent - a.sent);
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
      onClick={e => { e.stopPropagation(); e.preventDefault(); onChange(!active); }}
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
const PENDING_ONBOARDING_KEY = 'lb_pending_onboarding';

interface ConnectionIssue {
  connection_id: string;
  provider: string;
  email: string;
  issue: 'needs_reauth' | 'token_refresh_failed';
}

export function V2Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [planLimit, setPlanLimit] = useState(100);
  const [userPlan, setUserPlan] = useState<PlanType>('trial');
  const [stripePeriodEnd, setStripePeriodEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [connectionIssues, setConnectionIssues] = useState<ConnectionIssue[]>([]);
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set());
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);
  const [expandedAgentKey, setExpandedAgentKey] = useState<string | null>(null);
  const [selectedAgentSend, setSelectedAgentSend] = useState<AgentSend | null>(null);

  // Range state — shared between bubbles and timeline
  const [currentRange, setCurrentRange] = useState<RangeKey>(7);
  const [statOpacity, setStatOpacity] = useState(1);
  const [userPinned, setUserPinned] = useState(false);

  // ---------------------------------------------------------------------------
  // Bubble range cycle: 7d → 14d → 30d → all time, every 6s, with 0.5s fade
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (userPinned) return;

    let idx = 0;
    let alive = true;
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

  // Called by the timeline range buttons — pins the cycle
  const handleRangeChange = (range: RangeKey) => {
    setCurrentRange(range);
    setUserPinned(true);
  };

  // ---------------------------------------------------------------------------
  // Claim pending onboarding campaign
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const claimPending = async () => {
      const raw = localStorage.getItem(PENDING_ONBOARDING_KEY);
      if (!raw) return;
      let pending: any;
      try { pending = JSON.parse(raw); } catch { localStorage.removeItem(PENDING_ONBOARDING_KEY); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { businessInfo, searchCriteria, messageInfo, smsConfig } = pending;

        await supabase.from('users').upsert({
          id: user.id,
          business_name: businessInfo.business_name,
          contact_name: businessInfo.contact_name,
          forward_to: businessInfo.forward_to,
          service_type: Array.isArray(businessInfo.service_type)
            ? businessInfo.service_type.join(',')
            : businessInfo.service_type,
          mailing_address: businessInfo.mailing_address ?? '',
        });

        const campaignName = searchCriteria.city
          ? `${searchCriteria.city} - ${messageInfo.campaign_name}`
          : messageInfo.campaign_name;

        const { data: campaign, error: campaignErr } = await supabase
          .from('campaigns')
          .insert({
            user_id: user.id,
            campaign_name: campaignName,
            status: 'active',
            channel: messageInfo.channel,
            sender_type: 'default',
            subject: messageInfo.subject,
            body: messageInfo.body,
            forward_to: businessInfo.forward_to,
            drip_delay_minutes: 2,
          })
          .select()
          .single();

        if (campaignErr || !campaign) throw new Error(campaignErr?.message || 'Failed to create campaign');

        const daysOldNum = typeof searchCriteria.days_old === 'string'
          ? parseInt(searchCriteria.days_old, 10) || 1
          : searchCriteria.days_old;

        await supabase.from('campaign_search_criteria').insert({
          campaign_id: campaign.id,
          city: searchCriteria.city,
          state: searchCriteria.state,
          listing_type: searchCriteria.listing_type,
          active_status: 'Active',
          days_old: daysOldNum,
          price_min: searchCriteria.price_min,
          price_max: searchCriteria.price_max,
          property_type: searchCriteria.property_type,
          year_built_min: searchCriteria.year_built_min,
          year_built_max: searchCriteria.year_built_max,
        });

        if (messageInfo.channel === 'sms' && smsConfig) {
          await supabase.from('campaign_sms_config').insert({
            campaign_id: campaign.id,
            twilio_from_number: smsConfig.twilio_from_number,
            forward_to_phone: smsConfig.forward_to_phone,
          });
        }

        await supabase.functions.invoke('send-campaign-emails', {
          body: { campaign_id: campaign.id },
        });

        localStorage.removeItem(PENDING_ONBOARDING_KEY);
      } catch (err) {
        console.error('Failed to claim pending onboarding campaign:', err);
      }
    };
    claimPending();
  }, []);

  // ---------------------------------------------------------------------------
  // Data load
  // ---------------------------------------------------------------------------
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
        const plan = normalizePlan(userData.plan);
        setUserPlan(plan);
        setPlanLimit(PLAN_CONFIG[plan].messagesPerMonth);
        setStripePeriodEnd(userData.stripe_subscription_end || null);
      }

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select(`
          id, campaign_name, status, channel, subject, body, created_at,
          campaign_search_criteria ( city, state, listing_type, property_type ),
          campaign_sends (
            id, status, opened_at, clicked_at, sent_at, error_message,
            listing_address, listing_city, listing_state, listing_price,
            listing_type, listing_property_type, listing_beds, listing_baths,
            listing_sqft, listing_mls_number, listing_brokerage,
            agent_name, agent_email, agent_phone,
            campaign_replies ( id, replied_at )
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

  // ---------------------------------------------------------------------------
  // OAuth health check — runs in background after data loads
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isLoading) return;
    const check = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-oauth-health');
        if (!error && data && !data.healthy && Array.isArray(data.issues)) {
          setConnectionIssues(data.issues);
        }
      } catch {
        // Health check is best-effort — never block the dashboard
      }
    };
    check();
  }, [isLoading]);

  const navigate = (path: string) => { window.location.href = path; };

  const handleToggle = async (campaign: Campaign, next: boolean) => {
    if (next) {
      const currentActive = campaigns.filter(c => c.status === 'active' && c.id !== campaign.id).length;
      const { allowed, reason } = canActivateCampaign(userPlan, currentActive);
      if (!allowed) {
        toast.error(reason ?? 'Campaign limit reached', { description: 'Pause an active campaign or upgrade your plan.' });
        return;
      }
    }
    setTogglingId(campaign.id);
    const newStatus = next ? 'active' : 'paused';
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', campaign.id);
    setCampaigns(cs => cs.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
    setTogglingId(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const leaderboard = useMemo(() => buildLeaderboard(campaigns), [campaigns]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center">
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

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  // Aggregate stats for the current time window
  const ws = computeStats(getWindowSends(campaigns, currentRange));
  const replyRate = ws.sent > 0 ? Math.round((ws.replies / ws.sent) * 100) : 0;

  const bubbleTransition = 'opacity 0.5s ease, transform 0.3s ease, box-shadow 0.3s ease';

  const leaderboardVisible = leaderboardExpanded ? leaderboard : leaderboard.slice(0, 10);

  const handleReconnect = async (provider: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const url = provider === 'gmail'
        ? await buildGmailAuthUrl(user.id)
        : await buildOutlookAuthUrl(user.id);
      window.location.href = url;
    } catch (err) {
      console.error('[V2Dashboard] Reconnect failed:', err);
    }
  };

  const visibleIssues = connectionIssues.filter(i => !dismissedIssues.has(i.connection_id));

  return (
    <>
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">

        {/* OAuth health banners */}
        {visibleIssues.map(issue => (
          <div
            key={issue.connection_id}
            className="flex items-start gap-3 mb-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {issue.provider === 'smtp' ? 'SMTP connection' : issue.provider === 'gmail' ? 'Gmail' : 'Outlook'} needs to be reconnected
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {issue.email} · Your campaigns won't send until this is fixed
              </p>
            </div>
            {issue.provider !== 'smtp' && (
              <button
                onClick={() => handleReconnect(issue.provider)}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                style={{ background: '#FFCE0A', color: '#342e37' }}
              >
                Reconnect
              </button>
            )}
            {issue.provider === 'smtp' && (
              <a
                href="/v2/setup"
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md transition-colors no-underline"
                style={{ background: '#FFCE0A', color: '#342e37' }}
              >
                Fix in Setup
              </a>
            )}
            <button
              onClick={() => setDismissedIssues(s => new Set([...s, issue.connection_id]))}
              className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your campaign activity and messaging performance</p>
          </div>
          <a
            href="/v2/newcampaign"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shrink-0 no-underline"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            + New Campaign
          </a>
        </div>

        {/* My Campaigns section heading — outside two-column flex */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">My Campaigns</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} · {activeCampaigns} active
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Two-column main section                                           */}
        {/* Left: campaigns list | Right: Stat bubbles + Timeline            */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">

          {/* LEFT — campaigns list */}
          <div className="flex-1 min-w-0">
            {campaigns.length === 0 ? (
              <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]">
                  <Zap className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
                </div>
                <h3 className="font-bold text-lg text-gray-600 dark:text-white mb-2">No campaigns yet</h3>
                <p className="text-sm text-gray-500 dark:text-[#EBF2FA] mb-6">Create your first campaign to start reaching out to listing owners</p>
                <button
                  onClick={() => navigate('/v2/newcampaign')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
                  style={{ background: '#FFCE0A', color: '#342e37' }}
                >
                  + Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {campaigns.map(campaign => {
                  const criteria = campaign.campaign_search_criteria?.[0];
                  const stats = computeStats(campaign.campaign_sends ?? []);
                  const isActive = campaign.status === 'active';
                  const isToggling = togglingId === campaign.id;

                  return (
                    <a
                      key={campaign.id}
                      href={`/v2/campaign?id=${campaign.id}`}
                      className="block bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 no-underline"
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="text-base font-semibold text-gray-900 dark:text-white">{campaign.campaign_name}</div>
                          {criteria?.city && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {criteria.city}{criteria.state ? `, ${criteria.state}` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{isActive ? 'On' : 'Off'}</span>
                          <StatusToggle
                            active={isActive}
                            onChange={next => !isToggling && handleToggle(campaign, next)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Sent',      value: String(stats.sent),      sub: '' },
                          { label: 'Opens',     value: String(stats.opens),     sub: '' },
                          { label: 'Clicks',    value: String(stats.clicks),    sub: '' },
                          { label: 'Last send', value: stats.lastSendLabel,     sub: stats.lastAddress ?? '' },
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

                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT — Stat bubbles + Timeline */}
          <div className="lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col gap-4">

            {/* Stat bubbles */}
            <div className="flex gap-2">
              {/* Sent */}
              <div
                className="relative flex-1 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#2F2F2F] p-3 flex flex-col items-center hover:shadow-xl hover:-translate-y-1"
                style={{ opacity: statOpacity, transition: bubbleTransition }}
              >
                <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
                  {RANGE_PILL[currentRange]}
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-[#1a1a1a] flex items-center justify-center mb-2">
                  <Send className="w-4 h-4 text-amber-600 dark:text-[#FFCE0A]" />
                </div>
                <div className="text-xl font-bold text-[#342e37] dark:text-white mb-0.5">{ws.sent.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Sent</div>
              </div>

              {/* Opens */}
              <div
                className="relative flex-1 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#2F2F2F] p-3 flex flex-col items-center hover:shadow-xl hover:-translate-y-1"
                style={{ opacity: statOpacity, transition: bubbleTransition }}
              >
                <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
                  {RANGE_PILL[currentRange]}
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-[#1a1a1a] flex items-center justify-center mb-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-[#FFCE0A]" />
                </div>
                <div className="text-xl font-bold text-[#342e37] dark:text-white mb-0.5">{ws.opens.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Opens</div>
              </div>

              {/* Clicks */}
              <div
                className="relative flex-1 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#2F2F2F] p-3 flex flex-col items-center hover:shadow-xl hover:-translate-y-1"
                style={{ opacity: statOpacity, transition: bubbleTransition }}
              >
                <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
                  {RANGE_PILL[currentRange]}
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-[#1a1a1a] flex items-center justify-center mb-2">
                  <MousePointer2 className="w-4 h-4 text-amber-600 dark:text-[#FFCE0A]" />
                </div>
                <div className="text-xl font-bold text-[#342e37] dark:text-white mb-0.5">{ws.clicks.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Clicks</div>
              </div>

              {/* Replies */}
              <div
                className="relative flex-1 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#2F2F2F] p-3 flex flex-col items-center hover:shadow-xl hover:-translate-y-1"
                style={{ opacity: statOpacity, transition: bubbleTransition }}
              >
                <span className="absolute top-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400">
                  {RANGE_PILL[currentRange]}
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-[#1a1a1a] flex items-center justify-center mb-2">
                  <Reply className="w-4 h-4 text-amber-600 dark:text-[#FFCE0A]" />
                </div>
                <div className="text-xl font-bold text-[#342e37] dark:text-white mb-0.5">{ws.replies.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-center leading-tight">Replies</div>
              </div>
            </div>

            {/* Email performance timeline */}
            <EmailPerformanceTimeline
              campaigns={campaigns}
              currentRange={currentRange}
              onRangeChange={handleRangeChange}
              hideHeader
            />
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Agent Leaderboard                                                  */}
        {/* ---------------------------------------------------------------- */}
        {leaderboard.length > 0 && (
          <div className="mt-2 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agent Leaderboard</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {leaderboard.length} agent{leaderboard.length !== 1 ? 's' : ''} reached · ordered by messages sent
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden mb-2">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="h-9 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-8">#</th>
                    <th className="h-9 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agent</th>
                    <th className="hidden sm:table-cell h-9 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Brokerage</th>
                    <th className="h-9 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent</th>
                    <th className="hidden sm:table-cell h-9 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Opens</th>
                    <th className="hidden sm:table-cell h-9 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Replies</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardVisible.map((agent, idx) => {
                    const isExpanded = expandedAgentKey === agent.key;
                    return (
                      <React.Fragment key={agent.key}>
                        <tr
                          onClick={() => setExpandedAgentKey(isExpanded ? null : agent.key)}
                          className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 hover:outline hover:outline-2 hover:outline-[#FFCE0A] hover:drop-shadow-lg transition-all duration-300 cursor-pointer"
                        >
                          <td className="py-2.5 px-3 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-gray-900 dark:text-white leading-tight truncate max-w-[160px]">
                              {agent.agentName}
                            </div>
                            {agent.agentEmail && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{agent.agentEmail}</div>
                            )}
                          </td>
                          <td className="hidden sm:table-cell py-2.5 px-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                            {agent.brokerage || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                            {agent.sent}
                          </td>
                          <td className="hidden sm:table-cell py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                            {agent.opens}
                          </td>
                          <td className="hidden sm:table-cell py-2.5 px-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                            {agent.replies}
                          </td>
                        </tr>
                        {isExpanded && agent.recentSends.length > 0 && (
                          <tr key={`${agent.key}-expanded`} className="border-b border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02]">
                            <td colSpan={6} className="px-3 py-3">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-2">Recent listings</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {agent.recentSends.map((as) => {
                                  const hasReply = (as.send.campaign_replies?.length ?? 0) > 0;
                                  const statusColor = hasReply
                                    ? { bg: '#dcfce7', color: '#15803d' }
                                    : as.send.opened_at
                                    ? { bg: '#dbeafe', color: '#1d4ed8' }
                                    : as.send.status === 'sent'
                                    ? { bg: '#f3f4f6', color: '#374151' }
                                    : { bg: '#fef9c3', color: '#854d0e' };
                                  const statusLabel = hasReply ? 'Replied' : as.send.opened_at ? 'Opened' : as.send.status === 'sent' ? 'Sent' : as.send.status;
                                  return (
                                    <button
                                      key={as.send.id}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setSelectedAgentSend(as); }}
                                      className="text-left rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F] px-3 py-2.5 hover:border-[#FFCE0A]/60 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-900 dark:text-white leading-tight truncate">
                                          {as.send.listing_address || as.campaign.city || '—'}
                                        </span>
                                        <span
                                          className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                          style={{ background: statusColor.bg, color: statusColor.color }}
                                        >
                                          {statusLabel}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                        {as.send.listing_price != null ? `$${as.send.listing_price.toLocaleString()}` : ''}
                                        {as.send.listing_price && as.send.listing_property_type ? ' · ' : ''}
                                        {as.send.listing_property_type || ''}
                                        {as.send.sent_at ? ` · ${new Date(as.send.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {leaderboard.length > 10 && (
              <button
                onClick={() => setLeaderboardExpanded(e => !e)}
                className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {leaderboardExpanded ? 'Show less ↑' : `Show all ${leaderboard.length} agents ↓`}
              </button>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Account Usage                                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg text-[#342e37] dark:text-white mb-1">Account Usage This Period</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {usageCount.toLocaleString()} of {planLimit.toLocaleString()} messages used
                {periodEndLabel && <> · Resets {periodEndLabel}</>}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#342e37] dark:text-white">{usageCount.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Math.max(0, planLimit - usageCount).toLocaleString()} remaining
              </div>
            </div>
          </div>
          <div className="mb-3">
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${usagePct}%`, background: isNearLimit ? '#fa824c' : '#FFCE0A' }}
              />
            </div>
          </div>
          {isNearLimit && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                  You're at {Math.round(usagePct)}% of your message limit this period
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>

    {selectedAgentSend && (
      <AgentActivityModal
        send={selectedAgentSend.send as any}
        campaign={selectedAgentSend.campaign}
        onClose={() => setSelectedAgentSend(null)}
      />
    )}
    </>
  );
}
