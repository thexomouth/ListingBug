import { useState } from 'react';
import { Lock, Send, Wrench } from 'lucide-react';
import { CreateTab, Recipient } from './messaging/CreateTab';
import { ContactsTab, ContactRow } from './messaging/ContactsTab';
import { SetupTab } from './messaging/SetupTab';

const GATE_KEY = 'lb_msg_auth';
const GATE_PASS = 'spitonthatthang';

type Tab = 'create' | 'contacts' | 'setup';

function PasswordGate({ onSubmit }: { onSubmit: (input: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === GATE_PASS) {
      onSubmit(value);
    } else {
      setError(true);
      setValue('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
            <Lock size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Messaging</h1>
          <p className="text-sm text-zinc-400 mt-1">Admin access required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            placeholder="Password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false); }}
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ${
              error
                ? 'border-red-400 dark:border-red-600'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          />
          {error && <p className="text-xs text-red-500 text-center">Incorrect password.</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export function MessagingPage() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(GATE_KEY) === '1');
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const intent = sessionStorage.getItem('messaging_open_tab');
    if (intent === 'create') { sessionStorage.removeItem('messaging_open_tab'); return 'create'; }
    return 'contacts';
  });
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<ContactRow[]>([]);

  const handlePassword = (input: string) => {
    if (input === GATE_PASS) {
      localStorage.setItem(GATE_KEY, '1');
      setAuthed(true);
    }
  };

  if (!authed) return <PasswordGate onSubmit={handlePassword} />;

  const recipients: Recipient[] = selectedContacts.map(c => ({
    email: c.email,
    first_name: c.first_name,
    last_name: c.last_name,
    city: c.city,
    company: c.company,
    contact_id: c.id,
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">Messaging</h1>
            <p className="text-[13px] md:text-sm text-zinc-400">Compose and send emails to your contacts</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            {activeTab !== 'setup' && (
              <button
                onClick={() => setActiveTab('setup')}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Setup
              </button>
            )}
            {activeTab !== 'create' && (
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] text-sm font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
                Create
              </button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'create' && (
            <CreateTab
              selectedRecipients={recipients}
              onClearRecipients={() => { setSelectedEmails(new Set()); setSelectedContacts([]); }}
              onCampaignSent={() => {}}
              onGoToSetup={() => setActiveTab('setup')}
            />
          )}
          {activeTab === 'contacts' && (
            <ContactsTab
              selectedEmails={selectedEmails}
              onSelectionChange={(emails, contacts) => {
                setSelectedEmails(emails);
                setSelectedContacts(contacts);
              }}
            />
          )}
          {activeTab === 'setup' && <SetupTab />}
        </div>
      </div>
    </div>
  );
}
