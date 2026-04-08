import { useState, useEffect } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Campaign {
  id: string;
  name: string;
  subject: string | null;
  body: string | null;
  sender_id: string | null;
  unsubscribe_url: string | null;
}

interface TemplateDropdownProps {
  channel: 'email' | 'sms';
  onSelect: (campaign: { subject: string | null; body: string | null; sender_id: string | null; unsubscribe_url: string | null; name: string }) => void;
}

export function TemplateDropdown({ channel: _channel, onSelect }: TemplateDropdownProps) {
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('messaging_automations')
        .select('id, name, subject, body, sender_id, unsubscribe_url')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setCampaigns(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <FolderOpen size={14} />
        Load Campaign
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
          {loading && <p className="px-3 py-2 text-sm text-zinc-400">Loading…</p>}
          {!loading && campaigns.length === 0 && (
            <p className="px-3 py-2 text-sm text-zinc-400">No saved campaigns yet.</p>
          )}
          {campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => {
                onSelect({ subject: c.subject, body: c.body, sender_id: c.sender_id, unsubscribe_url: c.unsubscribe_url, name: c.name });
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="block truncate">{c.name}</span>
              {c.subject && <span className="block text-xs text-zinc-400 truncate">{c.subject}</span>}
            </button>
          ))}
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
