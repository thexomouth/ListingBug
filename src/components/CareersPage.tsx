import { Briefcase, Users, Zap, Globe } from 'lucide-react';

export function CareersPage() {
  return (
    <div className="min-h-[calc(100vh-300px)] flex items-center justify-center bg-white dark:bg-[#0F1115] px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFCE0A]/10 dark:bg-[#FFCE0A]/5 rounded-2xl mb-6">
          <Briefcase className="w-10 h-10 text-[#FFCE0A]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-[#342e37] dark:text-white mb-4">
          Careers Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-[#EBF2FA]/80 mb-8 leading-relaxed">
          We're building a team of passionate individuals dedicated to revolutionizing real estate data. 
          Join us in shaping the future of listing intelligence for service providers.
        </p>

        {/* Feature Preview Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Users className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Collaborative Culture
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Work with talented engineers and designers
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Globe className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Remote-First
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Work from anywhere with flexible schedules
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Zap className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Fast-Paced Growth
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Join a rapidly expanding platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}