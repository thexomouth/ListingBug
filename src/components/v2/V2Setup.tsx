import { Settings } from 'lucide-react';
import { SetupTab } from '../messaging/SetupTab';

export function V2Setup() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-[#342e37] dark:text-[#FFCE0A]" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Setup</h1>
        </div>
        <SetupTab />
      </div>
    </div>
  );
}
