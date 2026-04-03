import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { LBButton } from './design-system/LBButton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ChevronDown, ChevronUp, ExternalLink, Settings, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { CreateAutomationPage } from './CreateAutomationPage';
import { ViewEditAutomationDrawer } from './ViewEditAutomationDrawer';
import { RunAutomationLoading } from './RunAutomationLoading';
import { IntegrationManagementModal, Integration as IntegrationInterface } from './IntegrationManagementModal';
import { AutomationLimitModal } from './AutomationLimitModal';
import { RunDetailsModal } from './RunDetailsModal';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { canCreateAutomation, getCurrentPlan, getPlanLimits, getNextPlan, type PlanType } from './utils/planLimits';
import { 
  Zap,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Database,
  Webhook,
  FileSpreadsheet,
  MessageSquare,
  Send,
  Download,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useWalkthrough } from './WalkthroughContext';
import { WalkthroughOverlay } from './WalkthroughOverlay';
import { createNotification } from '../lib/notifications';
import { SkeletonAutomationRow } from './SkeletonLoader';

// Format date helper
const formatDate = (iso: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
};

interface Automation {
  id: string;
  name: string;
  searchName: string;
  schedule: string;
  destination: {
    type: 'email' | 'mailchimp' | 'webhook' | 'hubspot' | 'sheets' | 'slack';
    label: string;
  };
  active: boolean;
  lastRun?: {
    date: string;
    status: 'success' | 'failed';
    listingsSent: number;
  };
  nextRun?: string;
}

interface RunHistoryItem {
  id: string;
  automationName: string;
  runDate: string;
  status: 'success' | 'failed';
  listingsFound: number;
  listingsSent: number;
  destination: string;
  details?: string;
}

interface Integration {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  description: string;
  category: 'crm' | 'email' | 'communication' | 'automation' | 'storage';
  useCases: string[];
  connectedDate?: string;
  automationsUsing?: number;
}

interface AutomationsManagementPageProps {
  onViewDetail?: (automation: Automation) => void;
  initialTab?: 'create' | 'automations' | 'history';
  onNavigate?: (page: string) => void;
  onViewRunDetails?: (run: RunHistoryItem) => void;
}

