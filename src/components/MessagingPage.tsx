import { useState, useEffect } from 'react';
import { Send, BarChart2, Mail, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CreateTab, Recipient } from './messaging/CreateTab';
import { ContactsTab, ContactRow } from './messaging/ContactsTab';
import { SetupTab } from './messaging/SetupTab';
import { CampaignsTable } from './messaging/CampaignsTable';
import { MessagingResultsPage } from './MessagingResultsPage';

type Tab = 'create' | 'contacts' | 'campaigns' | 'results';

export function MessagingPage() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const intent = sessionStorage.getItem('messaging_open_tab');
    if (intent === 'create') { sessionStorage.removeItem('messaging_open_tab'); return 'create'; }
    return 'contacts';
  });
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<ContactRow[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(() => {
    const intent = sessionStorage.getItem('messaging_open_tab');
    if (intent === 'setup') { sessionStorage.removeItem('messaging_open_tab'); return true; }
    return false;
  });
  const [campaignRefresh, setCampaignRefresh] = useState(0);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [resultsName, setResultsName] = useState('');
  const [hasSender, setHasSender] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('messaging_config')
        .select('config')
        .eq('user_id', user.id)
        .eq('platform', 'sendgrid')
        .limit(1);
      setHasSender(!!(data?.length && data[0]?.config?.api_key));
    })();
  }, []);

  // Results view replaces the whole page
  if (activeTab === 'results' && resultsId) {
    return (
      <MessagingResultsPage
        campaignId={resultsId}
        campaignName={resultsName}
        onBack={() => setActiveTab('campaigns')}
      />
    );
  }

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

      {/* Setup modal */}
      {showSetupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowSetupModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Messaging Setup</h2>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <SetupTab />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#FFCE0A]" />
              <h1
                className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setActiveTab('contacts')}
              >
                Messaging
              </h1>
            </div>
            <p className="text-[13px] md:text-sm text-zinc-400">
              Compose and send emails to your contacts.{' '}
              <button
                onClick={() => setShowSetupModal(true)}
                className="text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 underline underline-offset-2 transition-colors"
              >
                Set up messaging
              </button>
            </p>
            <p className="text-[11px] md:text-xs text-amber-600 dark:text-amber-400 mt-1">
              Beta — performance may be significantly better from your platform's native messaging system.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            {activeTab !== 'campaigns' && (
              <button
                onClick={() => setActiveTab('campaigns')}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                Campaigns
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

        {/* No sender banner */}
        {hasSender === false && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-0.5">Sender not configured</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Before you can send emails, connect a SendGrid API key and verify a sender. Takes about 2 minutes.
              </p>
            </div>
            <button
              onClick={() => setShowSetupModal(true)}
              className="text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Go to Setup →
            </button>
          </div>
        )}

        {/* Content */}
        <div>
          {activeTab === 'create' && (
            <CreateTab
              selectedRecipients={recipients}
              onClearRecipients={() => { setSelectedEmails(new Set()); setSelectedContacts([]); }}
              onCampaignSent={() => setCampaignRefresh(n => n + 1)}
              onGoToSetup={() => setShowSetupModal(true)}
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
          {activeTab === 'campaigns' && (
            <CampaignsTable
              refreshTrigger={campaignRefresh}
              onViewResults={(id, name) => {
                setResultsId(id);
                setResultsName(name);
                setActiveTab('results');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
