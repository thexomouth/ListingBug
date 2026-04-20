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
  use_tls: boolean;
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
    use_tls: true,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleTest = async () => {
    // Validation
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
          use_tls: config.use_tls,
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

      // Store SMTP configuration
      const { data: connection, error: insertError } = await supabase
        .from('integration_connections')
        .insert({
          user_id: userId,
          integration_id: 'smtp',
          credentials: {
            username: config.username,
            password: config.password, // TODO: Encrypt in edge function
          },
          config: {
            host: config.host,
            port: parseInt(config.port, 10),
            use_tls: config.use_tls,
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

      // Check if this is the user's first sender - set as default
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
    if (!isTesting && !isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
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
              Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
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

          {/* TLS Toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="use-tls" className="flex-1">
              Use TLS/STARTTLS
            </Label>
            <button
              type="button"
              role="switch"
              aria-checked={config.use_tls}
              onClick={() => setConfig({ ...config, use_tls: !config.use_tls })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                config.use_tls ? 'bg-[#FFCE0A]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.use_tls ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

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
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Connection failed
                </p>
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
