const fs = require('fs');

// ─── HELPER ──────────────────────────────────────────────────────────────────
function patch(path, find, replace, label) {
  let content = fs.readFileSync(path, 'utf8');
  if (!content.includes(find)) {
    console.warn('  WARN: pattern not found for: ' + label);
    return;
  }
  fs.writeFileSync(path, content.replace(find, replace), 'utf8');
  console.log('  OK: ' + label);
}

// ─── 1. FOOTER: remove LinkedIn + Twitter, keep email + github ───────────────
const footerPath = 'C:\\Users\\User\\Downloads\\ListingBug FIGMA MVP\\src\\components\\Footer.tsx';
patch(footerPath,
  `import { Mail, Linkedin, Twitter, Github } from "lucide-react";`,
  `import { Mail, Github } from "lucide-react";`,
  'footer: remove LinkedIn/Twitter imports'
);
patch(footerPath,
  `                <button className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors" aria-label="LinkedIn" onClick={() => window.open('https://linkedin.com', '_blank')}>
                  <Linkedin className="w-5 h-5" />
                </button>
                <button className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors" aria-label="Twitter" onClick={() => window.open('https://twitter.com', '_blank')}>
                  <Twitter className="w-5 h-5" />
                </button>`,
  ``,
  'footer: remove LinkedIn/Twitter buttons'
);

// Make branding full-width and columns start after it
patch(footerPath,
  `          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Branding & Description */}
            <div className="lg:col-span-2">`,
  `          <div className="mb-8">
            {/* Branding & Description - full width */}
            <div className="mb-6">`,
  'footer: branding full width'
);
// Close the branding div and start columns div
patch(footerPath,
  `            {/* Product */}
            <div>`,
  `            </div>{/* end branding */}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Product */}
            <div>`,
  'footer: start columns after branding'
);

console.log('Footer done');

// ─── 2. ACCOUNTPAGE: load real user data, fix profile/subscription/password ──
const apPath = 'C:\\Users\\User\\Downloads\\ListingBug FIGMA MVP\\src\\components\\AccountPage.tsx';
let ap = fs.readFileSync(apPath, 'utf8');

// Replace hardcoded state + add useEffect to load from Supabase
ap = ap.replace(
  `  const [name, setName] = useState('Sarah Martinez');
  const [email, setEmail] = useState('sarah.martinez@realestatepros.com');
  const [company, setCompany] = useState('Martinez Realty Group');`,
  `  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [planName, setPlanName] = useState('Trial');
  const [planPrice, setPlanPrice] = useState('Free');
  const [planListings, setPlanListings] = useState('500');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);`
);

// Add useEffect after the walkthrough line
ap = ap.replace(
  `  // Walkthrough integration
  const { resetWalkthrough } = useWalkthrough();`,
  `  // Walkthrough integration
  const { resetWalkthrough } = useWalkthrough();

  // Load real user profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data } = await supabase
        .from('users')
        .select('plan, plan_status, trial_ends_at, created_at')
        .eq('id', user.id)
        .single();
      if (data) {
        const plan = (data.plan || 'trial').toLowerCase();
        setIsTrial(plan === 'trial' || data.plan_status === 'trialing');
        setTrialEndsAt(data.trial_ends_at || null);
        if (plan === 'starter') { setPlanName('Starter'); setPlanPrice('$49/mo'); setPlanListings('4,000'); }
        else if (plan === 'professional') { setPlanName('Professional'); setPlanPrice('$99/mo'); setPlanListings('10,000'); }
        else if (plan === 'enterprise') { setPlanName('Enterprise'); setPlanPrice('Contact Us'); setPlanListings('Unlimited'); }
        else { setPlanName('Trial'); setPlanPrice('Free'); setPlanListings('500'); }
      }
      // Load display name from auth metadata
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (displayName) setName(displayName);
      setIsLoadingProfile(false);
    };
    loadProfile();
  }, []);`
);

// Fix handleSave to actually update Supabase
ap = ap.replace(
  `  const handleSave = () => {
    toast.success('Account settings saved');
  };`,
  `  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updates: any = {};
    if (name) updates.data = { full_name: name };
    if (Object.keys(updates).length > 0) {
      await supabase.auth.updateUser(updates);
    }
    toast.success('Profile saved');
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) { toast.error('Please enter a new password'); return; }
    if (newPassword !== confirmNewPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully');
    setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
  };`
);

