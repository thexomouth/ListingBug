import { useState, useEffect, useMemo } from 'react';
import { Search, Upload, X, CheckSquare, Square, UserCheck, RefreshCw, ChevronLeft, ChevronRight, Download, ListPlus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ContactsListPanel, ContactList } from './ContactsListPanel';
import { CsvUploadZone, ParsedContact } from './CsvUploadZone';
import { toast } from 'sonner';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

export interface ContactRow {
  id?: string;
  email: string;
  first_name: string;
  last_name?: string;
  city?: string;
  company?: string;
  phone?: string;
  role?: string;
  tags?: string;
  unsubscribed?: boolean;
  source: 'agent' | 'csv-upload' | 'mailchimp' | 'hubspot';
  lists?: string[];
}

type SourceFilter = 'agents' | 'uploaded' | 'mailchimp' | 'hubspot';

interface ContactsTabProps {
  selectedEmails: Set<string>;
  onSelectionChange: (emails: Set<string>, contacts: ContactRow[]) => void;
}

function extractAgentsFromRuns(runs: any[]): ContactRow[] {
  const seen = new Set<string>();
  const agents: ContactRow[] = [];
  for (const run of runs) {
    const listings: any[] = run.results_json ?? [];
    for (const l of listings) {
      const email = (l.agentEmail ?? l.agent_email ?? l.listingAgent?.email ?? '').toLowerCase().trim();
      if (!email || !email.includes('@') || seen.has(email)) continue;
      seen.add(email);
      const name: string = l.agentName ?? l.agent_name ?? l.listingAgent?.name ?? '';
      const parts = name.split(' ');
      agents.push({
        email,
        first_name: parts[0] ?? '',
        last_name: parts.slice(1).join(' ') || undefined,
        city: l.city ?? l.formattedAddress?.split(',')[1]?.trim() ?? undefined,
        company: l.officeName ?? l.office_name ?? l.listingOffice?.name ?? undefined,
        phone: l.agentPhone ?? l.agent_phone ?? l.listingAgent?.phone ?? undefined,
        source: 'agent',
      });
    }
  }
  return agents;
}

