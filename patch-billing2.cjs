const fs = require('fs');

const bpPath = 'C:\\Users\\User\\Downloads\\ListingBug FIGMA MVP\\src\\components\\BillingPage.tsx';
let bp = fs.readFileSync(bpPath, 'utf8');

// Find the Payment Method card title/section and wrap with hasPaymentMethod check
// The section starts at the CardHeader with "Payment Method"
bp = bp.replace(
  `              {paymentMethod ? (`,
  `              {hasPaymentMethod && paymentMethod ? (`
);

// Replace hardcoded plan display with dynamic values
bp = bp.replace(
  `                        <p className="text-2xl font-bold text-[#342e37] dark:text-white">Professional Plan</p>`,
  `                        <p className="text-2xl font-bold text-[#342e37] dark:text-white">
                          {userPlan === 'trial' ? 'Free Trial' : userPlan === 'starter' ? 'Starter Plan' : userPlan === 'professional' ? 'Professional Plan' : 'Enterprise Plan'}
                        </p>`
);
bp = bp.replace(
  `                        <p className="text-gray-600 dark:text-[#EBF2FA]">10,000 listings per month</p>`,
  `                        <p className="text-gray-600 dark:text-[#EBF2FA]">
                          {userPlan === 'trial' ? '500 listings (trial)' : userPlan === 'starter' ? '4,000 listings/month' : userPlan === 'professional' ? '10,000 listings/month' : 'Unlimited listings'}
                        </p>`
);
bp = bp.replace(
  `                      <p className="text-2xl font-bold text-[#342e37] dark:text-white">$99</p>`,
  `                      <p className="text-2xl font-bold text-[#342e37] dark:text-white">
                        {userPlan === 'trial' ? 'Free' : userPlan === 'starter' ? '$49' : userPlan === 'professional' ? '$99' : 'Custom'}
                      </p>`
);

fs.writeFileSync(bpPath, bp, 'utf8');
console.log('BillingPage plan display patched');
