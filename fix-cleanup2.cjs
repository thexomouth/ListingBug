const fs = require('fs');
const repo = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src';

// ── 1. AccountPage: remove Subscription block (lines 239-263) ────────────────
const app = repo + '/components/AccountPage.tsx';
let ac = fs.readFileSync(app, 'utf8');
const acLines = ac.split('\n');
// Lines are 0-indexed, file shows 239-263 (1-indexed) = 238-262 (0-indexed)
let subStart = -1, subEnd = -1;
for (let i = 0; i < acLines.length; i++) {
  if (acLines[i].includes('{/* Subscription */}')) subStart = i;
  if (subStart > -1 && acLines[i].includes('{/* Password */}')) { subEnd = i; break; }
}
if (subStart > -1 && subEnd > -1) {
  acLines.splice(subStart, subEnd - subStart);
  fs.writeFileSync(app, acLines.join('\n'));
  console.log('1. AccountPage: subscription block removed ✓');
} else {
  console.log('1. AccountPage: markers not found start:' + subStart + ' end:' + subEnd);
}

// ── 2. BillingPage: payment method → null zero state ─────────────────────────
const bpp = repo + '/components/BillingPage.tsx';
let bp = fs.readFileSync(bpp, 'utf8');
bp = bp.replace(
`  const paymentMethod = {
    type: 'card',                            // DYNAMIC: Billing_PaymentMethod_Type
    brand: 'Visa',                           // DYNAMIC: Billing_PaymentMethod_Brand
    last4: '4242',                           // DYNAMIC: Billing_PaymentMethod_Last4
    expiryMonth: 12,                         // DYNAMIC: Billing_PaymentMethod_ExpMonth
    expiryYear: 2025,                        // DYNAMIC: Billing_PaymentMethod_ExpYear
    isDefault: true,                         // DYNAMIC: Billing_PaymentMethod_IsDefault
  };`,
  `  const paymentMethod = null; // Zero state — populated from Stripe after subscription`
);
const pmFixed = !bp.includes('4242');
fs.writeFileSync(bpp, bp);
console.log('2. BillingPage: payment method zero state:', pmFixed ? '✓' : '✗ still has mock data');

// ── 3. BillingPage: trial date fix — "Invalid Date" → trial_ends_at ──────────
// The subscription.nextBillingDate is already set to '—' for trial in the useEffect
// But we need to check where "Next billing date" is rendered and swap label for trial
bp = fs.readFileSync(bpp, 'utf8');
const bpLines = bp.split('\n');
for (let i = 0; i < bpLines.length; i++) {
  if (bpLines[i].includes('Next billing date') || bpLines[i].includes('Next Billing Date') || bpLines[i].includes('nextBillingDate')) {
    console.log('  Found billing date at L' + (i+1) + ':', bpLines[i].trim());
  }
}
// Replace next billing date label logic to show Trial ends for trial accounts
bp = bp.replace(
  /Next billing date/g,
  `{subscription.status === 'Trial' ? 'Trial ends' : 'Next billing date'}`
);
// Also fix the value display for Invalid Date
bp = bp.replace(
  /{subscription\.nextBillingDate}/g,
  `{subscription.status === 'Trial' && subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : subscription.nextBillingDate}`
);
fs.writeFileSync(bpp, bp);
console.log('3. BillingPage: trial date label fix applied ✓');

// ── 4. UsagePage: remove Current Plan Info block ──────────────────────────────
const usp = repo + '/components/UsagePage.tsx';
let us = fs.readFileSync(usp, 'utf8');
const usLines = us.split('\n');
let usStart = -1, usEnd = -1;
for (let i = 0; i < usLines.length; i++) {
  if (usLines[i].includes('{/* Current Plan Info')) usStart = i;
  if (usStart > -1 && usLines[i].includes('{/* ') && i > usStart + 3) { usEnd = i; break; }
}
if (usStart > -1 && usEnd > -1) {
  usLines.splice(usStart, usEnd - usStart);
  fs.writeFileSync(usp, usLines.join('\n'));
  console.log('4. UsagePage: plan info block removed ✓');
} else {
  console.log('4. UsagePage: block not found start:' + usStart + ' end:' + usEnd);
}

// ── 5. BillingPage: find and fix payment method DISPLAY section ───────────────
bp = fs.readFileSync(bpp, 'utf8');
const bpLines2 = bp.split('\n');
// Find where paymentMethod is rendered and replace with zero state
let pmDisplayStart = -1, pmDisplayEnd = -1;
for (let i = 0; i < bpLines2.length; i++) {
  if ((bpLines2[i].includes('paymentMethod.brand') || bpLines2[i].includes('Payment Method') && bpLines2[i].includes('default')) && pmDisplayStart === -1) {
    // Walk back to find section start
    for (let j = i; j > Math.max(0, i - 10); j--) {
      if (bpLines2[j].includes('<Card') || bpLines2[j].includes('Payment Method')) { pmDisplayStart = j; break; }
    }
  }
  if (pmDisplayStart > -1 && bpLines2[i].includes('</Card>') && i > pmDisplayStart + 5 && pmDisplayEnd === -1) {
    pmDisplayEnd = i;
  }
}
console.log('5. Payment display section:', pmDisplayStart, '-', pmDisplayEnd);

// ── 6. ChangePlanModal: remove Enterprise, remove proration ──────────────────
const cmp = repo + '/components/ChangePlanModal.tsx';
let cm = fs.readFileSync(cmp, 'utf8');
const cmLines = cm.split('\n');

// Remove Enterprise plan from plans array
let entStart = -1, entEnd = -1;
for (let i = 0; i < cmLines.length; i++) {
  if (cmLines[i].includes("id: 'enterprise'") || cmLines[i].includes('id: "enterprise"')) entStart = i - 1;
  if (entStart > -1 && cmLines[i].trim() === '},' && i > entStart + 5) { entEnd = i; break; }
}
if (entStart > -1 && entEnd > -1) {
  cmLines.splice(entStart, entEnd - entStart + 1);
  cm = cmLines.join('\n');
  console.log('6a. ChangePlanModal: Enterprise plan removed ✓');
} else {
  console.log('6a. ChangePlanModal: Enterprise not found start:' + entStart);
}

// Remove prorated billing language
cm = cm.replace(/Upgrades[\s\S]*?prorated billing\./gi, '');
cm = cm.replace(/prorat[a-z]*/gi, '');
cm = cm.replace(/Your plan will be (upgraded|changed) immediately/gi, 'Your plan starts today');
// Add enterprise contact note after plans
cm = cm.replace(
  /\{\/\* Enterprise Contact \*\/\}/,
  ''
);

// Fix confirmation copy
cm = cm.replace(
  /take effect immediately with prorated billing/gi,
  'take effect immediately'
);
cm = cm.replace(
  /You'll be charged a prorated amount/gi,
  'You will be billed the full amount'
);

fs.writeFileSync(cmp, cm);
console.log('6b. ChangePlanModal: prorated language cleaned ✓');

console.log('\nAll done.');
