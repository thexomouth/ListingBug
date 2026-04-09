import { Building2, Target, Lightbulb, Users } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-300px)] flex items-center justify-center bg-white dark:bg-[#0F1115] px-4 py-16">
      <Helmet>
        <title>About ListingBug — Real Estate Listing Alerts for Service Providers</title>
        <meta name="description" content="ListingBug helps mortgage brokers, home inspectors, contractors, and other real estate service providers find new listings and connect with listing agents automatically." />
        <link rel="canonical" href="https://thelistingbug.com/about" />
        <meta property="og:title" content="About ListingBug — Real Estate Listing Alerts for Service Providers" />
        <meta property="og:description" content="ListingBug helps mortgage brokers, home inspectors, contractors, and other real estate service providers find new listings and connect with listing agents automatically." />
        <meta property="og:url" content="https://thelistingbug.com/about" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ListingBug",
          "url": "https://thelistingbug.com",
          "logo": "https://thelistingbug.com/logo.png",
          "description": "Real estate listing alerts and workflow automation for service providers.",
          "sameAs": [
            "https://twitter.com/listingbug",
            "https://www.linkedin.com/company/listingbug"
          ]
        })}</script>
      </Helmet>
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFCE0A]/10 dark:bg-[#FFCE0A]/5 rounded-2xl mb-6">
          <Building2 className="w-10 h-10 text-[#FFCE0A]" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-[#342e37] dark:text-white mb-4">
          About Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-[#EBF2FA]/80 mb-8 leading-relaxed">
          We're crafting our story. Learn about our mission to empower real estate service providers 
          with intelligent data solutions that drive business growth.
        </p>

        {/* Feature Preview Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Target className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Our Mission
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Making data-driven decisions simple
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Lightbulb className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              What We Do
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Real-time MLS data and automation
            </p>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
            <Users className="w-6 h-6 text-[#FFCE0A] mb-3 mx-auto" />
            <h3 className="font-bold text-sm text-[#342e37] dark:text-white mb-2">
              Who We Serve
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#EBF2FA]/70">
              Service providers and investors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}