function exportToCsv(contacts: ContactRow[], filename = 'contacts.csv') {
  const headers = ['Email', 'First Name', 'Last Name', 'City', 'Company', 'Phone'];
  const rows = contacts.map(c => [
    c.email, c.first_name, c.last_name ?? '', c.city ?? '', c.company ?? '', c.phone ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ContactsTab({ selectedEmails, onSelectionChange }: ContactsTabProps) {
  const [source, setSource] = useState<SourceFilter>('agents');
  const [agentContacts, setAgentContacts] = useState<ContactRow[]>([]);
  const [uploadedContacts, setUploadedContacts] = useState<ContactRow[]>([]);

  // Mailchimp
  const [mailchimpLists, setMailchimpLists] = useState<{ id: string; name: string; member_count: number }[]>([]);
  const [mailchimpListId, setMailchimpListId] = useState('');
  const [mailchimpContacts, setMailchimpContacts] = useState<ContactRow[]>([]);
  const [mailchimpLoading, setMailchimpLoading] = useState(false);
  const [mailchimpConnected, setMailchimpConnected] = useState(false);

  // HubSpot
  const [hubspotLists, setHubspotLists] = useState<{ listId: string; name: string; size: number }[]>([]);
  const [hubspotListId, setHubspotListId] = useState('');
  const [hubspotContacts, setHubspotContacts] = useState<ContactRow[]>([]);
  const [hubspotLoading, setHubspotLoading] = useState(false);
  const [hubspotConnected, setHubspotConnected] = useState(false);
  const [hubspotPanelCollapsed, setHubspotPanelCollapsed] = useState(true);

  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideUnsubscribed, setHideUnsubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [pendingContacts, setPendingContacts] = useState<ParsedContact[] | null>(null);
  const [audienceCollapsed, setAudienceCollapsed] = useState(true);
  const [assignListId, setAssignListId] = useState('');
  const [newListName, setNewListName] = useState('');

  // Bulk action state
  const [showAddToList, setShowAddToList] = useState(false);
  const [bulkListId, setBulkListId] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: runs } = await supabase
      .from('search_runs')
      .select('results_json')
      .eq('user_id', user.id)
      .order('searched_at', { ascending: false });
    setAgentContacts(extractAgentsFromRuns(runs ?? []));

    const { data: contacts } = await supabase
      .from('marketing_contacts')
      .select('id, email, first_name, last_name, city, company, phone, role, tags, unsubscribed')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: listsData } = await supabase
      .from('marketing_lists')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const { data: memberships } = await supabase
      .from('marketing_contacts_lists')
      .select('contact_id, list_id');

    const membershipMap = new Map<string, string[]>();
    for (const m of memberships ?? []) {
      if (!membershipMap.has(m.contact_id)) membershipMap.set(m.contact_id, []);
      membershipMap.get(m.contact_id)!.push(m.list_id);
    }

    const listCountMap = new Map<string, number>();
    for (const m of memberships ?? []) {
      listCountMap.set(m.list_id, (listCountMap.get(m.list_id) ?? 0) + 1);
    }

    setUploadedContacts((contacts ?? []).map((c: any) => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name ?? '',
      last_name: c.last_name ?? undefined,
      city: c.city ?? undefined,
      company: c.company ?? undefined,
      phone: c.phone ?? undefined,
      role: c.role ?? undefined,
      tags: c.tags ?? undefined,
      unsubscribed: c.unsubscribed ?? false,
      source: 'csv-upload' as const,
      lists: membershipMap.get(c.id) ?? [],
    })));

    setLists((listsData ?? []).map((l: any) => ({
      id: l.id,
      name: l.name,
      count: listCountMap.get(l.id) ?? 0,
    })));

    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      // Check Mailchimp
      try {
        const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=mailchimp-lists`, {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMailchimpLists(data.lists ?? []);
          setMailchimpConnected(true);
          if (data.lists?.length > 0 && !mailchimpListId) setMailchimpListId(data.lists[0].id);
        }
      } catch { /* not configured */ }

      // Check HubSpot
      try {
        const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=hubspot-lists`, {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHubspotLists(data.lists ?? []);
          setHubspotConnected(true);
          if (data.lists?.length > 0 && !hubspotListId) setHubspotListId(data.lists[0].listId);
        }
      } catch { /* not configured */ }
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [source, selectedListId, searchQuery, perPage, hideUnsubscribed]);

  const loadMailchimpMembers = async (listId: string) => {
    if (!listId) return;
    setMailchimpLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const res = await fetch(
        `${SUPABASE_FUNCTIONS}/get-marketing-config?action=mailchimp-members&list_id=${encodeURIComponent(listId)}`,
        { headers: { Authorization: `Bearer ${session.session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setMailchimpContacts((data.members ?? []).map((m: any) => ({
          email: m.email, first_name: m.first_name, last_name: m.last_name,
          city: m.city, company: m.company, phone: m.phone, source: 'mailchimp' as const,
        })));
      } else { toast.error('Failed to load Mailchimp audience members.'); }
    } catch { toast.error('Could not reach Mailchimp.'); }
    finally { setMailchimpLoading(false); }
  };

  const loadHubspotMembers = async (listId: string) => {
    if (!listId) return;
    setHubspotLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const res = await fetch(
        `${SUPABASE_FUNCTIONS}/get-marketing-config?action=hubspot-members&list_id=${encodeURIComponent(listId)}`,
        { headers: { Authorization: `Bearer ${session.session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setHubspotContacts((data.members ?? []).map((m: any) => ({
          email: m.email, first_name: m.first_name, last_name: m.last_name,
          city: m.city, company: m.company, phone: m.phone, source: 'hubspot' as const,
        })));
      } else { toast.error('Failed to load HubSpot contacts.'); }
    } catch { toast.error('Could not reach HubSpot.'); }
    finally { setHubspotLoading(false); }
  };

  useEffect(() => {
    if (source === 'mailchimp' && mailchimpListId && mailchimpContacts.length === 0) {
      loadMailchimpMembers(mailchimpListId);
    }
  }, [source, mailchimpListId]);

  useEffect(() => {
    if (source === 'hubspot' && hubspotListId && hubspotContacts.length === 0) {
      loadHubspotMembers(hubspotListId);
    }
  }, [source, hubspotListId]);

  const activeContacts =
    source === 'agents' ? agentContacts :
    source === 'mailchimp' ? mailchimpContacts :
    source === 'hubspot' ? hubspotContacts :
    uploadedContacts;

  const filtered = useMemo(() => {
    let rows = activeContacts;
    if (source === 'uploaded' && selectedListId) {
      rows = rows.filter(c => c.lists?.includes(selectedListId));
    }
    if (hideUnsubscribed) {
      rows = rows.filter(c => !c.unsubscribed);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(c =>
        c.email.toLowerCase().includes(q) ||
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [activeContacts, source, selectedListId, searchQuery, hideUnsubscribed]);

  const selectedInView = filtered.filter(c => selectedEmails.has(c.email));
  const nonUnsub = filtered.filter(c => !c.unsubscribed);
  const allSelected = nonUnsub.length > 0 && nonUnsub.every(c => selectedEmails.has(c.email));

  const getSelectedRows = (emails: Set<string>): ContactRow[] => {
    const all = [...agentContacts, ...uploadedContacts, ...mailchimpContacts, ...hubspotContacts];
    const byEmail = new Map(all.map(c => [c.email, c]));
    return Array.from(emails).map(e => byEmail.get(e)).filter(Boolean) as ContactRow[];
  };

  const toggleAll = () => {
    if (selectedInView.length === nonUnsub.length && nonUnsub.length > 0) {
      const next = new Set(selectedEmails);
      for (const c of filtered) next.delete(c.email);
      onSelectionChange(next, getSelectedRows(next));
    } else {
      const next = new Set(selectedEmails);
      for (const c of nonUnsub) next.add(c.email);
      onSelectionChange(next, getSelectedRows(next));
    }
  };

  const toggleOne = (c: ContactRow) => {
    if (c.unsubscribed) return;
    const next = new Set(selectedEmails);
    if (next.has(c.email)) next.delete(c.email);
    else next.add(c.email);
    onSelectionChange(next, getSelectedRows(next));
  };

  const handleCreateList = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('marketing_lists').insert({ user_id: user.id, name }).select('id').single();
    if (error) { toast.error(error.message); return; }
    setLists(prev => [...prev, { id: data.id, name, count: 0 }]);
    toast.success(`List "${name}" created.`);
  };

  const handleImport = async (contacts: ParsedContact[]) => {
    setPendingContacts(contacts.filter(c => !c._error));
  };

  const confirmImport = async () => {
    if (!pendingContacts || pendingContacts.length === 0) return;
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${SUPABASE_FUNCTIONS}/import-marketing-contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: pendingContacts,
          list_ids: assignListId ? [assignListId] : [],
          new_list_name: newListName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Import failed.'); return; }
      toast.success(`Imported ${data.imported} contact${data.imported !== 1 ? 's' : ''}.`);
      setPendingContacts(null); setAssignListId(''); setNewListName('');
      setShowUpload(false);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    } finally { setImporting(false); }
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────

  const handleExportSelected = () => {
    const rows = getSelectedRows(selectedEmails);
    exportToCsv(rows, 'selected-contacts.csv');
    toast.success(`Exported ${rows.length} contact${rows.length !== 1 ? 's' : ''}.`);
  };

  const handleBulkAddToList = async () => {
    if (!bulkListId) { toast.error('Select a list.'); return; }
    setBulkAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For uploaded contacts we have IDs; for others, upsert first
      const rows = getSelectedRows(selectedEmails);
      const uploadedIds: string[] = [];
      const toUpsert: ContactRow[] = [];

      for (const c of rows) {
        if (c.id) uploadedIds.push(c.id);
        else toUpsert.push(c);
      }

      // Upsert non-uploaded contacts into marketing_contacts
      if (toUpsert.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${SUPABASE_FUNCTIONS}/import-marketing-contacts`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts: toUpsert, list_ids: [bulkListId] }),
          });
        }
      }

      // Add existing contacts to list
      if (uploadedIds.length > 0) {
        const inserts = uploadedIds.map(id => ({ contact_id: id, list_id: bulkListId }));
        await supabase.from('marketing_contacts_lists').upsert(inserts, { onConflict: 'contact_id,list_id' });
      }

      toast.success(`Added ${rows.length} contact${rows.length !== 1 ? 's' : ''} to list.`);
      setShowAddToList(false); setBulkListId('');
      await loadData();
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    } finally { setBulkAdding(false); }
  };

  const handleBulkDelete = async () => {
    const rows = getSelectedRows(selectedEmails).filter(c => c.id);
    if (rows.length === 0) { toast.error('Only uploaded contacts can be deleted.'); return; }
    if (!confirm(`Delete ${rows.length} contact${rows.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      const ids = rows.map(c => c.id!);
      const { error } = await supabase.from('marketing_contacts').delete().in('id', ids);
      if (error) { toast.error(error.message); return; }
      const cleared = new Set(selectedEmails);
      for (const c of rows) cleared.delete(c.email);
      onSelectionChange(cleared, getSelectedRows(cleared));
      toast.success(`Deleted ${rows.length} contact${rows.length !== 1 ? 's' : ''}.`);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    } finally { setBulkDeleting(false); }
  };

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const sourceTabs: { id: SourceFilter; label: string }[] = [
    { id: 'agents', label: 'Agents' },
    { id: 'uploaded' as SourceFilter, label: 'Uploaded' },
    ...(mailchimpConnected ? [{ id: 'mailchimp' as SourceFilter, label: 'Mailchimp' }] : []),
    ...(hubspotConnected ? [{ id: 'hubspot' as SourceFilter, label: 'HubSpot' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Contacts</h2>
            {selectedEmails.size > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">
                {selectedEmails.size} selected
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">View and select contacts for messaging.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Source switcher */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-sm">
            {sourceTabs.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`px-3 py-1.5 transition-colors ${i > 0 ? 'border-l border-zinc-200 dark:border-zinc-700' : ''} ${
                  source === s.id
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {source === 'uploaded' && (
            <button
              onClick={() => setShowUpload(v => !v)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Upload size={13} />
              Import CSV
            </button>
          )}
        </div>
      </div>

      {/* Import CSV — mobile */}
      {source === 'uploaded' && (
        <div className="sm:hidden">
          <button
            onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full justify-center"
          >
            <Upload size={13} />
            Import CSV
          </button>
        </div>
      )}

      {/* CSV upload panel */}
      {showUpload && source === 'uploaded' && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900">
          <CsvUploadZone onParsed={handleImport} />
          {pendingContacts && pendingContacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ready to import {pendingContacts.length} contacts. Assign to a list (optional):
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={assignListId}
                  onChange={e => setAssignListId(e.target.value)}
                  className="px-2 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="">No list</option>
                  {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <span className="text-zinc-400 text-sm">or create new:</span>
                <input
                  type="text"
                  placeholder="New list name"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="px-2 py-1.5 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                <button
                  onClick={confirmImport}
                  disabled={importing}
                  className="px-3 py-1.5 rounded bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {importing ? 'Importing…' : 'Confirm import'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setHideUnsubscribed(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
            hideUnsubscribed
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
        >
          {hideUnsubscribed ? <><X size={10} /> Showing subscribed only</> : 'Hide unsubscribed'}
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedEmails.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
          <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mr-1">
            {selectedEmails.size} selected
          </span>
          <button
            onClick={handleExportSelected}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
          <button
            onClick={() => { setShowAddToList(v => !v); setBulkListId(''); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ListPlus size={12} /> Add to list
          </button>
          {source === 'uploaded' && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-60 transition-colors"
            >
              <Trash2 size={12} /> {bulkDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button
            onClick={() => onSelectionChange(new Set(), [])}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Add to list inline picker */}
      {showAddToList && (
        <div className="flex items-center gap-2 flex-wrap px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Add to list:</span>
          <select
            value={bulkListId}
            onChange={e => setBulkListId(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
          >
            <option value="">Select list…</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button
            onClick={handleBulkAddToList}
            disabled={bulkAdding || !bulkListId}
            className="px-2.5 py-1 rounded bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-xs font-semibold disabled:opacity-60 transition-colors"
          >
            {bulkAdding ? 'Adding…' : 'Confirm'}
          </button>
          <button onClick={() => setShowAddToList(false)} className="text-xs text-zinc-400 hover:text-zinc-600">
            Cancel
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden min-h-[400px]">

        {/* Mailchimp audience selector */}
        {source === 'mailchimp' && (
          audienceCollapsed ? (
            <div className="w-8 shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col items-center pt-2">
              <button
                onClick={() => setAudienceCollapsed(false)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title="Expand audience"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Audience</p>
                <button onClick={() => setAudienceCollapsed(true)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <ChevronLeft size={14} />
                </button>
              </div>
              <div className="p-3 space-y-3">
                <select
                  value={mailchimpListId}
                  onChange={e => { setMailchimpListId(e.target.value); setMailchimpContacts([]); loadMailchimpMembers(e.target.value); }}
                  className="w-full text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2 py-1.5 focus:outline-none"
                >
                  {mailchimpLists.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.member_count})</option>
                  ))}
                </select>
                <button
                  onClick={() => { setMailchimpContacts([]); loadMailchimpMembers(mailchimpListId); }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <RefreshCw size={11} className={mailchimpLoading ? 'animate-spin' : ''} />
                  Reload members
                </button>
              </div>
            </div>
          )
        )}

        {/* HubSpot list selector */}
        {source === 'hubspot' && (
          hubspotPanelCollapsed ? (
            <div className="w-8 shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col items-center pt-2">
              <button
                onClick={() => setHubspotPanelCollapsed(false)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title="Expand lists"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">List</p>
                <button onClick={() => setHubspotPanelCollapsed(true)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <ChevronLeft size={14} />
                </button>
              </div>
              <div className="p-3 space-y-3">
                <select
                  value={hubspotListId}
                  onChange={e => { setHubspotListId(e.target.value); setHubspotContacts([]); loadHubspotMembers(e.target.value); }}
                  className="w-full text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2 py-1.5 focus:outline-none"
                >
                  {hubspotLists.map(l => (
                    <option key={l.listId} value={l.listId}>{l.name} ({l.size})</option>
                  ))}
                </select>
                <button
                  onClick={() => { setHubspotContacts([]); loadHubspotMembers(hubspotListId); }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <RefreshCw size={11} className={hubspotLoading ? 'animate-spin' : ''} />
                  Reload contacts
                </button>
              </div>
            </div>
          )
        )}

        {/* List panel (uploaded only) */}
        {source === 'uploaded' && (
          <ContactsListPanel
            lists={lists}
            selectedListId={selectedListId}
            onSelectList={setSelectedListId}
            onCreateList={handleCreateList}
          />
        )}

        {/* Contact table */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search */}
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, email, city…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {loading || (source === 'mailchimp' && mailchimpLoading) || (source === 'hubspot' && hubspotLoading) ? (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm text-zinc-400 p-8 text-center">
              {source === 'agents'
                ? <><UserCheck size={32} className="mb-2 opacity-30" /><p>No agents found yet. Run a search or automation to populate agent data.</p></>
                : source === 'mailchimp'
                  ? <><RefreshCw size={32} className="mb-2 opacity-30" /><p>No members loaded. Select an audience and click "Reload members".</p></>
                  : source === 'hubspot'
                    ? <><RefreshCw size={32} className="mb-2 opacity-30" /><p>No contacts loaded. Select a list and click "Reload contacts".</p></>
                    : <><Upload size={32} className="mb-2 opacity-30" /><p>No uploaded contacts. Import a CSV above.</p></>
              }
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <button onClick={toggleAll} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">City</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Company</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Phone</th>
                    {source === 'uploaded' && (
                      <th className="px-2 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">Lists</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c, i) => {
                    const isSelected = selectedEmails.has(c.email);
                    return (
                      <tr
                        key={`${c.email}-${i}`}
                        onClick={() => toggleOne(c)}
                        className={`border-t border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors ${
                          c.unsubscribed
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                              ? 'bg-yellow-50 dark:bg-yellow-900/20'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <td className="px-3 py-2">
                          {isSelected
                            ? <CheckSquare size={15} className="text-yellow-500" />
                            : <Square size={15} className="text-zinc-300 dark:text-zinc-600" />
                          }
                        </td>
                        <td className="px-2 py-2 font-mono text-xs text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">
                          {c.email}
                          {c.unsubscribed && <span className="ml-1 text-xs text-red-400">(unsub)</span>}
                        </td>
                        <td className="px-2 py-2 text-zinc-800 dark:text-zinc-200 max-w-[180px] truncate">
                          {(() => { const full = `${c.first_name}${c.last_name ? ` ${c.last_name}` : ''}`; return full.length > 30 ? full.slice(0, 30) + '…' : full; })()}
                        </td>
                        <td className="px-2 py-2 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{c.city ?? '—'}</td>
                        <td className="px-2 py-2 text-zinc-500 dark:text-zinc-400 max-w-[160px] truncate">{c.company ?? '—'}</td>
                        <td className="px-2 py-2 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{c.phone ?? '—'}</td>
                        {source === 'uploaded' && (
                          <td className="px-2 py-2">
                            <div className="flex flex-wrap gap-1">
                              {(c.lists ?? []).slice(0, 2).map(lid => {
                                const list = lists.find(l => l.id === lid);
                                return list ? (
                                  <span key={lid} className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">{list.name}</span>
                                ) : null;
                              })}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                {`${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, filtered.length)}`} of {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
                {selectedEmails.size > 0 && <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">({selectedEmails.size} selected)</span>}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-zinc-500 dark:text-zinc-400 px-1">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
              <select
                value={perPage}
                onChange={e => setPerPage(Number(e.target.value))}
                className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 focus:outline-none"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
