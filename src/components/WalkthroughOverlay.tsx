import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, CheckCircle, Search, Zap, Database } from 'lucide-react';
import { LBButton } from './design-system/LBButton';
import { LBCard, LBCardContent } from './design-system/LBCard';

/**
 * WALKTHROUGH OVERLAY COMPONENT
 * 
 * PURPOSE: Guide first-time users through search → automation → integration flow
 * 
 * USAGE:
 * <WalkthroughOverlay
 *   isActive={walkthroughStep === 1}
 *   step={1}
 *   totalSteps={3}
 *   title="Let's start by finding properties"
 *   description="Use filters to narrow down properties..."
 *   highlightSelector=".search-filters"
 *   onNext={() => handleNextStep()}
 *   onSkip={() => handleSkipWalkthrough()}
 * />
 */

interface WalkthroughOverlayProps {
  isActive: boolean;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  highlightSelector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  ctaText?: string;
  onNext: () => void;
  onSkip: () => void;
  showSkip?: boolean;
}

export function WalkthroughOverlay({
  isActive,
  step,
  totalSteps,
  title,
  description,
  highlightSelector,
  position = 'center',
  icon,
  ctaText = 'Next',
  onNext,
  onSkip,
  showSkip = true
}: WalkthroughOverlayProps) {
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const animationFrameRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // SAFEGUARD: Never show walkthrough on login/signup pages or for returning users
  const shouldBlockWalkthrough = () => {
    // Check if on login/signup/auth pages by looking at URL or page elements
    const authPageIndicators = [
      document.querySelector('[data-page="login"]'),
      document.querySelector('[data-page="signup"]'),
      document.querySelector('[data-page="forgot-password"]'),
      document.querySelector('[data-page="reset-password"]'),
    ];
    
    if (authPageIndicators.some(el => el !== null)) {
      return true;
    }
    
    // Check if returning user
    const isReturningUser = localStorage.getItem('listingbug_returning_user') === 'true' ||
                           localStorage.getItem('listingbug_walkthrough_completed') === 'true';
    
    return isReturningUser;
  };

  useEffect(() => {
    if (!isActive || !highlightSelector || shouldBlockWalkthrough()) {
      setHighlightElement(null);
      setHighlightRect(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      return;
    }

    let retryCount = 0;
    const maxRetries = 20;

    const findAndHighlightElement = () => {
      const element = document.querySelector(highlightSelector) as HTMLElement;
      
      if (element) {
        setHighlightElement(element);
        
        // Scroll element into view smoothly on first find
        if (retryCount === 0) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
        
        // Start continuous position tracking
        const updatePosition = () => {
          if (!element.isConnected) {
            // Element was removed from DOM, stop tracking
            setHighlightElement(null);
            setHighlightRect(null);
            return;
          }

          const rect = element.getBoundingClientRect();
          
          // Only update if position actually changed (avoid unnecessary re-renders)
          setHighlightRect(prevRect => {
            if (!prevRect || 
                Math.abs(prevRect.left - rect.left) > 0.5 ||
                Math.abs(prevRect.top - rect.top) > 0.5 ||
                Math.abs(prevRect.width - rect.width) > 0.5 ||
                Math.abs(prevRect.height - rect.height) > 0.5) {
              return rect;
            }
            return prevRect;
          });
          
          // Calculate overlay position based on current rect
          const spacing = 16;
          let style: React.CSSProperties = {};
          
          switch (position) {
            case 'top':
              style = {
                left: `${rect.left}px`,
                top: `${rect.top - spacing}px`,
                transform: 'translateY(-100%)',
              };
              break;
            case 'bottom':
              style = {
                left: `${rect.left}px`,
                top: `${rect.bottom + spacing}px`,
              };
              break;
            case 'left':
              style = {
                left: `${rect.left - spacing}px`,
                top: `${rect.top}px`,
                transform: 'translateX(-100%)',
              };
              break;
            case 'right':
              style = {
                left: `${rect.right + spacing}px`,
                top: `${rect.top}px`,
              };
              break;
            case 'center':
            default:
              style = {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              };
          }
          
          setOverlayStyle(style);
          
          // Continue tracking
          animationFrameRef.current = requestAnimationFrame(updatePosition);
        };
        
        // Start the tracking loop
        updatePosition();
      } else {
        // Element not found - retry with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(100 * Math.pow(1.5, retryCount), 2000);
          retryTimeoutRef.current = setTimeout(findAndHighlightElement, delay);
        }
      }
    };

    // Initial find
    findAndHighlightElement();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [isActive, highlightSelector, position]);

  if (!isActive) return null;

  // Get icon for step
  const getStepIcon = () => {
    if (icon) return icon;
    
    switch (step) {
      case 1:
        return <Search className="w-6 h-6 text-[#FFD447]" />;
      case 2:
        return <Zap className="w-6 h-6 text-[#FFD447]" />;
      case 3:
        return <Database className="w-6 h-6 text-[#FFD447]" />;
      default:
        return <CheckCircle className="w-6 h-6 text-[#FFD447]" />;
    }
  };

  const overlayContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ pointerEvents: 'none' }}
      >
        {/* Dark overlay with spotlight effect */}
        <div 
          className="absolute inset-0 bg-black/60"
          style={{ pointerEvents: 'auto' }}
        />
        
        {/* Highlight cutout */}
        {highlightRect && (
          <div
            className="absolute border-4 border-[#FFD447] rounded-lg animate-pulse"
            style={{
              left: `${highlightRect.left - 16}px`,
              top: `${highlightRect.top - 16}px`,
              width: `${highlightRect.width + 32}px`,
              height: `${highlightRect.height + 32}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Walkthrough card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute max-w-md w-full mx-4"
          style={{
            ...overlayStyle,
            pointerEvents: 'auto',
            zIndex: 51,
          }}
        >
          <LBCard className="border-2 border-[#FFD447] shadow-2xl">
            <LBCardContent className="p-6">
              {/* Close button */}
              {showSkip && (
                <button
                  onClick={onSkip}
                  className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Skip walkthrough"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}

              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      index + 1 <= step ? 'bg-[#FFD447]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Step label */}
              <div className="text-sm text-gray-600 mb-2">
                Step {step} of {totalSteps}
              </div>

              {/* Icon and title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFD447]/10 flex items-center justify-center flex-shrink-0">
                  {getStepIcon()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-[#342E37] mb-2">
                    {title}
                  </h3>
                  <p className="text-[15px] text-gray-700 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6">
                <LBButton
                  variant="primary"
                  onClick={onNext}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4" />
                </LBButton>
                {showSkip && (
                  <button
                    onClick={onSkip}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Skip tour
                  </button>
                )}
              </div>
            </LBCardContent>
          </LBCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
}

/**
 * WALKTHROUGH COMPLETION MODAL
 * Shown when user completes all walkthrough steps
 */

interface WalkthroughCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalkthroughCompleteModal({ isOpen, onClose }: WalkthroughCompleteModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full"
        >
          <LBCard className="border-2 border-[#FFD447]">
            <LBCardContent className="p-8 text-center">
              {/* Success icon */}
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              {/* Title */}
              <h2 className="font-bold text-2xl text-[#342E37] mb-2">
                You&apos;re all set!
              </h2>

              {/* Description */}
              <p className="text-[15px] text-gray-700 mb-6 leading-relaxed">
                Your first automation is live. ListingBug will now automatically find properties matching your criteria and send them to your connected integration.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-bold text-xl text-[#342E37]">✓</div>
                  <div className="text-xs text-gray-600 mt-1">Search Saved</div>
                </div>
                <div>
                  <div className="font-bold text-xl text-[#342E37]">✓</div>
                  <div className="text-xs text-gray-600 mt-1">Automation Created</div>
                </div>
                <div>
                  <div className="font-bold text-xl text-[#342E37]">✓</div>
                  <div className="text-xs text-gray-600 mt-1">Integration Connected</div>
                </div>
              </div>

              {/* CTA */}
              <LBButton
                variant="primary"
                onClick={onClose}
                className="w-full"
              >
                Go to Dashboard
              </LBButton>

              {/* Help text */}
              <p className="text-xs text-gray-500 mt-4">
                Need help? Visit our{' '}
                <button className="text-[#342E37] hover:underline font-medium">
                  Help Center
                </button>
              </p>
            </LBCardContent>
          </LBCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}