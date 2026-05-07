import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { User, Lock, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Small reusable field row (label + input, compact on mobile)
// ---------------------------------------------------------------------------
function Field({
  id, label, type = 'text', placeholder, value, onChange, disabled, hint, suffix,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  hint?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          disabled={disabled}
          className={`h-9 text-sm ${disabled ? 'bg-gray-50 dark:bg-white/5 text-gray-400 cursor-not-allowed' : ''}`}
        />
        {suffix && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading inside a card
// ---------------------------------------------------------------------------
function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white text-sm">{title}</div>
        {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 ${className}`}>
      {children}
    </div>
  );
}

function SaveButton({ onClick, disabled, label = 'Save changes' }: { onClick: () => void; disabled: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-1 w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
      style={{ background: '#FFCE0A', color: '#342e37' }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function V2AccountProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [mailingAddress, setMailingAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (user.email) setEmail(user.email);

        const googleIdentity = user.identities?.find((i: any) => i.provider === 'google');
        setIsGoogleUser(!!googleIdentity);
        const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';

        const { data: profile } = await supabase
          .from('users')
          .select('name, company, phone, mailing_address')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (!profile.name && googleName) {
            setName(googleName);
            await supabase.from('users').update({ name: googleName, updated_at: new Date().toISOString() }).eq('id', user.id);
          } else if (profile.name) {
            setName(profile.name);
          }
          if (profile.company) setCompany(profile.company);
          if (profile.phone) setPhone(profile.phone);
          if (profile.mailing_address) setMailingAddress(profile.mailing_address);
        } else if (googleName) {
          setName(googleName);
        }
      } catch (err) {
        console.error('[V2AccountProfile] load failed:', err);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (name.trim()) updates.name = name.trim();
    if (company.trim()) updates.company = company.trim();
    if (phone.trim()) updates.phone = phone.trim();
    if (mailingAddress.trim()) updates.mailing_address = mailingAddress.trim();
    if (Object.keys(updates).length === 1) { toast.error('Fill in at least one field'); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Fill in all password fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInErr) throw new Error('Current password is incorrect');
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw new Error(updateErr.message);
      toast.success('Password updated');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
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
      toast.success('Password reset email sent — check your inbox');
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
    if (!session?.access_token) { toast.error('Unable to delete account: not signed in'); return; }
    try {
      const res = await fetch(
        'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/delete-user',
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) throw new Error();
      toast.success('Account deleted');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      toast.error('Failed to delete account — contact support');
    }
  };

  const passwordMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;
  const isPasswordValid = !!(currentPassword && newPassword && confirmPassword && !passwordMismatch && newPassword.length >= 8);
  const isProfileDirty = !!(name.trim() || company.trim() || phone.trim() || mailingAddress.trim());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1115]">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account details and security settings.</p>
        </div>

        {/* 3-column grid on large screens, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

          {/* ── Card 1: Profile ─────────────────────────────────────── */}
          <Card>
            <SectionHead
              icon={<User className="w-4 h-4" />}
              title="Profile"
              sub="Your personal details"
            />

            <div className="space-y-3">
              <Field
                id="name"
                label="Full name"
                placeholder="Your name"
                value={name}
                onChange={setName}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                placeholder={email || 'Loading…'}
                value=""
                disabled
                hint="Email is tied to your account and cannot be changed."
              />
              <Field
                id="company"
                label="Company"
                placeholder="Your company"
                value={company}
                onChange={setCompany}
              />
              <Field
                id="phone"
                label="Phone"
                type="tel"
                placeholder="+1 (303) 555-0100"
                value={phone}
                onChange={setPhone}
              />
              <Field
                id="mailing-address"
                label="Mailing address"
                placeholder="123 Main St, Denver, CO 80202"
                value={mailingAddress}
                onChange={setMailingAddress}
                hint="CAN-SPAM — appears in every email footer."
              />
            </div>

            <div className="mt-5">
              <SaveButton onClick={handleSave} disabled={!isProfileDirty} />
            </div>
          </Card>

          {/* ── Card 2: Security ────────────────────────────────────── */}
          <Card>
            <SectionHead
              icon={<Lock className="w-4 h-4" />}
              title="Security"
              sub={isGoogleUser ? 'Google sign-in account' : 'Update your password'}
            />

            {isGoogleUser ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
                <Field
                  id="current-password"
                  label="Current password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                />
                <Field
                  id="new-password"
                  label="New password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={setNewPassword}
                />
                <Field
                  id="confirm-password"
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />

                {passwordMismatch && (
                  <p className="text-xs text-red-500">Passwords don't match</p>
                )}

                <div className="mt-5 space-y-2">
                  <SaveButton onClick={handleUpdatePassword} disabled={!isPasswordValid} label="Update password" />
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={isSendingReset}
                    className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {isSendingReset ? 'Sending…' : 'Forgot your password? Send a reset link'}
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* ── Card 3: Account ─────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Sign out */}
            <Card>
              <SectionHead
                icon={<LogOut className="w-4 h-4" />}
                title="Sign out"
                sub="End your session on this device"
              />
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Sign out
              </button>
            </Card>

            {/* Danger zone */}
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5">
              <SectionHead
                icon={<Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />}
                title="Delete account"
                sub="Permanently removes all your data"
              />
              <p className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
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
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account, all campaigns, sends, and settings. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Delete my account
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
