import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
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

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<'success' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showImapPassword, setShowImapPassword] = useState(false);

  const handleConnect = async () => {
    if (!config.host || !config.port || !config.username || !config.password || !config.from_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsConnecting(true);
    setConnectResult(null);
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

      if (!data?.success) {
        setConnectResult('failed');
        setErrorMessage(data?.error || 'Connection test failed');
        return;
      }

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

      setConnectResult('success');
      toast.success('SMTP account connected successfully!');
      onSuccess(connection.id);
      onClose();
    } catch (err: any) {
      setConnectResult('failed');
      setErrorMessage(err.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (!isConnecting) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[100dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="w-4 h-4" />
            Connect Custom SMTP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Row 1: Host + Port */}
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div className="space-y-1">
              <Label htmlFor="smtp-host" className="text-xs">SMTP Host <span className="text-red-500">*</span></Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="smtp-port" className="text-xs">Port <span className="text-red-500">*</span></Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Row 2: Username + From Email */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="smtp-username" className="text-xs">Username <span className="text-red-500">*</span></Label>
              <Input
                id="smtp-username"
                placeholder="you@example.com"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="from-email" className="text-xs">From Email <span className="text-red-500">*</span></Label>
              <Input
                id="from-email"
                type="email"
                placeholder="you@example.com"
                value={config.from_email}
                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Row 3: Password + From Name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="smtp-password" className="text-xs">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="h-8 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="from-name" className="text-xs">From Name <span className="text-red-500">*</span></Label>
              <Input
                id="from-name"
                placeholder="Your Name"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Reply Tracking Toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Reply Tracking</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Connect your inbox to detect replies
              </p>
            </div>
            <button
              type="button"
              role="switch"
              id="reply-tracking"
              aria-checked={replyTracking}
              onClick={() => setReplyTracking(v => !v)}
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
              style={{ background: replyTracking ? '#FFCE0A' : '#d1d5db' }}
              data-state={replyTracking ? 'checked' : 'unchecked'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  replyTracking ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* IMAP Section */}
          {replyTracking && (
            <div className="space-y-3 pl-3 border-l-2 border-[#FFCE0A]">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                IMAP lets ListingBug detect replies. Credentials default to SMTP if left blank.
              </p>

              {/* IMAP Row 1: Host + Port */}
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <div className="space-y-1">
                  <Label htmlFor="imap-host" className="text-xs">IMAP Host <span className="text-red-500">*</span></Label>
                  <Input
                    id="imap-host"
                    placeholder="imap.gmail.com"
                    value={imapConfig.host}
                    onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="imap-port" className="text-xs">Port</Label>
                  <Input
                    id="imap-port"
                    type="number"
                    placeholder="993"
                    value={imapConfig.port}
                    onChange={(e) => setImapConfig({ ...imapConfig, port: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* IMAP Row 2: Username + Password */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="imap-username" className="text-xs">IMAP Username</Label>
                  <Input
                    id="imap-username"
                    placeholder={config.username || 'you@example.com'}
                    value={imapConfig.username}
                    onChange={(e) => setImapConfig({ ...imapConfig, username: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="imap-password" className="text-xs">IMAP Password</Label>
                  <div className="relative">
                    <Input
                      id="imap-password"
                      type={showImapPassword ? 'text' : 'password'}
                      placeholder="Uses SMTP password"
                      value={imapConfig.password}
                      onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                      className="h-8 text-sm pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImapPassword(!showImapPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showImapPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Result */}
          {connectResult === 'failed' && errorMessage && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-700 dark:text-red-300 font-medium">Connection failed</p>
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 break-words">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 justify-end pt-3 border-t">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
