import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { User, Lock, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function V2AccountProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailPlaceholder, setEmailPlaceholder] = useState('');
  const [company, setCompany] = useState('');
  const [fromName, setFromName] = useState('');
  const [phone, setPhone] = useState('');
  const [mailingAddress, setMailingAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmailPlaceholder(user.email);
          setEmail(user.email);
        }
        const googleIdentity = user?.identities?.find((i: any) => i.provider === 'google');
        setIsGoogleUser(!!googleIdentity);
        const googleName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '';
        if (user?.id) {
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (profileData) {
            if (!profileData.name && googleName) {
              setName(googleName);
              await supabase.from('users').update({ name: googleName, updated_at: new Date().toISOString() }).eq('id', user.id);
            } else if (profileData.name) {
              setName(profileData.name);
            }
            if (profileData.company) setCompany(profileData.company);
            if (profileData.from_name) setFromName(profileData.from_name);
            if (profileData.phone) setPhone(profileData.phone);
            if (profileData.mailing_address) setMailingAddress(profileData.mailing_address);
          } else if (googleName) {
            setName(googleName);
            await supabase.from('users').update({ name: googleName, updated_at: new Date().toISOString() }).eq('id', user.id);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (name.trim()) updates.name = name.trim();
    if (company.trim()) updates.company = company.trim();
    if (fromName.trim()) updates.from_name = fromName.trim();
    if (phone.trim()) updates.phone = phone.trim();
    if (mailingAddress.trim()) updates.mailing_address = mailingAddress.trim();
    if (Object.keys(updates).length === 1) {
      toast.error('Please fill in at least one field to save');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('Account settings saved successfully');
    } catch (err: any) {
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
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInErr) throw new Error('Current password is incorrect');
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw new Error(updateErr.message);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { toast.error('Unable to delete account: not signed in'); return; }
    try {
      const response = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/delete-user',
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Delete account failed');
      toast.success('Your account has been deleted.');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      toast.error('Failed to delete account. Please contact support.');
    }
  };

  const isPasswordFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 8;
  const isProfileFormValid = name.trim() || company.trim() || fromName.trim() || phone.trim() || mailingAddress.trim();
  const passwordMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">Manage your account details, password, and business info.</p>
        </div>

        <div className="space-y-3">

          {/* ── Full-width profile card (original) ───────────────────── */}
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
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {/* Left column: Name, Phone, Email */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder={emailPlaceholder || 'Loading email...'} value="" disabled className="placeholder:text-gray-600 bg-gray-50 dark:bg-gray-900 cursor-not-allowed" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed.</p>
                  </div>
                </div>
                {/* Right column: Company, From Name, Mailing Address */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Enter your company" value={company} onChange={(e) => setCompany(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input id="from-name" placeholder="e.g. Jake @ Acme Realty" value={fromName} onChange={(e) => setFromName(e.target.value)} className="placeholder:text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Displayed as the sender name in outgoing emails.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mailing-address">
                      Mailing Address
                      <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(CAN-SPAM)</span>
                    </Label>
                    <Input id="mailing-address" placeholder="123 Main St, Denver, CO 80202" value={mailingAddress} onChange={(e) => setMailingAddress(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
              <Separator className="dark:bg-white/10 mt-4" />
              <Button onClick={handleSave} disabled={!isProfileFormValid} className="mt-3 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115]">Save Changes</Button>
            </CardContent>
          </Card>

          {/* ── Three cards in a row on desktop ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

            {/* Password */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-[#342e37] dark:text-[#FFCE0A]" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isGoogleUser ? 'Google sign-in account' : 'Update your password'}
                  </p>
                </div>
              </div>

              {isGoogleUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You signed up with Google and don't have a separate password. Send a reset link to set one.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingReset}
                    className="w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    {isSendingReset ? 'Sending…' : 'Send password reset email'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="current-password" className="text-xs text-gray-500 dark:text-gray-400">Current password</label>
                    <Input id="current-password" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-9 text-sm placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="new-password" className="text-xs text-gray-500 dark:text-gray-400">New password</label>
                    <Input id="new-password" type="password" placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-9 text-sm placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="confirm-password" className="text-xs text-gray-500 dark:text-gray-400">Confirm password</label>
                    <Input id="confirm-password" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-9 text-sm placeholder:text-gray-400" />
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-red-500">Passwords don't match</p>
                  )}
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={!isPasswordFormValid}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                    style={{ background: '#FFCE0A', color: '#342e37' }}
                  >
                    Update password
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingReset}
                    className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {isSendingReset ? 'Sending…' : 'Forgot your password? Send a reset link'}
                  </button>
                </div>
              )}
            </div>

            {/* Sign out */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5">
              <div className="flex items-center gap-2 mb-4">
                <LogOut className="w-4 h-4 text-[#342e37] dark:text-[#FFCE0A]" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Sign Out</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">End your session on this device</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You'll need to sign in again to access your account.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Delete account */}
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-sm text-red-700 dark:text-red-400">Delete Account</p>
                  <p className="text-xs text-red-500 dark:text-red-500">Permanently removes all your data</p>
                </div>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                This action is irreversible. All campaigns, contacts, and settings will be permanently deleted.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete my account
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete your account and all data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-x-2 flex justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>Delete My Account</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
