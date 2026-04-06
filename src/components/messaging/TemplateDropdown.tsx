import { useState, useEffect } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Template {
  id: string;
  name: string;
  subject: string | null;
  body: string | null;
}

interface TemplateDropdownProps {
  channel: 'email' | 'sms';
  onSelect: (template: Template) => void;
}

export function TemplateDropdown({ channel, onSelect }: TemplateDropdownProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('marketing_templates')
        .select('id, name, subject, body')
        .eq('user_id', user.id)
        .eq('channel', channel)
        .order('updated_at', { ascending: false });
      setTemplates(data ?? []);
      setLoading(false);
    };
    load();
  }, [channel]);

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
        <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50 py-1">
          {loading && (
            <p className="px-3 py-2 text-sm text-zinc-400">Loading...</p>
          )}
          {!loading && templates.length === 0 && (
            <p className="px-3 py-2 text-sm text-zinc-400">No saved templates yet.</p>
          )}
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
