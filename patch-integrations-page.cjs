const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add imports
c = c.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect } from 'react';\nimport { supabase } from '../lib/supabase';"
);

// 2. Find insertion point after handleConnectionModalClose function
const marker = 'handleConnectionModalClose = () => {';
const markerIdx = c.indexOf(marker);
if (markerIdx < 0) { console.log('MARKER NOT FOUND'); process.exit(1); }
// Find the closing }; after it
const closingIdx = c.indexOf('};', markerIdx) + 2;
console.log('insert after:', closingIdx, JSON.stringify(c.slice(closingIdx, closingIdx+30)));

const newCode = `

  // ── Load real connected state from Supabase ──────────────────────────────
  const loadConnectedIntegrations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('integration_connections')
      .select('integration_id')
      .eq('user_id', session.user.id);
    if (error || !data) return;
    const connectedIds = new Set(data.map((r: any) => r.integration_id));
    setIntegrations(prev => prev.map(i => ({
      ...i,
      connected: connectedIds.has(i.id),
      category: connectedIds.has(i.id) ? 'connected' : (i.category === 'connected' ? 'available' : i.category),
    })));
  };

  useEffect(() => {
    loadConnectedIntegrations();
    const params = new URLSearchParams(window.location.search);
    const justConnected = params.get('connected');
    if (justConnected) {
      toast.success('Integration connected! Configure your settings below.');
      setTimeout(() => {
        handleConnectClick(justConnected);
        window.history.replaceState({}, '', '/integrations');
      }, 400);
    }
  }, []);

  const handleDisconnect = async (integrationId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    await supabase.from('integration_connections').delete().eq('user_id', session.user.id).eq('integration_id', integrationId);
    setIntegrations(prev => prev.map(i =>
      i.id === integrationId ? { ...i, connected: false, category: 'available' } : i
    ));
    setDisconnectOpen(false);
    toast.success('Integration disconnected');
  };`;

c = c.slice(0, closingIdx) + newCode + c.slice(closingIdx);

// 3. Also update handleConnectionComplete to reload connected state after connecting
const completeMarker = "const handleConnectionComplete = (integrationId: string, credentials?: { apiKey?: string }) => {";
const completeIdx = c.indexOf(completeMarker);
if (completeIdx > 0) {
  const completeEnd = c.indexOf('};', completeIdx) + 2;
  const newComplete = `const handleConnectionComplete = (integrationId: string, credentials?: any) => {
    setConnectionModalOpen(false);
    setConnectionModalIntegration(null);
    loadConnectedIntegrations();
    onConnect?.(integrationId);
  };`;
  c = c.slice(0, completeIdx) + newComplete + c.slice(completeEnd);
  console.log('handleConnectionComplete: patched');
}

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('supabase import:', v.includes("import { supabase }"));
console.log('useEffect:', v.includes('loadConnectedIntegrations'));
console.log('OAuth handler:', v.includes('justConnected'));
console.log('handleDisconnect:', v.includes('handleDisconnect'));