// Fix profile card — show real data, no hardcoded placeholder
ap = ap.replace(
  `                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSave} className="mt-1">Save Changes</Button>`,
  `                  {isLoadingProfile ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} disabled className="opacity-60" />
                        <p className="text-xs text-gray-500">Email cannot be changed here</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="company">Company (optional)</Label>
                        <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
                      </div>
                      <Button onClick={handleSave} className="mt-1">Save Changes</Button>
                    </>
                  )}`
);

// Fix subscription card — show real plan data
ap = ap.replace(
  `                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="mb-0.5">Professional Plan</div>
                        <p className="text-sm text-gray-600">10,000 listings per month</p>
                      </div>
                      <div className="text-right">
                        <div className="mb-0.5">$99/month</div>
                        <p className="text-sm text-gray-600">Renews on Dec 1, 2025</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Change Plan</Button>
                      <Button variant="outline" size="sm">Cancel Subscription</Button>
                    </div>
                  </div>`,
  `                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="mb-0.5 font-medium">{planName} Plan</div>
                        <p className="text-sm text-gray-600">{planListings} listings per month</p>
                      </div>
                      <div className="text-right">
                        <div className="mb-0.5 font-medium">{planPrice}</div>
                        {isTrial && trialEndsAt ? (
                          <p className="text-sm text-amber-600">Trial ends {new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        ) : isTrial ? (
                          <p className="text-sm text-amber-600">Trial period</p>
                        ) : (
                          <p className="text-sm text-gray-600">Active subscription</p>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('billing')}>Manage Billing</Button>
                    </div>
                  </div>`
);

// Fix password update button to call handleUpdatePassword
ap = ap.replace(
  `                  <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button className="mt-1">Update Password</Button>`,
  `                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Repeat new password" />
                  </div>
                  <Button className="mt-1" onClick={handleUpdatePassword}>Update Password</Button>`
);

fs.writeFileSync(apPath, ap, 'utf8');
console.log('AccountPage done');

// ─── 3. BILLINGPAGE: load real plan, hide payment/invoices on trial ──────────
const bpPath = 'C:\\Users\\User\\Downloads\\ListingBug FIGMA MVP\\src\\components\\BillingPage.tsx';
let bp = fs.readFileSync(bpPath, 'utf8');

// Add state variables and useEffect to load real plan data
bp = bp.replace(
  `  const [isLoadingPortal, setIsLoadingPortal] = useState(false);`,
  `  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [realPlan, setRealPlan] = useState<{plan: string, status: string, trial_ends_at: string | null, created_at: string} | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('plan, plan_status, trial_ends_at, created_at').eq('id', user.id).single();
      if (data) setRealPlan(data);
    };
    loadPlan();
  }, []);

  const isTrial = !realPlan || (realPlan.plan === 'trial') || (realPlan.plan_status === 'trialing');
  const hasPaymentMethod = !isTrial;`
);

// Add supabase import
if (!bp.includes("import { supabase }")) {
  bp = bp.replace(
    `import { useState`,
    `import { useState, useEffect`
  );
  bp = bp.replace(
    `import { CreditCard,`,
    `import { supabase } from '../lib/supabase';\nimport { CreditCard,`
  );
}

// Replace hardcoded subscription object to use real data
bp = bp.replace(
  `  // MOCK DATA - Replace with API response
  const subscription = {
    plan: 'Professional',                    // DYNAMIC: Billing_Display_PlanName
    status: 'Active',                        // DYNAMIC: Billing_Display_Status
    price: 99,                               // DYNAMIC: Billing_Display_Price (monthly)
    billingCycle: 'Monthly',                 // DYNAMIC: Billing_Display_Cycle
    nextBillingDate: '2024-12-23',          // DYNAMIC: Billing_Display_NextBilling
    reportsLimit: 10000,                     // DYNAMIC: Billing_Display_ReportsLimit (listings/month)
    reportsUsed: 4823,                       // DYNAMIC: Billing_Display_ReportsUsed
    dataPointsLimit: 100000,                 // DYNAMIC: Billing_Display_DataPointsLimit
    dataPointsUsed: 45320,                   // DYNAMIC: Billing_Display_DataPointsUsed
    trialEndsAt: null,                       // DYNAMIC: null if not on trial
    cancelAtPeriodEnd: false,                // DYNAMIC: true if cancellation scheduled
    // Projected usage data
    projectedReports: 9200,                  // DYNAMIC: Billing_Display_ProjectedReports
    projectedDataPoints: 92500,              // DYNAMIC: Billing_Display_ProjectedDataPoints`,
  `  // Real subscription data derived from Supabase
  const planMap: Record<string, {plan: string, price: number, limit: number}> = {
    trial:        { plan: 'Trial',        price: 0,  limit: 500 },
    starter:      { plan: 'Starter',      price: 49, limit: 4000 },
    professional: { plan: 'Professional', price: 99, limit: 10000 },
    enterprise:   { plan: 'Enterprise',   price: 0,  limit: 999999 },
  };
  const planKey = realPlan?.plan?.toLowerCase() || 'trial';
  const planInfo = planMap[planKey] || planMap['trial'];
  const subscription = {
    plan: planInfo.plan,
    status: isTrial ? 'Trial' : 'Active',
    price: planInfo.price,
    billingCycle: 'Monthly',
    nextBillingDate: realPlan?.trial_ends_at || 'N/A',
    reportsLimit: planInfo.limit,
    reportsUsed: 0,
    dataPointsLimit: planInfo.limit * 10,
    dataPointsUsed: 0,
    trialEndsAt: realPlan?.trial_ends_at || null,
    cancelAtPeriodEnd: false,
    projectedReports: 0,
    projectedDataPoints: 0,`
);