export function AutomationsManagementPage({ onViewDetail, initialTab = 'create', onNavigate, onViewRunDetails }: AutomationsManagementPageProps = {}) {
  const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();
  const walkthroughStep3Active = isStepActive(3);
  
  const [activeTab, setActiveTab] = useState<'create' | 'automations' | 'history'>(() => {
    const lastTab = sessionStorage.getItem('listingbug_automations_last_tab');
    if (lastTab && ['create','automations','history'].includes(lastTab)) {
      return lastTab as 'create' | 'automations' | 'history';
    }
    return initialTab;
  });
  useEffect(() => {
    sessionStorage.setItem('listingbug_automations_last_tab', activeTab);
  }, [activeTab]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [expandedAutomations, setExpandedAutomations] = useState<Set<string>>(new Set());
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState<Automation | null>(null);
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationInterface | null>(null);
  const [runDetailsModalOpen, setRunDetailsModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunHistoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ReturnType<typeof getCurrentPlan>>(getCurrentPlan());
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);

  const realCount = automations.length;
  const planLimits = getPlanLimits(currentPlan);
  const maxSlots = planLimits.automationSlots;
  const automationUsage = {
    current: realCount,
    max: maxSlots,
    percentage: maxSlots === Infinity ? 0 : (realCount / maxSlots) * 100,
    remaining: maxSlots === Infinity ? Infinity : Math.max(0, maxSlots - realCount),
    isAtLimit: maxSlots !== Infinity && realCount >= maxSlots,
  };
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  const loadAutomations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setAutomationsLoading(false); return; }
    const userId = session.user.id;
    const { data: userData } = await supabase.from('users').select('plan').eq('id', userId).single();
    if (userData?.plan) {
      const planMap: Record<string, PlanType> = { trial: 'trial', starter: 'starter', professional: 'pro', enterprise: 'enterprise' };
      const mapped = planMap[userData.plan];
      if (mapped) { setCurrentPlan(mapped); localStorage.setItem('listingbug_user_plan', mapped); }
    }
    const { data, error } = await supabase
      .from('automations')
      .select('id,name,search_name,destination_type,destination_label,destination_config,search_criteria,schedule,schedule_time,sync_frequency,sync_rate,active,last_run_at,next_run_at,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[Automations] load error:', error.message); setAutomationsLoading(false); return; }
    const mapped = (data || []).map((row: any) => ({
      id: row.id, name: row.name, searchName: row.search_name ?? '',
      schedule: [row.schedule, row.schedule_time ? `at ${row.schedule_time}` : ''].filter(Boolean).join(' '),
      destination: { type: row.destination_type, label: row.destination_label ?? row.destination_type, config: row.destination_config ?? {} },
      searchCriteria: row.search_criteria ?? {}, active: row.active ?? true, status: 'idle',
      lastRun: row.last_run_at ? { date: row.last_run_at, status: 'success', listingsSent: 0 } : undefined,
      nextRun: row.next_run_at ? new Date(row.next_run_at).toLocaleString() : 'Pending first run',
    }));
    if (data !== null) setAutomations(mapped);
    setAutomationsLoading(false);
  };

  const loadRunHistory = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { setRunHistory([]); return; }
    const { data, error } = await supabase
      .from('automation_runs')
      .select('id,automation_name,run_date,status,listings_found,listings_sent,destination,details')
      .eq('user_id', userId)
      .order('run_date', { ascending: false })
      .limit(50);
    if (error || !data) { setRunHistory([]); return; }
    setRunHistory(data.map((run: any) => ({
      id: run.id, automationName: run.automation_name || 'Unknown',
      runDate: run.run_date || new Date().toISOString(),
      status: run.status || 'failed',
      listingsFound: run.listings_found || 0, listingsSent: run.listings_sent || 0,
      destination: run.destination || '', details: run.details || '',
    })));
  }, []);

  useEffect(() => {
    loadAutomations();
    loadRunHistory();
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') { loadAutomations(); loadRunHistory(); }
      if (event === 'SIGNED_OUT') { setAutomations([]); setRunHistory([]); }
    });
    const runsSub = supabase
      .channel('automation_runs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automation_runs' }, () => { loadRunHistory(); })
      .subscribe();
    return () => { authSub.unsubscribe(); supabase.removeChannel(runsSub); };
  }, []);

  useEffect(() => {
    const prefillData = sessionStorage.getItem('listingbug_prefill_automation');
    if (prefillData) {
      try {
        const { searchName } = JSON.parse(prefillData);
        setActiveTab('create');
        sessionStorage.removeItem('listingbug_prefill_automation');
        toast.info(`Ready to automate "${searchName}"`);
      } catch (e) { console.error('Failed to parse prefill data:', e); }
    }
    const tabPref = sessionStorage.getItem('listingbug_automations_tab');
    if (tabPref === 'automations' || tabPref === 'history') {
      setActiveTab(tabPref as any);
      sessionStorage.removeItem('listingbug_automations_tab');
    }
  }, []);

  const handleToggleAutomation = async (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (!automation) return;
    const newActive = !automation.active;
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: newActive } : a));
    const { error } = await supabase.from('automations').update({ active: newActive, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !newActive } : a));
      toast.error('Failed to update automation');
    } else {
      toast.success(`Automation ${newActive ? 'activated' : 'paused'}`);
    }
  };

  const handleRunNow = async (automation: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const PLAN_CAPS: Record<string, number> = {
        trial: 1000, starter: 4000, pro: 10000, professional: 10000, enterprise: Infinity,
      };
      const monthYear = new Date().toISOString().slice(0, 7);
      const [{ data: profile }, { data: usageRow }] = await Promise.all([
        supabase.from('users').select('plan').eq('id', session.user.id).single(),
        // maybeSingle() returns null (not 406) when no row exists for this month
        supabase.from('usage_tracking').select('listings_fetched').eq('user_id', session.user.id).eq('month_year', monthYear).maybeSingle(),
      ]);
      const cap = PLAN_CAPS[profile?.plan ?? 'trial'] ?? 1000;
      const used = usageRow?.listings_fetched ?? 0;
      if (cap !== Infinity && used >= cap) {
        toast.error(`Monthly listing limit reached (${used.toLocaleString()} / ${cap.toLocaleString()}). Upgrade your plan to run automations.`);
        return;
      }

      // All checks passed — show loading modal and fire the fetch
      const token = session.access_token;
      setRunNowLoading(true);
      setRunningAutomation(automation);

      const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/run-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ automation_id: automation.id }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Automation run failed');
      const { status, listings_found, listings_sent, details } = result;
      const destLabel = automation.destination?.label ?? 'destination';
      if (status === 'failed') {
        toast.error(`"${automation.name}" failed: ${(details ?? 'Unknown error').slice(0, 120)}`);
      } else {
        toast.success(`"${automation.name}" complete — ${listings_found} found, ${listings_sent} sent to ${destLabel}`);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({
          userId: user.id,
          type: status === 'failed' ? 'error' : 'success',
          title: status === 'failed' ? `Automation failed: ${automation.name}` : `Automation run complete: ${automation.name}`,
          message: status === 'failed' ? (details ?? 'The automation encountered an error.') : listings_sent > 0 ? `${listings_found} listings found — ${listings_sent} sent to ${destLabel}` : `${listings_found} listings found.`,
        });
      }
      await loadRunHistory();
      setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, lastRun: { status: status === 'failed' ? 'failed' : 'success', date: new Date().toISOString(), listingsSent: listings_sent ?? 0, details: details ?? '' } } : a));
    } catch (err: any) {
      const msg = err.message ?? 'Unknown error';
      toast.error(`Run failed: ${msg}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({ userId: user.id, type: 'error', title: `Automation failed: ${automation.name}`, message: msg });
      }
    } finally {
      setRunNowLoading(false);
      setRunningAutomation(null);
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automation deleted');
  };

  const handleDuplicateAutomation = (automation: any) => {
    const newAutomation = { ...automation, id: Date.now().toString(), name: `${automation.name} (Copy)`, active: false, lastRun: undefined, nextRun: undefined };
    setAutomations(prev => [...prev, newAutomation]);
    toast.success('Automation duplicated');
  };

  const handleAutomationUpdated = (updated: any) => {
    setAutomations(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    setEditModalOpen(false);
    toast.success('Automation updated');
    loadAutomations();
  };

  const handleAutomationCreated = (automation: any) => {
    loadAutomations();
    setActiveTab('automations');
    toast.success(`Automation "${automation.name}" created`);
  };

  const getDestinationIcon = (type: string) => {
    const icons: Record<string, any> = { email: Mail, mailchimp: Send, webhook: Webhook, hubspot: Database, sheets: FileSpreadsheet, slack: MessageSquare };
    return icons[type] || Database;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <div className="bg-white dark:bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">Automations</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-[15px]">Automate your searches. Deliver listings to your tools.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 dark:border-white/10 mb-4">
          <nav className="flex">
            <button onClick={() => setActiveTab('create')} className={`flex-1 py-4 border-b-2 transition-colors text-[15px] ${activeTab === 'create' ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Create</button>
            <button onClick={() => setActiveTab('automations')} className={`flex-1 py-4 border-b-2 transition-colors text-[15px] ${activeTab === 'automations' ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>My Automations</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 border-b-2 transition-colors text-[15px] ${activeTab === 'history' ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>History</button>
          </nav>
        </div>

        {activeTab === 'create' ? (
          automationUsage.isAtLimit && !walkthroughStep3Active ? (
            <div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-amber-200 dark:border-amber-500/30 rounded-lg">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]"><AlertTriangle className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div>
              <p className="text-gray-900 dark:text-white text-[18px] font-bold mb-2">Automation Limit Reached</p>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] mb-6">You've used {automationUsage.current} of {automationUsage.max} automation slots on your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.</p>
              <div className="flex items-center justify-center gap-3">
                <LBButton onClick={() => setLimitModalOpen(true)} className="bg-[#ffd447] hover:bg-[#ffd447]/90">View Options</LBButton>
                <Button variant="outline" onClick={() => setActiveTab('automations')}>Manage Existing</Button>
              </div>
            </div>
          ) : (
            <CreateAutomationPage
              onAutomationCreated={(automation) => {
                const limitCheck = canCreateAutomation(currentPlan, automations.length);
                if (!limitCheck.allowed && !walkthroughStep3Active) { setLimitModalOpen(true); toast.error('Automation limit reached'); return; }
                handleAutomationCreated(automation);
              }}
            />
          )
        ) : activeTab === 'automations' ? (
          <div className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-gray-900 dark:text-white">Your Automations ({automations.length})</h3>
            </div>
            {automationsLoading ? (
              <LBTable>
                <LBTableHeader><LBTableRow><LBTableHead className="text-right"></LBTableHead><LBTableHead>Name</LBTableHead><LBTableHead className="hidden md:table-cell">Last Run</LBTableHead><LBTableHead className="hidden md:table-cell">Search Results</LBTableHead><LBTableHead className="hidden md:table-cell">Export Results</LBTableHead><LBTableHead className="text-right"></LBTableHead></LBTableRow></LBTableHeader>
                <LBTableBody>{Array.from({ length: 4 }).map((_, i) => <SkeletonAutomationRow key={i} />)}</LBTableBody>
              </LBTable>
            ) : automations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]"><Zap className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div>
                <p className="text-gray-600 dark:text-white text-[18px] mb-2 font-bold">No automations yet</p>
                <p className="text-gray-500 dark:text-[#EBF2FA] text-[14px] mb-6">Automate a search to deliver listings to your CRM, email lists, or other tools</p>
                <LBButton onClick={() => setActiveTab('create')}><Plus className="w-4 h-4 mr-2" />Create Automation</LBButton>
              </div>
            ) : (
              <LBTable>
                <LBTableHeader><LBTableRow><LBTableHead className="text-right"></LBTableHead><LBTableHead>Name</LBTableHead><LBTableHead className="hidden md:table-cell">Last Run</LBTableHead><LBTableHead className="hidden md:table-cell">Search Results</LBTableHead><LBTableHead className="hidden md:table-cell">Export Results</LBTableHead><LBTableHead className="text-right"></LBTableHead></LBTableRow></LBTableHeader>
                <LBTableBody>
                  {automations.map((automation) => {
                    const lastRun = runHistory.find(r => r.automationName === automation.name);
                    const lastRunStatus = lastRun?.status;
                    const lastRunDate = lastRun?.runDate;
                    const lastRunFound = lastRun?.listingsFound ?? 0;
                    const lastRunSent = lastRun?.listingsSent ?? 0;
                    return (
                      <LBTableRow key={automation.id} onClick={() => { setSelectedAutomation(automation); setEditModalOpen(true); }} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                        <LBTableCell className="text-right">
                          <div onClick={(e) => { e.stopPropagation(); handleToggleAutomation(automation.id); }} className="inline-flex items-center cursor-pointer select-none justify-end">
                            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${automation.active ? 'bg-[#FFD447]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${automation.active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </LBTableCell>
                        <LBTableCell>
                          <div className="font-bold text-[14px] text-gray-900 dark:text-white">{automation.name}</div>
                          {lastRun && (
                            <div className="flex items-center gap-2 mt-1 md:hidden">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${lastRunStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {lastRunStatus === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {lastRunStatus === 'success' ? 'Success' : 'Failed'}
                              </span>
                              <span className="text-[11px] text-gray-400">{formatDate(lastRunDate ?? '')}</span>
                            </div>
                          )}
                        </LBTableCell>
                        <LBTableCell className="hidden md:table-cell">
                          {lastRun ? (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded-full w-fit ${lastRunStatus === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                {lastRunStatus === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {lastRunStatus === 'success' ? 'Success' : 'Failed'}
                              </span>
                              <span className="text-[11px] text-gray-400">{formatDate(lastRunDate ?? '')}</span>
                              {lastRunStatus === 'failed' && lastRun.details && (<span className="text-[11px] text-red-500 max-w-[180px] truncate" title={lastRun.details}>{lastRun.details}</span>)}
                            </div>
                          ) : (<span className="text-[12px] text-gray-400 italic">Never run</span>)}
                        </LBTableCell>
                        <LBTableCell className="hidden md:table-cell">
                          {lastRun ? (<div className="flex flex-col gap-0.5"><span className="font-bold text-[15px] text-gray-900 dark:text-white">{lastRunFound}</span><span className="text-[11px] text-gray-400">listings found</span></div>) : <span className="text-[12px] text-gray-400">—</span>}
                        </LBTableCell>
                        <LBTableCell className="hidden md:table-cell">
                          {lastRun ? (
                            <div className="flex flex-col gap-0.5">
                              {lastRunStatus === 'success' ? (<><span className="font-bold text-[15px] text-green-600 dark:text-green-400">{lastRunSent}</span><span className="text-[11px] text-gray-400">exported</span></>) : (<><span className="font-bold text-[15px] text-red-500">0</span><span className="text-[11px] text-red-400">export failed</span></>)}
                            </div>
                          ) : <span className="text-[12px] text-gray-400">—</span>}
                        </LBTableCell>
                        <LBTableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-3">
                            <button onClick={(e) => { e.stopPropagation(); handleRunNow(automation); }} disabled={runNowLoading && runningAutomation?.id === automation.id} className="p-1.5 rounded-lg text-gray-400 hover:text-[#FFCE0A] hover:bg-[#FFCE0A]/10 dark:hover:bg-[#FFCE0A]/10 transition-colors disabled:opacity-50" title="Run now">
                              {runNowLoading && runningAutomation?.id === automation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(automation.id); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete automation"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </LBTableCell>
                      </LBTableRow>
                    );
                  })}
                </LBTableBody>
              </LBTable>
            )}
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-[18px] mb-4 text-gray-900 dark:text-white">Run History</h3>
            <div className="block lg:hidden space-y-3">
              {runHistory.map((run) => (
                <div key={run.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => { if (onViewRunDetails) { onViewRunDetails(run); } else { setSelectedRun(run); setRunDetailsModalOpen(true); } }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium ${run.status === 'success' ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'}`}>
                          {run.status === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {run.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(run.runDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                    <div className="text-right"><div className="text-[20px] font-bold text-gray-900 dark:text-white">{run.listingsSent}</div><div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Listings</div></div>
                  </div>
                  <div><div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Automation</div><div className="font-medium text-[14px] text-gray-900 dark:text-white">{run.automationName}</div></div>
                  <div><div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Destination</div><div className="font-medium text-[14px] text-gray-700 dark:text-gray-300">{run.destination}</div></div>
                  {run.details && (<div className="pt-2 border-t border-gray-100 dark:border-white/10"><div className="text-[13px] text-gray-500 dark:text-gray-400">{run.details}</div></div>)}
                </div>
              ))}
              {runHistory.length === 0 && (<div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg"><div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 bg-gray-50 dark:bg-[#0F1115]"><Clock className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div><p className="text-gray-600 dark:text-white font-medium">No run history yet</p><p className="text-[13px] text-gray-500 dark:text-[#EBF2FA] mt-1">Your automation runs will appear here</p></div>)}
            </div>
            <div className="hidden lg:block">
              <div className="w-full overflow-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a]">
                <LBTable className="bg-white dark:bg-[#1a1a1a]">
                  <LBTableHeader className="bg-gray-50 dark:bg-[#252525] border-b border-gray-200 dark:border-white/10">
                    <LBTableRow>
                      <LBTableHead className="text-gray-600 dark:text-gray-300">Date & Time</LBTableHead>
                      <LBTableHead className="text-gray-600 dark:text-gray-300">Automation</LBTableHead>
                      <LBTableHead className="text-gray-600 dark:text-gray-300">Destination</LBTableHead>
                      <LBTableHead className="text-gray-600 dark:text-gray-300">Status</LBTableHead>
                      <LBTableHead className="text-right text-gray-600 dark:text-gray-300">Listings Sent</LBTableHead>
                      <LBTableHead className="text-gray-600 dark:text-gray-300 w-[80px]"></LBTableHead>
                    </LBTableRow>
                  </LBTableHeader>
                  <LBTableBody>
                    {runHistory.map((run) => (
                      <LBTableRow key={run.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => { if (onViewRunDetails) { onViewRunDetails(run); } else { setSelectedRun(run); setRunDetailsModalOpen(true); } }}>
                        <LBTableCell className="font-medium text-gray-900 dark:text-white">{new Date(run.runDate).toLocaleString()}</LBTableCell>
                        <LBTableCell className="text-gray-900 dark:text-white">{run.automationName}</LBTableCell>
                        <LBTableCell className="text-gray-600 dark:text-gray-300">{run.destination}</LBTableCell>
                        <LBTableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${run.status === 'success' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                            {run.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {run.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </LBTableCell>
                        <LBTableCell className="text-right font-medium text-gray-900 dark:text-white">{run.listingsSent}</LBTableCell>
                        <LBTableCell>
                          <button onClick={(e) => { e.stopPropagation(); if (onViewRunDetails) { onViewRunDetails(run); } else { setSelectedRun(run); setRunDetailsModalOpen(true); } }} className="flex items-center gap-1 text-[12px] text-[#FFCE0A] hover:text-[#FFCE0A]/80 font-medium transition-colors">
                            <Eye className="w-3.5 h-3.5" />View
                          </button>
                        </LBTableCell>
                      </LBTableRow>
                    ))}
                  </LBTableBody>
                </LBTable>
              </div>
              {runHistory.length === 0 && (<div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg"><div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 bg-gray-50 dark:bg-[#0F1115]"><Clock className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" /></div><p className="text-gray-600 dark:text-white font-medium">No run history yet</p><p className="text-[13px] text-gray-500 dark:text-[#EBF2FA] mt-1">Your automation runs will appear here</p></div>)}
            </div>
          </div>
        )}
      </div>

      <ViewEditAutomationDrawer isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} automation={selectedAutomation} onAutomationUpdated={handleAutomationUpdated} onViewDetail={onViewDetail} />

      {runningAutomation && (
        <RunAutomationLoading isOpen={runNowLoading} automationName={runningAutomation.name} searchName={runningAutomation.searchName} destinationType={runningAutomation.destination.type} destinationLabel={runningAutomation.destination.label}
          onCancel={() => { setRunNowLoading(false); setRunningAutomation(null); }}
        />
      )}

      <WalkthroughOverlay isActive={walkthroughStep3Active} step={3} totalSteps={totalSteps} title="Create your first automation" description="Fill out the form above to create your first automation. Select the search you just saved, choose a schedule, and pick where you want the listings delivered. Then click 'Create Automation' at the bottom." position="center" ctaText="Got it" onNext={() => {}} onSkip={skipWalkthrough} />
      <WalkthroughOverlay isActive={isStepActive(4)} step={4} totalSteps={totalSteps} title="All set! You're ready to go" description="Your automation is active and will run on schedule. You've completed the setup! Remember to review compliance requirements in Settings to ensure your data handling meets regulations." position="center" ctaText="Finish walkthrough" onNext={() => { completeStep(4); }} onSkip={skipWalkthrough} />

      <AutomationLimitModal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} currentPlan={currentPlan} currentSlots={automationUsage.current} maxSlots={automationUsage.max === Infinity ? 999 : automationUsage.max} onUpgrade={() => { sessionStorage.setItem('billing_open_change_plan', 'true'); onNavigate?.('billing'); }} onContactSupport={() => { onNavigate?.('contact-support'); }} />

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Automation</DialogTitle><DialogDescription>Are you sure you want to delete this automation? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Back</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) { handleDeleteAutomation(deleteConfirmId); setDeleteConfirmId(null); } }}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RunDetailsModal isOpen={runDetailsModalOpen} onClose={() => { setRunDetailsModalOpen(false); setSelectedRun(null); }} run={selectedRun ? { id: selectedRun.id, automation: selectedRun.automationName, date: selectedRun.runDate, status: selectedRun.status, listingsFound: selectedRun.listingsFound, exported: selectedRun.listingsSent, destination: selectedRun.destination, details: selectedRun.details } : null} />
    </div>
  );
}
