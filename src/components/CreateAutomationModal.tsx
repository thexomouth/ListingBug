/**
 * CREATE AUTOMATION WIZARD - 4-Step Flow (Processor Stance)
 * 
 * API ENDPOINTS:
 * - POST /api/automations - Create automation
 * 
 * STEPS:
 * 1. Connect Destination - Select integration and configure
 * 2. Map Fields - Auto-mapping with suggested labels
 * 3. Preview & Test - Sample payload and test send
 * 4. Activate - Simple activation (no approval language)
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWalkthrough } from './WalkthroughContext';
import { supabase } from '../lib/supabase';
import { InteractiveWalkthroughOverlay } from './InteractiveWalkthroughOverlay';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { LBButton } from './design-system/LBButton';
import { 
  Zap, 
  Mail, 
  Send, 
  Database, 
  Webhook, 
  FileSpreadsheet, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Shield,
  Info,
  Sparkles,
  MapPin,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Eye,
  FileJson,
  User,
  Download,
  X
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
  provenance_breakdown: {
    [key: string]: number;
  };
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
  isOpen,
  onClose,
  savedSearch,
  currentCriteria,
  onAutomationCreated,
  onNavigate
}: CreateAutomationModalProps) {
  const [step, setStep] = useState(1);
  const [automationName, setAutomationName] = useState('');
  const [selectedSearchId, setSelectedSearchId] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [syncFrequency, setSyncFrequency] = useState('1'); // How many times
  const [syncRate, setSyncRate] = useState('day'); // Per day/week/month
  const [selectedDestination, setSelectedDestination] = useState('');
  const [destinationConfig, setDestinationConfig] = useState<Record<string, string>>({});
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadConnections = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('integration_connections')
        .select('integration_id')
        .eq('user_id', session.user.id);
      if (data) setConnectedIds(new Set(data.map((r: any) => r.integration_id)));
    };
    loadConnections();
  }, []);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [mappingsAccepted, setMappingsAccepted] = useState(false);
  
  // Column customization state for sample results table
  const [sampleResultsColumns, setSampleResultsColumns] = useState<ColumnConfig[]>([
    { id: 'address', label: 'Address', visible: true, required: true },
    { id: 'price', label: 'Price', visible: true },
    { id: 'contact', label: 'Contact', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'consent', label: 'Consent', visible: true, required: true },
  ]);
  
  // Walkthrough integration
  const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();

  // Load saved searches from localStorage AND Supabase
  // Supabase is the source of truth; localStorage is a cache that may be stale
  useEffect(() => {
    const loadSearches = async () => {
      // Try localStorage first for immediate render
      const stored = localStorage.getItem('listingbug_saved_searches');
      if (stored) {
        try {
          const searches = JSON.parse(stored);
          setSavedSearches(searches);
        } catch (e) {
          console.error('Failed to parse saved searches from localStorage:', e);
        }
      }

      // Then fetch from Supabase and merge/override
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: rows } = await supabase
            .from('searches')
            .select('id, name, location, filters_json, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (rows && rows.length > 0) {
            const searches = rows.map((r: any) => ({
              id: r.id,
              name: r.name,
              location: r.location,
              criteria: r.filters_json?.criteria ?? {},
              activeFilters: r.filters_json?.activeFilters ?? [],
              criteriaDescription: r.filters_json?.criteriaDescription ?? r.location,
            }));
            setSavedSearches(searches);
            // Keep localStorage in sync
            localStorage.setItem('listingbug_saved_searches', JSON.stringify(searches));
          }
        }
      } catch (e) {
        console.error('[CreateAutomationModal] Supabase search load failed:', e);
      }

      // Auto-select the passed-in saved search if provided
      if (savedSearch) {
        setSelectedSearchId(savedSearch.id);
      } else if (currentCriteria) {
        setSelectedSearchId('current-search');
      }
    };
    if (isOpen) loadSearches();
  }, [isOpen, savedSearch, currentCriteria]);

  // Auto-generate automation name
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
  
  // Walkthrough: Step 6 → Step 7 transition (when modal opens)
  useEffect(() => {
    if (isOpen && isStepActive(6)) {
      completeStep(6);
    }
  }, [isOpen, isStepActive]);
  
  // Walkthrough: Step 7 → Step 8 trigger (when destination selected)
  useEffect(() => {
    if (selectedDestination && step === 1 && isStepActive(7)) {
      // Small delay to allow user to see the selection
      const timer = setTimeout(() => {
        completeStep(7);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedDestination, step, isStepActive]);
  
  // Walkthrough: Step 8 → Step 9 trigger (when automation activated)
  const handleWalkthroughAutomationCreated = () => {
    if (isStepActive(8)) {
      completeStep(8);
      // Navigate to integrations page after a short delay
      setTimeout(() => {
        onNavigate?.('integrations');
      }, 1500);
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
    if (criteria.city || criteria.state) {
      parts.push(`${[criteria.city, criteria.state].filter(Boolean).join(', ')}`);
    }
    if (criteria.propertyType) {
      parts.push(criteria.propertyType);
    }
    if (criteria.minPrice || criteria.maxPrice) {
      parts.push(`$${criteria.minPrice || '0'}-$${criteria.maxPrice || '∞'}`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'Custom search';
  };

  /**
   * INTEGRATION DEFINITIONS
   * DATA BINDING: integration.id → automation.destination_type
   */
  const integrations: Integration[] = [
    // Native ListingBug
    { 
      id: 'csv-download', 
      name: 'ListingBug CSV Download', 
      icon: Download, 
      connected: true, 
      requiresSetup: false
    },
    {
      id: 'csv-email',
      name: 'CSV — Email Delivery',
      icon: Mail,
      connected: true,
      requiresSetup: true,
      setupFields: [
        { key: 'delivery_email', label: 'Deliver CSV to email', placeholder: 'you@example.com', type: 'email' }
      ]
    },
    // CRM
    { 
      id: 'salesforce', 
      name: 'Salesforce', 
      icon: Database, 
      connected: true, 
      requiresSetup: false
    },
    { 
      id: 'hubspot', 
      name: 'HubSpot', 
      icon: Database, 
      connected: connectedIds.has('hubspot'), 
      requiresSetup: false,
      riskTier: 'medium' // Tier B - CRM destination
    },
    // Email Marketing
    { 
      id: 'mailchimp', 
      name: 'Mailchimp', 
      icon: Mail, 
      connected: connectedIds.has('mailchimp'), 
      requiresSetup: true,
      setupFields: [
        { key: 'audience_id', label: 'Audience ID', placeholder: 'abc123' },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', type: 'password' }
      ]
    },
    { 
      id: 'constantcontact', 
      name: 'Constant Contact', 
      icon: Mail, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'list_id', label: 'Audience / List ID', placeholder: 'abc123def', hint: 'Found in Mailchimp → Audience → Settings → Audience ID' },
        { key: 'tags', label: 'Tags (optional)', placeholder: 'ListingBug, Denver Agents', hint: 'Comma-separated tags applied to each contact' },
        { key: 'double_opt_in', label: 'Double opt-in', type: 'select', options: [{value:'false',label:'No (subscribe immediately)'},{value:'true',label:'Yes (send confirmation email)'}] }
      ]
    },
    // Spreadsheets & Databases
    { 
      id: 'google', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: connectedIds.has('google'), 
      requiresSetup: true,
      setupFields: [
        { key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms', hint: 'In your Google Sheets URL between /d/ and /edit' },
        { key: 'sheet_name', label: 'Sheet Tab Name', placeholder: 'Sheet1', hint: 'The tab name at the bottom of your spreadsheet' },
        { key: 'write_mode', label: 'Write Mode', type: 'select', options: [{value:'append',label:'Append rows each run'},{value:'overwrite',label:'Overwrite each run'}] }
      ]
    },
    { 
      id: 'airtable', 
      name: 'Airtable', 
      icon: Database, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX' },
        { key: 'table_id', label: 'Table ID', placeholder: 'tblXXXXXXXXXXXXXX' },
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', type: 'password' }
      ]
    },
    // SMS
    { 
      id: 'twilio', 
      name: 'Twilio', 
      icon: MessageSquare, 
      connected: connectedIds.has('twilio'), 
      requiresSetup: true,
      setupFields: [
        { key: 'list_unique_name', label: 'Sync List Name', placeholder: 'listingbug_contacts', hint: 'Name of the Twilio Sync List to push contacts to' }
      ]
    },
    // Automation Platforms
    { 
      id: 'zapier', 
      name: 'Zapier', 
      icon: Zap, 
      connected: connectedIds.has('zapier'), 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...', type: 'url', hint: 'From Webhooks by Zapier → Catch Hook trigger' },
        { key: 'send_mode', label: 'Delivery Mode', type: 'select', options: [{value:'batch',label:'Batch (one request with all listings)'},{value:'individual',label:'Individual (one request per listing)'}] }
      ]
    },
    { 
      id: 'make', 
      name: 'Make', 
      icon: Zap, 
      connected: connectedIds.has('make'), 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'Make Webhook URL', placeholder: 'https://hook.make.com/...', type: 'url', hint: 'From Webhooks module → Custom Webhook trigger' },
        { key: 'send_mode', label: 'Delivery Mode', type: 'select', options: [{value:'batch',label:'Batch (one request with all listings)'},{value:'individual',label:'Individual (one request per listing)'}] }
      ]
    },
    // Developer Tools
    { 
      id: 'webhook', 
      name: 'Custom Webhook', 
      icon: Webhook, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://api.example.com/webhook', type: 'url' }
      ]
    },
    { 
      id: 'n8n', 
      name: 'n8n', 
      icon: Webhook, 
      connected: connectedIds.has('n8n'), 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'n8n Webhook URL', placeholder: 'https://your-n8n.com/webhook/...', type: 'url', hint: 'From a Webhook trigger node in your n8n workflow' },
        { key: 'send_mode', label: 'Delivery Mode', type: 'select', options: [{value:'batch',label:'Batch (one request with all listings)'},{value:'individual',label:'Individual (one request per listing)'}] }
      ]
    }
  ];

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const syncFrequencyOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '6', label: '6' },
    { value: '12', label: '12' }
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
        const time12 = `${hour12}:${minuteStr} ${period}`;
        
        times.push({ value: time24, label: time12 });
      }
    }
    return times;
  };

  const selectedIntegration = integrations.find(i => i.id === selectedDestination);

  /**
   * MOCK CONSENT DATA
   * API ENDPOINT: GET /api/consent/provenance?search_id={selectedSearchId}
   * RESPONSE SCHEMA: ConsentSummary
   * 
   * DATA BINDINGS:
   * - total_contacts → consent_summary.total_contacts
   * - verified_opt_in_count → consent_summary.verified_count
   * - verified_opt_in_percentage → consent_summary.consent_percentage
   * - provenance_breakdown → consent_summary.provenance_sources
   */
  const mockConsentSummary: ConsentSummary = {
    total_contacts: 65,
    verified_opt_in_count: 58,
    verified_opt_in_percentage: 89.2,
    missing_consent_count: 7,
    provenance_breakdown: {
      'Form': 45,
      'Phone': 8,
      'In-person': 5,
      'Imported': 7
    }
  };

  /**
   * MOCK SAMPLE CONTACTS FOR CONSENT PANEL
   * Shows detailed provenance and consent records
   */
  const mockSampleContacts = [
    {
      contact_id: 'cnt_001',
      contact_name: 'Jane Smith',
      contact_email: 'jane.smith@example.com',
      contact_phone: '+14155551234',
      provenance_source: 'Form' as const,
      provenance_method: 'Website opt-in form',
      provenance_timestamp: '2024-11-15T10:30:00Z',
      consent_flag: true,
      consent_method: 'Email opt-in checkbox',
      consent_timestamp: '2024-11-15T10:30:00Z',
      consent_ip: '192.168.1.1'
    },
    {
      contact_id: 'cnt_002',
      contact_name: 'John Doe',
      contact_email: 'john.doe@example.com',
      provenance_source: 'Phone' as const,
      provenance_method: 'Phone verification',
      provenance_timestamp: '2024-11-20T14:20:00Z',
      consent_flag: true,
      consent_method: 'Verbal consent recorded',
      consent_timestamp: '2024-11-20T14:20:00Z',
      consent_ip: '192.168.1.2'
    },
    {
      contact_id: 'cnt_003',
      contact_name: 'Sarah Johnson',
      contact_email: 'sarah.johnson@example.com',
      contact_phone: '+14155552222',
      provenance_source: 'In-person' as const,
      provenance_method: 'Trade show signup',
      provenance_timestamp: '2024-10-05T09:00:00Z',
      consent_flag: true,
      consent_method: 'Paper form signed',
      consent_timestamp: '2024-10-05T09:00:00Z',
      consent_ip: '192.168.1.3'
    },
    {
      contact_id: 'cnt_004',
      contact_name: 'Michael Brown',
      contact_email: 'michael.brown@example.com',
      provenance_source: 'Imported' as const,
      provenance_method: 'CSV import',
      provenance_timestamp: '2024-09-01T08:00:00Z',
      consent_flag: false,
      consent_method: 'No consent recorded',
      consent_timestamp: '',
      consent_ip: ''
    },
    {
      contact_id: 'cnt_005',
      contact_name: 'Emily Davis',
      contact_email: 'emily.davis@example.com',
      contact_phone: '+14155553333',
      provenance_source: 'Form' as const,
      provenance_method: 'Email subscription',
      provenance_timestamp: '2024-11-28T16:45:00Z',
      consent_flag: true,
      consent_method: 'Double opt-in confirmed',
      consent_timestamp: '2024-11-28T16:50:00Z',
      consent_ip: '192.168.1.4'
    }
  ];

  /**
   * MOCK VALIDATION RESULT
   * API ENDPOINT: POST /api/consent/validate
   * REQUEST BODY: { search_id, destination_type, destination_config }
   * RESPONSE SCHEMA: ValidationResult
   */
  const mockValidationResult: ValidationResult = {
    consent_percentage: 89.2,
    suppression_count: 3,
    total_contacts: 65,
    verified_count: 58,
    risk_assessment: selectedIntegration?.riskTier || 'low',
    sample_contacts: [
      {
        contact_id: 'cnt_001',
        email: 'jane.smith@example.com',
        phone: '+14155551234',
        consent_flag: true,
        consent_method: 'Website opt-in form',
        provenance_source: 'Form'
      },
      {
        contact_id: 'cnt_002',
        email: 'john.doe@example.com',
        consent_flag: true,
        consent_method: 'Phone verification',
        provenance_source: 'Phone'
      },
      {
        contact_id: 'cnt_003',
        email: 'sarah.johnson@example.com',
        phone: '+14155552222',
        consent_flag: true,
        consent_method: 'Trade show signup',
        provenance_source: 'In-person'
      },
      {
        contact_id: 'cnt_004',
        email: 'michael.brown@example.com',
        consent_flag: false,
        consent_method: 'No consent recorded',
        provenance_source: 'Imported'
      },
      {
        contact_id: 'cnt_005',
        email: 'emily.davis@example.com',
        phone: '+14155553333',
        consent_flag: true,
        consent_method: 'Email subscription',
        provenance_source: 'Form'
      }
    ]
  };

  /**
   * GENERATE FIELD MAPPINGS
   * DATA BINDING: Auto-generated based on destination_type
   * Each mapping has: source_field, destination_field, label (Suggested/Custom), required_flag
   * 
   * INDIVIDUALIZED MAPPINGS FOR EACH INTEGRATION
   */
  const getFieldMappingsForDestination = (destinationType: string): FieldMapping[] => {
    switch (destinationType) {
      // CSV DOWNLOAD - All available fields with clean headers
      case 'csv-download':
        return [
          { source: 'listing_address', destination: 'Property Address', label: 'Suggested', required: true },
          { source: 'listing_city', destination: 'City', label: 'Suggested', required: true },
          { source: 'listing_state', destination: 'State', label: 'Suggested', required: true },
          { source: 'listing_zip', destination: 'ZIP Code', label: 'Suggested', required: false },
          { source: 'listing_price', destination: 'Price', label: 'Suggested', required: true },
          { source: 'listing_beds', destination: 'Bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'Bathrooms', label: 'Suggested', required: false },
          { source: 'listing_sqft', destination: 'Square Feet', label: 'Suggested', required: false },
          { source: 'listing_type', destination: 'Property Type', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'Status', label: 'Suggested', required: false },
          { source: 'listing_date', destination: 'Date Listed', label: 'Suggested', required: false },
          { source: 'mls_number', destination: 'MLS Number', label: 'Suggested', required: false },
          { source: 'agent_name', destination: 'Agent Name', label: 'Suggested', required: false },
          { source: 'agent_email', destination: 'Agent Email', label: 'Suggested', required: false },
          { source: 'agent_phone', destination: 'Agent Phone', label: 'Suggested', required: false },
          { source: 'agent_company', destination: 'Brokerage', label: 'Suggested', required: false },
          { source: 'listing_url', destination: 'Listing URL', label: 'Suggested', required: false }
        ];
        
      // SALESFORCE - CRM Lead/Contact fields
      case 'salesforce':
        return [
          { source: 'agent_name', destination: 'FirstName', label: 'Suggested', required: true },
          { source: 'agent_last_name', destination: 'LastName', label: 'Suggested', required: true },
          { source: 'agent_email', destination: 'Email', label: 'Suggested', required: true },
          { source: 'agent_phone', destination: 'Phone', label: 'Suggested', required: false },
          { source: 'agent_company', destination: 'Company', label: 'Suggested', required: false },
          { source: 'listing_address', destination: 'Street', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'City', label: 'Suggested', required: false },
          { source: 'listing_state', destination: 'State', label: 'Suggested', required: false },
          { source: 'listing_zip', destination: 'PostalCode', label: 'Suggested', required: false },
          { source: 'listing_price', destination: 'LeadSource_PropertyValue__c', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'Status', label: 'Suggested', required: false },
          { source: 'listing_type', destination: 'LeadSource_PropertyType__c', label: 'Suggested', required: false }
        ];

      // HUBSPOT - Contact and Deal fields
      case 'hubspot':
        return [
          { source: 'agent_name', destination: 'firstname', label: 'Suggested', required: true },
          { source: 'agent_last_name', destination: 'lastname', label: 'Suggested', required: true },
          { source: 'agent_email', destination: 'email', label: 'Suggested', required: true },
          { source: 'agent_phone', destination: 'phone', label: 'Suggested', required: false },
          { source: 'listing_address', destination: 'address', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'city', label: 'Suggested', required: false },
          { source: 'listing_state', destination: 'state', label: 'Suggested', required: false },
          { source: 'listing_zip', destination: 'zip', label: 'Suggested', required: false },
          { source: 'listing_price', destination: 'property_value', label: 'Suggested', required: false },
          { source: 'listing_beds', destination: 'bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'bathrooms', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'hs_lead_status', label: 'Suggested', required: false },
          { source: 'agent_company', destination: 'company', label: 'Suggested', required: false }
        ];

      // MAILCHIMP - Email subscriber fields
      case 'mailchimp':
        return [
          { source: 'agent_email', destination: 'email_address', label: 'Suggested', required: true },
          { source: 'agent_name', destination: 'FNAME', label: 'Suggested', required: false },
          { source: 'agent_last_name', destination: 'LNAME', label: 'Suggested', required: false },
          { source: 'agent_phone', destination: 'PHONE', label: 'Suggested', required: false },
          { source: 'listing_address', destination: 'ADDRESS', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'CITY', label: 'Suggested', required: false },
          { source: 'listing_state', destination: 'STATE', label: 'Suggested', required: false },
          { source: 'listing_price', destination: 'PROPERTY_PRICE', label: 'Suggested', required: false },
          { source: 'listing_type', destination: 'PROPERTY_TYPE', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'LISTING_STATUS', label: 'Suggested', required: false }
        ];

      // CONSTANT CONTACT - Contact fields
      case 'constantcontact':
        return [
          { source: 'agent_email', destination: 'email_address', label: 'Suggested', required: true },
          { source: 'agent_name', destination: 'first_name', label: 'Suggested', required: false },
          { source: 'agent_last_name', destination: 'last_name', label: 'Suggested', required: false },
          { source: 'agent_phone', destination: 'phone_number', label: 'Suggested', required: false },
          { source: 'listing_address', destination: 'street_address', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'city', label: 'Suggested', required: false },
          { source: 'listing_state', destination: 'state', label: 'Suggested', required: false },
          { source: 'listing_zip', destination: 'postal_code', label: 'Suggested', required: false },
          { source: 'listing_price', destination: 'custom_field_property_value', label: 'Suggested', required: false },
          { source: 'agent_company', destination: 'company_name', label: 'Suggested', required: false }
        ];

      // GOOGLE SHEETS - Flexible column mapping
      case 'sheets':
        return [
          { source: 'listing_address', destination: 'Column A - Address', label: 'Suggested', required: true },
          { source: 'listing_price', destination: 'Column B - Price', label: 'Suggested', required: true },
          { source: 'listing_beds', destination: 'Column C - Bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'Column D - Bathrooms', label: 'Suggested', required: false },
          { source: 'listing_sqft', destination: 'Column E - Sq Ft', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'Column F - City', label: 'Suggested', required: true },
          { source: 'listing_state', destination: 'Column G - State', label: 'Suggested', required: true },
          { source: 'listing_zip', destination: 'Column H - ZIP', label: 'Suggested', required: false },
          { source: 'agent_name', destination: 'Column I - Agent Name', label: 'Suggested', required: false },
          { source: 'agent_email', destination: 'Column J - Agent Email', label: 'Suggested', required: false },
          { source: 'agent_phone', destination: 'Column K - Agent Phone', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'Column L - Status', label: 'Suggested', required: false },
          { source: 'listing_date', destination: 'Column M - Listing Date', label: 'Suggested', required: false }
        ];

      // AIRTABLE - Record fields
      case 'airtable':
        return [
          { source: 'listing_address', destination: 'Property Address', label: 'Suggested', required: true },
          { source: 'listing_price', destination: 'List Price', label: 'Suggested', required: true },
          { source: 'listing_beds', destination: 'Bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'Bathrooms', label: 'Suggested', required: false },
          { source: 'listing_sqft', destination: 'Square Footage', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'City', label: 'Suggested', required: true },
          { source: 'listing_state', destination: 'State', label: 'Suggested', required: true },
          { source: 'listing_zip', destination: 'ZIP Code', label: 'Suggested', required: false },
          { source: 'listing_type', destination: 'Property Type', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'Listing Status', label: 'Suggested', required: false },
          { source: 'agent_name', destination: 'Agent Name', label: 'Suggested', required: false },
          { source: 'agent_email', destination: 'Agent Email', label: 'Suggested', required: true },
          { source: 'agent_phone', destination: 'Agent Phone', label: 'Suggested', required: false },
          { source: 'listing_date', destination: 'Date Listed', label: 'Suggested', required: false }
        ];

      // TWILIO - SMS fields (phone-focused)
      case 'twilio':
        return [
          { source: 'agent_phone', destination: 'to_phone_number', label: 'Suggested', required: true },
          { source: 'agent_name', destination: 'recipient_name', label: 'Suggested', required: false },
          { source: 'listing_address', destination: 'property_address', label: 'Suggested', required: true },
          { source: 'listing_price', destination: 'property_price', label: 'Suggested', required: false },
          { source: 'listing_beds', destination: 'bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'bathrooms', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'city', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'listing_status', label: 'Suggested', required: false }
        ];

      // ZAPIER - Webhook payload fields
      case 'zapier':
        return [
          { source: 'listing_address', destination: 'property_address', label: 'Suggested', required: true },
          { source: 'listing_price', destination: 'price', label: 'Suggested', required: true },
          { source: 'listing_beds', destination: 'bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'bathrooms', label: 'Suggested', required: false },
          { source: 'listing_sqft', destination: 'square_feet', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'city', label: 'Suggested', required: true },
          { source: 'listing_state', destination: 'state', label: 'Suggested', required: true },
          { source: 'listing_zip', destination: 'zip_code', label: 'Suggested', required: false },
          { source: 'listing_type', destination: 'property_type', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'status', label: 'Suggested', required: false },
          { source: 'agent_name', destination: 'agent_name', label: 'Suggested', required: false },
          { source: 'agent_email', destination: 'agent_email', label: 'Suggested', required: true },
          { source: 'agent_phone', destination: 'agent_phone', label: 'Suggested', required: false },
          { source: 'listing_url', destination: 'listing_url', label: 'Suggested', required: false },
          { source: 'listing_date', destination: 'date_listed', label: 'Suggested', required: false }
        ];

      // MAKE - Webhook payload fields (similar to Zapier but with Make-specific naming)
      case 'make':
        return [
          { source: 'listing_address', destination: 'propertyAddress', label: 'Suggested', required: true },
          { source: 'listing_price', destination: 'listPrice', label: 'Suggested', required: true },
          { source: 'listing_beds', destination: 'bedroomCount', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'bathroomCount', label: 'Suggested', required: false },
          { source: 'listing_sqft', destination: 'squareFeet', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'cityName', label: 'Suggested', required: true },
          { source: 'listing_state', destination: 'stateCode', label: 'Suggested', required: true },
          { source: 'listing_zip', destination: 'postalCode', label: 'Suggested', required: false },
          { source: 'listing_type', destination: 'propertyType', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'listingStatus', label: 'Suggested', required: false },
          { source: 'agent_name', destination: 'agentFullName', label: 'Suggested', required: false },
          { source: 'agent_email', destination: 'agentEmailAddress', label: 'Suggested', required: true },
          { source: 'agent_phone', destination: 'agentPhoneNumber', label: 'Suggested', required: false },
          { source: 'listing_url', destination: 'listingUrl', label: 'Suggested', required: false },
          { source: 'mls_number', destination: 'mlsNumber', label: 'Suggested', required: false }
        ];

      // DEFAULT - Generic mapping
      default:
        return [
          { source: 'listing_address', destination: 'property_address', label: 'Suggested', required: true },
          { source: 'listing_price', destination: 'price', label: 'Suggested', required: true },
          { source: 'listing_beds', destination: 'bedrooms', label: 'Suggested', required: false },
          { source: 'listing_baths', destination: 'bathrooms', label: 'Suggested', required: false },
          { source: 'agent_name', destination: 'contact_name', label: 'Suggested', required: true },
          { source: 'agent_email', destination: 'email', label: 'Suggested', required: true },
          { source: 'agent_phone', destination: 'phone', label: 'Suggested', required: false },
          { source: 'listing_status', destination: 'status', label: 'Suggested', required: false },
          { source: 'listing_sqft', destination: 'square_footage', label: 'Suggested', required: false },
          { source: 'listing_city', destination: 'city', label: 'Suggested', required: true },
          { source: 'listing_state', destination: 'state', label: 'Suggested', required: true },
          { source: 'listing_zip', destination: 'zip_code', label: 'Suggested', required: false }
        ];
    }
  };

  useEffect(() => {
    if (selectedDestination) {
      const mappings = getFieldMappingsForDestination(selectedDestination);
      setFieldMappings(mappings);
    }
  }, [selectedDestination]);

  /**
   * GENERATE SAMPLE PAYLOAD
   * Shows actual data that will be sent (max 5 rows)
   * DATA BINDING: Maps source fields to destination fields based on accepted mappings
   */
  const generateSamplePayload = () => {
    return [
      {
        property_address: '123 Main St',
        price: 450000,
        bedrooms: 3,
        bathrooms: 2,
        contact_name: 'John Agent',
        email: 'john@realestate.com',
        phone: '+14155551234',
        status: 'Active',
        city: 'Los Angeles',
        state: 'CA',
        consent_verified: true,
        consent_method: 'Website opt-in form'
      },
      {
        property_address: '456 Oak Ave',
        price: 575000,
        bedrooms: 4,
        bathrooms: 2.5,
        contact_name: 'Jane Smith',
        email: 'jane@realestate.com',
        phone: '+14155552222',
        status: 'Active',
        city: 'San Diego',
        state: 'CA',
        consent_verified: true,
        consent_method: 'Phone verification'
      },
      {
        property_address: '789 Pine Rd',
        price: 625000,
        bedrooms: 3,
        bathrooms: 2,
        contact_name: 'Bob Johnson',
        email: 'bob@realestate.com',
        phone: '+14155553333',
        status: 'Pending',
        city: 'Irvine',
        state: 'CA',
        consent_verified: true,
        consent_method: 'Trade show signup'
      },
      {
        property_address: '321 Elm St',
        price: 525000,
        bedrooms: 3,
        bathrooms: 2.5,
        contact_name: 'Sarah Williams',
        email: 'sarah@realestate.com',
        phone: '+14155554444',
        status: 'Active',
        city: 'Santa Monica',
        state: 'CA',
        consent_verified: true,
        consent_method: 'Email subscription'
      },
      {
        property_address: '555 Maple Dr',
        price: 695000,
        bedrooms: 4,
        bathrooms: 3,
        contact_name: 'Mike Davis',
        email: 'mike@realestate.com',
        status: 'Active',
        city: 'Pasadena',
        state: 'CA',
        consent_verified: false,
        consent_method: 'No consent - will be suppressed'
      }
    ];
  };

  /**
   * HANDLE FINAL APPROVAL
   * API ENDPOINT: POST /api/automations
   * REQUEST BODY: {
   *   name, search_id, schedule, schedule_time,
   *   destination_type, destination_config,
   *   field_mappings, consent_validated, owner_id
   * }
   * 
   * THEN LOG EVENT
   * API ENDPOINT: POST /api/ledger/events
   * REQUEST BODY: {
   *   event_type: 'automation_approved',
   *   owner_id, automation_id, destination_type,
   *   consent_percentage, risk_tier, timestamp, ip_address
   * }
   */
  const handleFinalApproval = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { toast.error('Not signed in'); return; }

      const selectedSearch = getSelectedSearch();

      // Guard: never save an automation with empty search criteria — it will flood RentCast
      // with an unconstrained query and return up to 500 listings with no location filter.
      const criteria = selectedSearch?.criteria ?? {};
      const hasLocation = criteria.city || criteria.state || criteria.zipCode || criteria.address;
      if (!hasLocation && selectedSearchId !== 'current-search') {
        console.error('[CreateAutomation] Refusing to save automation — search criteria is missing location:', criteria);
        toast.error('This search has no location set. Please edit it in Saved Searches before automating.');
        return;
      }
      // currentCriteria path: validate it too
      if (selectedSearchId === 'current-search' && currentCriteria) {
        const hasCurrentLocation = currentCriteria.city || currentCriteria.state || currentCriteria.zipCode || currentCriteria.address;
        if (!hasCurrentLocation) {
          toast.error('Please enter a city or ZIP before automating the current search.');
          return;
        }
      }

      console.log('[CreateAutomation] Saving with criteria:', criteria);
      const now = new Date().toISOString();

      // Save automation to Supabase
      const { data: saved, error } = await supabase.from('automations').insert({
        user_id: session.user.id,
        name: automationName,
        search_name: selectedSearch?.name ?? null,
        destination_type: selectedDestination,
        destination_label: selectedIntegration?.name ?? selectedDestination,
        destination_config: destinationConfig ?? {},
        search_criteria: selectedSearch?.criteria ?? criteria,
        active_filters: selectedSearch?.activeFilters ?? [],
        schedule: schedule,
        schedule_time: scheduleTime,
        sync_frequency: syncFrequency,
        sync_rate: syncRate,
        active: true,
        created_at: now,
        updated_at: now,
      }).select().single();

      if (error) {
        console.error('[CreateAutomation] DB insert error:', error);
        toast.error(`Failed to save automation: ${error.message}`);
        return;
      }

      const automation = {
        id: saved.id,
        name: automationName,
        searchName: selectedSearch?.name ?? '',
        schedule: scheduleOptions.find(s => s.value === schedule)?.label || schedule,
        destination: { type: selectedDestination, label: selectedIntegration?.name ?? selectedDestination, config: destinationConfig },
        searchCriteria: selectedSearch?.criteria ?? {},
        active: true,
        createdAt: now,
      };

      onAutomationCreated?.(automation);
      handleWalkthroughAutomationCreated();
      toast.success(`Automation "${automationName}" created!`);
      handleClose();
    } catch (err: any) {
      console.error('[CreateAutomation] unexpected error:', err);
      toast.error(err.message ?? 'Failed to create automation');
    }
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

  const canProceedToStep2 = selectedDestination &&
    (!selectedIntegration?.requiresSetup ||
      (selectedIntegration.setupFields?.every((f: any) =>
        f.type === 'select' || destinationConfig[f.key]?.trim()
      )));
  
  // Field mapping step is hidden — step 1 jumps directly to step 3
  const canProceedToStep3 = canProceedToStep2;

  const getRiskBadge = () => {
    if (!selectedIntegration) return null;
    const tier = selectedIntegration.riskTier;
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-red-100 text-red-800 border-red-300'
    };
    const labels = {
      low: 'Tier A - Low Risk',
      medium: 'Tier B - Medium Risk',
      high: 'Tier C - High Risk'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-xs font-bold ${colors[tier]}`}>
        <Shield className="w-3 h-3" />
        {labels[tier]}
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

  // Handle scroll lock
  useEffect(() => {
    if (!isOpen) return;
    
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.left = '0';
    document.body.style.right = '0';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Side Drawer */}
      <div 
        className="fixed right-0 top-0 h-screen w-[calc(100%-12px)] md:w-[700px] lg:w-[800px] bg-white z-[9999] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Wrapper for flex layout */}
        <div className="h-full flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 bg-[#FFD447] border-b border-[#FFD447]/20 px-3 md:px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                <Zap className="w-5 h-5 text-[#342E37]" />
                <h2 className="text-[21px] font-bold text-[#342E37]">Create Automation</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close"
              >
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
            {[
              { num: 1, label: 'Connect' },
              { num: 3, label: 'Preview' },
              { num: 4, label: 'Activate' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= s.num 
                      ? 'bg-[#FFD447] border-[#FFD447] text-[#342E37]' 
                      : 'bg-white border-gray-300 text-gray-400'
                  } font-bold text-sm transition-all`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    step >= s.num ? 'text-[#342E37]' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    step > s.num ? 'bg-[#FFD447]' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div 
              className="px-3 md:px-6 py-6 space-y-6"
              data-walkthrough="wizard-content"
            >
            {/* STEP 1: CONNECT DESTINATION */}
            {step === 1 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-[#000000]">Connect Destination</h3>
                  <Tooltip content="Choose where your listings will be sent automatically">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>

                {/* Disclaimer */}
                <div className="">
                  <p className="text-xs text-blue-900">
                    <Info className="w-3 h-3 inline mr-1" />
                    ListingBug processes data on your behalf. You are responsible for compliance with applicable marketing laws. 
                    Data transfers are logged. <a href="#" onClick={(e) => { e.preventDefault(); toast.info('View logs in Account > Compliance'); }} className="underline font-bold">View logs in Account &gt; Compliance</a>
                  </p>
                </div>

                {/* Search & Schedule Selection */}
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
                    
                    {/* Sync Frequency - Two-step input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sync Frequency
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <LBSelect className="bg-[#ebc400]"
                          options={syncFrequencyOptions}
                          value={syncFrequency}
                          onChange={setSyncFrequency}
                          required
                        />
                        <div className="col-span-2">
                          <LBSelect className="bg-[#ebc400]"
                            options={syncRateOptions.map(option => ({
                              value: option.value,
                              label: `time(s) each ${option.label}`
                            }))}
                            value={syncRate}
                            onChange={setSyncRate}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <LBSelect className="bg-[#ebc400]"
                      label="Time"
                      options={timeOptions()}
                      value={scheduleTime}
                      onChange={setScheduleTime}
                    />
                  </div>
                  {selectedSearchId && (
                    <p className="text-xs text-blue-800 mt-2">
                      <strong>Will run:</strong> {syncFrequency} time(s) each {syncRateOptions.find(r => r.value === syncRate)?.label.toLowerCase()} at {timeOptions().find(t => t.value === scheduleTime)?.label}
                    </p>
                  )}
                  {(Number(syncFrequency) > 1 && syncRate === 'day') && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        <strong>Heads up:</strong> Automations are designed for daily updates — running more than once per day can lead to listing overages on your plan.
                      </p>
                    </div>
                  )}
                </div>

                {/* Automation Name */}
                <LBInput
                  label="Automation Name"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                  placeholder="e.g., Daily Foreclosures to HubSpot"
                  required
                />

                {/* Destination Selection Table */}
                <div 
                  className="border border-gray-300 rounded-lg overflow-hidden"
                  data-walkthrough="destination-selector"
                >
                  <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 grid grid-cols-2 gap-3 text-xs font-bold text-gray-700 uppercase">
                    <div>Integration</div>
                    <div className="text-right">Status</div>
                  </div>

                  <div className="divide-y divide-gray-200 bg-white">
                    {integrations.map((integration) => {
                      const Icon = integration.icon;
                      const isSelected = selectedDestination === integration.id;
                      return (
                        <button
                          key={integration.id}
                          onClick={() => setSelectedDestination(integration.id)}
                          disabled={!integration.connected}
                          className={`w-full px-4 py-3 grid grid-cols-2 gap-3 items-center text-left transition-all ${
                            isSelected
                              ? 'bg-[#FFD447]/30 border-l-4 border-l-[#FFD447]'
                              : integration.connected
                              ? 'hover:bg-gray-50'
                              : 'opacity-50 cursor-not-allowed bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 flex-shrink-0 ${
                              integration.connected ? 'text-[#342E37]' : 'text-gray-400'
                            }`} />
                            <span className="font-bold text-sm text-[#252525]">{integration.name}</span>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-auto" />
                            )}
                          </div>

                          <div className="flex items-center justify-end">
                            {integration.connected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-bold">
                                <CheckCircle className="w-3 h-3" />
                                Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                Not Connected
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Configuration Fields */}
                {selectedIntegration?.requiresSetup && selectedIntegration.setupFields && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Configure {selectedIntegration.name}
                    </h4>
                    {selectedIntegration.setupFields.map((field: any) => (
                      <div key={field.key} className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {field.label}
                          {field.required !== false && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white"
                            value={destinationConfig[field.key] || (field.options?.[0]?.value ?? '')}
                            onChange={(e) => setDestinationConfig({ ...destinationConfig, [field.key]: e.target.value })}
                          >
                            {(field.options ?? []).map((opt: any) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                            className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder={field.placeholder}
                            value={destinationConfig[field.key] || ''}
                            onChange={(e) => setDestinationConfig({ ...destinationConfig, [field.key]: e.target.value })}
                          />
                        )}
                        {field.hint && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
                        )}
                      </div>
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  

                  

                  
                </div>

                {/* Sample Payload */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-sm text-[#000000]">Sample Payload (Max 5 Rows)</h4>
                      <TableColumnCustomizer
                        tableId="automation-sample-results"
                        columns={sampleResultsColumns}
                        onColumnsChange={setSampleResultsColumns}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-mono">
                      POST /api/integrations/{selectedDestination}/sync
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-300 sticky top-0">
                        <tr>
                          {sampleResultsColumns.filter(col => col.visible).map(col => (
                            <th key={col.id} className="px-3 py-2 text-left font-bold text-gray-700">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {generateSamplePayload().map((row, idx) => (
                          <AutomationSampleTableRow
                            key={idx}
                            row={row}
                            columns={sampleResultsColumns}
                            index={idx}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Full Payload Preview */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View Full JSON Payload
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs font-mono">
{JSON.stringify({
  automation_id: `auto_${Date.now()}`,
  destination_type: selectedDestination,
  destination_config: destinationConfig,
  field_mappings: fieldMappings,
  contacts: generateSamplePayload(),
  consent_summary: mockConsentSummary,
  timestamp: new Date().toISOString()
}, null, 2)}
                  </pre>
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

                {/* Compact Summary Card */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-5">
                  {/* Top Row - Name and Status */}
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

                  {/* Compact 3-Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 font-bold mb-1.5 flex items-center gap-1">
                        <Database className="w-3 h-3" /> SOURCE
                      </p>
                      <p className="text-sm font-medium text-[#342E37]">{getSelectedSearch()?.name || 'Current search'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 font-bold mb-1.5 flex items-center gap-1">
                        <Send className="w-3 h-3" /> DESTINATION
                      </p>
                      <p className="text-sm font-medium text-[#342E37]">{selectedIntegration?.name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 font-bold mb-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> SCHEDULE
                      </p>
                      <p className="text-sm font-medium text-[#342E37]">
                        {scheduleOptions.find(s => s.value === schedule)?.label} {timeOptions().find(t => t.value === scheduleTime)?.label}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row - Quick Stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-300">
                    {Object.keys(destinationConfig).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs text-gray-700">
                          <strong>{Object.keys(destinationConfig).length}</strong> config{Object.keys(destinationConfig).length !== 1 ? 's' : ''} set
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-800 font-bold">All checks passed</span>
                    </div>
                  </div>
                </div>

                {/* Action Info */}
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
          
          {/* Footer - Fixed */}
          <div className="flex-shrink-0 border-t border-gray-300 bg-white px-3 md:px-6 py-4">
            <div className="flex gap-3 justify-between">
              <LBButton 
                variant="outline" 
                onClick={step === 1 ? handleClose : () => setStep(step === 3 ? 1 : step - 1)}
              >
                {step === 1 ? 'Cancel' : '← Back'}
              </LBButton>
              
              <div className="flex gap-2">
                {step < 4 && (
                  <LBButton 
                    variant="primary"
                    onClick={() => setStep(step === 1 ? 3 : step + 1)}
                    disabled={
                      (step === 1 && !canProceedToStep3) ||
                      (step === 2 && !canProceedToStep3)
                    }
                  >
                    Next Step →
                  </LBButton>
                )}
                
                {step === 4 && (
                  <LBButton 
                    variant="primary"
                    onClick={handleFinalApproval}
                    className="min-w-[200px]"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Automation
                  </LBButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Walkthrough Overlays - Steps 7-8 */}
      
      {/* Step 7: Select Destination */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(7)}
        step={7}
        totalSteps={totalSteps}
        title="Choose where to send listings"
        description="Select 'ListingBug CSV Download' to complete this walkthrough. You can connect Mailchimp, Airtable, Zapier, and more from the Integrations page later."
        highlightSelector="[data-walkthrough='destination-selector']"
        tooltipPosition="auto"
        mode="wait-for-action"
        onSkip={skipWalkthrough}
        showSkip={true}
      />
      
      {/* Step 8: Activate Automation */}
      <InteractiveWalkthroughOverlay
        isActive={isStepActive(8)}
        step={8}
        totalSteps={totalSteps}
        title="Name and activate automation"
        description="Give your automation a name (e.g., 'Miami Condos Weekly'), choose a frequency, then click through the wizard to activate. Your listings will be delivered automatically on schedule."
        highlightSelector="[data-walkthrough='wizard-content']"
        tooltipPosition="auto"
        mode="wait-for-action"
        onSkip={skipWalkthrough}
        showSkip={true}
      />
    </>
  );

  return createPortal(modalContent, document.body);
}