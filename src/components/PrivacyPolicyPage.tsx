export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#342e37] dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-[#EBF2FA]/80">
            <strong>Effective Date:</strong> October 19, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              ListingBug ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our real estate listing management platform and services (the "Service"). Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              1. Information We Collect
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              1.1 Information You Provide to Us
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              We collect information that you voluntarily provide when using our Service, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Account Information:</strong> Name, email address, phone number, password, and company information</li>
              <li><strong>Payment Information:</strong> Credit card details, billing address, and payment history (processed securely through third-party payment processors)</li>
              <li><strong>Profile Information:</strong> Professional details, preferences, and account settings</li>
              <li><strong>Real Estate Data:</strong> Listing searches, saved searches, property preferences, and search criteria</li>
              <li><strong>Communications:</strong> Messages, support requests, and feedback you send to us</li>
            </ul>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              1.2 Information Collected Automatically
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              When you access our Service, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Log Data:</strong> IP address, browser type, operating system, access times, and pages viewed</li>
              <li><strong>Device Information:</strong> Device type, unique device identifiers, and mobile network information</li>
              <li><strong>Usage Data:</strong> Features used, searches performed, automations created, and interaction patterns</li>
              <li><strong>Cookies and Tracking Technologies:</strong> Data collected through cookies, web beacons, and similar technologies (see Section 4)</li>
            </ul>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              1.3 Information from Third-Party Integrations
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              When you connect third-party services to ListingBug (such as Salesforce, HubSpot, Mailchimp, SendGrid, Constant Contact, Zoho CRM, Zapier, Make.com, or n8n), we may collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li>API keys and authentication tokens</li>
              <li>Data you authorize us to access from these services</li>
              <li>Synchronization logs and status information</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              2. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Provide and Maintain the Service:</strong> Create and manage your account, process transactions, and deliver the features you request</li>
              <li><strong>Process Payments:</strong> Handle billing, invoicing, and subscription management</li>
              <li><strong>Personalize Your Experience:</strong> Customize search results, recommendations, and platform features based on your preferences</li>
              <li><strong>Enable Integrations:</strong> Facilitate data synchronization with third-party services you connect</li>
              <li><strong>Send Communications:</strong> Deliver transactional emails, service updates, billing notifications, and customer support responses</li>
              <li><strong>Improve Our Service:</strong> Analyze usage patterns, troubleshoot issues, and develop new features</li>
              <li><strong>Ensure Security:</strong> Detect and prevent fraud, unauthorized access, and other security threats</li>
              <li><strong>Comply with Legal Obligations:</strong> Meet regulatory requirements and respond to legal requests</li>
              <li><strong>Marketing (with your consent):</strong> Send promotional materials about new features, updates, and special offers (you may opt out at any time)</li>
            </ul>
          </section>

          {/* 3. How We Share Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              3. How We Share Your Information
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Third-Party Service Providers:</strong> Payment processors, hosting providers, analytics services, and customer support tools that help us operate our Service</li>
              <li><strong>Integrated Third-Party Platforms:</strong> Services you explicitly connect (Salesforce, HubSpot, Mailchimp, etc.), as authorized by you through integration settings</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sales of assets, where your information may be transferred as part of the business</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request, or to protect our rights, safety, or property</li>
              <li><strong>With Your Consent:</strong> Any other sharing authorized by you</li>
            </ul>
          </section>

          {/* 4. Cookies and Tracking Technologies */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              4. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              We use cookies and similar tracking technologies to collect and store information about your interactions with our Service. Cookies are small data files stored on your device.
            </p>
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              Types of Cookies We Use:
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Essential Cookies:</strong> Required for the Service to function (e.g., authentication, security)</li>
              <li><strong>Performance Cookies:</strong> Help us understand how you use the Service and improve performance</li>
              <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Collect information about usage patterns to help us improve our Service</li>
            </ul>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that disabling certain cookies may limit your ability to use some features of our Service.
            </p>
          </section>

          {/* 5. Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your information from unauthorized access, disclosure, alteration, or destruction. These measures include encryption, secure servers, access controls, and regular security audits. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 6. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              6. Data Retention
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide you with the Service. We will also retain and use your information as necessary to comply with legal obligations, resolve disputes, enforce our agreements, and for backup and archival purposes. When you close your account, we will delete or anonymize your personal information within 90 days, except where we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          {/* 7. Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
              <li><strong>Opt-Out of Marketing:</strong> Unsubscribe from promotional emails using the link in each message</li>
            </ul>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@listingbug.com" className="text-[#FFCE0A] hover:underline">privacy@listingbug.com</a>. We will respond to your request within 30 days.
            </p>
          </section>

          {/* 8. Third-Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              8. Third-Party Links
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Our Service may contain links to third-party websites and services. We are not responsible for the privacy practices or content of these third parties. We encourage you to review the privacy policies of any third-party services you access.
            </p>
          </section>

          {/* 9. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at <a href="mailto:privacy@listingbug.com" className="text-[#FFCE0A] hover:underline">privacy@listingbug.com</a>, and we will take steps to delete such information.
            </p>
          </section>

          {/* 10. International Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from your jurisdiction. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* 11. California Privacy Rights */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              11. California Privacy Rights
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, use, and disclose; the right to request deletion of your personal information; and the right to opt-out of the sale of personal information (note: we do not sell personal information). To exercise these rights, contact us at <a href="mailto:privacy@listingbug.com" className="text-[#FFCE0A] hover:underline">privacy@listingbug.com</a>.
            </p>
          </section>

          {/* 12. Changes to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Effective Date" above. We encourage you to review this Privacy Policy periodically. Your continued use of the Service after changes are posted constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 13. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
              <p className="text-gray-700 dark:text-[#EBF2FA] font-bold mb-2">ListingBug</p>
              <p className="text-gray-700 dark:text-[#EBF2FA]">
                Email: <a href="mailto:privacy@listingbug.com" className="text-[#FFCE0A] hover:underline">privacy@listingbug.com</a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
