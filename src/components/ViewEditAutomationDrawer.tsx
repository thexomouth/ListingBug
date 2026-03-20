import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
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
  ChevronDown,
  ChevronUp,
  Eye,
  X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ViewEditAutomationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  automation: any;
  onAutomationUpdated?: (automation: any) => void;
  onViewDetail?: (automation: any) => void;
}

interface Integration {
  id: string;
  name: string;
  icon: any;
  connected: boolean;
  requiresSetup: boolean;
  setupFields?: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
  }[];
}

export function ViewEditAutomationDrawer({
  isOpen,
  onClose,
  automation,
  onAutomationUpdated,
  onViewDetail
}: ViewEditAutomationDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [automationName, setAutomationName] = useState('');
  const [selectedSearchId, setSelectedSearchId] = useState('');
  const [schedule, setSchedule] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [destinationConfig, setDestinationConfig] = useState<Record<string, string>>({});
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showCriteria, setShowCriteria] = useState(false);

  // Load saved searches and populate form
  useEffect(() => {
    if (isOpen && automation) {
      // Load saved searches
      const stored = localStorage.getItem('listingbug_saved_searches');
      if (stored) {
        try {
          const searches = JSON.parse(stored);
          setSavedSearches(searches);
          
          // Find the matching saved search
          const matchingSearch = searches.find((s: any) => s.name === automation.searchName);
          if (matchingSearch) {
            setSelectedSearchId(matchingSearch.id);
          }
        } catch (e) {
          console.error('Failed to parse saved searches:', e);
        }
      }

      // Populate form with automation data
      setAutomationName(automation.name || '');
      setSelectedDestination(automation.destination?.type || '');
      setDestinationConfig(automation.destination?.config || {});

      // Parse schedule
      const scheduleLower = automation.schedule?.toLowerCase() || '';
      if (scheduleLower.includes('daily')) {
        setSchedule('daily');
      } else if (scheduleLower.includes('weekly')) {
        setSchedule('weekly');
      } else if (scheduleLower.includes('monthly')) {
        setSchedule('monthly');
      }

      // Set schedule time if available
      if (automation.scheduleTime) {
        setScheduleTime(automation.scheduleTime);
      }
    }
  }, [isOpen, automation]);

  const getSelectedSearch = () => {
    return savedSearches.find(s => s.id === selectedSearchId);
  };

  const integrations: Integration[] = [
    { 
      id: 'email', 
      name: 'Email', 
      icon: Mail, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'email', label: 'Email Address', placeholder: 'you@example.com', type: 'email' }
      ]
    },
    { 
      id: 'mailchimp', 
      name: 'Mailchimp', 
      icon: Send, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'audience', label: 'Audience Name', placeholder: 'Hot Leads' }
      ]
    },
    { 
      id: 'hubspot', 
      name: 'HubSpot', 
      icon: Database, 
      connected: true, 
      requiresSetup: false
    },
    { 
      id: 'salesforce', 
      name: 'Salesforce', 
      icon: Database, 
      connected: true, 
      requiresSetup: false
    },
    { 
      id: 'pipedrive', 
      name: 'Pipedrive', 
      icon: Database, 
      connected: true, 
      requiresSetup: false
    },
    { 
      id: 'follow-up-boss', 
      name: 'Follow Up Boss', 
      icon: Database, 
      connected: true, 
      requiresSetup: false
    },
    { 
      id: 'liondesk', 
      name: 'LionDesk', 
      icon: Database, 
      connected: true, 
      requiresSetup: false
    },
    { 
      id: 'activecampaign', 
      name: 'ActiveCampaign', 
      icon: Send, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'list', label: 'List Name', placeholder: 'My Contacts' }
      ]
    },
    { 
      id: 'webhook', 
      name: 'Webhook', 
      icon: Webhook, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'url', label: 'Webhook URL', placeholder: 'https://api.example.com/webhook', type: 'url' }
      ]
    },
    { 
      id: 'sheets', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: false, 
      requiresSetup: true,
      setupFields: [
        { key: 'spreadsheet', label: 'Spreadsheet Name', placeholder: 'Listings Export' }
      ]
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      icon: MessageSquare, 
      connected: false, 
      requiresSetup: true,
      setupFields: [
        { key: 'channel', label: 'Channel', placeholder: '#listings' }
      ]
    },
    { 
      id: 'zapier', 
      name: 'Zapier', 
      icon: Zap, 
      connected: false, 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/...', type: 'url' }
      ]
    },
    { 
      id: 'make', 
      name: 'Make.com', 
      icon: Zap, 
      connected: false, 
      requiresSetup: true,
      setupFields: [
        { key: 'webhook_url', label: 'Make Webhook URL', placeholder: 'https://hook.integromat.com/...', type: 'url' }
      ]
    }
  ];

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
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

  const handleSave = () => {
    // Validation
    if (!automationName.trim()) {
      toast.error('Please enter an automation name');
      return;
    }
    if (!selectedSearchId) {
      toast.error('Please select a saved search');
      return;
    }
    if (!schedule) {
      toast.error('Please select a schedule');
      return;
    }
    if (!selectedDestination) {
      toast.error('Please select a destination');
      return;
    }

    // Check required fields for selected integration
    if (selectedIntegration?.requiresSetup && selectedIntegration.setupFields) {
      const missingFields = selectedIntegration.setupFields.filter(
        field => !destinationConfig[field.key]?.trim()
      );
      if (missingFields.length > 0) {
        toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
    }

    const updatedAutomation = {
      ...automation,
      name: automationName,
      searchName: getSelectedSearch()?.name || automation.searchName,
      schedule: scheduleOptions.find(s => s.value === schedule)?.label || schedule,
      scheduleTime: scheduleTime,
      destination: {
        type: selectedDestination,
        label: selectedIntegration?.name || selectedDestination,
        config: destinationConfig
      },
      searchCriteria: getSelectedSearch()?.criteria || automation.searchCriteria || {},
      activeFilters: getSelectedSearch()?.activeFilters || automation.activeFilters || [],
    };

    onAutomationUpdated?.(updatedAutomation);
    toast.success(`Automation "${automationName}" updated successfully!`);
    setIsEditing(false);
    onClose();
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowCriteria(false);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleClose} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-[650px] lg:max-w-[800px]">
        {/* Accessibility: Hidden title and description for screen readers */}
        <DrawerTitle className="sr-only">
          {isEditing ? 'Edit Automation' : 'Automation Details'}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {isEditing 
            ? 'Edit automation settings including name, schedule, and destination' 
            : 'View automation details and configuration'}
        </DrawerDescription>

        {/* Header with Close Button */}
        <div className="bg-[#FFD447] px-3 md:px-6 py-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {isEditing ? <Zap className="w-5 h-5 text-[#342E37]" /> : <Eye className="w-5 h-5 text-[#342E37]" />}
              <h2 className="font-bold text-[20px] text-[#342E37]">
                {isEditing ? 'Edit Automation' : 'Automation Details'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-[#342E37] hover:text-[#342E37]/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#342E37]/80 text-[14px]">
            {isEditing ? 'Update your automation settings' : 'View automation configuration'}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-6">
          <div className="space-y-6">
            {/* View Mode */}
            {!isEditing && (
              <>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] text-gray-600 mb-1">Automation Name</p>
                    <p className="font-medium text-[15px] text-[#000000]">{automation?.name}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] text-gray-600 mb-1">Saved Search</p>
                    <p className="font-medium text-[15px] text-[#252525]">{automation?.searchName}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] text-gray-600 mb-1">Schedule</p>
                    <p className="font-medium text-[15px] text-[#252525]">
                      {automation?.schedule}
                      {automation?.scheduleTime && ` at ${timeOptions().find(t => t.value === automation.scheduleTime)?.label || automation.scheduleTime}`}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] text-gray-600 mb-1">Destination</p>
                    <p className="font-medium text-[15px] text-[#252525]">{automation?.destination?.label}</p>
                    {automation?.destination?.config && Object.entries(automation.destination.config).map(([key, value]) => (
                      <p key={key} className="text-[13px] text-gray-600 mt-1">
                        {key}: {value as string}
                      </p>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-[12px] text-gray-600 mb-1">Status</p>
                    <div className="flex items-center gap-2">
  <div className={`w-2 h-2 rounded-full ${automation?.active ? 'bg-green-500' : 'bg-gray-400'}`} />
  <p className="font-medium text-[15px] text-[#252525]">{automation?.active ? 'Active' : 'Paused'}</p>
</div>
                  </div>

                  {/* Search Criteria Section */}
                  {automation?.searchCriteria && Object.keys(automation.searchCriteria).length > 0 && (
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setShowCriteria(!showCriteria)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-[14px]">View search criteria</span>
                        {showCriteria ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      
                      {showCriteria && (
                        <div className="px-4 pb-4 space-y-2 border-t border-gray-200 pt-4">
                          {Object.entries(automation.searchCriteria).map(([key, value]) => {
                            if (!value || (Array.isArray(value) && value.length === 0)) return null;
                            
                            const displayValue = Array.isArray(value) 
                              ? value.join(', ') 
                              : typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value);

                            const displayKey = key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase())
                              .trim();

                            return (
                              <div key={key} className="flex flex-col">
                                <span className="text-[11px] text-gray-500 uppercase tracking-wide">{displayKey}</span>
                                <span className="text-[13px] text-gray-900">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Edit Mode */}
            {isEditing && (
              <>
                <LBInput
                  label="Automation Name"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                  placeholder="e.g., Daily Foreclosures to HubSpot"
                  required
                />

                <LBSelect
                  label="Saved Search"
                  options={savedSearches.map(s => ({ value: s.id, label: s.name }))}
                  value={selectedSearchId}
                  onChange={setSelectedSearchId}
                  placeholder={savedSearches.length === 0 ? "No saved searches available" : "Select a saved search"}
                  required
                />

                {selectedSearchId && getSelectedSearch() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-[13px] text-blue-900 mb-2">
                      <strong>This automation will run the following search:</strong>
                    </p>
                    <p className="text-[13px] font-medium text-blue-900">
                      {getSelectedSearch()?.name}
                    </p>
                    {getSelectedSearch()?.criteriaDescription && (
                      <p className="text-[12px] text-blue-700 mt-1">
                        {getSelectedSearch()?.criteriaDescription}
                      </p>
                    )}
                  </div>
                )}

                <LBSelect
                  label="Run Schedule"
                  options={scheduleOptions}
                  value={schedule}
                  onChange={setSchedule}
                  placeholder="Select frequency"
                  required
                />

                <LBSelect
                  label="Run Time"
                  options={timeOptions()}
                  value={scheduleTime}
                  onChange={setScheduleTime}
                />

                {/* Destination Selection */}
                <div>
                  <h3 className="font-bold text-[16px] mb-3">Destination</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {integrations.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <button
                          key={integration.id}
                          onClick={() => setSelectedDestination(integration.id)}
                          disabled={!integration.connected}
                          className={`border-2 rounded-lg p-4 text-left transition-all ${
                            selectedDestination === integration.id
                              ? 'border-[#FFD447] bg-[#FFD447]/10'
                              : integration.connected
                              ? 'border-gray-200 hover:border-gray-300'
                              : 'border-gray-200 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${
                              integration.connected ? 'text-[#342E37]' : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-[14px]">{integration.name}</p>
                              {!integration.connected && (
                                <p className="text-[11px] text-red-600">Not connected</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Destination Configuration */}
                {selectedIntegration?.requiresSetup && selectedIntegration.setupFields && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-bold text-[16px]">Configure {selectedIntegration.name}</h3>
                    {selectedIntegration.setupFields.map((field) => (
                      <LBInput
                        key={field.key}
                        label={field.label}
                        type={field.type || 'text'}
                        value={destinationConfig[field.key] || ''}
                        onChange={(e) => setDestinationConfig({
                          ...destinationConfig,
                          [field.key]: e.target.value
                        })}
                        placeholder={field.placeholder}
                        required
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-4">
          {/* View Mode: Stack on mobile, row on desktop */}
          {!isEditing && (
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
              <LBButton variant="outline" onClick={handleClose} className="w-full sm:w-auto order-3 sm:order-1">
                Close
              </LBButton>
              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                {onViewDetail && (
                  <LBButton 
                    variant="outline" 
                    onClick={() => {
                      onViewDetail(automation);
                      onClose();
                    }}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Open in Viewer</span>
                    <span className="sm:hidden">View</span>
                  </LBButton>
                )}
                <LBButton variant="primary" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                  Edit
                </LBButton>
              </div>
            </div>
          )}
          
          {/* Edit Mode: Stack on mobile, row on desktop */}
          {isEditing && (
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
              <LBButton variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </LBButton>
              <LBButton variant="primary" onClick={handleSave} className="w-full sm:w-auto">
                Save Changes
              </LBButton>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}