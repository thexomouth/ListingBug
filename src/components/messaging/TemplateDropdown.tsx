import { useState, useEffect } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

interface NativeTemplate {
  id: string;
  name: string;
  subject: string | null;
  body: string | null;
  sender_id: string | null;
  unsubscribe_url: string | null;
  source: 'listingbug';
}

interface MailchimpTemplate {
  id: string;
  name: string;
  subject: string | null;
  source: 'mailchimp';
}

type AnyTemplate = NativeTemplate | MailchimpTemplate;

interface TemplateDropdownProps {
  channel: 'email' | 'sms';
  onSelect: (campaign: { subject: string | null; body: string | null; sender_id: string | null; unsubscribe_url: string | null; name: string }) => void;
}

export function TemplateDropdown({ channel: _channel, onSelect }: TemplateDropdownProps) {
  const [open, setOpen] = useState(false);
  const [native, setNative] = useState<NativeTemplate[]>([]);
  const [mailchimp, setMailchimp] = useState<MailchimpTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load ListingBug saved campaigns
      const { data } = await supabase
        .from('messaging_automations')
        .select('id, name, subject, body, sender_id, unsubscribe_url')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setNative((data ?? []).map((c: any) => ({ ...c, source: 'listingbug' as const })));

      // Try loading Mailchimp templates
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=mailchimp-templates`, {
            headers: { Authorization: `Bearer ${session.session.access_token}` },
          });
          if (res.ok) {
            const mc = await res.json();
            setMailchimp((mc.templates ?? []).map((t: any) => ({
              id: t.id,
              name: t.name,
              subject: t.subject ?? null,
              source: 'mailchimp' as const,
            })));
          }
        }
      } catch { /* Mailchimp not configured */ }

      setLoading(false);
    };
    load();
  }, []);

  const total = native.length + mailchimp.length;

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
        <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
          {loading && <p className="px-3 py-2 text-sm text-zinc-400">Loading…</p>}
          {!loading && total === 0 && (
            <p className="px-3 py-2 text-sm text-zinc-400">No saved campaigns or templates yet.</p>
          )}

          {/* ListingBug templates */}
          {native.length > 0 && (
            <>
              {mailchimp.length > 0 && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  ListingBug
                </p>
              )}
              {native.map(c => (
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
            </>
          )}

          {/* Mailchimp templates */}
          {mailchimp.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                Mailchimp
              </p>
              {mailchimp.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelect({ subject: t.subject, body: null, sender_id: null, unsubscribe_url: null, name: t.name });
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="block truncate">{t.name}</span>
                  {t.subject && <span className="block text-xs text-zinc-400 truncate">{t.subject}</span>}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