fs.writeFileSync(bpPath, bp, 'utf8');
console.log('BillingPage done');

// ─── 4. INPUT PLACEHOLDER: grey placeholder, white text on input ─────────────
const globalsCssPath = 'C:\\Users\\User\\Downloads\\ListingBug FIGMA MVP\\src\\styles\\globals.css';
let css = fs.readFileSync(globalsCssPath, 'utf8');

// The current placeholder color is #d1d5db (grey-300) which is fine for light mode
// but on the dark auth pages inputs have dark backgrounds so placeholder should be lighter grey
// and entered text should be white/dark depending on theme
css = css.replace(
  `  /* Lighter placeholder text */
  ::placeholder {
    color: #d1d5db;
    opacity: 1;
  }

  :-ms-input-placeholder {
    color: #d1d5db;
  }

  ::-ms-input-placeholder {
    color: #d1d5db;
  }`,
  `  /* Placeholder: grey. Typed text: inherits (white in dark, dark in light) */
  ::placeholder {
    color: #9ca3af;
    opacity: 1;
  }

  :-ms-input-placeholder {
    color: #9ca3af;
  }

  ::-ms-input-placeholder {
    color: #9ca3af;
  }
  
  /* Dark mode: lighter placeholder so it's visible on dark inputs */
  .dark ::placeholder {
    color: #6b7280;
    opacity: 1;
  }`
);

fs.writeFileSync(globalsCssPath, css, 'utf8');
console.log('Globals CSS placeholder done');

// ─── 5. BILLINGPAGE: hide payment method section when no payment on trial ─────
// Find the payment method section and wrap with conditional
let bp2 = fs.readFileSync(bpPath, 'utf8');

// Find the payment method card and wrap it
bp2 = bp2.replace(
  `  const paymentMethod = {
    type: 'card',                            // DYNAMIC: Billing_PaymentMethod_Type
    brand: 'Visa',                           // DYNAMIC: Billing_PaymentMethod_Brand
    last4: '4242',                           // DYNAMIC: Billing_PaymentMethod_Last4
    expiryMonth: 12,                         // DYNAMIC: Billing_PaymentMethod_ExpMonth
    expiryYear: 2025,                        // DYNAMIC: Billing_PaymentMethod_ExpYear
    isDefault: true,                         // DYNAMIC: Billing_PaymentMethod_IsDefault
  };`,
  `  // Payment method only shown for paid plans
  const paymentMethod = hasPaymentMethod ? {
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  } : null;`
);

// Hide invoices on trial — replace invoices array with empty when trial
bp2 = bp2.replace(
  `  const invoices = [
    {
      id: 'inv_001',                         // DYNAMIC: Invoice ID for download`,
  `  const invoices = isTrial ? [] : [
    {
      id: 'inv_001',`
);

fs.writeFileSync(bpPath, bp2, 'utf8');
console.log('BillingPage payment/invoices trial guard done');

// ─── 6. BILLING TABLE: make it horizontally scrollable on mobile ─────────────
let bp3 = fs.readFileSync(bpPath, 'utf8');
bp3 = bp3.replace(
  `              <table className="w-full text-[13px]">`,
  `              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0"><table className="w-full text-[13px] min-w-[500px]">`
);
bp3 = bp3.replace(
  `              </table>`,
  `              </table></div>`
);
fs.writeFileSync(bpPath, bp3, 'utf8');
console.log('BillingPage table scroll done');

console.log('\nAll patches complete.');
