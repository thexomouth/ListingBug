import { HelpCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import headerLogoSimplified from 'figma:asset/18389b12a0fe14349edcb6b64a2864bb6264d47e.png';

interface LoginHeaderProps {
  onNavigateToHome?: () => void;
  onNavigateToHelp?: () => void;
}

/**
 * LoginHeader - Simplified header for login/signup pages
 * Minimal design with centered bug-only logo
 */
export function LoginHeader({ onNavigateToHome, onNavigateToHelp }: LoginHeaderProps) {
  return (
    <header className="bg-[#ffce0a] border-b border-[#342e37]/10 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          {/* Logo - Center Aligned */}
          <button
            onClick={onNavigateToHome}
            className="flex items-center"
            aria-label="ListingBug home"
          >
            <ImageWithFallback 
              src={headerLogoSimplified} 
              alt="ListingBug" 
              className="h-13 w-13 object-contain"
            />
          </button>
        </div>
      </div>
    </header>
  );
}