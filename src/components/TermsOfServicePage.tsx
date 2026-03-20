export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#342e37] dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-[#EBF2FA]/80">
            <strong>Effective Date:</strong> March 19, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of the ListingBug platform and services ("Service") provided by ListingBug ("we," "us," or "our"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              By creating an account, accessing, or using ListingBug, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms, and your acceptance constitutes the organization's acceptance of these Terms.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              ListingBug is a real estate listing management platform that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li>Search and track real estate listings</li>
              <li>Create and manage saved searches with customizable parameters</li>
              <li>Set up automated workflows and integrations with third-party services</li>
              <li>Sync data with CRM platforms (Salesforce, HubSpot, Zoho CRM), email marketing tools (Mailchimp, SendGrid, Constant Contact), and automation platforms (Zapier, Make.com, n8n)</li>
              <li>Receive notifications and alerts based on listing criteria</li>
              <li>Export and manage listing data</li>
            </ul>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mt-4">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              3. User Accounts
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              3.1 Account Creation
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              To use the Service, you must create an account by providing accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              3.2 Account Security
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              You agree to immediately notify us of any unauthorized access or use of your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              3.3 Account Eligibility
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              You must be at least 18 years old and capable of forming a binding contract to use the Service. By using the Service, you represent that you meet these requirements.
            </p>
          </section>

          {/* 4. Subscription and Billing */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              4. Subscription and Billing
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              4.1 Subscription Plans
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              ListingBug offers the following subscription plans:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li><strong>Starter Plan:</strong> $49 per month for up to 4,000 listings</li>
              <li><strong>Professional Plan:</strong> $99 per month for up to 10,000 listings</li>
              <li><strong>Enterprise Plan:</strong> Custom pricing for unlimited listings (contact us for details)</li>
            </ul>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mt-4">
              All prices are in U.S. dollars unless otherwise stated. We reserve the right to modify our pricing with 30 days' notice to existing subscribers.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              4.2 Billing and Payment
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Subscriptions are billed on a monthly basis in advance. You authorize us to charge your designated payment method for all fees incurred. If payment fails, we may suspend or terminate your access to the Service. You are responsible for all applicable taxes.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              4.3 Automatic Renewal
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Your subscription will automatically renew each month unless you cancel before the renewal date. You may cancel your subscription at any time through your account settings.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              4.4 Refunds
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We offer a 14-day money-back guarantee for first-time subscribers. After the initial 14-day period, subscription fees are non-refundable. If you cancel your subscription, you will retain access to the Service until the end of your current billing period.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              4.5 Free Trials
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We may offer free trials from time to time. At the end of the trial period, your subscription will automatically convert to a paid plan unless you cancel. Free trial eligibility is determined at our sole discretion and is limited to one trial per user or organization.
            </p>
          </section>

          {/* 5. Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              5. Acceptable Use
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Use the Service to transmit harmful, fraudulent, or illegal content</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated scripts or bots to access the Service without our permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove or obscure any proprietary notices on the Service</li>
              <li>Use the Service to compete with us or create a similar service</li>
              <li>Scrape, harvest, or collect user data without consent</li>
              <li>Share your account credentials with others or create multiple accounts</li>
              <li>Exceed the listing limits of your subscription plan</li>
            </ul>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mt-4">
              We reserve the right to investigate and take appropriate action against anyone who violates these Terms, including suspending or terminating accounts without notice.
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              6. Intellectual Property
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              6.1 Our Intellectual Property
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              The Service, including all content, features, functionality, software, code, designs, graphics, logos, and trademarks, is owned by ListingBug and is protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for your internal business purposes in accordance with these Terms.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              6.2 Your Content
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              You retain ownership of any data, content, or materials you upload or create using the Service ("Your Content"). By using the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, store, process, and display Your Content solely to provide and improve the Service. You represent that you have all necessary rights to grant this license.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              6.3 Feedback
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              If you provide us with feedback, suggestions, or ideas about the Service, you grant us the right to use such feedback without any obligation or compensation to you.
            </p>
          </section>

          {/* 7. Third-Party Integrations */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              7. Third-Party Integrations
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              The Service integrates with third-party platforms such as Salesforce, HubSpot, Zoho CRM, Mailchimp, SendGrid, Constant Contact, Zapier, Make.com, and n8n. Your use of these integrations is subject to the terms and privacy policies of those third-party services. We are not responsible for the functionality, availability, or data practices of third-party services. You are solely responsible for your use of third-party integrations and any data shared with them.
            </p>
          </section>

          {/* 8. Data and Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              8. Data and Privacy
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Our collection and use of your information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our data practices as described in the Privacy Policy. You are responsible for ensuring that any data you provide or process through the Service complies with applicable data protection laws.
            </p>
          </section>

          {/* 9. Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              9. Disclaimers
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED OR ERROR-FREE OPERATION.
            </p>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-[#EBF2FA]">
              <li>The Service will meet your requirements or expectations</li>
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The accuracy, completeness, or reliability of any listing data or information obtained through the Service</li>
              <li>Any errors or defects will be corrected</li>
              <li>The Service will be compatible with all devices or systems</li>
            </ul>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mt-4">
              You acknowledge that real estate listing data is sourced from third parties and may be incomplete, inaccurate, or outdated. We do not verify or guarantee the accuracy of such data.
            </p>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LISTINGBUG AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed mb-4">
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
            </p>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </section>

          {/* 11. Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              11. Indemnification
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              You agree to indemnify, defend, and hold harmless ListingBug and its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) Your Content.
            </p>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              12. Termination
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              12.1 Termination by You
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              You may cancel your subscription and terminate your account at any time through your account settings. Upon cancellation, your access to the Service will continue until the end of your current billing period.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              12.2 Termination by Us
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We may suspend or terminate your access to the Service at any time, with or without notice, for any reason, including if you violate these Terms, fail to pay fees, or engage in fraudulent or illegal activity. We may also terminate the Service entirely at our discretion.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              12.3 Effect of Termination
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Upon termination, your right to use the Service will immediately cease. We may delete Your Content and account data after termination, though some data may be retained as required by law or for legitimate business purposes. Sections of these Terms that by their nature should survive termination (including payment obligations, disclaimers, limitations of liability, and indemnification) will survive.
            </p>
          </section>

          {/* 13. Modifications to the Service and Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              13. Modifications to the Service and Terms
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time. We may also update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the "Effective Date" above. Your continued use of the Service after changes are posted constitutes your acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Service and cancel your subscription.
            </p>
          </section>

          {/* 14. Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              14. Dispute Resolution
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              14.1 Informal Resolution
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Before filing a claim, you agree to contact us at <a href="mailto:support@listingbug.com" className="text-[#FFCE0A] hover:underline">support@listingbug.com</a> to attempt to resolve the dispute informally.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              14.2 Arbitration
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Any disputes arising out of or related to these Terms or the Service that cannot be resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall be conducted in the English language and located in [Your Jurisdiction]. Each party shall bear its own costs and expenses. You agree to waive any right to a jury trial or to participate in a class action.
            </p>
          </section>

          {/* 15. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              15. Governing Law
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. You consent to the exclusive jurisdiction of the state and federal courts located in Delaware for any disputes not subject to arbitration.
            </p>
          </section>

          {/* 16. General Provisions */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              16. General Provisions
            </h2>
            
            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              16.1 Entire Agreement
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and ListingBug regarding the Service and supersede all prior agreements.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              16.2 Severability
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              16.3 Waiver
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              Our failure to enforce any provision of these Terms shall not constitute a waiver of that provision or our right to enforce it in the future.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              16.4 Assignment
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              You may not assign or transfer these Terms or your rights under these Terms without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-bold text-[#342e37] dark:text-white mb-3 mt-6">
              16.5 Force Majeure
            </h3>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, or internet outages.
            </p>
          </section>

          {/* 17. Contact Us */}
          <section>
            <h2 className="text-2xl font-bold text-[#342e37] dark:text-white mb-4">
              17. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-[#EBF2FA] leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
              <p className="text-gray-700 dark:text-[#EBF2FA] font-bold mb-2">ListingBug</p>
              <p className="text-gray-700 dark:text-[#EBF2FA]">
                Email: <a href="mailto:support@listingbug.com" className="text-[#FFCE0A] hover:underline">support@listingbug.com</a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
