const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find exact boundaries using indexOf
const start = c.indexOf('  const handleRunNow = async (automation: Automation) => {');
// Find the end: the closing }; after the setTimeout block
// Look for '  };\n' or '  };\r\n' after the setTimeout
let searchFrom = start + 50;
let end = -1;
// The function ends at the next top-level function declaration
// Find '  const handleDeleteAutomation'
const nextFn = c.indexOf('  const handleDeleteAutomation', start);
if (nextFn > 0) {
  // Walk back from nextFn to find the closing };
  let i = nextFn - 1;
  while (i > start && c[i] !== ';') i--;
  // i is at ';', go back a bit more to include it
  end = i + 1;
}

console.log('start:', start, 'end:', end, 'length:', end - start);
if (start < 0 || end < 0) { console.log('NOT FOUND'); process.exit(1); }

const before = c.slice(0, start);
const after = c.slice(end);

const newFn = `  const handleRunNow = async (automation: Automation) => {
    setRunNowLoading(true);
    setRunningAutomation(automation);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        \`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-automation\`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${session.access_token}\`,
          },
          body: JSON.stringify({ automation }),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Automation run failed');

      const { status, listings_found, listings_sent, details } = result;
      const destLabel = automation.destination?.label ?? 'destination';

      if (status === 'failed') {
        toast.error(\`"\${automation.name}" failed: \${(details ?? 'Unknown error').slice(0, 120)}\`);
      } else {
        toast.success(\`"\${automation.name}" complete — \${listings_found} found, \${listings_sent} sent to \${destLabel}\`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({
          userId: user.id,
          type: status === 'failed' ? 'error' : 'success',
          title: status === 'failed'
            ? \`Automation failed: \${automation.name}\`
            : \`Automation run complete: \${automation.name}\`,
          message: status === 'failed'
            ? (details ?? 'The automation encountered an error.')
            : listings_sent > 0
              ? \`\${listings_found} listings found — \${listings_sent} sent to \${destLabel}\`
              : \`\${listings_found} listings found. Check destination config if 0 were sent.\`,
        });
      }

      await loadRunHistory();

      setAutomations(prev => prev.map(a =>
        a.id === automation.id
          ? { ...a, lastRun: { status: status === 'failed' ? 'failed' : 'success', date: new Date().toISOString(), listingsSent: listings_sent ?? 0, details: details ?? '' } }
          : a
      ));

    } catch (err: any) {
      const msg = err.message ?? 'Unknown error';
      toast.error(\`Run failed: \${msg}\`);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({
          userId: user.id,
          type: 'error',
          title: \`Automation failed: \${automation.name}\`,
          message: msg,
        });
      }
    } finally {
      setRunNowLoading(false);
      setRunningAutomation(null);
    }
  };`;

fs.writeFileSync(path, before + newFn + '\n\n' + after.trimStart());
const verify = require('fs').readFileSync(path, 'utf8');
console.log('run-automation wired:', verify.includes('run-automation'));
console.log('loadRunHistory called:', verify.includes('loadRunHistory()'));
