import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { User, CreditCard, Plug, BarChart3, Shield, Download, FileText, Info, RotateCcw } from 'lucide-react';
import { BillingPage } from './BillingPage';
import { AccountIntegrationsTab } from './AccountIntegrationsTab';
import { APIKeysSection } from './APIKeysSection';
import { UsagePage } from './UsagePage';
import { IntegrationConnectionModal, INTEGRATION_CONFIGS } from './IntegrationConnectionModal';
import { IntegrationDetailsPanel, MOCK_INTEGRATION_DETAILS } from './IntegrationDetailsPanel';
import { RequestIntegrationPage } from './RequestIntegrationPage';
import { toast } from 'sonner';
import { useWalkthrough } from './WalkthroughContext';
import { LBToggle } from './design-system/LBToggle';

interface AccountPageProps {
  onLogout: () => void;
  defaultTab?: 'profile' | 'usage' | 'billing' | 'integrations' | 'compliance';
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onNavigate?: (page: string, tab?: string) => void;
}

export function AccountPage({ onLogout, defaultTab = 'profile', isDarkMode = false, onToggleDarkMode, onNavigate }: AccountPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Controlled tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'usage' | 'billing' | 'integrations' | 'compliance'>(defaultTab);
  
  // Update active tab when defaultTab prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  // Walkthrough integration
  const { resetWalkthrough } = useWalkthrough();
  
  // Integration modal states
  const [selectedIntegrationForConnect, setSelectedIntegrationForConnect] = useState<any>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [selectedIntegrationForManage, setSelectedIntegrationForManage] = useState<any>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  
  // Request integration modal state
  const [showRequestIntegrationPage, setShowRequestIntegrationPage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !company.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Account settings saved');
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    }
  };

  const isPasswordFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 8;
  const isProfileFormValid = name.trim() && email.trim() && company.trim();

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      toast.error('Unable to delete account: not signed in');
      return;
    }

    try {
      const response = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Delete account failed');
      }

      toast.success('Your account has been deleted.');
      await supabase.auth.signOut();
      onNavigate?.('home');
    } catch (err) {
      toast.error('Failed to delete account. Please contact support.');
    }
  };

  const handleConnectIntegration = (integrationId: string) => {
    // Get integration data and config
    const integrationData = {
      id: integrationId,
      name: integrationId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      authType: INTEGRATION_CONFIGS[integrationId]?.authType || 'oauth',
      logo: getIntegrationLogo(integrationId),
      description: INTEGRATION_CONFIGS[integrationId]?.description || '',
      ...INTEGRATION_CONFIGS[integrationId],
    };
    
    setSelectedIntegrationForConnect(integrationData);
    setIsConnectionModalOpen(true);
  };

  const handleManageIntegration = (integrationId: string) => {
    // Get integration details
    const details = MOCK_INTEGRATION_DETAILS[integrationId];
    if (details) {
      setSelectedIntegrationForManage(details);
      setIsDetailsPanelOpen(true);
    }
  };

  const handleConnectionComplete = (integrationId: string, credentials?: any) => {
    console.log('Connected:', integrationId, credentials);
    setIsConnectionModalOpen(false);
    setSelectedIntegrationForConnect(null);
    // TODO: Refresh integrations list
  };

  const handleDisconnect = (integrationId: string) => {
    console.log('Disconnecting:', integrationId);
    // TODO: Call API to disconnect
  };

  const handleSync = async (integrationId: string) => {
    console.log('Syncing:', integrationId);
    // TODO: Call API to sync
  };

  const handleUpdateSettings = (integrationId: string, settings: any) => {
    console.log('Updating settings:', integrationId, settings);
    // TODO: Call API to update settings
  };

  const getIntegrationLogo = (id: string) => {
    const logos: any = {
      salesforce: '🌩️',
      hubspot: '🟠',
      'zoho-crm': '🔷',
      mailchimp: '🐵',
      sendgrid: '📧',
      'constant-contact': '✉️',
      zapier: '⚡',
      make: '🔮',
      n8n: '🔗',
    };
    return logos[id] || '🔌';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0F1115] border-b dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-4 gap-2 sm:gap-4 md:gap-6">
            <TabsTrigger 
              value="profile" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFCE0A] data-[state=active]:text-[#342e37] dark:data-[state=active]:text-white data-[state=active]:bg-transparent px-3 sm:px-6 md:px-8 py-2.5 text-[14px] md:text-[15px] flex flex-col items-center gap-1 flex-1 min-w-0 dark:text-[#EBF2FA]"
            >
              <User className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="truncate w-full text-center font-bold">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="usage" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFCE0A] data-[state=active]:text-[#342e37] dark:data-[state=active]:text-white data-[state=active]:bg-transparent px-3 sm:px-6 md:px-8 py-2.5 text-[14px] md:text-[15px] flex flex-col items-center gap-1 flex-1 min-w-0 dark:text-[#EBF2FA]"
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="truncate w-full text-center font-bold">Usage</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFCE0A] data-[state=active]:text-[#342e37] dark:data-[state=active]:text-white data-[state=active]:bg-transparent px-3 sm:px-6 md:px-8 py-2.5 text-[14px] md:text-[15px] flex flex-col items-center gap-1 flex-1 min-w-0 dark:text-[#EBF2FA]"
            >
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="truncate w-full text-center font-bold">Billing</span>
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFCE0A] data-[state=active]:text-[#342e37] dark:data-[state=active]:text-white data-[state=active]:bg-transparent px-3 sm:px-6 md:px-8 py-2.5 text-[14px] md:text-[15px] flex flex-col items-center gap-1 flex-1 min-w-0 dark:text-[#EBF2FA]"
            >
              <Plug className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="truncate w-full text-center font-bold">API</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile" className="mt-0 py-4">
            <div className="space-y-3">
              {/* Profile Information */}
              <Card className="mt-[0px] mr-[0px] mb-[9px] ml-[0px]">
                <CardHeader className="pb-[0px] pt-[18px] pr-[24px] pl-[24px]">
                  <CardTitle className="font-bold text-[18px]">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Enter your company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                  <Button onClick={handleSave} disabled={!isProfileFormValid} className="mt-1">Save Changes</Button>
                </CardContent>
              </Card>

              {/* Password */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      placeholder="Enter new password (min. 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-500">Passwords do not match</p>
                  )}
                  <Button onClick={handleUpdatePassword} disabled={!isPasswordFormValid} className="mt-1">Update Password</Button>
                </CardContent>
              </Card>

              {/* Preferences */}
              

              {/* Sign Out Section */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Sign Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      
                      <p className="text-[13px] text-gray-600">
                        Sign out of your account on this device.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onLogout} className="shrink-0">
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 bg-red-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-600 text-[18px] font-bold">Delete Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-[14px] text-gray-900 mb-1">Delete Account</h4>
                      <p className="text-[13px] text-[#acacac]">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setShowDeleteConfirm(true)}>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Account Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure? This will permanently delete your account and all data. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-x-2 flex justify-end">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete My Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Usage Tab Content */}
          <TabsContent value="usage" className="mt-0">
            <UsagePage embeddedInTabs />
          </TabsContent>

          {/* Billing Tab Content */}
          <TabsContent value="billing" className="mt-0">
            <BillingPage embeddedInTabs />
          </TabsContent>

          {/* Integrations Tab Content */}
          <TabsContent value="integrations" className="mt-0 py-8">
            <div className="space-y-6">
              {/* API Keys Section */}
              <APIKeysSection onNavigate={onNavigate} />

              {/* Browse Integrations */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-bold text-[16px] text-[#342e37] dark:text-white">Integrations</h3>
                  <p className="text-sm text-gray-500 dark:text-[#EBF2FA]/70 mt-0.5">Connect ListingBug to your CRM, email platform, and automation tools.</p>
                </div>
                <button
                  onClick={() => onNavigate?.('integrations')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold text-sm transition-colors"
                >
                  Browse Integrations
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Compliance Tab Content */}
          <TabsContent value="compliance" className="mt-0 py-4">
            <div className="space-y-4">
              {/* DPA Acceptance Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span className="break-words">Data Processing Agreement (DPA)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-green-900">DPA Accepted</p>
                        <p className="text-xs text-green-800 mt-1 break-words">
                          Accepted on November 15, 2024 by sarah.martinez@realestatepros.com
                        </p>
                        <p className="text-xs text-green-700 mt-2 leading-relaxed">
                          You are the data controller; ListingBug processes data on your behalf in accordance with this agreement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button variant="outline" size="sm" className="w-full xs:w-auto" onClick={() => {
                      // API: GET /api/compliance/dpa/download
                      toast.info('Downloading DPA document...');
                    }}>
                      <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Download DPA</span>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full xs:w-auto" onClick={() => {
                      window.open('https://listingbug.com/legal/dpa', '_blank');
                    }}>
                      <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">View Full Terms</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subprocessor List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Subprocessors</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Third-party services that process data on behalf of ListingBug
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-700">Service</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700">Purpose</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">AWS (Amazon Web Services)</td>
                          <td className="px-4 py-3 text-gray-600">Cloud hosting & data storage</td>
                          <td className="px-4 py-3 text-gray-600">United States</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">SendGrid</td>
                          <td className="px-4 py-3 text-gray-600">Email delivery services</td>
                          <td className="px-4 py-3 text-gray-600">United States</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">Stripe</td>
                          <td className="px-4 py-3 text-gray-600">Payment processing</td>
                          <td className="px-4 py-3 text-gray-600">United States</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">Cloudflare</td>
                          <td className="px-4 py-3 text-gray-600">CDN & security</td>
                          <td className="px-4 py-3 text-gray-600">Global</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-600">
                    <p>
                      <strong>Note:</strong> All subprocessors are GDPR-compliant and have executed Data Processing Agreements with ListingBug. 
                      <a href="https://listingbug.com/legal/subprocessors" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        View full subprocessor disclosure →
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Log Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Audit Logs</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Export data transfer logs for compliance and auditing purposes
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900">
                      <Info className="w-3 h-3 inline mr-1" />
                      All automation runs and data transfers are logged with timestamps, destination info, and contact counts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="log-date-range">Select Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" placeholder="Start date" />
                      <Input type="date" placeholder="End date" />
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => {
                    // API: POST /api/compliance/audit-logs/export
                    // Request body: { start_date, end_date }
                    // Response: CSV download
                    toast.success('Audit log export started. Download will begin shortly.');
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as CSV
                  </Button>

                  <div className="text-xs text-gray-600">
                    <strong>Export includes:</strong> automation_id, run_timestamp, destination_type, contact_count, sync_status, error_logs
                  </div>
                </CardContent>
              </Card>

              {/* Suppression List Management */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Suppression List</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage contacts that should never be synced to marketing destinations
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-900">
                      <strong>3 contacts currently suppressed</strong> - These contacts will be automatically excluded from all marketing automations.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-suppression">Add Email to Suppression List</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="add-suppression" 
                        type="email" 
                        placeholder="email@example.com"
                      />
                      <Button onClick={() => {
                        // API: POST /api/compliance/suppression-list
                        // Request body: { email }
                        toast.success('Email added to suppression list');
                      }}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      // API: GET /api/compliance/suppression-list/export
                      toast.info('Downloading suppression list...');
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Export List
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      // API: POST /api/compliance/suppression-list/import
                      toast.info('Upload CSV file to import suppressions');
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>

                  <div className="text-xs text-gray-600">
                    <strong>API Endpoints:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono">
                      <li>POST /api/compliance/suppression-list - Add email</li>
                      <li>DELETE /api/compliance/suppression-list/{'{'}email{'}'} - Remove email</li>
                      <li>GET /api/compliance/suppression-list/export - Download CSV</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Integration Modals */}
      <IntegrationConnectionModal
        integration={selectedIntegrationForConnect}
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnect={handleConnectionComplete}
        onNavigate={onNavigate}
      />

      <IntegrationDetailsPanel
        integration={selectedIntegrationForManage}
        isOpen={isDetailsPanelOpen}
        onClose={() => setIsDetailsPanelOpen(false)}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Request Integration Page */}
      {showRequestIntegrationPage && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <RequestIntegrationPage
            onBack={() => setShowRequestIntegrationPage(false)}
            isMember={true}
          />
        </div>
      )}
    </div>
  );
}