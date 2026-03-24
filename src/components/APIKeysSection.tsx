import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Key, Copy, Trash2, Eye, EyeOff, Plus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';

interface APIKey {
  id: string;
  name: string;
  keyPreview: string;
  fullKey?: string; // Only available immediately after creation
  createdAt: string;
  lastUsed: string | null;
}

interface APIKeysSectionProps {
  onNavigate?: (page: string) => void;
}

export function APIKeysSection({ onNavigate }: APIKeysSectionProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedKeyForRevoke, setSelectedKeyForRevoke] = useState<APIKey | null>(null);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<APIKey | null>(null);
  
  const [newKeyName, setNewKeyName] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return 'Never';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const loadApiKeys = async () => {
      setLoadingKeys(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userId = currentUser?.id;
      if (!userId) {
        setApiKeys([]);
        setLoadingKeys(false);
        return;
      }
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load API keys:', error);
        toast.error('Unable to load API keys');
        setApiKeys([]);
      } else {
        setApiKeys(
          (data || []).map((item: any) => ({
            id: item.id,
            name: item.name || 'Untitled key',
            keyPreview: item.key ? `${item.key.substring(0, 16)}...` : '—',
            createdAt: item.created_at,
            lastUsed: item.last_used || null,
          }))
        );
      }
      setLoadingKeys(false);
    };

    loadApiKeys();
  }, []);

  const generateRandomKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'lb_live_';
    for (let i = 0; i < 48; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    if (apiKeys.length >= 10) {
      toast.error('Maximum of 10 API keys allowed');
      return;
    }

    const fullKey = generateRandomKey();

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const userId = currentUser?.id;

    if (!userId) {
      toast.error('Unable to generate API key: not signed in');
      return;
    }

    console.log('[APIKeys] inserting for user:', userId);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: newKeyName.trim(),
        key: fullKey,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[APIKeys] insert failed:', error?.message, error?.code, error?.details);
      toast.error(`Unable to generate API key: ${error?.message || 'unknown error'}`);
      return;
    }

    const createdKey: APIKey = {
      id: data.id,
      name: data.name,
      keyPreview: `${fullKey.substring(0, 16)}...`,
      fullKey,
      createdAt: data.created_at,
      lastUsed: data.last_used || null,
    };

    setApiKeys([createdKey, ...apiKeys]);
    setNewlyGeneratedKey(createdKey);
    setShowGenerateModal(false);
    setShowKeyModal(true);
    setNewKeyName('');
    toast.success('API key generated successfully');
  };

  const handleCopyKey = () => {
    if (newlyGeneratedKey?.fullKey) {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(newlyGeneratedKey.fullKey)
          .then(() => {
            setKeyCopied(true);
            toast.success('API key copied to clipboard');
            setTimeout(() => setKeyCopied(false), 2000);
          })
          .catch(() => {
            // Fallback to legacy method
            copyTextFallback(newlyGeneratedKey.fullKey);
          });
      } else {
        // Use fallback method if Clipboard API not available
        copyTextFallback(newlyGeneratedKey.fullKey);
      }
    }
  };

  // Fallback copy method for when Clipboard API is blocked
  const copyTextFallback = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setKeyCopied(true);
        toast.success('API key copied to clipboard');
        setTimeout(() => setKeyCopied(false), 2000);
      } else {
        toast.error('Failed to copy. Please select and copy manually.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy. Please select and copy manually.');
    }
  };

  const handleRevokeKey = async () => {
    if (!selectedKeyForRevoke) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', selectedKeyForRevoke.id);

    if (error) {
      console.error('Failed to revoke API key:', error);
      toast.error('Unable to revoke API key');
      return;
    }

    setApiKeys((prev) => prev.filter((k) => k.id !== selectedKeyForRevoke.id));
    toast.success(`API key "${selectedKeyForRevoke.name}" revoked`);
    setShowRevokeModal(false);
    setSelectedKeyForRevoke(null);
  };

  const handleCloseKeyModal = () => {
    setShowKeyModal(false);
    setNewlyGeneratedKey(null);
    setKeyCopied(false);
  };

  return (
    <Card className="bg-white dark:bg-[#2F2F2F] border-gray-200 dark:border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-bold text-[18px] text-[#342e37] dark:text-white">
              <Key className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
              API Keys
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-[#EBF2FA]">
              Generate API keys for Zapier, Make.com, and n8n integrations
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowGenerateModal(true)}
            disabled={apiKeys.length >= 10}
            className="gap-2 bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Generate New Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-[#EBF2FA] mb-4">
          Generate API keys for Zapier, Make.com, and n8n integrations. Each key can be revoked independently.
          Maximum 10 keys allowed.
        </p>

        <Separator className="dark:bg-white/10 mb-4" />

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-600 dark:text-[#EBF2FA]">No API keys yet</p>
            <p className="text-sm text-gray-500 dark:text-[#EBF2FA]/60 mt-1">
              Generate your first API key to connect with Zapier, Make.com, or n8n
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="border border-gray-200 dark:border-white/10 rounded-lg p-4 hover:border-[#342e37] dark:hover:border-[#FFCE0A] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-[14px] truncate">{key.name}</h4>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 dark:bg-[#2F2F2F] px-2 py-1 rounded font-mono">
                          {key.keyPreview}
                        </code>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#EBF2FA]/60">
                        <span>Created {formatDate(key.createdAt)}</span>
                        <span>•</span>
                        <span>Last used {formatDate(key.lastUsed)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedKeyForRevoke(key);
                      setShowRevokeModal(true);
                    }}
                    className="gap-2 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {apiKeys.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-[#EBF2FA]/60 mt-4">
            {apiKeys.length} of 10 API keys used
          </p>
        )}
      </CardContent>

      {/* Generate New Key Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for connecting to Zapier, Make.com, or n8n. Give it a descriptive name
              to help you remember what it's used for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">API Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., My Zapier Connection"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerateKey();
                  }
                }}
              />
              <p className="text-xs text-gray-500 dark:text-[#EBF2FA]/60">
                This is just a label for you to identify this key
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateModal(false);
              setNewKeyName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleGenerateKey}>
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Modal */}
      <Dialog open={showKeyModal} onOpenChange={handleCloseKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Copy Your API Key Now
            </DialogTitle>
            <DialogDescription>
              This is the only time you'll be able to see the full API key. Copy it now and store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>API Key Name</Label>
              <p className="font-bold">{newlyGeneratedKey?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-3">
                  <code className="text-xs font-mono break-all">
                    {newlyGeneratedKey?.fullKey}
                  </code>
                </div>
                <Button
                  size="sm"
                  onClick={handleCopyKey}
                  className="gap-2 flex-shrink-0"
                >
                  {keyCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Warning:</strong> Once you close this dialog, you won't be able to see this key again.
                  Make sure to copy it now!
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseKeyModal}>
              I've Copied My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Confirmation Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key?</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the API key "{selectedKeyForRevoke?.name}"?
              Any integrations using this key will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRevokeModal(false);
              setSelectedKeyForRevoke(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeKey}>
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}