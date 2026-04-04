import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import {
  Zap, Mail, Database, Webhook, FileSpreadsheet, MessageSquare,
  X, Edit2, CheckCircle, XCircle, AlertTriangle, Plus, Lock
} from 'lucide-react';
import { toast } from 'react-toastify';

interface ViewEditAutomationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  automation: any;
  onAutomationUpdated?: (automation: any) => void;
  onViewDetail?: (automation: any) => void;
  onViewHistory?: () => void;
}

const LAUNCH_INTEGRATIONS = [
  { id: 'zapier',    name: 'Zapier',        icon: Zap,             webhookField: true },
  { id: 'make',      name: 'Make.com',      icon: Zap,             webhookField: true },
  { id: 'n8n',       name: 'n8n',           icon: Webhook,         webhookField: true },
  { id: 'webhook',   name: 'Webhooks',      icon: Webhook,         webhookField: true },
  { id: 'mailchimp', name: 'Mailchimp',     icon: Mail,            webhookField: false },
  { id: 'google',    name: 'Google Sheets', icon: FileSpreadsheet, webhookField: false },
  { id: 'hubspot',   name: 'HubSpot',       icon: Database,        webhookField: false },
  { id: 'sendgrid',  name: 'SendGrid',      icon: Mail,            webhookField: false },
  { id: 'twilio',    name: 'Twilio',        icon: MessageSquare,   webhookField: false },
];

function CriteriaRow({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === '' || value === false) return null;
  const display = typeof value === 'boolean' ? 'Yes' : String(value);
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-[12px] text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 dark:text-white ml-4 text-right">{display}</span>
    </div>
  );
}

