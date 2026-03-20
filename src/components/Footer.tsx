import { Mail, Linkedin, Twitter, Github } from "lucide-react";
import { ImageWithFallback } from './figma/ImageWithFallback';
import logo from 'figma:asset/ac9d14a9fc5e2f8315c311b8dec3220da367a867.png';

interface FooterProps {
  isLoggedIn: boolean;
  onNavigate: (page: string) => void;
  onAccountTabChange?: (tab: 'profile' | 'usage' | 'billing' | 'integrations' | 'compliance') => void;
}

export function Footer({ isLoggedIn, onNavigate, onAccountTabChange }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleCompliance = () => {
    if (onAccountTabChange) {
      onAccountTabChange('compliance');
    }
    onNavigate('account');
  };

  if (isLoggedIn) {
    // Signed-in footer - simpler with key links
    return (
      <footer className="bg-gray-50 dark:bg-[#2F2F2F] text-[#342e37] dark:text-white mt-auto border-t border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-8 border-b border-gray-200 dark:border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Branding */}
              <div className="md:col-span-1">
                <ImageWithFallback 
                  src={logo} 
                  alt="ListingBug" 
                  className="h-12 w-auto mb-3"
                />
                <p className="text-gray-600 dark:text-[#EBF2FA] text-sm leading-relaxed">
                  Real estate data intelligence for service providers.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-[#342e37] dark:text-white font-semibold mb-3">Dashboard</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => onNavigate("dashboard")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Overview
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("search-listings")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Search Listings
                    </button>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-[#342e37] dark:text-white font-semibold mb-3">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => onNavigate("data-sets")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Listing Data
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("use-cases")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Use Cases
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("api-documentation")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      API Documentation
                    </button>
                  </li>
                </ul>
              </div>

              {/* Account */}
              <div>
                <h3 className="text-[#342e37] dark:text-white font-semibold mb-3">Account</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => onNavigate("account")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Settings
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("billing")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Billing
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleCompliance}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Compliance
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate("help-center")}
                      className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                    >
                      Support
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-[#EBF2FA] text-sm">
              © {currentYear} ListingBug. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 dark:text-[#EBF2FA] hover:text-[#FFCE0A] dark:hover:text-[#FFCE0A] transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Signed-out footer - comprehensive with conversion focus
  return (
    <footer className="bg-[#2F2F2F] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-[33px] border-b border-white/10 px-[0px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Branding & Description */}
            <div className="lg:col-span-2">
              <ImageWithFallback 
                src={logo} 
                alt="ListingBug" 
                className="h-14 w-auto mb-3"
              />
              <p className="text-[#EBF2FA] mb-6 max-w-sm leading-relaxed text-[14px]">
                Transform real estate data into actionable business opportunities. 
                Access comprehensive listing data with powerful search and automation tools.
              </p>
              <div className="flex gap-4">
                <button className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors" aria-label="Email" onClick={() => window.location.href = 'mailto:info@listingbug.com'}>
                  <Mail className="w-5 h-5" />
                </button>
                <button className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors" aria-label="LinkedIn" onClick={() => window.open('https://linkedin.com', '_blank')}>
                  <Linkedin className="w-5 h-5" />
                </button>
                <button className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors" aria-label="Twitter" onClick={() => window.open('https://twitter.com', '_blank')}>
                  <Twitter className="w-5 h-5" />
                </button>
                <a href="#" className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors" aria-label="View our GitHub">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white mb-4 text-[14px] font-bold font-normal no-underline not-italic pb-2 border-b border-white/20 text-left md:text-left">Product</h3>
              <ul className="space-y-3 text-right md:text-left">
                <li>
                  <button
                    onClick={() => onNavigate("how-it-works")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("data-sets")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                  >
                    Listing Data
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("use-cases")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                  >
                    Use Cases
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("pricing")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <a href="#" className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm leading-relaxed">
                    API Access
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white mb-4 text-[14px] font-bold font-normal pb-2 border-b border-white/20 text-left md:text-left">Resources</h3>
              <ul className="space-y-3 text-right md:text-left">
                <li>
                  <button
                    onClick={() => onNavigate("api-documentation")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Documentation
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("api-documentation")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    API Reference
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("help-center")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("blog")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("changelog")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Changelog
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white mb-4 text-[14px] font-bold font-normal pb-2 border-b border-white/20 text-left md:text-left">Company</h3>
              <ul className="space-y-3 text-right md:text-left">
                <li>
                  <button
                    onClick={() => onNavigate("about")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("careers")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Careers
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("contact")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("contact-support")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Support
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("privacy")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("terms")}
                    className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors text-sm"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="py-[33px] border-b border-white/10 px-[0px]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white mb-1">Ready to get started?</h3>
              <p className="text-[#EBF2FA] text-sm">
                Join service providers already using ListingBug to grow their business.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate("pricing")}
                className="px-6 py-2.5 bg-[#FFCE0A] text-[#0F1115] rounded-lg hover:bg-[#ffc520] transition-colors whitespace-nowrap font-bold"
              >
                View Pricing
              </button>
              <button
                onClick={() => onNavigate("login")}
                className="px-6 py-2.5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[#EBF2FA] text-sm">
            © {currentYear} ListingBug. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <button
              onClick={() => onNavigate("privacy")}
              className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => onNavigate("terms")}
              className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors"
            >
              Terms
            </button>
            <a href="#" className="text-[#EBF2FA] hover:text-[#FFCE0A] transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}