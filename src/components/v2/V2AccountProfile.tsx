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
  const [phone, setPhone] = useState('');
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
            .select('name, company, phone, created_at')
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
            if (profileData.phone) setPhone(profileData.phone);
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
    if (phone.trim()) updates.phone = phone.trim();
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
  const isProfileFormValid = name.trim() || company.trim() || phone.trim();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">Manage your account details, password, and business info.</p>
        </div>

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
                <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} className="placeholder:text-gray-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder={emailPlaceholder || 'Loading email...'} value="" disabled className="placeholder:text-gray-600 bg-gray-50 dark:bg-gray-900 cursor-not-allowed" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed. It is the identity linked to your account.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Enter your company" value={company} onChange={(e) => setCompany(e.target.value)} className="placeholder:text-gray-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="placeholder:text-gray-400" />
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
                  <Button onClick={handleSendPasswordReset} disabled={isSendingReset} variant="outline" className="border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                    {isSendingReset ? 'Sending…' : 'Send password reset email'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="Enter new password (min. 8 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="placeholder:text-gray-400" />
                  </div>
                  <Separator className="dark:bg-white/10" />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-red-500">Passwords do not match</p>
                  )}
                  <div className="flex items-center gap-3">
                    <Button onClick={handleUpdatePassword} disabled={!isPasswordFormValid} className="bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115]">Update Password</Button>
                    <button type="button" onClick={handleSendPasswordReset} disabled={isSendingReset} className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50">
                      {isSendingReset ? 'Sending…' : 'Reset your password'}
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sign Out */}
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
                <p className="text-[13px] text-gray-600 dark:text-[#EBF2FA]">
                  You'll need to sign in again to access your account.
                </p>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0 border-gray-200 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
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
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAccount}>Delete My Account</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
