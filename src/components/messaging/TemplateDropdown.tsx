import { useState, useEffect } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

interface Template {
  id: string;
  name: string;
  subject: string | null;
  body: string | null;
  source: 'native' | 'mailchimp';
}

interface TemplateDropdownProps {
  channel: 'email' | 'sms';
  onSelect: (template: { subject: string | null; body: string | null }) => void;
}

export function TemplateDropdown({ channel, onSelect }: TemplateDropdownProps) {
  const [open, setOpen] = useState(false);
  const [native, setNative] = useState<Template[]>([]);
  const [mailchimp, setMailchimp] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load native templates
      const { data } = await supabase
        .from('marketing_templates')
        .select('id, name, subject, body')
        .eq('user_id', user.id)
        .eq('channel', channel)
        .order('updated_at', { ascending: false });
      setNative((data ?? []).map((t: any) => ({ ...t, source: 'native' as const })));

      // Load Mailchimp templates if email channel
      if (channel === 'email') {
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
                body: null, // Mailchimp template HTML not loaded here — subject only
                source: 'mailchimp' as const,
              })));
            }
          }
        } catch { /* Mailchimp not connected */ }
      }

      setLoading(false);
    };
    load();
  }, [channel]);

  const hasTemplates = native.length > 0 || mailchimp.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <FileText size={14} />
        Load template
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 py-1 max-h-80 overflow-y-auto">
          {loading && <p className="px-3 py-2 text-sm text-zinc-400">Loading…</p>}
          {!loading && !hasTemplates && <p className="px-3 py-2 text-sm text-zinc-400">No templates saved yet.</p>}

          {native.length > 0 && (
            <>
              <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 dark:border-zinc-800">
                ListingBug
              </p>
              {native.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onSelect({ subject: t.subject, body: t.body }); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </>
          )}

          {mailchimp.length > 0 && (
            <>
              <p className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 dark:border-zinc-800 mt-1">
                Mailchimp
              </p>
              {mailchimp.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onSelect({ subject: t.subject, body: t.body }); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Subject pre-filled from Mailchimp. Paste your HTML body below."
                >
                  <span>{t.name}</span>
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
