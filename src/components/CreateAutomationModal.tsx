/** 
 * CREATE AUTOMATION WIZARD - 4-Step Flow (Processor Stance) 
 * STEPS: 1. Connect Destination 2. Preview & Test 3. Activate
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWalkthrough } from './WalkthroughContext';
import { InteractiveWalkthroughOverlay } from './InteractiveWalkthroughOverlay';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { LBButton } from './design-system/LBButton';
import {
  Zap, Mail, Send, Database, Webhook, FileSpreadsheet, MessageSquare,
  CheckCircle, ArrowRight, Shield, Info, Sparkles, MapPin, AlertTriangle,
  HelpCircle, ExternalLink, Eye, FileJson, User, Download, X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { TableColumnCustomizer, ColumnConfig } from './TableColumnCustomizer';
import { AutomationSampleTableRow } from './AutomationSampleTableRow';

interface CreateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSearch?: any;
  currentCriteria?: any;
  onAutomationCreated?: (automation: any) => void;
  onNavigate?: (page: string) => void;
}

interface Integration {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  requiresSetup: boolean;
  riskTier?: 'low' | 'medium' | 'high';
  setupFields?: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
  }[];
}

interface FieldMapping {
  source: string;
  destination: string;
  label: 'Suggested' | 'Custom';
  required: boolean;
}

interface ConsentSummary {
  total_contacts: number;
  verified_opt_in_count: number;
  verified_opt_in_percentage: number;
  missing_consent_count?: number;
  provenance_breakdown: { [key: string]: number };
}

interface ValidationResult {
  consent_percentage: number;
  suppression_count: number;
  total_contacts: number;
  verified_count: number;
  risk_assessment: string;
  sample_contacts: any[];
}

export function CreateAutomationModal({
  isOpen, onClose, savedSearch, currentCriteria, onAutomationCreated, onNavigate
}: CreateAutomationModalProps) {
  const [step, setStep] = useState(1);
  const [automationName, setAutomationName] = useState('');
  const [selectedSearchId, setSelectedSearchId] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [syncFrequency, setSyncFrequency] = useState('1');
  const [syncRate, setSyncRate] = useState('day');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [destinationConfig, setDestinationConfig] = useState<Record<string, string>>({});
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [mappingsAccepted, setMappingsAccepted] = useState(false);

  const [sampleResultsColumns, setSampleResultsColumns] = useState<ColumnConfig[]>([
    { id: 'address', label: 'Address', visible: true, required: true },
    { id: 'price', label: 'Price', visible: true },
    { id: 'contact', label: 'Contact', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'consent', label: 'Consent', visible: true, required: true },
  ]);

  const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();

  useEffect(() => {
    const stored = localStorage.getItem('listingbug_saved_searches');
    if (stored) {
      try {
        const searches = JSON.parse(stored);
        setSavedSearches(searches);
        if (savedSearch) {
          const matchingSearch = searches.find((s: any) => s.id === savedSearch.id);
          if (matchingSearch) setSelectedSearchId(matchingSearch.id);
        }
      } catch (e) { console.error('Failed to parse saved searches:', e); }
    }
    if (currentCriteria && !savedSearch) setSelectedSearchId('current-search');
  }, [isOpen, savedSearch, currentCriteria]);

  useEffect(() => {
    if (selectedDestination && selectedSearchId) {
      const search = getSelectedSearch();
      const destination = integrations.find(i => i.id === selectedDestination);
      if (search && destination) {
        const rateLabel = syncRateOptions.find(r => r.value === syncRate)?.label || 'Day';
        const frequencyLabel = syncFrequency === '1' ? rateLabel : `${syncFrequency}x ${rateLabel}`;
        setAutomationName(`${frequencyLabel} ${search.name} to ${destination.name}`);
      }
    }
  }, [selectedDestination, selectedSearchId, syncFrequency, syncRate]);

  useEffect(() => {
    if (isOpen && isStepActive(6)) completeStep(6);
  }, [isOpen, isStepActive]);

  useEffect(() => {
    if (selectedDestination && step === 1 && isStepActive(7)) {
      const timer = setTimeout(() => completeStep(7), 800);
      return () => clearTimeout(timer);
    }
  }, [selectedDestination, step, isStepActive]);

  const handleWalkthroughAutomationCreated = () => {
    if (isStepActive(8)) {
      completeStep(8);
      setTimeout(() => onNavigate?.('integrations'), 1500);
    }
  };

  const getSelectedSearch = () => {
    if (selectedSearchId === 'current-search' && currentCriteria) {
      return {
        id: 'current-search',
        name: 'Current Search',
        criteria: currentCriteria,
        activeFilters: [],
        criteriaDescription: formatCurrentCriteriaDescription(currentCriteria)
      };
    }
    return savedSearches.find(s => s.id === selectedSearchId);
  };

  const formatCurrentCriteriaDescription = (criteria: any) => {
    const parts = [];
    if (criteria.city || criteria.state) parts.push(`${[criteria.city, criteria.state].filter(Boolean).join(', ')}`);
    if (criteria.propertyType) parts.push(criteria.propertyType);
    if (criteria.minPrice || criteria.maxPrice) parts.push(`$${criteria.minPrice || '0'}-$${criteria.maxPrice || '∞'}`);
    return parts.length > 0 ? parts.join(' · ') : 'Custom search';
  };

  const integrations: Integration[] = [
    { id: 'csv-download', name: 'ListingBug CSV Download', icon: Download, connected: true, requiresSetup: false },
    { id: 'csv-email', name: 'CSV — Email Delivery', icon: Mail, connected: true, requiresSetup: true,
      setupFields: [{ key: 'delivery_email', label: 'Deliver CSV to email', placeholder: 'you@example.com', type: 'email' }] },
    { id: 'salesforce', name: 'Salesforce', icon: Database, connected: true, requiresSetup: false },
    { id: 'hubspot', name: 'HubSpot', icon: Database, connected: true, requiresSetup: false, riskTier: 'medium' },
    { id: 'mailchimp', name: 'Mailchimp', icon: Mail, connected: true, requiresSetup: true,
      setupFields: [
        { key: 'audience_id', label: 'Audience ID', placeholder: 'abc123' },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', type: 'password' }
      ]},
    { id: 'constantcontact', name: 'Constant Contact', icon: Mail, connected: true, requiresSetup: true,
      setupFields: [
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', type: 'password' },
        { key: 'list_id', label: 'Contact List ID', placeholder: 'Enter list ID' }
      ]},
    { id: 'sheets', name: 'Google Sheets', icon: FileSpreadsheet, connected: true, requiresSetup: true,
      setupFields: [{ key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1A2B3C4D...' }] },
    { id: 'airtable', name: 'Airtable', icon: Database, connected: true, requiresSetup: true,
      setupFields: [
        { key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX' },
        { key: 'table_id', label: 'Table ID', placeholder: 'tblXXXXXXXXXXXXXX' },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', type: 'password' }
      ]},
    { id: 'twilio', name: 'Twilio', icon: MessageSquare, connected: true, requiresSetup: true,
      setupFields: [
        { key: 'account_sid', label: 'Account SID', placeholder: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
        { key: 'auth_token', label: 'Auth Token', placeholder: 'Enter auth token', type: 'password' },
        { key: 'from_number', label: 'From Number', placeholder: '+1234567890' }
      ]},
    { id: 'zapier', name: 'Zapier', icon: Zap, connected: true, requiresSetup: true,
      setupFields: [{ key: 'webhook_url', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...', type: 'url' }] },
    { id: 'make', name: 'Make', icon: Zap, connected: true, requiresSetup: true,
      setupFields: [{ key: 'webhook_url', label: 'Make Webhook URL', placeholder: 'https://hook.integromat.com/...', type: 'url' }] },
    { id: 'webhook', name: 'Custom Webhook', icon: Webhook, connected: true, requiresSetup: true,
      setupFields: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://api.example.com/webhook', type: 'url' }] },
  ];

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const syncFrequencyOptions = [
    { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
    { value: '4', label: '4' }, { value: '6', label: '6' }, { value: '12', label: '12' }
  ];

  const syncRateOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ];

  const timeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        const time24 = `${hourStr}:${minuteStr}`;
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        times.push({ value: time24, label: `${hour12}:${minuteStr} ${period}` });
      }
    }
    return times;
  };

  const selectedIntegration = integrations.find(i => i.id === selectedDestination);

  const mockConsentSummary: ConsentSummary = {
    total_contacts: 65,
    verified_opt_in_count: 58,
    verified_opt_in_percentage: 89.2,
    missing_consent_count: 7,
    provenance_breakdown: { 'Form': 45, 'Phone': 8, 'In-person': 5, 'Imported': 7 }
  };

  const mockValidationResult: ValidationResult = {
    consent_percentage: 89.2,
    suppression_count: 3,
    total_contacts: 65,
    verified_count: 58,
    risk_assessment: selectedIntegration?.riskTier || 'low',
    sample_contacts: []
  };

  // Field mappings kept for payload generation / step 4 display — not shown as a wizard step
  const getFieldMappingsForDestination = (destinationType: string): FieldMapping[] => {
    // Note: Field mappings will be configured per integration at implementation time.
    const base: FieldMapping[] = [
      { source: 'listing_address', destination: 'property_address', label: 'Suggested', required: true },
      { source: 'listing_price', destination: 'price', label: 'Suggested', required: true },
      { source: 'listing_beds', destination: 'bedrooms', label: 'Suggested', required: false },
      { source: 'listing_baths', destination: 'bathrooms', label: 'Suggested', required: false },
      { source: 'agent_name', destination: 'contact_name', label: 'Suggested', required: true },
      { source: 'agent_email', destination: 'email', label: 'Suggested', required: true },
      { source: 'agent_phone', destination: 'phone', label: 'Suggested', required: false },
      { source: 'listing_city', destination: 'city', label: 'Suggested', required: true },
      { source: 'listing_state', destination: 'state', label: 'Suggested', required: true },
    ];
    return base;
  };

  useEffect(() => {
    if (selectedDestination) setFieldMappings(getFieldMappingsForDestination(selectedDestination));
  }, [selectedDestination]);

  const generateSamplePayload = () => [
    { property_address: '123 Main St', price: 450000, bedrooms: 3, bathrooms: 2, contact_name: 'John Agent', email: 'john@realestate.com', phone: '+14155551234', status: 'Active', city: 'Los Angeles', state: 'CA', consent_verified: true, consent_method: 'Website opt-in form' },
    { property_address: '456 Oak Ave', price: 575000, bedrooms: 4, bathrooms: 2.5, contact_name: 'Jane Smith', email: 'jane@realestate.com', phone: '+14155552222', status: 'Active', city: 'San Diego', state: 'CA', consent_verified: true, consent_method: 'Phone verification' },
    { property_address: '789 Pine Rd', price: 625000, bedrooms: 3, bathrooms: 2, contact_name: 'Bob Johnson', email: 'bob@realestate.com', phone: '+14155553333', status: 'Pending', city: 'Irvine', state: 'CA', consent_verified: true, consent_method: 'Trade show signup' },
    { property_address: '321 Elm St', price: 525000, bedrooms: 3, bathrooms: 2.5, contact_name: 'Sarah Williams', email: 'sarah@realestate.com', phone: '+14155554444', status: 'Active', city: 'Santa Monica', state: 'CA', consent_verified: true, consent_method: 'Email subscription' },
    { property_address: '555 Maple Dr', price: 695000, bedrooms: 4, bathrooms: 3, contact_name: 'Mike Davis', email: 'mike@realestate.com', status: 'Active', city: 'Pasadena', state: 'CA', consent_verified: false, consent_method: 'No consent - will be suppressed' },
  ];

  const handleFinalApproval = async () => {
    const automation = {
      id: `auto_${Date.now()}`,
      name: automationName,
      searchName: getSelectedSearch()?.name || 'Current Search',
      schedule: scheduleOptions.find(s => s.value === schedule)?.label || schedule,
      scheduleTime,
      syncFrequency,
      syncRate,
      syncFrequencyLabel: `${syncFrequency} time(s) each ${syncRateOptions.find(r => r.value === syncRate)?.label.toLowerCase()}`,
      destination: {
        type: selectedDestination,
        label: selectedIntegration?.name || selectedDestination,
        config: destinationConfig
      },
      searchCriteria: getSelectedSearch()?.criteria || {},
      activeFilters: getSelectedSearch()?.activeFilters || [],
      fieldMappings,
      active: true,
      createdAt: new Date().toISOString(),
      consentValidated: true,
      consentPercentage: mockConsentSummary.verified_opt_in_percentage,
      riskTier: selectedIntegration?.riskTier,
    };
    onAutomationCreated?.(automation);
    handleWalkthroughAutomationCreated();
    toast.success(`Automation "${automationName}" created successfully!`, {
      description: `${mockConsentSummary.verified_opt_in_count} verified contacts will be synced to ${selectedIntegration?.name}`
    });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setAutomationName('');
    setSelectedSearchId('');
    setSchedule('daily');
    setScheduleTime('08:00');
    setSyncFrequency('1');
    setSyncRate('day');
    setSelectedDestination('');
    setDestinationConfig({});
    setFieldMappings([]);
    setMappingsAccepted(false);
    onClose();
  };

  const canProceedToStep3 = selectedDestination &&
    (!selectedIntegration?.requiresSetup ||
      (selectedIntegration.setupFields?.every(f => destinationConfig[f.key]?.trim())));

  const getRiskBadge = () => {
    if (!selectedIntegration?.riskTier) return null;
    const tier = selectedIntegration.riskTier;
    const colors = { low: 'bg-green-100 text-green-800 border-green-300', medium: 'bg-yellow-100 text-yellow-800 border-yellow-300', high: 'bg-red-100 text-red-800 border-red-300' };
    const labels = { low: 'Tier A - Low Risk', medium: 'Tier B - Medium Risk', high: 'Tier C - High Risk' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-xs font-bold ${colors[tier]}`}>
        <Shield className="w-3 h-3" />{labels[tier]}
      </span>
    );
  };

  const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div className="group relative inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const orig = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = orig.overflow;
      document.body.style.position = orig.position;
      document.body.style.top = orig.top;
      document.body.style.width = orig.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose} aria-hidden="true" />
      <div className="fixed right-0 top-0 h-screen w-[calc(100%-12px)] md:w-[700px] lg:w-[800px] bg-white z-[9999] shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="flex-shrink-0 bg-[#FFD447] border-b border-[#FFD447]/20 px-3 md:px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                <Zap className="w-5 h-5 text-[#342E37]" />
                <h2 className="text-[21px] font-bold text-[#342E37]">Create Automation</h2>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors flex-shrink-0" aria-label="Close">
                <X className="w-5 h-5 text-[#342E37]" />
              </button>
            </div>
            <p className="text-[14px] text-[#342E37]/80">
              {step === 1 && 'Connect your destination and configure settings'}
              {step === 3 && 'Preview sample data and test your automation'}
              {step === 4 && 'Activate your automation'}
            </p>
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mt-4 px-2">
              {[{ num: 1, label: 'Connect' }, { num: 3, label: 'Preview' }, { num: 4, label: 'Activate' }].map((s, idx) => (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= s.num ? 'bg-[#FFD447] border-[#FFD447] text-[#342E37]' : 'bg-white border-gray-300 text-gray-400'} font-bold text-sm transition-all`}>
                      {idx + 1}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${step >= s.num ? 'text-[#342E37]' : 'text-gray-400'}`}>{s.label}</span>
                  </div>
                  {idx < 2 && <div className={`h-0.5 flex-1 mx-2 ${step > s.num ? 'bg-[#FFD447]' : 'bg-gray-300'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 md:px-6 py-6 space-y-6" data-walkthrough="wizard-content">

              {/* STEP 1: CONNECT DESTINATION */}
              {step === 1 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-[#000000]">Connect Destination</h3>
                    <Tooltip content="Choose where your listings will be sent automatically">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>

                  <div className="">
                    <p className="text-xs text-blue-900">
                      <Info className="w-3 h-3 inline mr-1" />
                      ListingBug processes data on your behalf. You are responsible for compliance with applicable marketing laws.
                      Data transfers are logged. <a href="#" onClick={(e) => { e.preventDefault(); toast.info('View logs in Account > Compliance'); }} className="underline font-bold">View logs in Account &gt; Compliance</a>
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 gap-3">
                      <LBSelect className="bg-[#c9dbff] bg-[#cadcff] bg-[#d4e2ff] bg-[#ebc400]"
                        label="Search"
                        options={[
                          ...(currentCriteria ? [{ value: 'current-search', label: '🔍 Current Search' }] : []),
                          ...savedSearches.map(s => ({ value: s.id, label: s.name }))
                        ]}
                        value={selectedSearchId}
                        onChange={setSelectedSearchId}
                        placeholder="Select search"
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label>
                        <div className="grid grid-cols-3 gap-2">
                          <LBSelect className="bg-[#ebc400]" options={syncFrequencyOptions} value={syncFrequency} onChange={setSyncFrequency} required />
                          <div className="col-span-2">
                            <LBSelect className="bg-[#ebc400]"
                              options={syncRateOptions.map(option => ({ value: option.value, label: `time(s) each ${option.label}` }))}
                              value={syncRate}
                              onChange={setSyncRate}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <LBSelect className="bg-[#ebc400]" label="Time" options={timeOptions()} value={scheduleTime} onChange={setScheduleTime} />
                    </div>
                    {selectedSearchId && (
                      <p className="text-xs text-blue-800 mt-2">
                        <strong>Will run:</strong> {syncFrequency} time(s) each {syncRateOptions.find(r => r.value === syncRate)?.label.toLowerCase()} at {timeOptions().find(t => t.value === scheduleTime)?.label}
                      </p>
                    )}
                    {(Number(syncFrequency) > 1 && syncRate === 'day') && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800"><strong>Heads up:</strong> Running more than once per day can lead to listing overages on your plan.</p>
                      </div>
                    )}
                  </div>

                  <LBInput label="Automation Name" value={automationName} onChange={(e) => setAutomationName(e.target.value)} placeholder="e.g., Daily Foreclosures to HubSpot" required />

                  <div className="border border-gray-300 rounded-lg overflow-hidden" data-walkthrough="destination-selector">
                    <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 grid grid-cols-2 gap-3 text-xs font-bold text-gray-700 uppercase">
                      <div>Integration</div>
                      <div className="text-right">Status</div>
                    </div>
                    <div className="divide-y divide-gray-200 bg-white">
                      {integrations.map((integration) => {
                        const Icon = integration.icon;
                        const isSelected = selectedDestination === integration.id;
                        return (
                          <button key={integration.id} onClick={() => setSelectedDestination(integration.id)} disabled={!integration.connected}
                            className={`w-full px-4 py-3 grid grid-cols-2 gap-3 items-center text-left transition-all ${isSelected ? 'bg-[#FFD447]/30 border-l-4 border-l-[#FFD447]' : integration.connected ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed bg-gray-50/50'}`}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-5 h-5 flex-shrink-0 ${integration.connected ? 'text-[#342E37]' : 'text-gray-400'}`} />
                              <span className="font-bold text-sm text-[#252525]">{integration.name}</span>
                              {isSelected && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-auto" />}
                            </div>
                            <div className="flex items-center justify-end">
                              {integration.connected
                                ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-bold"><CheckCircle className="w-3 h-3" />Connected</span>
                                : <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Not Connected</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedIntegration?.requiresSetup && selectedIntegration.setupFields && (
                    <div className="space-y-3 pt-4 border-t border-gray-300">
                      <h4 className="font-bold text-sm">Configure {selectedIntegration.name}</h4>
                      <p className="text-xs text-gray-500">Field mappings will be configured per integration at implementation time.</p>
                      {selectedIntegration.setupFields.map((field) => (
                        <LBInput key={field.key} label={field.label} type={field.type || 'text'}
                          value={destinationConfig[field.key] || ''}
                          onChange={(e) => setDestinationConfig({ ...destinationConfig, [field.key]: e.target.value })}
                          placeholder={field.placeholder} required />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* STEP 3: PREVIEW & TEST */}
              {step === 3 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-[#342E37]" />
                      <h3 className="font-bold text-lg text-[#000000]">Preview Sample Data</h3>
                      {getRiskBadge()}
                    </div>
                    <Tooltip content="This shows exactly what will be sent to your destination">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>

                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-sm text-[#000000]">Sample Payload (Max 5 Rows)</h4>
                        <TableColumnCustomizer tableId="automation-sample-results" columns={sampleResultsColumns} onColumnsChange={setSampleResultsColumns} />
                      </div>
                      <span className="text-xs text-gray-600 font-mono">POST /api/integrations/{selectedDestination}/sync</span>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                          <tr>
                            {sampleResultsColumns.filter(col => col.visible).map(col => (
                              <th key={col.id} className="px-3 py-2 text-left font-bold text-gray-700">{col.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {generateSamplePayload().map((row, idx) => (
                            <AutomationSampleTableRow key={idx} row={row} columns={sampleResultsColumns} index={idx} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">View Full JSON Payload</summary>
                    <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs font-mono">{JSON.stringify({
                      automation_id: `auto_${Date.now()}`,
                      destination_type: selectedDestination,
                      destination_config: destinationConfig,
                      field_mappings: fieldMappings,
                      contacts: generateSamplePayload(),
                      timestamp: new Date().toISOString()
                    }, null, 2)}</pre>
                  </details>
                </>
              )}

              {/* STEP 4: ACTIVATE */}
              {step === 4 && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-lg text-[#000000]">Activate Automation</h3>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-300">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-bold mb-1">AUTOMATION</p>
                        <p className="font-bold text-lg text-[#342E37]">{automationName}</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-green-800">Ready</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 font-bold mb-1.5 flex items-center gap-1"><Database className="w-3 h-3" /> SOURCE</p>
                        <p className="text-sm font-medium text-[#342E37]">{getSelectedSearch()?.name || 'Current search'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-bold mb-1.5 flex items-center gap-1"><Send className="w-3 h-3" /> DESTINATION</p>
                        <p className="text-sm font-medium text-[#342E37]">{selectedIntegration?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-bold mb-1.5 flex items-center gap-1"><Zap className="w-3 h-3" /> SCHEDULE</p>
                        <p className="text-sm font-medium text-[#342E37]">
                          {scheduleOptions.find(s => s.value === schedule)?.label} {timeOptions().find(t => t.value === scheduleTime)?.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs text-gray-700"><strong>{fieldMappings.length}</strong> fields mapped</span>
                      </div>
                      {Object.keys(destinationConfig).length > 0 && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-gray-700"><strong>{Object.keys(destinationConfig).length}</strong> config{Object.keys(destinationConfig).length !== 1 ? 's' : ''} set</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs text-green-800 font-bold">All checks passed</span>
                      </div>
                    </div>
                  </div>

                  <div className="">
                    <p className="text-xs text-blue-900">
                      <Info className="w-3 h-3 inline mr-1" />
                      This automation will start running on its next scheduled time. You can pause or edit it anytime from the Automations page.
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-300 bg-white px-3 md:px-6 py-4">
            <div className="flex gap-3 justify-between">
              <LBButton variant="outline" onClick={step === 1 ? handleClose : () => setStep(step === 3 ? 1 : step - 1)}>
                {step === 1 ? 'Cancel' : '← Back'}
              </LBButton>
              <div className="flex gap-2">
                {step < 4 && (
                  <LBButton variant="primary" onClick={() => setStep(step === 1 ? 3 : step + 1)} disabled={!canProceedToStep3}>
                    Next Step →
                  </LBButton>
                )}
                {step === 4 && (
                  <LBButton variant="primary" onClick={handleFinalApproval} className="min-w-[200px]">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Automation
                  </LBButton>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Walkthrough Overlays */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(7)} step={7} totalSteps={totalSteps}
        title="Choose where to send listings"
        description="Select 'ListingBug CSV Download' to complete this walkthrough. You can connect Mailchimp, Airtable, Zapier, and more from the Integrations page later."
        highlightSelector="[data-walkthrough='destination-selector']"
        tooltipPosition="auto" mode="wait-for-action" onSkip={skipWalkthrough} showSkip={true}
      />
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(8)} step={8} totalSteps={totalSteps}
        title="Name and activate automation"
        description="Give your automation a name, choose a frequency, then click through the wizard to activate."
        highlightSelector="[data-walkthrough='wizard-content']"
        tooltipPosition="auto" mode="wait-for-action" onSkip={skipWalkthrough} showSkip={true}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}
