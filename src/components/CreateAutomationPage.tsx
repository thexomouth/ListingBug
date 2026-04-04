/**
 * CREATE AUTOMATION PAGE - Processor Stance
 * 
 * Shared automation setup:
 * 1. Select saved search or use current search
 * 2. Choose destination integration
 * 3. Map fields (source → destination)
 * 4. Set sync frequency
 * 5. Launch integration-specific modal for final config
 * 
 * API ENDPOINTS:
 * - GET /api/searches/saved - List saved searches
 * - GET /api/integrations - List available integrations
 * - POST /api/automations/preview - Preview automation
 */

import { useState, useEffect } from 'react';
import { LBButton } from './design-system/LBButton';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { 
  Database, 
  Mail, 
  FileSpreadsheet, 
  MessageSquare, 
  Webhook, 
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  Search,
  Settings,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabase';
import { useWalkthrough } from './WalkthroughContext';
import { WalkthroughOverlay, WalkthroughCompleteModal } from './WalkthroughOverlay';

interface CreateAutomationPageProps {
  savedSearch?: any;
  currentCriteria?: any;
  onAutomationCreated?: (automation: any) => void;
}

interface Integration {
  id: string;
  name: string;
  icon: any;
  category: string;
  connected: boolean;
}

interface FieldMapping {
  source: string;
  destination: string;
  label: 'Suggested' | 'Custom';
  required: boolean;
}

export function CreateAutomationPage({ 
  savedSearch, 
  currentCriteria,
  onAutomationCreated 
}: CreateAutomationPageProps) {
  // Walkthrough integration
  const { isStepActive, completeStep } = useWalkthrough();
  const walkthroughStep3Active = isStepActive(3);
  
  const [selectedSearchId, setSelectedSearchId] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [syncFrequency, setSyncFrequency] = useState('daily');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [isActivating, setIsActivating] = useState(false);
  const [automationName, setAutomationName] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Load saved searches from Supabase (authoritative source).
  // localStorage is NOT used — it can be stale or store a different shape,
  // causing search_criteria to arrive empty when creating an automation.
  useEffect(() => {
    const loadSearches = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('searches')
          .select('id, name, location, filters_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error || !data) {
          console.error('[CreateAutomationPage] failed to load searches:', error?.message);
          return;
        }

        // Normalise the shape: criteria lives in filters_json.criteria
        const searches = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          location: row.location,
          criteria: row.filters_json?.criteria ?? row.filters_json ?? {},
        }));

        setSavedSearches(searches);

        // Auto-select if prefill data is present (coming from "Automate" on search page)
        const prefillData = sessionStorage.getItem('listingbug_prefill_automation');
        if (prefillData) {
          try {
            const { searchId } = JSON.parse(prefillData);
            const match = searches.find((s: any) => s.id === searchId);
            if (match) setSelectedSearchId(match.id);
            // Don't clear here — let AutomationsManagementPage handle it
          } catch (e) {
            console.error('Failed to parse prefill data:', e);
          }
        } else if (savedSearch) {
          const match = searches.find((s: any) => s.id === savedSearch.id);
          if (match) setSelectedSearchId(match.id);
        }
      } catch (e) {
        console.error('[CreateAutomationPage] loadSearches exception:', e);
      }
    };

    loadSearches();

    if (currentCriteria && !savedSearch) {
      setSelectedSearchId('current-search');
    }
  }, [savedSearch, currentCriteria]);

  // Auto-generate field mappings when destination changes
  useEffect(() => {
    if (selectedDestination) {
      const defaultMappings: FieldMapping[] = [
        { source: 'address', destination: 'address', label: 'Suggested', required: true },
        { source: 'price', destination: 'price', label: 'Suggested', required: true },
        { source: 'bedrooms', destination: 'beds', label: 'Suggested', required: false },
        { source: 'bathrooms', destination: 'baths', label: 'Suggested', required: false },
        { source: 'sqft', destination: 'square_feet', label: 'Suggested', required: false },
        { source: 'listing_date', destination: 'date_listed', label: 'Suggested', required: false },
      ];
      setFieldMappings(defaultMappings);
    }
  }, [selectedDestination]);

  // Auto-generate automation name
  useEffect(() => {
    if (selectedDestination && selectedSearchId) {
      const search = getSelectedSearch();
      const destination = integrations.find(i => i.id === selectedDestination);
      if (search && destination) {
        const frequencyLabel = frequencyOptions.find(f => f.value === syncFrequency)?.label || 'Daily';
        setAutomationName(`${frequencyLabel} ${search.name} to ${destination.name}`);
      }
    }
  }, [selectedDestination, selectedSearchId, syncFrequency]);

  const getSelectedSearch = () => {
    if (selectedSearchId === 'current-search' && currentCriteria) {
      return {
        id: 'current-search',
        name: 'Current Search',
        criteria: currentCriteria,
      };
    }
    return savedSearches.find(s => s.id === selectedSearchId);
  };

  const [integrations, setIntegrations] = useState<Integration[]>([{
    id: 'csv-download',
    name: 'ListingBug CSV Download',
    icon: Download,
    category: 'Export',
    connected: true,
  }]);

  useEffect(() => {
    async function fetchIntegrations() {
      // Always include CSV as a standard option
      const baseIntegrations: Integration[] = [{
        id: 'csv-download',
        name: 'ListingBug CSV Download',
        icon: Download,
        category: 'Export',
        connected: true,
      }];
      // Fetch user-connected integrations from Supabase
      // Map integration_id to display info
      const INTEGRATION_INFO: Record<string, { name: string; icon: any; category: string }> = {
        salesforce: { name: 'Salesforce', icon: Database, category: 'CRM' },
        hubspot: { name: 'HubSpot', icon: Database, category: 'CRM' },
        mailchimp: { name: 'Mailchimp', icon: Mail, category: 'Email Marketing' },
        constantcontact: { name: 'Constant Contact', icon: Mail, category: 'Email Marketing' },
        sheets: { name: 'Google Sheets', icon: FileSpreadsheet, category: 'Spreadsheets' },
        airtable: { name: 'Airtable', icon: Database, category: 'Spreadsheets' },
        twilio: { name: 'Twilio', icon: MessageSquare, category: 'SMS' },
        zapier: { name: 'Zapier', icon: Zap, category: 'Automation' },
        make: { name: 'Make', icon: Zap, category: 'Automation' },
        webhook: { name: 'Custom Webhook', icon: Webhook, category: 'Developer' },
      };
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIntegrations(baseIntegrations);
          return;
        }
        const { data, error } = await supabase
          .from('integration_connections')
          .select('integration_id');
        if (error) {
          setIntegrations(baseIntegrations);
          return;
        }
        const connected = (data || []).map((row: any) => row.integration_id);
        const userIntegrations: Integration[] = connected
          .filter((id: string) => INTEGRATION_INFO[id])
          .map((id: string) => ({
            id,
            name: INTEGRATION_INFO[id].name,
            icon: INTEGRATION_INFO[id].icon,
            category: INTEGRATION_INFO[id].category,
            connected: true,
          }));
        setIntegrations([...baseIntegrations, ...userIntegrations]);
      } catch (e) {
        setIntegrations(baseIntegrations);
      }
    }
    fetchIntegrations();
  }, []);

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ];

  const availableSourceFields = [
    'address', 'price', 'bedrooms', 'bathrooms', 'sqft', 
    'listing_date', 'property_type', 'status', 'agent_name', 
    'agent_email', 'agent_phone', 'mls_number'
  ];

  const handleUpdateMapping = (index: number, field: 'source' | 'destination', value: string) => {
    setFieldMappings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, label: 'Custom' };
      return updated;
    });
  };

  const handleAddMapping = () => {
    setFieldMappings(prev => [...prev, {
      source: '',
      destination: '',
      label: 'Custom',
      required: false
    }]);
  };

  const handleRemoveMapping = (index: number) => {
    setFieldMappings(prev => prev.filter((_, i) => i !== index));
  };

  // Integrations that require a list/audience to be configured before activating
  const REQUIRED_LIST_INTEGRATIONS: Record<string, string> = {
    mailchimp: 'Add Audience in Mailchimp settings',
    sendgrid: 'Add Contact List in SendGrid settings',
    constantcontact: 'Add Contact List in Constant Contact settings',
  };

  const handleActivate = async () => {
    if (!selectedSearchId || !selectedDestination) return;
    setIsActivating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { toast.error('Not signed in'); return; }

      // Fetch saved integration config from the integrations page
      const { data: conn } = await supabase
        .from('integration_connections')
        .select('config')
        .eq('integration_id', selectedDestination)
        .single();

      const config = conn?.config ?? {};

      // Validate required fields for integrations that need a list/audience
      const requiredListError = REQUIRED_LIST_INTEGRATIONS[selectedDestination];
      if (requiredListError && !config.list_id) {
        toast.error(requiredListError);
        return;
      }

      const selectedSearch = getSelectedSearch();
      const criteria = selectedSearch?.criteria ?? {};

      // Guard: block automation creation if criteria has no location.
      // Without city/state/zip/address, run-automation will fetch up to 500
      // unconstrained results from RentCast — wasting API quota and producing bad data.
      const hasLocation = !!(criteria.city || criteria.state || criteria.zipCode || criteria.zip || criteria.address);
      if (!hasLocation) {
        toast.error('The selected search has no location (city, state, or zip). Please re-save the search with a location before automating it.');
        return;
      }

      const destIntegration = integrations.find((i: any) => i.id === selectedDestination);
      const now = new Date().toISOString();

      const { data: saved, error } = await supabase.from('automations').insert({
        user_id: session.user.id,
        name: automationName,
        search_name: selectedSearch?.name ?? null,
        destination_type: selectedDestination,
        destination_label: destIntegration?.name ?? selectedDestination,
        destination_config: config,
        search_criteria: criteria,
        schedule: syncFrequency,
        schedule_time: '08:00',
        active: true,
        created_at: now,
        updated_at: now,
      }).select().single();

      if (error) { console.error('[CreateAuto]', error); toast.error('Failed to save: ' + error.message); return; }

      onAutomationCreated?.({ id: saved.id, name: automationName, searchName: selectedSearch?.name ?? '', destination: { type: selectedDestination, label: destIntegration?.name ?? '', config }, schedule: syncFrequency, active: true });
      toast.success('Automation created: ' + automationName);
      if (walkthroughStep3Active) { completeStep(3); setShowCompleteModal(true); }
      setSelectedSearchId(''); setSelectedDestination(''); setSyncFrequency('daily'); setFieldMappings([]);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create automation');
    } finally {
      setIsActivating(false);
    }
  };

  const canContinue = !!(selectedSearchId && selectedDestination);

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  const { walkthroughStep, setWalkthroughStep } = useWalkthrough();

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <div className="space-y-8">
        {/* Combined Setup Section - Column Layout */}
        <section className="bg-transparent dark:bg-transparent">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-[21px] font-bold text-[#0F1115] dark:text-white">Create Automation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Select Search */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#0F1115] dark:text-white">
                Select Search
              </label>
              <select
                value={selectedSearchId}
                onChange={(e) => setSelectedSearchId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/20 bg-white dark:bg-[#0F1115] text-[#0F1115] dark:text-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FFCE0A] focus:border-[#FFCE0A]"
              >
                <option value="">Choose a saved search...</option>
                {currentCriteria && (
                  <option value="current-search">Current Search</option>
                )}
                {savedSearches.map(search => (
                  <option key={search.id} value={search.id}>{search.name}</option>
                ))}
              </select>
            </div>

            {/* Sync Frequency */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#0F1115] dark:text-white">
                Sync Frequency
              </label>
              <select
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/20 bg-white dark:bg-[#0F1115] text-[#0F1115] dark:text-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FFCE0A] focus:border-[#FFCE0A]"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Choose Destination */}
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#0F1115] dark:text-white">
                Choose Destination
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/20 bg-white dark:bg-[#0F1115] text-[#0F1115] dark:text-white rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FFCE0A] focus:border-[#FFCE0A]"
              >
                <option value="">Select destination...</option>
                {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
                  <optgroup key={category} label={category}>
                    {categoryIntegrations.map(integration => (
                      <option key={integration.id} value={integration.id}>
                        {integration.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Audit & Compliance Info */}
        {selectedDestination && (
          <section>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[13px] text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-700 dark:text-gray-200">Audit Reference:</strong> All transfers are logged in Account &gt; Compliance
                </p>
                <p className="text-[13px] text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-700 dark:text-gray-200">Data Controller Notice:</strong> You are the data controller; ListingBug processes data on your behalf.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Create Button */}
        <div className="flex justify-end">
          <LBButton
            onClick={handleActivate}
            disabled={!canContinue || isActivating}
            className="min-w-[200px]"
          >
            {isActivating ? 'Creating…' : 'Create Automation'}
            {!isActivating && <ArrowRight className="w-4 h-4 ml-2" />}
          </LBButton>
        </div>
      </div>

      {/* Walkthrough Complete Modal */}
      <WalkthroughCompleteModal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
        }}
      />
    </div>
  );
}
