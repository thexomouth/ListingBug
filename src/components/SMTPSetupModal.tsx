import React, { useState } from 'react';
import { X, Mail, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface SMTPSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (connectionId: string) => void;
  userId: string;
  userContactName?: string | null;
  userBusinessName?: string | null;
}

interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
}

interface IMAPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
}

export function SMTPSetupModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userContactName,
  userBusinessName,
}: SMTPSetupModalProps) {
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: '587',
    username: '',
    password: '',
    from_email: '',
    from_name: userContactName || userBusinessName || '',
  });

  const [replyTracking, setReplyTracking] = useState(false);
  const [imapConfig, setImapConfig] = useState<IMAPConfig>({
    host: '',
    port: '993',
    username: '',
    password: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showImapPassword, setShowImapPassword] = useState(false);

  const handleTest = async () => {
    if (!config.host || !config.port || !config.username || !config.password || !config.from_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
        body: {
          host: config.host,
          port: parseInt(config.port, 10),
          username: config.username,
          password: config.password,
          from_email: config.from_email,
          from_name: config.from_name,
          use_tls: true,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast.success('SMTP connection successful!');
      } else {
        setTestResult('failed');
        setErrorMessage(data?.error || 'Connection test failed');
        toast.error(data?.error || 'Connection test failed');
      }
    } catch (err: any) {
      setTestResult('failed');
      setErrorMessage(err.message || 'Failed to test connection');
      toast.error(err.message || 'Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (testResult !== 'success') {
      toast.error('Please test the connection first');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: connection, error: insertError } = await supabase
        .from('integration_connections')
        .insert({
          user_id: userId,
          integration_id: 'smtp',
          credentials: {
            username: config.username,
            password: config.password,
            ...(replyTracking && {
              imap_username: imapConfig.username || config.username,
              imap_password: imapConfig.password || config.password,
            }),
          },
          config: {
            host: config.host,
            port: parseInt(config.port, 10),
            use_tls: true,
            ...(replyTracking && {
              imap_host: imapConfig.host,
              imap_port: parseInt(imapConfig.port, 10),
              reply_tracking: true,
            }),
          },
          display_name: `SMTP (${config.from_email})`,
          from_email: config.from_email,
          from_name: config.from_name,
          is_sender: true,
          connected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: user } = await supabase
        .from('users')
        .select('default_sender_id')
        .eq('id', userId)
        .single();

      if (!user?.default_sender_id) {
        await supabase
          .from('users')
          .update({ default_sender_id: connection.id })
          .eq('id', userId);
      }

      toast.success('SMTP account connected successfully!');
      onSuccess(connection.id);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save SMTP configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isTesting && !isSaving) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Connect Custom SMTP
          </DialogTitle>
          <DialogDescription>
            Configure your SMTP server to send emails from ListingBug
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* SMTP Host */}
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host *</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.gmail.com"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your mail server hostname (e.g., smtp.gmail.com, smtp.office365.com)
            </p>
          </div>

          {/* SMTP Port */}
          <div className="space-y-2">
            <Label htmlFor="smtp-port">Port *</Label>
            <Input
              id="smtp-port"
              type="number"
              placeholder="587"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Common ports: 587 (TLS/STARTTLS), 465 (SSL)
            </p>
          </div>

          {/* SMTP Username */}
          <div className="space-y-2">
            <Label htmlFor="smtp-username">Username *</Label>
            <Input
              id="smtp-username"
              placeholder="you@example.com"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
            />
          </div>

          {/* SMTP Password */}
          <div className="space-y-2">
            <Label htmlFor="smtp-password">Password *</Label>
            <div className="relative">
              <Input
                id="smtp-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use an app password for Gmail/Outlook
            </p>
          </div>

          {/* From Email */}
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email *</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="you@example.com"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email address that will appear in the "From" field
            </p>
          </div>

          {/* From Name */}
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name *</Label>
            <Input
              id="from-name"
              placeholder="Your Name"
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
            />
          </div>

          {/* Reply Tracking Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-white/10 mt-2">
            <div>
              <Label htmlFor="reply-tracking" className="text-sm font-medium">Reply Tracking</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Connect your inbox to detect replies automatically
              </p>
            </div>
            <button
              type="button"
              role="switch"
              id="reply-tracking"
              aria-checked={replyTracking}
              onClick={() => setReplyTracking(v => !v)}
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
              style={{ background: replyTracking ? '#FFCE0A' : undefined }}
              data-state={replyTracking ? 'checked' : 'unchecked'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  replyTracking ? 'translate-x-5' : 'translate-x-0.5'
                } ${!replyTracking ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
              />
            </button>
          </div>

          {/* IMAP Fields — shown only when Reply Tracking is on */}
          {replyTracking && (
            <div className="space-y-4 pl-3 border-l-2 border-[#FFCE0A]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                IMAP is used to read your inbox and detect when agents reply. Username and password default to your SMTP credentials if left blank.
              </p>

              <div className="space-y-2">
                <Label htmlFor="imap-host">IMAP Host *</Label>
                <Input
                  id="imap-host"
                  placeholder="imap.gmail.com"
                  value={imapConfig.host}
                  onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-port">IMAP Port</Label>
                <Input
                  id="imap-port"
                  type="number"
                  placeholder="993"
                  value={imapConfig.port}
                  onChange={(e) => setImapConfig({ ...imapConfig, port: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Common ports: 993 (SSL), 143 (STARTTLS)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-username">IMAP Username</Label>
                <Input
                  id="imap-username"
                  placeholder={config.username || 'you@example.com'}
                  value={imapConfig.username}
                  onChange={(e) => setImapConfig({ ...imapConfig, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-password">IMAP Password</Label>
                <div className="relative">
                  <Input
                    id="imap-password"
                    type={showImapPassword ? 'text' : 'password'}
                    placeholder="Leave blank to use SMTP password"
                    value={imapConfig.password}
                    onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImapPassword(!showImapPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showImapPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Connection successful! Ready to save.
              </span>
            </div>
          )}

          {testResult === 'failed' && errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Connection failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isTesting || isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleTest}
            disabled={isTesting || isSaving || testResult === 'success'}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : testResult === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tested
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isTesting || isSaving || testResult !== 'success'}
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Connect'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
