import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import { User, CreditCard, Plug, BarChart3, Shield, Download, FileText, Info, RotateCcw, Key, Lock, LogOut, Trash2 } from 'lucide-react';
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
  const [emailPlaceholder, setEmailPlaceholder] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // Controlled tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'usage' | 'billing' | 'integrations' | 'compliance'>(() => {
    const lastTab = sessionStorage.getItem('account_last_tab');
    if (lastTab && ['profile','usage','billing','integrations','compliance'].includes(lastTab)) {
      return lastTab as 'profile' | 'usage' | 'billing' | 'integrations' | 'compliance';
    }
    return defaultTab;
  });
  
  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmailPlaceholder(user.email);
          setEmail(user.email);
        }

        // Detect Google OAuth user
        const googleIdentity = user?.identities?.find((i: any) => i.provider === 'google');
        const isGoogle = !!googleIdentity;
        setIsGoogleUser(isGoogle);

        // Extract name from Google user_metadata if available
        const googleName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';

        // Load profile data from users table
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('users')
            .select('name, company, phone, created_at')
            .eq('id', user.id)
            .single();

          if (profileData) {
            // If DB name is empty and Google provides a name, auto-populate and save it
            if (!profileData.name && googleName) {
              setName(googleName);
              await supabase.from('users').update({ name: googleName, updated_at: new Date().toISOString() }).eq('id', user.id);
            } else if (profileData.name) {
              setName(profileData.name);
            }
            if (profileData.company) setCompany(profileData.company);
            if (profileData.phone) setPhone(profileData.phone);
            if (profileData.created_at) setCreatedAt(profileData.created_at);
          } else if (googleName) {
            // No DB row yet — seed with Google name
            setName(googleName);
            await supabase.from('users').update({ name: googleName, updated_at: new Date().toISOString() }).eq('id', user.id);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    loadProfile();
  }, []);
  

  // Update active tab when defaultTab prop changes (unless user has a sessionStorage tab)
  useEffect(() => {
    const lastTab = sessionStorage.getItem('account_last_tab');
    if (!lastTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);


  // Read tab override from sessionStorage (e.g. "Get API Key" button on IntegrationsPage)
  useEffect(() => {
    const stored = sessionStorage.getItem('account_default_tab') as typeof activeTab | null;
    if (stored) {
      setActiveTab(stored);
      sessionStorage.removeItem('account_default_tab');
    }
  }, []);

  // Persist activeTab to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem('account_last_tab', activeTab);
  }, [activeTab]);
  
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

  // Compliance tab state
  const [suppressionList, setSuppressionList] = useState<{id: string; email: string; created_at: string}[]>([]);
  const [suppressionEmail, setSuppressionEmail] = useState('');
  const [isAddingSuppression, setIsAddingSuppression] = useState(false);
  const [isLoadingSuppression, setIsLoadingSuppression] = useState(false);
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [isExportingAudit, setIsExportingAudit] = useState(false);

  // Load suppression list when compliance tab is active
  useEffect(() => {
    if (activeTab !== 'compliance') return;
    const loadSuppression = async () => {
      setIsLoadingSuppression(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) { setIsLoadingSuppression(false); return; }
      const { data } = await supabase
        .from('suppression_list')
        .select('id, email, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSuppressionList(data || []);
      setIsLoadingSuppression(false);
    };
    loadSuppression();
  }, [activeTab]);

  const handleAddSuppression = async () => {
    if (!suppressionEmail.trim()) return;
    setIsAddingSuppression(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) { toast.error('Not authenticated'); setIsAddingSuppression(false); return; }
    const { error } = await supabase.from('suppression_list').insert({
      user_id: user.id,
      email: suppressionEmail.trim().toLowerCase(),
    });
    if (error) {
      if (error.code === '23505') toast.error('Email already in suppression list');
      else toast.error('Failed to add email');
    } else {
      toast.success('Email added to suppression list');
      setSuppressionEmail('');
      const { data } = await supabase.from('suppression_list').select('id, email, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      setSuppressionList(data || []);
    }
    setIsAddingSuppression(false);
  };

  const handleRemoveSuppression = async (id: string) => {
    const { error } = await supabase.from('suppression_list').delete().eq('id', id);
    if (error) { toast.error('Failed to remove email'); return; }
    setSuppressionList(prev => prev.filter(s => s.id !== id));
    toast.success('Email removed from suppression list');
  };

  const handleExportSuppression = () => {
    if (suppressionList.length === 0) { toast.error('No emails to export'); return; }
    const csv = ['email,added_at', ...suppressionList.map(s => `${s.email},${s.created_at}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppression-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSuppression = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const emails: string[] = [];
      for (const line of lines) {
        if (line.toLowerCase().startsWith('email')) continue;
        const emailVal = line.split(',')[0].trim().toLowerCase();
        if (emailVal && emailVal.includes('@')) emails.push(emailVal);
      }
      if (emails.length === 0) { toast.error('No valid emails found in CSV'); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) { toast.error('Not authenticated'); return; }
      const rows = emails.map(emailVal => ({ user_id: user.id, email: emailVal }));
      const { error } = await supabase.from('suppression_list').upsert(rows, { onConflict: 'user_id,email' });
      if (error) { toast.error('Failed to import some emails'); }
      else {
        toast.success(`Imported ${emails.length} email(s)`);
        const { data } = await supabase.from('suppression_list').select('id, email, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
        setSuppressionList(data || []);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportAuditLogs = async () => {
    if (!auditStartDate || !auditEndDate) {
      toast.error('Please select both a start and end date');
      return;
    }
    setIsExportingAudit(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) { toast.error('Not authenticated'); setIsExportingAudit(false); return; }
    const { data, error } = await supabase
      .from('automation_runs')
      .select('id, automation_name, run_date, status, listings_found, listings_sent, destination, details')
      .eq('user_id', user.id)
      .gte('run_date', auditStartDate)
      .lte('run_date', auditEndDate + 'T23:59:59Z')
      .order('run_date', { ascending: false });
    if (error || !data) { toast.error('Failed to export audit logs'); setIsExportingAudit(false); return; }
    if (data.length === 0) { toast.error('No automation runs found in that date range'); setIsExportingAudit(false); return; }
    const headers = ['automation_id', 'automation_name', 'run_timestamp', 'status', 'listings_found', 'listings_sent', 'destination_type', 'details'];
    const rows = data.map(r => [
      r.id,
      `"${(r.automation_name || '').replace(/"/g, '""')}"`,
      r.run_date, r.status,
      r.listings_found, r.listings_sent,
      `"${(r.destination || '').replace(/"/g, '""')}"`,
      `"${(r.details || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${auditStartDate}-to-${auditEndDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportingAudit(false);
    toast.success(`Exported ${data.length} run(s)`);
  };

  const handleDownloadDPA = () => {
    const dpaText = `DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") is entered into between ListingBug ("Processor") and you ("Controller") as part of your ListingBug subscription.

1. DEFINITIONS
"Personal Data" means any information relating to identified or identifiable natural persons processed under this agreement.
"Processing" means any operation performed on Personal Data.

2. SCOPE AND PURPOSE
ListingBug processes Personal Data solely to provide the services described in the Terms of Service, including property listing search, automation, and CRM integration features.

3. DATA CONTROLLER OBLIGATIONS
You, as data controller, are responsible for ensuring you have a lawful basis for processing and sharing contact data with ListingBug.

4. PROCESSOR OBLIGATIONS
ListingBug will: (a) process data only on your documented instructions; (b) implement appropriate technical and organizational security measures; (c) assist you in fulfilling data subject rights requests; (d) delete or return all Personal Data upon termination.

5. SUBPROCESSORS
ListingBug uses the following subprocessors: Supabase (database/auth), RentCast (property data), SendGrid (email delivery), Stripe (payments), Vercel (hosting), Cloudflare (CDN). All subprocessors are bound by equivalent data protection obligations.

6. SECURITY
ListingBug maintains appropriate technical measures including encryption at rest and in transit, access controls, and regular security assessments.

7. DATA RETENTION
Personal Data is retained for the duration of your subscription plus 90 days following termination, unless earlier deletion is requested.

8. GOVERNING LAW
This DPA is governed by the laws of the United States.

Accepted: ${createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'at account creation'}
Account: ${email}

ListingBug — support@thelistingbug.com
`;
    const blob = new Blob([dpaText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ListingBug-DPA.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (name.trim()) updates.name = name.trim();
    if (company.trim()) updates.company = company.trim();
    if (phone.trim()) updates.phone = phone.trim();

    if (Object.keys(updates).length === 1) {
      toast.error('Please fill in at least one field to save');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Account settings saved successfully');
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(err.message || 'Failed to save settings');
    }
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      // Step 1: verify current password by signing in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) throw new Error('Current password is incorrect');

      // Step 2: update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw new Error(updateErr.message);

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update failed:', err);
      toast.error(err.message || 'Failed to update password');
    }
  };

  const handleSendPasswordReset = async () => {
    if (!email) { toast.error('No email address found'); return; }
    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setIsSendingReset(false);
    }
  };

  const isPasswordFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 8;
  const isProfileFormValid = name.trim() || company.trim() || phone.trim();

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account</h1>
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
              <Key className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="truncate w-full text-center font-bold">API</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value="profile" className="mt-0 py-4">
            <div className="space-y-3">
              {/* Profile Information */}
              <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
                    <User className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-[#EBF2FA]">
                    Manage your personal details
                  </CardDescription>
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
                      placeholder={emailPlaceholder || "Loading email..."}
                      value=""
                      disabled
                      className="placeholder:text-gray-600 bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed. It is the identity linked to your account.</p>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="placeholder:text-gray-400"
                    />
                  </div>

                  <Separator className="dark:bg-white/10" />
                  
                  <Button onClick={handleSave} disabled={!isProfileFormValid} className="mt-1 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115]">Save Changes</Button>
                </CardContent>
              </Card>

              {/* Password */}
              <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
                    <Lock className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                    Password
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-[#EBF2FA]">
                    {isGoogleUser ? 'Your account uses Google Sign-in' : 'Update your password'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isGoogleUser ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-[#EBF2FA]">
                        You signed up with Google and don't have a separate password yet. To add one, we'll send a password reset link to your email address.
                      </p>
                      <Button
                        onClick={handleSendPasswordReset}
                        disabled={isSendingReset}
                        variant="outline"
                        className="border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                      >
                        {isSendingReset ? 'Sending…' : 'Send password reset email'}
                      </Button>
                    </div>
                  ) : (
                    <>
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
                      <Separator className="dark:bg-white/10" />
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-sm text-red-500">Passwords do not match</p>
                      )}
                      <div className="flex items-center gap-3">
                        <Button onClick={handleUpdatePassword} disabled={!isPasswordFormValid} className="bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115]">Update Password</Button>
                        <button
                          type="button"
                          onClick={handleSendPasswordReset}
                          disabled={isSendingReset}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                        >
                          {isSendingReset ? 'Sending…' : 'Reset your password'}
                        </button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Preferences */}
              

              {/* Sign Out Section */}
              <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
                    <LogOut className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                    Sign Out
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-[#EBF2FA]">
                    Sign out of your account on this device
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">
                        You'll need to sign in again to access your account.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onLogout} className="shrink-0 border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[18px] font-bold">
                    <Trash2 className="w-5 h-5" />
                    Delete Account
                  </CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-400">
                    Permanently delete your account and all data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-[14px] text-red-600 dark:text-red-400 mb-1">Delete Account</h4>
                      <p className="text-[13px] text-red-600 dark:text-red-400">
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
                          {createdAt && email
                            ? `Accepted on ${new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} by ${email}`
                            : 'Accepted by your account email'}
                        </p>
                        <p className="text-xs text-green-700 mt-2 leading-relaxed">
                          You are the data controller; ListingBug processes data on your behalf in accordance with this agreement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button variant="outline" size="sm" className="w-full xs:w-auto" onClick={handleDownloadDPA}>
                      <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Download DPA</span>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full xs:w-auto" onClick={() => onNavigate?.('legal-dpa')}>
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
                  <p className="text-sm text-gray-600 dark:text-[#EBF2FA]/70 mt-1">
                    Third-party services that process data on behalf of ListingBug
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-[#1a1a1f] border-b border-gray-200 dark:border-white/10">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-white">Service</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-white">Purpose</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-white">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {[
                          { name: 'Supabase', purpose: 'Database, authentication & edge functions', location: 'United States' },
                          { name: 'RentCast', purpose: 'Property listing data API', location: 'United States' },
                          { name: 'SendGrid (Twilio)', purpose: 'Transactional email delivery', location: 'United States' },
                          { name: 'Stripe', purpose: 'Payment processing & billing', location: 'United States' },
                          { name: 'Vercel', purpose: 'Frontend hosting & CDN', location: 'Global' },
                          { name: 'Cloudflare', purpose: 'DNS & DDoS protection', location: 'Global' },
                        ].map(row => (
                          <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-white/5">
                            <td className="px-4 py-3 font-medium">{row.name}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-[#EBF2FA]/70">{row.purpose}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-[#EBF2FA]/70">{row.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 dark:text-[#EBF2FA]/60">
                    All subprocessors are GDPR-compliant and have executed Data Processing Agreements with ListingBug.{' '}
                    <button onClick={() => onNavigate?.('legal-subprocessors')} className="text-[#FFCE0A] hover:underline">
                      View full subprocessor disclosure →
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Log Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Audit Logs</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-[#EBF2FA]/70 mt-1">
                    Export automation run logs for compliance and auditing purposes
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                    <p className="text-xs text-blue-900 dark:text-blue-300">
                      <Info className="w-3 h-3 inline mr-1" />
                      All automation runs are logged with timestamps, destination info, and listing counts. Both dates are required before export.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={auditStartDate}
                        onChange={e => setAuditStartDate(e.target.value)}
                        placeholder="Start date"
                      />
                      <Input
                        type="date"
                        value={auditEndDate}
                        onChange={e => setAuditEndDate(e.target.value)}
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleExportAuditLogs}
                    disabled={isExportingAudit || !auditStartDate || !auditEndDate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExportingAudit ? 'Exporting…' : 'Export as CSV'}
                  </Button>

                  <div className="text-xs text-gray-600 dark:text-[#EBF2FA]/60">
                    <strong>Export includes:</strong> automation_id, automation_name, run_timestamp, status, listings_found, listings_sent, destination_type, details
                  </div>
                </CardContent>
              </Card>

              {/* Suppression List Management */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-[18px] font-bold">Suppression List</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-[#EBF2FA]/70 mt-1">
                    Contacts excluded from all marketing automations
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                    <p className="text-xs text-amber-900 dark:text-amber-300">
                      {isLoadingSuppression
                        ? 'Loading suppression list…'
                        : <><strong>{suppressionList.length} contact{suppressionList.length !== 1 ? 's' : ''} currently suppressed</strong> — automatically excluded from all automations.</>
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-suppression">Add Email to Suppression List</Label>
                    <div className="flex gap-2">
                      <Input
                        id="add-suppression"
                        type="email"
                        placeholder="email@example.com"
                        value={suppressionEmail}
                        onChange={e => setSuppressionEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSuppression(); }}
                      />
                      <Button onClick={handleAddSuppression} disabled={isAddingSuppression || !suppressionEmail.trim()}>
                        {isAddingSuppression ? 'Adding…' : 'Add'}
                      </Button>
                    </div>
                  </div>

                  {suppressionList.length > 0 && (
                    <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {suppressionList.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                          <span className="font-mono text-[13px]">{item.email}</span>
                          <button
                            onClick={() => handleRemoveSuppression(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                            aria-label={`Remove ${item.email}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportSuppression} disabled={suppressionList.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export List
                    </Button>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <FileText className="w-4 h-4 mr-2" />
                          Import CSV
                        </span>
                      </Button>
                      <input type="file" accept=".csv" className="hidden" onChange={handleImportSuppression} />
                    </label>
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