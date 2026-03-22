const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/BillingPage.tsx';
let c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// ── 1. Replace mock subscription const with useState + useEffect ─────────────
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// MOCK DATA - Replace with API response')) startLine = i;
  if (startLine > -1 && lines[i].trim() === '};' && i > startLine + 5) {
    // Check next non-empty line is paymentMethod
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (lines[j] && lines[j].includes('const paymentMethod')) { endLine = i; break; }
  }
}
console.log('Mock block lines:', startLine, '-', endLine);

if (startLine > -1 && endLine > -1) {
  const newBlock = [
    '  const [subscription, setSubscription] = React.useState({',
    "    plan: 'Starter',",
    "    status: 'Active',",
    '    price: 19,',
    "    billingCycle: 'Monthly',",
    "    nextBillingDate: '—',",
    '    reportsLimit: 4000,',
    '    reportsUsed: 0,',
    '    dataPointsLimit: 40000,',
    '    dataPointsUsed: 0,',
    '    trialEndsAt: null,',
    '    cancelAtPeriodEnd: false,',
    '    projectedReports: 0,',
    '    projectedDataPoints: 0,',
    '    overageReports: 0,',
    '    overageDataPoints: 0,',
    '    overageRateReports: 0.01,',
    '    overageRateDataPoints: 0.0001,',
    '    overageFee: 0,',
    '  });',
    '',
    '  React.useEffect(() => {',
    '    const fetchBillingData = async () => {',
    "      const { data: { user } } = await supabase.auth.getUser();",
    '      if (!user) return;',
    "      const { data } = await supabase.from('users')",
    "        .select('plan, plan_status, trial_ends_at, stripe_subscription_end')",
    "        .eq('id', user.id).single();",
    '      if (data) {',
    "        const planName = data.plan === 'professional' ? 'Professional' : data.plan === 'enterprise' ? 'Enterprise' : 'Starter';",
    "        const price = data.plan === 'professional' ? 49 : data.plan === 'enterprise' ? 0 : 19;",
    "        const limit = data.plan === 'professional' ? 10000 : data.plan === 'enterprise' ? 999999 : 4000;",
    "        const isTrialing = data.plan_status === 'trialing' || !!data.trial_ends_at;",
    '        setSubscription(prev => ({',
    '          ...prev,',
    '          plan: planName, price, reportsLimit: limit,',
    "          status: isTrialing ? 'Trial' : data.plan_status === 'active' ? 'Active' : data.plan_status || 'Active',",
    '          trialEndsAt: data.trial_ends_at ?? null,',
    "          nextBillingDate: data.stripe_subscription_end ? new Date(data.stripe_subscription_end).toLocaleDateString() : '—',",
    '        }));',
    '      }',
    '    };',
    '    fetchBillingData();',
    '  }, []);',
  ];
  lines.splice(startLine, endLine - startLine + 1, ...newBlock);
  console.log('Mock subscription replaced ✓');
}

// Rejoin and re-split to get fresh line numbers
c = lines.join('\n');
const lines2 = c.split('\n');

// ── 2. Replace handleManageSubscription demo with real Stripe portal ──────────
let hmsStart = -1, hmsEnd = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('const handleManageSubscription = async ()')) hmsStart = i;
  if (hmsStart > -1 && lines2[i].trim() === '};' && i > hmsStart) { hmsEnd = i; break; }
}
console.log('handleManageSubscription lines:', hmsStart, '-', hmsEnd);

if (hmsStart > -1 && hmsEnd > -1) {
  const newFn = [
    '  const handleManageSubscription = async () => {',
    '    setIsLoadingPortal(true);',
    '    try {',
    "      const { data: { session } } = await supabase.auth.getSession();",
    "      if (!session?.access_token) throw new Error('Not authenticated');",
    "      const res = await fetch('https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/stripe-portal', {",
    "        method: 'POST',",
    "        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },",
    '        body: JSON.stringify({ returnUrl: window.location.href }),',
    '      });',
    '      const data = await res.json();',
    '      if (data.url) { window.location.href = data.url; }',
    "      else { toast.info('No billing account found. Please subscribe first.'); }",
    '    } catch (err) {',
    '      console.error(err);',
    "      toast.error('Could not open billing portal. Please try again.');",
    '    } finally {',
    '      setIsLoadingPortal(false);',
    '    }',
    '  };',
  ];
  lines2.splice(hmsStart, hmsEnd - hmsStart + 1, ...newFn);
  console.log('handleManageSubscription replaced ✓');
}

// ── 3. Add React import (useState/useEffect via React.useState) ───────────────
c = lines2.join('\n');
if (!c.includes("import React")) {
  c = "import React from 'react';\n" + c;
  console.log('React import added ✓');
}

fs.writeFileSync(path, c, 'utf8');
console.log('BillingPage.tsx updated. Lines:', c.split('\n').length);
