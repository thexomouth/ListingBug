import { LBButton } from "../design-system/LBButton";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Pricing CTA Section */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl mb-4 text-white">
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Start with a 7-day free trial. No credit card required. Cancel anytime. <strong>Plus:</strong> Free month of extra reports to learn the platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LBButton size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8">
                Start Free Trial
              </LBButton>
              <LBButton size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 font-bold">
                View Pricing Plans
              </LBButton>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <h3 className="mb-4 text-white">ListingBug</h3>
            <p className="text-white/70 mb-4">
              Connecting service providers with real estate opportunities through daily updated listing data.
            </p>
          </div>
          
          {/* Product Links */}
          <div>
            <h4 className="mb-4 text-white">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Use Cases
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Listing Data
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Links */}
          <div>
            <h4 className="mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="mb-4 text-white">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-white/70">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>support@listingbug.com</span>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>123 Main Street<br />Suite 100<br />San Francisco, CA 94105</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/60 text-sm">
              © 2024 ListingBug. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                Cookie Policy
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}