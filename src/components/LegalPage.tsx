import { useLocation } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';

export function LegalPage() {
  const { pathname } = useLocation();
  const slug = pathname.split('/legal/')[1] || '';

  if (slug === 'subprocessors') return <SubprocessorsPage />;
  if (slug === 'dpa') return <DPAPage />;
  return null;
}

function SubprocessorsPage() {
  const subprocessors = [
    {
      name: 'Supabase',
      purpose: 'Database, authentication, real-time subscriptions, and edge functions',
      dataTypes: 'User accounts, search data, automation configurations, notification logs',
      location: 'United States (AWS us-east-1)',
      link: 'https://supabase.com/privacy',
    },
    {
      name: 'RentCast',
      purpose: 'Property listing data API — source of all MLS and off-market listing data',
      dataTypes: 'Search query parameters (location, filters); no personal data sent',
      location: 'United States',
      link: 'https://rentcast.io/privacy',
    },
    {
      name: 'SendGrid (Twilio)',
      purpose: 'Transactional and notification email delivery',
      dataTypes: 'Email addresses, email content (search results, support replies)',
      location: 'United States',
      link: 'https://www.twilio.com/en-us/legal/privacy',
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing and subscription billing',
      dataTypes: 'Payment card data (handled by Stripe directly), billing email, subscription status',
      location: 'United States',
      link: 'https://stripe.com/privacy',
    },
    {
      name: 'Vercel',
      purpose: 'Frontend application hosting, CDN, and edge delivery',
      dataTypes: 'IP addresses, request logs (no user content)',
      location: 'Global (edge network)',
      link: 'https://vercel.com/legal/privacy-policy',
    },
    {
      name: 'Cloudflare',
      purpose: 'DNS resolution and DDoS protection',
      dataTypes: 'IP addresses, DNS queries (no user content)',
      location: 'Global',
      link: 'https://www.cloudflare.com/privacypolicy/',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-7 h-7 text-[#FFCE0A]" />
          <h1 className="font-bold text-[33px] dark:text-white mb-0">Subprocessor Disclosure</h1>
        </div>
        <p className="text-gray-600 dark:text-[#EBF2FA]/70 text-[15px] leading-relaxed">
          ListingBug uses the following third-party services (subprocessors) to provide its platform. Each subprocessor has executed a Data Processing Agreement with ListingBug and is required to maintain appropriate security and privacy standards.
        </p>
        <p className="text-gray-500 dark:text-[#EBF2FA]/50 text-[13px] mt-2">Last updated: March 2026</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10 mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#1a1a1f] border-b border-gray-200 dark:border-white/10">
              <th className="px-4 py-3 text-left font-bold text-[#342e37] dark:text-white">Service</th>
              <th className="px-4 py-3 text-left font-bold text-[#342e37] dark:text-white">Purpose</th>
              <th className="px-4 py-3 text-left font-bold text-[#342e37] dark:text-white">Data Processed</th>
              <th className="px-4 py-3 text-left font-bold text-[#342e37] dark:text-white">Location</th>
            </tr>
          </thead>
          <tbody>
            {subprocessors.map(sp => (
              <tr key={sp.name} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-4 font-medium align-top">
                  <a
                    href={sp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#342e37] dark:text-white hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors"
                  >
                    {sp.name}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </td>
                <td className="px-4 py-4 text-gray-600 dark:text-[#EBF2FA]/70 text-[13px] align-top">{sp.purpose}</td>
                <td className="px-4 py-4 text-gray-600 dark:text-[#EBF2FA]/70 text-[13px] align-top">{sp.dataTypes}</td>
                <td className="px-4 py-4 text-gray-600 dark:text-[#EBF2FA]/70 text-[13px] align-top whitespace-nowrap">{sp.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 text-[13px] text-amber-900 dark:text-amber-300 leading-relaxed">
        <strong>Changes to subprocessors:</strong> ListingBug will provide reasonable notice before adding new subprocessors that process personal data. If you have concerns about any subprocessor, contact us at{' '}
        <a href="mailto:support@thelistingbug.com" className="underline">support@thelistingbug.com</a>.
      </div>
    </div>
  );
}

function DPAPage() {
  const sections = [
    {
      title: '1. Definitions',
      content: `"Controller" means you, the ListingBug customer, who determines the purposes and means of processing Personal Data.

"Processor" means ListingBug, which processes Personal Data on behalf of the Controller.

"Personal Data" means any information relating to an identified or identifiable natural person processed under this agreement.

"Processing" means any operation performed on Personal Data, including collection, storage, use, disclosure, or deletion.`,
    },
    {
      title: '2. Scope and Purpose',
      content: `ListingBug processes Personal Data solely to provide the services described in the Terms of Service, including property listing search, automation scheduling, CRM integration, and related features.

ListingBug will not process Personal Data for any purpose other than the documented instructions of the Controller, except where required by applicable law.`,
    },
    {
      title: '3. Controller Obligations',
      content: `As data controller, you are responsible for:

• Ensuring you have a lawful basis for processing and sharing contact information with ListingBug
• Providing required privacy notices to data subjects
• Honoring data subject rights requests that are forwarded to you by ListingBug
• Not uploading or processing Special Categories of Personal Data through the platform`,
    },
    {
      title: '4. Processor Obligations',
      content: `ListingBug will:

• Process Personal Data only on your documented instructions
• Ensure personnel authorized to process Personal Data are bound by confidentiality
• Implement appropriate technical and organizational security measures
• Assist you in complying with data subject rights requests (access, erasure, portability)
• Notify you without undue delay upon becoming aware of a Personal Data breach
• Delete or return all Personal Data upon termination of the service relationship`,
    },
    {
      title: '5. Subprocessors',
      content: `ListingBug engages the subprocessors listed in the Subprocessor Disclosure page. Each subprocessor is bound by data protection obligations equivalent to those in this DPA.

ListingBug will inform you of any intended changes concerning the addition or replacement of subprocessors, giving you the opportunity to object.`,
    },
    {
      title: '6. Security Measures',
      content: `ListingBug maintains appropriate technical measures including:

• Encryption of Personal Data at rest (AES-256) and in transit (TLS 1.2+)
• Role-based access controls and least-privilege access
• Row-level security enforced at the database layer
• Regular security assessments and dependency updates
• Secure API key management via environment secrets`,
    },
    {
      title: '7. International Transfers',
      content: `Personal Data processed by ListingBug is stored in the United States. Transfers to subprocessors located outside the EEA are conducted in compliance with applicable data protection law, including through Standard Contractual Clauses where required.`,
    },
    {
      title: '8. Data Retention',
      content: `Personal Data is retained for the duration of your active subscription plus 90 days following termination, unless you request earlier deletion. Audit logs are retained for 12 months for compliance purposes.

To request deletion of your Personal Data, contact support@thelistingbug.com.`,
    },
    {
      title: '9. Acceptance',
      content: `This DPA forms part of the ListingBug Terms of Service. By creating a ListingBug account, you agree to the terms of this Data Processing Agreement on behalf of yourself and, where applicable, your organization.`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-7 h-7 text-[#FFCE0A]" />
          <h1 className="font-bold text-[33px] dark:text-white mb-0">Data Processing Agreement</h1>
        </div>
        <p className="text-gray-600 dark:text-[#EBF2FA]/70 text-[15px] leading-relaxed">
          This Data Processing Agreement ("DPA") governs how ListingBug processes Personal Data on your behalf in connection with the ListingBug service.
        </p>
        <p className="text-gray-500 dark:text-[#EBF2FA]/50 text-[13px] mt-2">Effective date: January 1, 2025 · Last updated: March 2026</p>
      </div>

      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.title} className="border-b border-gray-100 dark:border-white/10 pb-6 last:border-0 last:pb-0">
            <h2 className="font-bold text-[17px] dark:text-white mb-3">{section.title}</h2>
            <div className="text-[14px] text-gray-700 dark:text-[#EBF2FA]/80 leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-50 dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-lg p-4 text-[13px] text-gray-600 dark:text-[#EBF2FA]/60">
        Questions about this DPA? Contact us at{' '}
        <a href="mailto:support@thelistingbug.com" className="text-[#FFCE0A] hover:underline">
          support@thelistingbug.com
        </a>
      </div>
    </div>
  );
}