export function ViewEditAutomationDrawer({
  isOpen, onClose, automation, onAutomationUpdated, onViewHistory,
}: ViewEditAutomationDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [automationName, setAutomationName] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [originalDestination, setOriginalDestination] = useState('');
  const [originalDestinationLabel, setOriginalDestinationLabel] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [daysOld, setDaysOld] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoadingConnections(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('integration_connections')
          .select('integration_id')
          .eq('user_id', user.id);
        setConnectedIntegrations((data ?? []).map((r: any) => r.integration_id));
      } catch (e) { console.error(e); }
      finally { setLoadingConnections(false); }
    };
    load();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && automation) {
      setAutomationName(automation.name ?? '');
      setSelectedDestination(automation.destination?.type ?? '');
      setOriginalDestination(automation.destination?.type ?? '');
      setOriginalDestinationLabel(automation.destination?.label ?? automation.destination?.type ?? '');
      setWebhookUrl(automation.destination?.config?.webhook_url ?? '');
      const c = automation.searchCriteria ?? {};
      setDaysOld(c.daysOld != null ? String(c.daysOld) : '');
      setMinPrice(c.minPrice != null ? String(c.minPrice) : '');
      setMaxPrice(c.maxPrice != null ? String(c.maxPrice) : '');
      setPropertyType(c.propertyType ?? '');
      setBedrooms(c.bedrooms != null ? String(c.bedrooms) : '');
    }
  }, [isOpen, automation]);

  // When destination changes, update the auto-generated name suffix.
  const handleDestinationChange = (newDestId: string) => {
    setSelectedDestination(newDestId);
    if (newDestId === originalDestination) return;
    const newIntegration = LAUNCH_INTEGRATIONS.find(i => i.id === newDestId);
    if (!newIntegration) return;
    const suffix = ` to ${originalDestinationLabel}`;
    if (automationName.endsWith(suffix)) {
      setAutomationName(automationName.slice(0, -suffix.length) + ` to ${newIntegration.name}`);
    }
  };

  const handleClose = () => { setIsEditing(false); onClose(); };

  const handleSave = async () => {
    if (!automationName.trim()) { toast.error('Automation name is required'); return; }
    if (!selectedDestination) { toast.error('Please select a destination'); return; }
    if (daysOld === '' || !/^\d+$/.test(daysOld.trim()) || parseInt(daysOld) <= 0) {
      toast.error('Days Listed is required and must be a single positive number (e.g. 1, 30, 200)');
      return;
    }
    const integration = LAUNCH_INTEGRATIONS.find(i => i.id === selectedDestination);
    if (integration?.webhookField && !webhookUrl.trim()) {
      toast.error(`Webhook URL is required for ${integration.name}`);
      return;
    }

    // Location (city, state, zip) is intentionally NOT updated here.
    // Changing location requires delete + recreate to ensure RentCast
    // receives a correctly formatted, validated city/state.
    const updatedCriteria = {
      ...automation.searchCriteria,
      daysOld: parseInt(daysOld),
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      propertyType: propertyType || undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
    };

    let destConfig: Record<string, any> = {};
    if (selectedDestination !== originalDestination) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: connRow } = await supabase
          .from('integration_connections')
          .select('config')
          .eq('user_id', user.id)
          .eq('integration_id', selectedDestination)
          .maybeSingle();
        destConfig = connRow?.config ?? {};
      }
      if (integration?.webhookField) {
        destConfig = { ...destConfig, webhook_url: webhookUrl };
      }
    } else {
      destConfig = {
        ...(automation.destination?.config ?? {}),
        ...(integration?.webhookField ? { webhook_url: webhookUrl } : {}),
      };
    }

    const destLabel = integration?.name ?? selectedDestination;

    if (automation.id) {
      const { error } = await supabase.from('automations').update({
        name: automationName,
        destination_type: selectedDestination,
        destination_label: destLabel,
        destination_config: destConfig,
        search_criteria: updatedCriteria,
        updated_at: new Date().toISOString(),
      }).eq('id', automation.id);
      if (error) { toast.error('Failed to save: ' + error.message); return; }
    }

    onAutomationUpdated?.({
      ...automation,
      name: automationName,
      destination: { ...automation.destination, type: selectedDestination, label: destLabel, config: destConfig },
      searchCriteria: updatedCriteria,
    });
    toast.success('Automation updated');
    setIsEditing(false);
    onClose();
  };

  if (!isOpen || !automation) return null;

  const criteria = automation.searchCriteria ?? {};
  const hasCriteria = Object.values(criteria).some(v => v !== undefined && v !== null && v !== '' && v !== false);
  const selectedIntegration = LAUNCH_INTEGRATIONS.find(i => i.id === selectedDestination);
  const availableIntegrations = LAUNCH_INTEGRATIONS.filter(i => connectedIntegrations.includes(i.id));

  // Display string for the locked location
  const lockedLocation = [criteria.city, criteria.state].filter(Boolean).join(', ') || criteria.zipCode || '—';

  const modal = (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-[#1a1a1a] z-50 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#FFD447] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {isEditing ? <Edit2 className="w-5 h-5 text-[#342e37]" /> : <Zap className="w-5 h-5 text-[#342e37]" />}
            <h2 className="font-bold text-[18px] text-[#342e37]">
              {isEditing ? 'Edit Automation' : 'Automation Details'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[#342e37]/10 transition-colors">
            <X className="w-5 h-5 text-[#342e37]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* ── VIEW MODE ─────────────────────────────────────── */}
          {!isEditing && (
            <>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Automation</p>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[13px] text-gray-500">Name</span>
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white">{automation.name}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[13px] text-gray-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${automation.active ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${automation.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {automation.active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[13px] text-gray-500">Schedule</span>
                  <span className="text-[13px] font-medium text-gray-900 dark:text-white">{automation.schedule ?? 'Daily'}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[13px] text-gray-500">Destination</span>
                  <span className="text-[13px] font-medium text-gray-900 dark:text-white">{automation.destination?.label ?? '—'}</span>
                </div>
                {automation.destination?.config?.webhook_url && (
                  <div className="flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                    <span className="text-[13px] text-gray-500">Webhook</span>
                    <span className="text-[11px] text-gray-500 font-mono ml-4 max-w-[220px] truncate">{automation.destination.config.webhook_url}</span>
                  </div>
                )}
                {automation.lastRun && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[13px] text-gray-500">Last Run</span>
                    <div className="flex items-center gap-2">
                      {automation.lastRun.status === 'success' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span className="text-[12px] text-gray-500">{automation.lastRun.date ? new Date(automation.lastRun.date).toLocaleDateString() : '—'}</span>
                      <span className={`text-[12px] font-medium ${automation.lastRun.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                        {automation.lastRun.status === 'success' ? `${automation.lastRun.listingsSent ?? 0} sent` : 'Failed'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Search Criteria</p>
                {hasCriteria ? (
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-1">
                    <CriteriaRow label="Location" value={[criteria.city, criteria.state].filter(Boolean).join(', ') || criteria.zipCode} />
                    {!criteria.city && <CriteriaRow label="ZIP Code" value={criteria.zipCode} />}
                    <CriteriaRow label="Days Listed" value={criteria.daysOld} />
                    <CriteriaRow label="Property Type" value={criteria.propertyType} />
                    <CriteriaRow label="Min Price" value={criteria.minPrice ? `$${Number(criteria.minPrice).toLocaleString()}` : undefined} />
                    <CriteriaRow label="Max Price" value={criteria.maxPrice ? `$${Number(criteria.maxPrice).toLocaleString()}` : undefined} />
                    <CriteriaRow label="Bedrooms" value={criteria.bedrooms} />
                    <CriteriaRow label="Bathrooms" value={criteria.bathrooms} />
                    <CriteriaRow label="Min Sqft" value={criteria.squareFootage} />
                    <CriteriaRow label="Year Built" value={criteria.yearBuilt} />
                    <CriteriaRow label="Price Drop" value={criteria.priceDrop} />
                    <CriteriaRow label="Foreclosure" value={criteria.foreclosure} />
                    <CriteriaRow label="Re-Listed" value={criteria.reListedProperty} />
                    <CriteriaRow label="Radius (mi)" value={criteria.radius} />
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-400 italic">No search criteria stored. Edit this automation to configure the search.</p>
                )}
              </div>

              {automation.lastRun?.status === 'failed' && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-red-700 dark:text-red-400 mb-1">Last run failed</p>
                    <p className="text-[12px] text-red-600 dark:text-red-300">{automation.lastRun.details ?? 'Ensure Days Listed is set and your integration is connected.'}</p>
                    <button onClick={() => setIsEditing(true)} className="mt-2 text-[12px] font-bold text-red-700 dark:text-red-400 underline underline-offset-2">Fix in Edit →</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── EDIT MODE ─────────────────────────────────────── */}
          {isEditing && (
            <>
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-gray-600 dark:text-gray-400">Automation Name</label>
                <input
                  value={automationName}
                  onChange={e => setAutomationName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A]"
                />
              </div>

              {/* Search criteria */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Search Criteria</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">Edit these to fix failing automations. Days Listed is required.</p>

                {/* Location — locked */}
                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                  <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      Location: <span className="font-bold">{lockedLocation}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Location is locked. To change it, delete this automation and create a new one.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
                      Days Listed <span className="text-red-500">*</span>
                      <span className="ml-1 text-gray-400 font-normal text-[11px]">(single number only — e.g. 1, 30, 200)</span>
                    </label>
                    <input
                      value={daysOld}
                      onChange={e => setDaysOld(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 1"
                      inputMode="numeric"
                      className={`w-full px-3 py-2 border rounded-lg text-[14px] bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A] ${!daysOld ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-white/10'}`}
                    />
                    {!daysOld && <p className="text-[11px] text-amber-600 dark:text-amber-400">⚠ Without this, the automation cannot run safely.</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">Property Type</label>
                    <select value={propertyType} onChange={e => setPropertyType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A]">
                      <option value="">Any</option>
                      <option value="Single Family">Single Family</option>
                      <option value="Condo">Condo</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Multi Family">Multi Family</option>
                      <option value="Land">Land</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">Bedrooms</label>
                    <input value={bedrooms} onChange={e => setBedrooms(e.target.value.replace(/[^0-9]/g, ''))} placeholder="3"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">Min Price</label>
                    <input value={minPrice} onChange={e => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="200000"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">Max Price</label>
                    <input value={maxPrice} onChange={e => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="800000"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[14px] bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A]" />
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Destination</p>
                {selectedDestination !== originalDestination && selectedDestination && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-700 dark:text-amber-400">
                      Destination changed — the config for <strong>{LAUNCH_INTEGRATIONS.find(i => i.id === selectedDestination)?.name}</strong> will be loaded from your integration settings.
                    </p>
                  </div>
                )}

                {loadingConnections ? (
                  <p className="text-[13px] text-gray-400">Loading your integrations...</p>
                ) : availableIntegrations.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-center">
                    <Webhook className="w-8 h-8 text-gray-300" />
                    <p className="text-[14px] font-bold text-gray-600 dark:text-gray-300">No integrations connected</p>
                    <p className="text-[12px] text-gray-400">Connect an integration to send listings to your tools.</p>
                    <button onClick={() => { onClose(); window.location.hash = '#integrations'; }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold text-[13px] rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />Set Up an Integration
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableIntegrations.map(integration => {
                      const Icon = integration.icon;
                      const isSelected = selectedDestination === integration.id;
                      return (
                        <button key={integration.id} onClick={() => handleDestinationChange(integration.id)}
                          className={`flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all ${
                            isSelected ? 'border-[#FFCE0A] bg-[#FFCE0A]/10' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                          }`}>
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#342e37] dark:text-[#FFCE0A]' : 'text-gray-500'}`} />
                          <span className={`text-[13px] font-medium ${isSelected ? 'text-[#342e37] dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{integration.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedIntegration?.webhookField && (
                  <div className="space-y-1 mt-2">
                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
                      {selectedIntegration.name} Webhook URL <span className="text-red-500">*</span>
                    </label>
                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} type="url" placeholder="https://hooks.zapier.com/..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-[13px] font-mono bg-white dark:bg-[#0F1115] dark:text-white focus:outline-none focus:border-[#FFCE0A]" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
          {!isEditing ? (
            <>
              <button onClick={handleClose} className="px-4 py-2 text-[14px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Close</button>
              <div className="flex items-center gap-2">
                {onViewHistory && (
                  <button onClick={() => { handleClose(); onViewHistory(); }} className="px-4 py-2 text-[14px] font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    History
                  </button>
                )}
                <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-5 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold text-[14px] rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />Edit Automation
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-[14px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold text-[14px] rounded-lg transition-colors">Save Changes</button>
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
