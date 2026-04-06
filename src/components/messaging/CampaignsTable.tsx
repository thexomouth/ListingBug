import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Campaign {
  id: string;
  name: string | null;
  subject: string | null;
  channel: string;
  sent_at: string;
  recipient_count: number;
  delivered: number;
  bounced: number;
  failed: number;
  pending: number;
}

interface CampaignsTableProps {
  onViewResults: (campaignId: string, campaignName: string) => void;
  refreshTrigger: number;
}

export function CampaignsTable({ onViewResults, refreshTrigger }: CampaignsTableProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: camps } = await supabase
      .from('marketing_campaigns')
      .select('id, name, subject, channel, sent_at, recipient_count')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false });

    if (!camps || camps.length === 0) { setCampaigns([]); setLoading(false); return; }

    // Load send status counts per campaign
    const campIds = camps.map((c: any) => c.id);
    const { data: sends } = await supabase
      .from('marketing_sends')
      .select('campaign_id, status')
      .in('campaign_id', campIds);

    const countMap: Record<string, Record<string, number>> = {};
    for (const s of sends ?? []) {
      if (!countMap[s.campaign_id]) countMap[s.campaign_id] = {};
      countMap[s.campaign_id][s.status] = (countMap[s.campaign_id][s.status] ?? 0) + 1;
    }

    setCampaigns(camps.map((c: any) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      channel: c.channel,
      sent_at: c.sent_at,
      recipient_count: c.recipient_count,
      delivered: countMap[c.id]?.delivered ?? 0,
      bounced: countMap[c.id]?.bounced ?? 0,
      failed: countMap[c.id]?.failed ?? 0,
      pending: countMap[c.id]?.pending ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshTrigger]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Campaigns</h2>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400 py-8 text-center">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
          <Mail size={40} className="opacity-20" />
          <p className="text-sm">No campaigns yet. Compose and send from the Create tab.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                {['Campaign', 'Subject', 'Sent at', 'Recipients', 'Delivered', 'Bounced', 'Failed', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr
                  key={c.id}
                  className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  onClick={() => onViewResults(c.id, c.name ?? c.subject ?? 'Campaign')}
                >
                  <td className="px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-200 max-w-[180px] truncate">
                    {c.name ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                    {c.subject ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(c.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 text-center">{c.recipient_count}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-green-600 dark:text-green-400 font-medium">{c.delivered}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={c.bounced > 0 ? 'text-amber-500 font-medium' : 'text-zinc-400'}>{c.bounced}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={c.failed > 0 ? 'text-red-500 font-medium' : 'text-zinc-400'}>{c.failed}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400">
                    <ChevronRight size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
