import { History, Sparkles, Bug, Zap } from 'lucide-react';

export function ChangelogPage() {
  return (
    <div className="min-h-[calc(100vh-300px)] flex items-center justify-center bg-white dark:bg-[#0F1115] px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFCE0A]/10 dark:bg-[#FFCE0A]/5 rounded-2xl mb-6">
          <History className="w-10 h-10 text-[#FFCE0A]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-[#342e37] dark:text-white mb-4">
          Changelog Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-[#EBF2FA]/80 mb-8 leading-relaxed">
          We're building a detailed version history to keep you informed about new features, 
          improvements, and bug fixes. Stay tuned for comprehensive release notes!
        </p>

        {/* Feature Preview Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Sparkles className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              New Features
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Track exciting new capabilities
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Zap className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Improvements
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Performance and UX enhancements
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Bug className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Bug Fixes
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Quality and stability updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}