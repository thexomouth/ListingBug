import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { LBButton } from './design-system/LBButton';
import { ChevronDown, ChevronUp, ExternalLink, Settings, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { CreateAutomationPage } from './CreateAutomationPage';
import { ViewEditAutomationDrawer } from './ViewEditAutomationDrawer';
import { RunAutomationLoading } from './RunAutomationLoading';
import { IntegrationManagementModal, Integration as IntegrationInterface } from './IntegrationManagementModal';
import { AutomationLimitModal } from './AutomationLimitModal';
import { RunDetailsModal } from './RunDetailsModal';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { canCreateAutomation, getCurrentPlan, getAutomationUsage, getNextPlan } from './utils/planLimits';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Edit2, 
  Trash2, 
  Copy,
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
  Play,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useWalkthrough } from './WalkthroughContext';
import { WalkthroughOverlay } from './WalkthroughOverlay';
import { AlertTriangle } from 'lucide-react';
import { createNotification } from '../lib/notifications';

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
  destination: string;$8  details?: string;
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
}

export function AutomationsManagementPage({ onViewDetail, initialTab = 'create' }: AutomationsManagementPageProps = {}) {
  // Walkthrough integration
  const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();
  const walkthroughStep3Active = isStepActive(3);
  
  const [activeTab, setActiveTab] = useState<'create' | 'automations' | 'history'>(() => {
    // Try to restore last tab from sessionStorage
    const lastTab = sessionStorage.getItem('listingbug_automations_last_tab');
    if (lastTab && ['create','automations','history'].includes(lastTab)) {
      return lastTab as 'create' | 'automations' | 'history';
    }
    return initialTab;
  });
    // Persist activeTab to sessionStorage on change
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
  
  // Automation limit modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const currentPlan = getCurrentPlan();
  const automationUsage = getAutomationUsage(currentPlan);

  // Automations loaded from Supabase (see loadAutomations below)
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);

