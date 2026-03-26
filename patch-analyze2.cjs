const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

console.log('Before:', lines.length, 'lines');

// Line 549 (index 548) is the .eq line that got corrupted - fix it
// Line 550-673 (indices 549-672) is the garbage - delete it  
// Line 674+ (index 673+) is the real return() - keep it

const fixed = [
  ...lines.slice(0, 548),           // lines 1-548 unchanged
  "      .eq('user_id', userId)",   // line 549 fixed (was corrupted)
  "      .order('created_at', { ascending: false });",  // line 550 - the .order() that was also cut
  ...lines.slice(673)               // line 674 onwards (the return() JSX)
];

// But wait - we also need the rest of loadAutomations body (mapped, setAutomations etc)
// Those are still in lines 549+. Let me check what's in lines 549-560 of original
console.log('Lines 548-575:');
for (let i = 547; i < 575; i++) {
  console.log(i+1, JSON.stringify(lines[i]?.slice(0,100) ?? 'undefined'));
}
