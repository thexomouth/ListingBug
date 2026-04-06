import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Send {
  id: string;
  email: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  updated_at: string;
}

interface MessagingResultsPageProps {
  campaignId: string;
  campaignName: string;
  onBack: () => void;
}

export function MessagingResultsPage({ campaignId, campaignName, onBack }: MessagingResultsPageProps) {
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('marketing_sends')
      .select('id, email, status, error, sent_at, updated_at')
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: true });
    setSends(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [campaignId]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 dark:text-green-400';
      case 'bounced': return 'text-amber-500';
      case 'failed': return 'text-red-500';
      default: return 'text-zinc-400';
    }
  };

  const counts = sends.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">{campaignName}</h1>
        </div>

        {/* Summary stats */}
        {!loading && sends.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: sends.length, color: 'text-zinc-700 dark:text-zinc-300' },
              { label: 'Delivered', value: counts.delivered ?? 0, color: 'text-green-600 dark:text-green-400' },
              { label: 'Bounced', value: counts.bounced ?? 0, color: 'text-amber-500' },
              { label: 'Failed', value: counts.failed ?? 0, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                <p className="text-xs text-zinc-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Per-recipient results</p>
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-400">Loading…</div>
          ) : sends.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">No sends recorded for this campaign.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    {['Email', 'Status', 'Error', 'Sent at', 'Updated at'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sends.map(s => (
                    <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-3 py-2.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">{s.email}</td>
                      <td className={`px-3 py-2.5 font-medium capitalize ${statusColor(s.status)}`}>{s.status}</td>
                      <td className="px-3 py-2.5 text-xs text-zinc-400 max-w-[280px] truncate">{s.error ?? '—'}</td>
                      <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap text-xs">
                        {s.sent_at ? new Date(s.sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400 whitespace-nowrap text-xs">
                        {new Date(s.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
