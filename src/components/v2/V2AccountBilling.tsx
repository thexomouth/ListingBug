import { CreditCard } from 'lucide-react';
import { BillingPage } from '../BillingPage';

export function V2AccountBilling() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">View your plan, manage your subscription, and update payment details.</p>
        </div>
        <BillingPage embeddedInTabs />
      </div>
    </div>
  );
}