// Load automations from Supabase — works on any device
  const loadAutomations = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setAutomationsLoading(false); return; }
    const { data, error } = await supabase
      .from('automations')
      .select('id,name,search_name,destination_type,destination_label,destination_config,search_criteria,schedule,schedule_time,sync_frequency,sync_rate,active,last_run_at,next_run_at,created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Automations] load error:', error.message);
      setAutomationsLoading(false);
      return;
    }
    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      searchName: row.search_name ?? '',
      schedule: [row.schedule, row.schedule_time ? `at ${row.schedule_time}` : ''].filter(Boolean).join(' '),
      destination: { type: row.destination_type, label: row.destination_label ?? row.destination_type, config: row.destination_config ?? {} },
      searchCriteria: row.search_criteria ?? {},
      active: row.active ?? true,
      status: 'idle',
      lastRun: row.last_run_at ? { date: row.last_run_at, status: 'success', listingsSent: 0 } : undefined,
      nextRun: row.next_run_at ? new Date(row.next_run_at).toLocaleString() : 'Pending first run',
    }));
    setAutomations(mapped);
    setAutomationsLoading(false);
  }, []);

  // Load on mount and whenever auth state changes (handles mobile session restore)
  useEffect(() => {
    loadAutomations();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadAutomations();
      }
      if (event === 'SIGNED_OUT') {
        setAutomations([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

// Check for prefilled automation data from search page
  useEffect(() => {
    const prefillData = sessionStorage.getItem('listingbug_prefill_automation');
    if (prefillData) {
      try {
        const { searchId, searchName } = JSON.parse(prefillData);
        // Auto-switch to create tab
        setActiveTab('create');
        
        // Clear the prefill data
        sessionStorage.removeItem('listingbug_prefill_automation');
        
        // Show a helpful toast
        toast.info(`Ready to automate "${searchName}"`, {
          description: 'Your saved search has been pre-selected.',
          duration: 3000,
        });
      } catch (e) {
        console.error('Failed to parse prefill data:', e);
      }
    }

    // Check if user clicked Active Automations card from dashboard
    const automationsTabPreference = sessionStorage.getItem('listingbug_automations_tab');
    if (automationsTabPreference === 'automations') {
      setActiveTab('automations');
      sessionStorage.removeItem('listingbug_automations_tab');
    } else if (automationsTabPreference === 'history') {
      setActiveTab('history');
      sessionStorage.removeItem('listingbug_automations_tab');
    }
  }, []);

  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  const loadRunHistory = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { setRunHistory([]); return; }
    const { data, error } = await supabase
      .from('automation_runs')
      .select('id,automation_name:automation_name,run_date,status,listings_found,listings_sent,destination,details')
      .eq('user_id', userId)
      .order('run_date', { ascending: false })
      .limit(20);
    if (error || !data || data.length === 0) { setRunHistory([]); return; }
    setRunHistory(data.map((run) => ({
      id: run.id,
      automationName: run.automation_name || 'Unknown',
      runDate: run.run_date || new Date().toISOString(),
      status: run.status || 'failed',
      listingsFound: run.listings_found || 0,
      listingsSent: run.listings_sent || 0,
      destination: run.destination || '',
      details: run.details || '',
    })));
  }, []);

  useEffect(() => {
    const loadRunHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setRunHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('automation_runs')
        .select('id,automation_name:automation_name,run_date,status,listings_found,listings_sent,destination,details')
        .eq('user_id', userId)
        .order('run_date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Failed to load automation run history:', error);
        setRunHistory([]);
        return;
      }

      if (!data || data.length === 0) {
        setRunHistory([]);
        return;
      }

      setRunHistory(
        data.map((run: any) => ({
          id: run.id,
          automationName: run.automation_name || 'Unknown automation',
          runDate: run.run_date || new Date().toISOString(),
          status: run.status || 'failed',
          listingsFound: run.listings_found || 0,
          listingsSent: run.listings_sent || 0,
          destination: run.destination || '',
          details: run.details || '',
        }))
      );
    };

    loadRunHistory();
  }, []);


  const integrations: Integration[] = [
    // Native ListingBug Features
    { 
      id: 'csv-download', 
      name: 'ListingBug CSV Download', 
      icon: Download, 
      connected: true, 
      description: 'Download listing data as CSV files automatically',
      category: 'storage',
      useCases: ['Data exports', 'Offline analysis', 'Backup copies'],
      connectedDate: '2024-01-01',
      automationsUsing: 0
    },
    
    // CRM (MVP)
    { 
      id: 'salesforce', 
      name: 'Salesforce', 
      icon: Database, 
      connected: true, 
      description: 'Enterprise CRM with custom object mapping',
      category: 'crm',
      useCases: ['Lead creation', 'Opportunity management', 'Custom objects'],
      connectedDate: '2024-01-20',
      automationsUsing: 1
    },
    { 
      id: 'hubspot', 
      name: 'HubSpot', 
      icon: Database, 
      connected: true, 
      description: 'Contact/deal sync with workflows',
      category: 'crm',
      useCases: ['Lead management', 'Deal tracking', 'Contact updates'],
      connectedDate: '2024-01-20',
      automationsUsing: 1
    },
    
    // Email Marketing (MVP)
    { 
      id: 'mailchimp', 
      name: 'Mailchimp', 
      icon: Mail, 
      connected: true, 
      description: 'Audience sync + campaign triggers',
      category: 'email',
      useCases: ['Lead nurturing', 'Newsletter campaigns', 'Drip sequences'],
      connectedDate: '2024-02-01',
      automationsUsing: 1
    },
    { 
      id: 'constantcontact', 
      name: 'Constant Contact', 
      icon: Mail, 
      connected: true, 
      description: 'Email marketing for small businesses',
      category: 'email',
      useCases: ['Monthly market reports', 'Open house announcements', 'Seasonal showcases'],
      connectedDate: '2024-02-15',
      automationsUsing: 0
    }, 
    
    // Spreadsheets & Databases (MVP)
    { 
      id: 'sheets', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: true, 
      description: 'Daily updates, fallback option',
      category: 'storage',
      useCases: ['Data analysis', 'Custom reports', 'Team sharing'],
      connectedDate: '2024-01-15',
      automationsUsing: 2
    },
    { 
      id: 'airtable', 
      name: 'Airtable', 
      icon: Database, 
      connected: true, 
      description: 'Structured sync with custom views',
      category: 'storage',
      useCases: ['Custom databases', 'Project management', 'Collaboration'],
      connectedDate: '2024-02-05',
      automationsUsing: 0
    },
    
    // SMS (MVP)
    { 
      id: 'twilio', 
      name: 'Twilio', 
      icon: MessageSquare, 
      connected: true, 
      description: 'SMS notifications and campaigns',
      category: 'communication',
      useCases: ['Time-sensitive alerts', 'Agent outreach', 'Follow-up sequences'],
      connectedDate: '2024-01-25',
      automationsUsing: 0
    },
    
    // Automation Platforms (MVP)
    { 
      id: 'zapier', 
      name: 'Zapier', 
      icon: Zap, 
      connected: true, 
      description: 'Webhook triggers, multi-app workflows',
      category: 'automation',
      useCases: ['Multi-step workflows', 'Custom integrations', 'App connections'],
      connectedDate: '2024-01-18',
      automationsUsing: 0
    },
    { 
      id: 'make', 
      name: 'Make', 
      icon: Zap, 
      connected: true, 
      description: 'Advanced automation scenarios',
      category: 'automation',
      useCases: ['Complex workflows', 'Data transformation', 'API routing'],
      connectedDate: '2024-02-10',
      automationsUsing: 0
    },
    
    // Developer Tools (Available)
    { 
      id: 'webhook', 
      name: 'Custom Webhook', 
      icon: Webhook, 
      connected: true, 
      description: 'Send listing data to any custom API endpoint',
      category: 'automation',
      useCases: ['Custom integrations', 'Internal systems', 'Third-party APIs'],
      connectedDate: '2024-01-10',
      automationsUsing: 0
    }
  ];

  const getDestinationIcon = (type: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      mailchimp: Send,
      webhook: Webhook,
      hubspot: Database,
      sheets: FileSpreadsheet,
      slack: MessageSquare
    };
    return icons[type] || Database;
  };

  const handleToggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    ));
    const automation = automations.find(a => a.id === id);
    toast.success(`Automation ${automation?.active ? 'paused' : 'activated'}`);
  };

  const handleRunNow = async (automation: Automation) => {
    setRunNowLoading(true);
    setRunningAutomation(automation);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-automation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ automation }),
        }
      );

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
          title: status === 'failed'
            ? `Automation failed: ${automation.name}`
            : `Automation run complete: ${automation.name}`,
          message: status === 'failed'
            ? (details ?? 'The automation encountered an error.')
            : listings_sent > 0
              ? `${listings_found} listings found — ${listings_sent} sent to ${destLabel}`
              : `${listings_found} listings found. Check destination config if 0 were sent.`,
        });
      }

      await loadRunHistory();

      setAutomations(prev => prev.map(a =>
        a.id === automation.id
          ? { ...a, lastRun: { status: status === 'failed' ? 'failed' : 'success', date: new Date().toISOString(), listingsSent: listings_sent ?? 0, details: details ?? '' } }
          : a
      ));

    } catch (err: any) {
      const msg = err.message ?? 'Unknown error';
      toast.error(`Run failed: ${msg}`);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({
          userId: user.id,
          type: 'error',
          title: `Automation failed: ${automation.name}`,
          message: msg,
        });
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

  const handleDuplicateAutomation = (automation: Automation) => {
    const newAutomation: Automation = {
      ...automation,
      id: Date.now().toString(),
      name: `${automation.name} (Copy)`,
      active: false,
      lastRun: undefined,
      nextRun: undefined
    };
    setAutomations(prev => [...prev, newAutomation]);
    toast.success('Automation duplicated');
  };

  const handleAutomationCreated = async (automation: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error('You must be signed in to create automations.');
      return;
    }

    // Write to Supabase so it's available on all devices
    const { data: inserted, error } = await supabase
      .from('automations')
      .insert({
        user_id: session.user.id,
        name: automation.name,
        search_name: automation.searchName ?? '',
        search_criteria: automation.searchCriteria ?? {},
        destination_type: automation.destination?.type ?? '',
        destination_label: automation.destination?.label ?? '',
        destination_config: automation.destination?.config ?? {},
        schedule: automation.schedule ?? 'daily',
        schedule_time: automation.scheduleTime ?? '08:00',
        sync_frequency: automation.syncFrequency ?? '1',
        sync_rate: automation.syncRate ?? 'day',
        active: true,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('[Automations] insert failed:', error?.message);
      toast.error('Failed to save automation. Please try again.');
      return;
    }

    // Immediately add to local state so UI updates without waiting for DB round-trip
    const newAutomation: any = {
      id: inserted.id,
      name: inserted.name,
      searchName: inserted.search_name ?? '',
      schedule: [inserted.schedule, inserted.schedule_time ? `at ${inserted.schedule_time}` : ''].filter(Boolean).join(' '),
      destination: {
        type: inserted.destination_type,
        label: inserted.destination_label ?? inserted.destination_type,
        config: inserted.destination_config ?? {}
      },
      searchCriteria: inserted.search_criteria ?? {},
      active: inserted.active ?? true,
      status: 'idle',
      lastRun: undefined,
      nextRun: 'Pending first run',
    };
    setAutomations(prev => [newAutomation, ...prev]);
    setActiveTab('automations');
    // Also sync from DB in background to ensure consistency
    loadAutomations();
    toast.success('Automation created successfully!');

    if (walkthroughStep3Active) {
      completeStep(3);
    }
  };

  const handleAutomationUpdated = (updatedAutomation: any) => {
    setAutomations(prev => prev.map(a => 
      a.id === updatedAutomation.id ? updatedAutomation : a
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleExpanded = (id: string) => {
    setExpandedAutomations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatSearchCriteria = (automation: any) => {
    if (!automation.searchCriteria) return 'No criteria stored';
    
    const criteria = automation.searchCriteria;
    const parts = [];
    
    if (criteria.city || criteria.state) {
      parts.push(`Location: ${[criteria.city, criteria.state].filter(Boolean).join(', ')}`);
    }
    if (criteria.propertyType) {
      parts.push(`Type: ${criteria.propertyType}`);
    }
    if (criteria.minPrice || criteria.maxPrice) {
      parts.push(`Price: ${criteria.minPrice ? '$' + criteria.minPrice : ''}${criteria.minPrice && criteria.maxPrice ? '-' : ''}${criteria.maxPrice ? '$' + criteria.maxPrice : ''}`);
    }
    if (criteria.beds) {
      parts.push(`Beds: ${criteria.beds}`);
    }
    if (criteria.baths) {
      parts.push(`Baths: ${criteria.baths}`);
    }
    if (criteria.foreclosure) {
      parts.push('Foreclosures only');
    }
    if (criteria.priceDrop) {
      parts.push('Price drops only');
    }
    if (criteria.reListedProperty) {
      parts.push('Re-listed properties');
    }
    
    return parts.length > 0 ? parts.join(' � ') : 'All listings';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      crm: 'CRM Platforms',
      email: 'Email Marketing',
      communication: 'Team Communication',
      automation: 'Automation Platforms',
      storage: 'Data & Storage'
    };
    return labels[category] || category;
  };

  const categorizedIntegrations = {
    crm: integrations.filter(i => i.category === 'crm'),
    email: integrations.filter(i => i.category === 'email'),
    communication: integrations.filter(i => i.category === 'communication'),
    automation: integrations.filter(i => i.category === 'automation'),
    storage: integrations.filter(i => i.category === 'storage')
  };

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">Automations</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-[15px]">
            Automate your searches. Deliver listings to your tools.
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-4 border-b-2 transition-colors text-[15px] ${
                activeTab === 'create'
                  ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab('automations')}
              className={`flex-1 py-4 border-b-2 transition-colors text-[15px] ${
                activeTab === 'automations'
                  ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Automations
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 border-b-2 transition-colors text-[15px] ${
                activeTab === 'history'
                  ? 'border-[#FFD447] text-[#342E37] dark:text-white font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'create' ? (
          /* Create Tab - Check automation limits */
          automationUsage.isAtLimit && !walkthroughStep3Active ? (
            // Show limit reached message instead of create form
            <div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-amber-200 dark:border-amber-500/30 rounded-lg">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]">
                <AlertTriangle className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
              </div>
              <p className="text-gray-900 dark:text-white text-[18px] font-bold mb-2">Automation Limit Reached</p>
              <p className="text-gray-600 dark:text-[#EBF2FA] text-[14px] mb-6">
                You've used {automationUsage.current} of {automationUsage.max} automation slots on your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.
              </p>
              <div className="flex items-center justify-center gap-3">
                <LBButton 
                  onClick={() => setLimitModalOpen(true)}
                  className="bg-[#ffd447] hover:bg-[#ffd447]/90"
                >
                  View Options
                </LBButton>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('automations')}
                >
                  Manage Existing
                </Button>
              </div>
            </div>
          ) : (
            <CreateAutomationPage
              onAutomationCreated={(automation) => {
                // Check limit before creating
                const limitCheck = canCreateAutomation(currentPlan);
                
                if (!limitCheck.allowed && !walkthroughStep3Active) {
                  // Show limit modal
                  setLimitModalOpen(true);
                  toast.error('Automation limit reached');
                  return;
                }
                
                // Create automation (includes toast and tab switch)
                handleAutomationCreated(automation);
              }}
            />
          )
        ) : activeTab === 'automations' ? (
          <div className="pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px]">Your Automations ({automations.length})</h3>
            </div>

            {automations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-white dark:bg-[#0F1115]">
                  <Zap className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
                </div>
                <p className="text-gray-600 dark:text-white text-[18px] mb-2 font-bold">No automations yet</p>
                <p className="text-gray-500 dark:text-[#EBF2FA] text-[14px] mb-6">
                  Automate a search to deliver listings to your CRM, email lists, or other tools
                </p>
                <LBButton onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Automation
                </LBButton>
              </div>
            ) : (
              <LBTable>
                <LBTableHeader>
                  <LBTableRow>
                    <LBTableHead className="text-right"></LBTableHead>
                    <LBTableHead>Name</LBTableHead>
                    <LBTableHead className="hidden md:table-cell">Last Run</LBTableHead>
                    <LBTableHead className="hidden md:table-cell">Search Results</LBTableHead>
                    <LBTableHead className="hidden md:table-cell">Export Results</LBTableHead>
                    <LBTableHead className="text-right"></LBTableHead>
                  </LBTableRow>
                </LBTableHeader>
                <LBTableBody>
                  {automations.map((automation) => {
                    const lastRun = runHistory.find(r => r.automationName === automation.name);
                    const lastRunStatus = lastRun?.status;
                    const lastRunDate = lastRun?.runDate;
                    const lastRunFound = lastRun?.listingsFound ?? 0;
                    const lastRunSent = lastRun?.listingsSent ?? 0;
                    return (
                      <LBTableRow
                        key={automation.id}
                        onClick={() => { setSelectedAutomation(automation); setEditModalOpen(true); }}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        {/* Toggle column (leftmost) */}
                        <LBTableCell className="text-right">
                          <div onClick={(e) => { e.stopPropagation(); handleToggleAutomation(automation.id); }}
                            className="inline-flex items-center cursor-pointer select-none justify-end">
                            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${automation.active ? 'bg-[#FFD447]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${automation.active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </LBTableCell>
                        {/* Name and details */}
                        <LBTableCell>
                          <div className="font-bold text-[14px] text-gray-900 dark:text-white">{automation.name}</div>
                          <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{automation.destination?.label ?? '�'}</div>
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
                              {lastRunStatus === 'failed' && lastRun.details && (
                                <span className="text-[11px] text-red-500 max-w-[180px] truncate" title={lastRun.details}>{lastRun.details}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] text-gray-400 italic">Never run</span>
                          )}
                        </LBTableCell>
                        <LBTableCell className="hidden md:table-cell">
                          {lastRun ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-[15px] text-gray-900 dark:text-white">{lastRunFound}</span>
                              <span className="text-[11px] text-gray-400">listings found</span>
                            </div>
                          ) : <span className="text-[12px] text-gray-400">�</span>}
                        </LBTableCell>
                        <LBTableCell className="hidden md:table-cell">
                          {lastRun ? (
                            <div className="flex flex-col gap-0.5">
                              {lastRunStatus === 'success' ? (
                                <>
                                  <span className="font-bold text-[15px] text-green-600 dark:text-green-400">{lastRunSent}</span>
                                  <span className="text-[11px] text-gray-400">sent to {automation.destination?.label ?? 'destination'}</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-[15px] text-red-500">0</span>
                                  <span className="text-[11px] text-red-400">export failed</span>
                                </>
                              )}
                            </div>
                          ) : <span className="text-[12px] text-gray-400">�</span>}
                        </LBTableCell>
                        {/* Play/Trash column (rightmost) */}
                        <LBTableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRunNow(automation); }}
                              disabled={runNowLoading && runningAutomation?.id === automation.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#FFCE0A] hover:bg-[#FFCE0A]/10 dark:hover:bg-[#FFCE0A]/10 transition-colors disabled:opacity-50"
                              title="Run now"
                            >
                              {runNowLoading && runningAutomation?.id === automation.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteAutomation(automation.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete automation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
          /* Run History Tab */
          <div>
            <h3 className="font-bold text-[18px] mb-4">Run History</h3>
            
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {runHistory.map((run) => (
                <div 
  key={run.id} 
  className="bg-transparent rounded-lg p-4 space-y-3 cursor-pointer hover:bg-white/5 transition-colors"
  onClick={() => {
    setSelectedRun(run);
    setRunDetailsModalOpen(true);
  }}
>
  {/* Header Row - Status & Date */}
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium ${
          run.status === 'success'
            ? ' text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {run.status === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {run.status === 'success' ? 'Success' : 'Failed'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        {new Date(run.runDate).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}
      </div>
    </div>
    <div className="text-right">
      <div className="text-[20px] font-bold text-white">{run.listingsSent}</div>
      <div className="text-[11px] text-gray-400 uppercase tracking-wide">Listings</div>
    </div>
  </div>
  {/* Automation Name */}
  <div>
    <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Automation</div>
    <div className="font-medium text-[14px] text-white">{run.automationName}</div>
  </div>
  {/* Destination */}
  <div>
    <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Destination</div>
    <div className="font-medium text-[14px] text-gray-300">{run.destination}</div>
  </div>
  {/* Details */}
  {run.details && (
    <div className="pt-2 border-t border-white/10">
      <div className="text-[13px] text-gray-400">{run.details}</div>
    </div>
  )}
</div>
              ))}
              
              {runHistory.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 bg-white dark:bg-[#0F1115]">
                    <Clock className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
                  </div>
                  <p className="text-gray-600 dark:text-white font-medium">No run history yet</p>
                  <p className="text-[13px] text-gray-500 dark:text-[#EBF2FA] mt-1">Your automation runs will appear here</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="w-full overflow-auto rounded-lg border border-white/10 bg-[#1a1a1a]">
                <LBTable className="bg-[#1a1a1a]">
                  <LBTableHeader className="bg-[#252525] border-b border-white/10">
                    <LBTableRow>
                      <LBTableHead className="text-gray-300">Date & Time</LBTableHead>
                      <LBTableHead className="text-gray-300">Automation</LBTableHead>
                      <LBTableHead className="text-gray-300">Destination</LBTableHead>
                      <LBTableHead className="text-gray-300">Status</LBTableHead>
                      <LBTableHead className="text-right text-gray-300">Listings Sent</LBTableHead>
                      <LBTableHead className="text-gray-300">Details</LBTableHead>
                    </LBTableRow>
                  </LBTableHeader>
                  <LBTableBody>
                    {runHistory.map((run) => (
                      <LBTableRow key={run.id} className="border-b border-white/5 hover:bg-white/5">
                        <LBTableCell className="font-medium text-white">
                          {new Date(run.runDate).toLocaleString()}
                        </LBTableCell>
                        <LBTableCell className="text-white">{run.automationName}</LBTableCell>
                        <LBTableCell className="text-gray-300">{run.destination}</LBTableCell>
                        <LBTableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            run.status === 'success'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {run.status === 'success' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {run.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </LBTableCell>
                        <LBTableCell className="text-right font-medium text-white">
                          {run.listingsSent}
                        </LBTableCell>
                        <LBTableCell className="text-[13px] text-gray-400">
                          {run.details || '-'}
                        </LBTableCell>
                      </LBTableRow>
                    ))}
                  </LBTableBody>
                </LBTable>
              </div>
              
              {runHistory.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 bg-white dark:bg-[#0F1115]">
                    <Clock className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
                  </div>
                  <p className="text-gray-600 dark:text-white font-medium">No run history yet</p>
                  <p className="text-[13px] text-gray-500 dark:text-[#EBF2FA] mt-1">Your automation runs will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Automation Modal */}
      <ViewEditAutomationDrawer
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        automation={selectedAutomation}
        onAutomationUpdated={handleAutomationUpdated}
        onViewDetail={onViewDetail}
      />

      {/* Run Now Loading Modal */}
      {runningAutomation && (
        <RunAutomationLoading
          isOpen={runNowLoading}
          automationName={runningAutomation.name}
          searchName={runningAutomation.searchName}
          destinationType={runningAutomation.destination.type}
          destinationLabel={runningAutomation.destination.label}
          onCancel={() => {
            setRunNowLoading(false);
            setRunningAutomation(null);
          }}
        />
      )}
      
      {/* Walkthrough Overlay - Step 3: Create Automation */}
      <WalkthroughOverlay
        isActive={walkthroughStep3Active}
        step={3}
        totalSteps={totalSteps}
        title="Create your first automation"
        description="Fill out the form above to create your first automation. Select the search you just saved, choose a schedule, and pick where you want the listings delivered. Then click 'Create Automation' at the bottom."
        position="center"
        ctaText="Got it"
        onNext={() => {
          // Just dismiss - user will complete by creating the automation
        }}
        onSkip={skipWalkthrough}
      />
      
      {/* Walkthrough Overlay - Step 4: Connect Integration */}
      <WalkthroughOverlay
        isActive={isStepActive(4)}
        step={4}
        totalSteps={totalSteps}
        title="All set! You're ready to go"
        description="Your automation is active and will run on schedule. You've completed the setup! Remember to review compliance requirements in Settings to ensure your data handling meets regulations."
        position="center"
        ctaText="Finish walkthrough"
        onNext={() => {
          completeStep(4);
        }}
        onSkip={skipWalkthrough}
      />
      
      {/* Automation Limit Modal */}
      <AutomationLimitModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        currentPlan={currentPlan}
        currentSlots={automationUsage.current}
        maxSlots={automationUsage.max === Infinity ? 999 : automationUsage.max}
        onUpgrade={() => {
          // Navigate to pricing page
          window.location.hash = '#pricing';
        }}
        onContactSupport={() => {
          // Navigate to contact support page
          window.location.hash = '#contact-support';
        }}
      />
      
      {/* Run Details Modal */}
      <RunDetailsModal
        isOpen={runDetailsModalOpen}
        onClose={() => {
          setRunDetailsModalOpen(false);
          setSelectedRun(null);
        }}
        run={selectedRun ? {
          automation: selectedRun.automationName,
          date: selectedRun.runDate,
          status: selectedRun.status,
          listingsFound: selectedRun.listingsSent,
          exported: selectedRun.listingsSent,
          destination: selectedRun.destination,
          details: selectedRun.details
        } : null}
      />
    </div>
  );
}