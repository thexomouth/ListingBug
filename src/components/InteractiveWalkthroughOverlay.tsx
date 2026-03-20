import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, MousePointerClick, Info } from 'lucide-react';
import { LBButton } from './design-system/LBButton';
import { LBCard, LBCardContent } from './design-system/LBCard';

/**
 * INTERACTIVE WALKTHROUGH OVERLAY - ENHANCED VERSION
 * 
 * KEY FEATURES:
 * - Allows clicks through to highlighted elements
 * - Supports "wait for action" mode where user must interact with highlighted element
 * - Doesn't break when user clicks to type in forms
 * - Auto-advances when user completes required action
 * - Industry-standard spotlight effect with click-through regions
 * 
 * MODES:
 * 1. "click-to-continue": User clicks Next button to advance (default)
 * 2. "wait-for-click": User must click the highlighted element to advance
 * 3. "wait-for-action": User must perform action (e.g., fill form, click button)
 * 4. "wait-for-blur": User must blur the highlighted element to advance
 * 5. "wait-for-selection": User must select a specific option (e.g., dropdown)
 * 6. "manual": User must manually advance to the next step
 */

interface InteractiveWalkthroughOverlayProps {
  isActive: boolean;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  highlightSelector?: string; // CSS selector for element to highlight
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'auto';
  mode?: 'click-to-continue' | 'wait-for-click' | 'wait-for-action' | 'wait-for-blur' | 'wait-for-selection' | 'manual';
  onAction?: () => boolean; // Function that returns true when action is complete
  onNext?: () => void; // Called when advancing to next step
  onBack?: () => void; // Called when going back
  onSkip: () => void;
  showSkip?: boolean;
  showBack?: boolean; // Show back button
  pulseHighlight?: boolean; // Whether to pulse the highlight border
  allowInteraction?: boolean; // Allow clicks inside highlighted area
  enableNudge?: boolean; // Enable 12-second nudge reminder
  ctaText?: string; // Custom CTA button text
  highlightPadding?: number; // Padding around highlight (default 16px)
}

export function InteractiveWalkthroughOverlay({
  isActive,
  step,
  totalSteps,
  title,
  description,
  highlightSelector,
  tooltipPosition = 'bottom',
  mode = 'wait-for-click',
  onAction,
  onNext,
  onBack,
  onSkip,
  showSkip = true,
  showBack = false,
  pulseHighlight = false,
  allowInteraction = true,
  enableNudge = true,
  ctaText,
  highlightPadding
}: InteractiveWalkthroughOverlayProps) {
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [actionComplete, setActionComplete] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const initialViewportHeight = useRef<number>(window.innerHeight);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic highlight padding based on device
  const effectiveHighlightPadding = highlightPadding ?? (isMobile ? 24 : 16);

  // Calculate button visibility - must be before useEffects that use it
  const showContinueButton = mode === 'click-to-continue' || mode === 'manual' || (mode === 'wait-for-action' && actionComplete);
  const isWaitingForUser = (mode === 'wait-for-click' || mode === 'wait-for-selection' || (mode === 'wait-for-action' && !actionComplete));

  // Detect keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialViewportHeight.current - currentHeight;
      
      // Keyboard is visible if viewport shrunk by more than 150px
      setKeyboardVisible(heightDiff > 150);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [isMobile]);

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
      console.log('🚫 Walkthrough blocked: User is on authentication page');
      return true;
    }
    
    // Check if returning user
    const isReturningUser = localStorage.getItem('listingbug_returning_user') === 'true' ||
                           localStorage.getItem('listingbug_walkthrough_completed') === 'true';
    
    if (isReturningUser) {
      console.log('🚫 Walkthrough blocked: Returning user detected');
      return true;
    }
    
    return false;
  };

  // Update highlight element and position with continuous tracking
  useEffect(() => {
    if (!isActive || !highlightSelector) {
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
        console.log('✅ Walkthrough: Found element', highlightSelector);
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
            console.log('⚠️ Walkthrough: Element disconnected from DOM');
            setHighlightElement(null);
            setHighlightRect(null);
            return;
          }

          const rect = element.getBoundingClientRect();
          
          // Log first position for debugging
          if (retryCount === 0) {
            console.log('📍 Walkthrough: Element position', {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              scroll: { x: window.scrollX, y: window.scrollY }
            });
          }
          
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
          
          calculateTooltipPosition(rect);
          
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
          console.log(`⏳ Walkthrough: Element not found, retry ${retryCount}/${maxRetries} in ${delay}ms`);
          retryTimeoutRef.current = setTimeout(findAndHighlightElement, delay);
          
          // Show fallback after 2 seconds (approximately when total retry time exceeds 2s)
          if (retryCount === 1) {
            fallbackTimeoutRef.current = setTimeout(() => {
              if (!element) {
                console.warn('⚠️ Walkthrough: Showing fallback UI - element not found');
                setShowFallback(true);
              }
            }, 2000);
          }
        } else {
          console.error('❌ Walkthrough: Element not found after max retries', highlightSelector);
          setShowFallback(true);
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
  }, [isActive, highlightSelector]);

  // Check if action is complete
  useEffect(() => {
    if (mode === 'wait-for-action' && onAction) {
      const checkInterval = setInterval(() => {
        if (onAction()) {
          setActionComplete(true);
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [mode, onAction]);

  // Auto-advance when action is complete
  useEffect(() => {
    if (actionComplete && onSkip) {
      setTimeout(() => {
        onSkip();
        setActionComplete(false);
      }, 500);
    }
  }, [actionComplete, onSkip]);

  const calculateTooltipPosition = (rect: DOMRect) => {
    const spacing = 24; // Gap between highlight and tooltip
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 400; // Approximate tooltip width
    const tooltipHeight = 200; // Approximate tooltip height
    const keyboardSafeArea = isMobile ? 100 : 0; // Reserve space for mobile keyboard

    let style: React.CSSProperties = {};
    let position = tooltipPosition;

    // Auto positioning: determine best placement based on available space
    if (position === 'auto') {
      const spaceAbove = rect.top - effectiveHighlightPadding;
      const spaceBelow = viewportHeight - (rect.bottom + effectiveHighlightPadding);
      const spaceLeft = rect.left - effectiveHighlightPadding;
      const spaceRight = viewportWidth - (rect.right + effectiveHighlightPadding);

      // Prefer top or bottom based on available space
      if (spaceBelow >= tooltipHeight + spacing + keyboardSafeArea) {
        position = 'bottom';
      } else if (spaceAbove >= tooltipHeight + spacing) {
        position = 'top';
      } else if (spaceRight >= tooltipWidth + spacing) {
        position = 'right';
      } else if (spaceLeft >= tooltipWidth + spacing) {
        position = 'left';
      } else {
        // Fallback to center overlay if no good position
        position = 'center';
      }

      console.log('📐 Auto positioning:', {
        chosen: position,
        spaces: { above: spaceAbove, below: spaceBelow, left: spaceLeft, right: spaceRight }
      });
    }

    // Mobile-specific: Use full-width tooltip above keyboard
    if (isMobile && (position === 'bottom' || position === 'top')) {
      const highlightBottom = rect.bottom + effectiveHighlightPadding;
      const wouldBeHiddenByKeyboard = highlightBottom + tooltipHeight + spacing > viewportHeight - keyboardSafeArea;
      
      if (wouldBeHiddenByKeyboard) {
        // Position at top of screen, full width
        style = {
          left: '16px',
          right: '16px',
          top: '16px',
          maxWidth: 'calc(100vw - 32px)',
          width: 'auto',
        };
        setTooltipStyle(style);
        return;
      }
    }

    // Calculate position based on mode
    switch (position) {
      case 'center':
        // Overlay in center of screen with arrow pointing to element
        style = {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'top':
        style = {
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.top - effectiveHighlightPadding - spacing}px`,
          transform: 'translate(-50%, -100%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'bottom':
        style = {
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.bottom + effectiveHighlightPadding + spacing}px`,
          transform: 'translateX(-50%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'left':
        style = {
          left: `${rect.left - effectiveHighlightPadding - spacing}px`,
          top: `${rect.top + rect.height / 2}px`,
          transform: 'translate(-100%, -50%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'right':
        style = {
          left: `${rect.right + effectiveHighlightPadding + spacing}px`,
          top: `${rect.top + rect.height / 2}px`,
          transform: 'translateY(-50%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'top-left':
        style = {
          left: `${rect.left}px`,
          top: `${rect.top - effectiveHighlightPadding - spacing}px`,
          transform: 'translateY(-100%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'top-right':
        style = {
          right: `${viewportWidth - rect.right}px`,
          top: `${rect.top - effectiveHighlightPadding - spacing}px`,
          transform: 'translateY(-100%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'bottom-left':
        style = {
          left: `${rect.left}px`,
          top: `${rect.bottom + effectiveHighlightPadding + spacing}px`,
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
        };
        break;

      case 'bottom-right':
      default:
        // Smart positioning: if too close to edge, flip to left
        const wouldOverflow = rect.right + tooltipWidth > viewportWidth;
        if (wouldOverflow) {
          style = {
            right: `${viewportWidth - rect.right}px`,
            top: `${rect.bottom + effectiveHighlightPadding + spacing}px`,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
          };
        } else {
          style = {
            left: `${rect.left}px`,
            top: `${rect.bottom + effectiveHighlightPadding + spacing}px`,
            maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
          };
        }
        break;
    }

    // Detect and prevent overlap with highlighted element
    const detectOverlap = () => {
      if (!style.top || !style.left) return false;
      
      const tooltipTop = typeof style.top === 'string' ? parseFloat(style.top) : style.top;
      const tooltipLeft = typeof style.left === 'string' ? parseFloat(style.left) : style.left;
      const tooltipBottom = tooltipTop + tooltipHeight;
      const tooltipRight = tooltipLeft + tooltipWidth;

      const highlightTop = rect.top - effectiveHighlightPadding;
      const highlightBottom = rect.bottom + effectiveHighlightPadding;
      const highlightLeft = rect.left - effectiveHighlightPadding;
      const highlightRight = rect.right + effectiveHighlightPadding;

      // Check for overlap
      return !(
        tooltipBottom < highlightTop ||
        tooltipTop > highlightBottom ||
        tooltipRight < highlightLeft ||
        tooltipLeft > highlightRight
      );
    };

    // If overlap detected, switch to center overlay mode
    if (detectOverlap() && position !== 'center') {
      console.log('⚠️ Overlap detected, switching to center overlay');
      style = {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px',
      };
    }

    // Ensure tooltip stays within viewport bounds
    if (style.left) {
      const leftVal = typeof style.left === 'string' ? parseFloat(style.left) : style.left;
      if (leftVal < 16) {
        style.left = '16px';
        // Remove centered transform if we're constraining to edge
        if (style.transform?.includes('translate(-50%')) {
          style.transform = style.transform.replace('translate(-50%', 'translate(0');
        }
      }
    }
    
    if (style.right) {
      const rightVal = typeof style.right === 'string' ? parseFloat(style.right) : style.right;
      if (rightVal < 16) {
        style.right = '16px';
        style.transform = undefined;
      }
    }

    if (style.top) {
      const topVal = typeof style.top === 'string' ? parseFloat(style.top) : style.top;
      if (topVal < 16) {
        style.top = '16px';
        // Adjust transform if needed
        if (style.transform?.includes('translateY(-100%)')) {
          style.transform = style.transform.replace('translateY(-100%)', 'translateY(0)');
        } else if (style.transform?.includes('translate(-50%, -100%)')) {
          style.transform = 'translateX(-50%)';
        }
      }
    }

    // Ensure tooltip doesn't go off bottom of screen
    if (style.top) {
      const topVal = typeof style.top === 'string' ? parseFloat(style.top) : style.top;
      const maxTop = viewportHeight - tooltipHeight - 16 - keyboardSafeArea;
      if (topVal > maxTop) {
        style.top = `${maxTop}px`;
        // Adjust transform
        if (style.transform?.includes('translateY(-50%)')) {
          style.transform = style.transform.replace('translateY(-50%)', 'translateY(0)');
        }
      }
    }

    setTooltipStyle(style);
  };

  // Handle click on highlighted element
  useEffect(() => {
    if (mode === 'wait-for-click' && highlightElement && isActive) {
      const handleClick = (e: MouseEvent) => {
        // When user clicks the highlighted element, advance to next step
        if (onNext) {
          onNext();
        }
      };

      highlightElement.addEventListener('click', handleClick);
      return () => highlightElement.removeEventListener('click', handleClick);
    }
  }, [mode, highlightElement, isActive, onNext]);

  // Handle blur on highlighted element
  useEffect(() => {
    if (mode === 'wait-for-blur' && highlightElement && isActive) {
      const handleBlur = (e: FocusEvent) => {
        // When user blurs the highlighted element, advance to next step
        if (onNext) {
          onNext();
        }
      };

      highlightElement.addEventListener('blur', handleBlur);
      return () => highlightElement.removeEventListener('blur', handleBlur);
    }
  }, [mode, highlightElement, isActive, onNext]);

  // Enable nudge reminder
  useEffect(() => {
    if (enableNudge && isActive && highlightElement) {
      const nudge = () => {
        if (onSkip) {
          onSkip();
        }
      };

      nudgeTimeoutRef.current = setTimeout(nudge, 12000);
    }

    return () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
        nudgeTimeoutRef.current = null;
      }
    };
  }, [enableNudge, isActive, highlightElement, onSkip]);

  // Handle focus on highlighted element
  useEffect(() => {
    if (highlightElement && isActive) {
      const handleFocus = (e: FocusEvent) => {
        previousFocusRef.current = e.target as HTMLElement;
      };

      highlightElement.addEventListener('focus', handleFocus);
      return () => highlightElement.removeEventListener('focus', handleFocus);
    }
  }, [highlightElement, isActive]);

  // Focus trap: Save previous focus and move focus to tooltip
  useEffect(() => {
    if (isActive && tooltipRef.current) {
      // Save previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Move focus to tooltip
      const firstButton = tooltipRef.current.querySelector('button');
      if (firstButton) {
        setTimeout(() => {
          firstButton.focus();
        }, 300);
      }
    }
    
    // Restore focus when overlay closes
    return () => {
      if (previousFocusRef.current && !isActive) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onSkip();
          break;
        case 'Enter':
          e.preventDefault();
          if (showContinueButton && (onNext || onSkip)) {
            (onNext || onSkip)?.();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (showContinueButton && (onNext || onSkip)) {
            (onNext || onSkip)?.();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (showBack && onBack) {
            onBack();
          }
          break;
        case 'Tab':
          // Keep focus within tooltip
          if (tooltipRef.current) {
            const focusableElements = tooltipRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
              }
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onSkip, onNext, onBack, showContinueButton, showBack]);

  if (!isActive || shouldBlockWalkthrough()) return null;

  const overlayContent = (
    <AnimatePresence>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999]"
        style={{ 
          pointerEvents: 'none',
        }}
      >
        {/* Dark overlay with spotlight effect - blocks clicks outside highlighted area */}
        <div 
          className="absolute inset-0"
          style={{ 
            pointerEvents: allowInteraction ? 'none' : 'auto',
          }}
        >
          {/* Create spotlight effect using box-shadow on highlighted element */}
          {highlightRect && (
            <>
              {/* Top overlay */}
              <div 
                className="absolute left-0 right-0 bg-black/70 transition-all duration-300"
                style={{
                  top: 0,
                  height: `${highlightRect.top - effectiveHighlightPadding}px`,
                  pointerEvents: 'auto',
                }}
                onClick={onSkip}
              />
              
              {/* Bottom overlay */}
              <div 
                className="absolute left-0 right-0 bg-black/70 transition-all duration-300"
                style={{
                  top: `${highlightRect.bottom + effectiveHighlightPadding}px`,
                  bottom: 0,
                  pointerEvents: 'auto',
                }}
                onClick={onSkip}
              />
              
              {/* Left overlay */}
              <div 
                className="absolute top-0 bottom-0 bg-black/70 transition-all duration-300"
                style={{
                  left: 0,
                  width: `${highlightRect.left - effectiveHighlightPadding}px`,
                  pointerEvents: 'auto',
                }}
                onClick={onSkip}
              />
              
              {/* Right overlay */}
              <div 
                className="absolute top-0 bottom-0 bg-black/70 transition-all duration-300"
                style={{
                  left: `${highlightRect.right + effectiveHighlightPadding}px`,
                  right: 0,
                  pointerEvents: 'auto',
                }}
                onClick={onSkip}
              />
            </>
          )}
        </div>

        {/* Highlight border with glow */}
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute rounded-lg transition-all duration-300 ${
              pulseHighlight ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${highlightRect.left - effectiveHighlightPadding}px`,
              top: `${highlightRect.top - effectiveHighlightPadding}px`,
              width: `${highlightRect.width + effectiveHighlightPadding * 2}px`,
              height: `${highlightRect.height + effectiveHighlightPadding * 2}px`,
              border: isMobile ? '4px solid #FFD447' : '3px solid #FFD447',
              boxShadow: isMobile 
                ? '0 0 0 6px rgba(255, 212, 71, 0.25), 0 0 32px rgba(255, 212, 71, 0.5)' 
                : '0 0 0 4px rgba(255, 212, 71, 0.2), 0 0 24px rgba(255, 212, 71, 0.4)',
              pointerEvents: allowInteraction ? 'none' : 'auto',
              zIndex: 1,
            }}
          />
        )}

        {/* Pointer arrow/hand for wait-for-click mode */}
        {isWaitingForUser && highlightRect && mode === 'wait-for-click' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
            className="absolute"
            style={{
              left: `${highlightRect.left + highlightRect.width / 2}px`,
              top: `${highlightRect.top + highlightRect.height / 2}px`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <MousePointerClick className="w-12 h-12 text-[#FFD447] drop-shadow-lg" />
          </motion.div>
        )}

        {/* Fallback tooltip when element not found */}
        {showFallback && !highlightRect && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-[400px] w-full px-4"
            style={{
              pointerEvents: 'auto',
              zIndex: 10,
            }}
          >
            <LBCard className="border-2 border-orange-400 shadow-2xl bg-orange-50">
              <LBCardContent className="p-5">
                {/* Close button */}
                <button
                  onClick={onSkip}
                  className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Skip walkthrough"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>

                {/* Warning icon */}
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg text-[#342E37] mb-2">
                      Can't find that element
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {title} - {description}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      The element we're looking for isn't visible yet. Please ensure you're on the correct page, then click Continue to proceed.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'items-center'}`}>
                  <LBButton
                    variant="primary"
                    onClick={onNext || onSkip}
                    className={`flex items-center justify-center gap-2 ${isMobile ? 'w-full min-h-[48px]' : 'flex-1'}`}
                  >
                    Continue Anyway
                    <ArrowRight className="w-4 h-4" />
                  </LBButton>
                  <button
                    onClick={onSkip}
                    className={`text-xs text-gray-600 hover:text-gray-800 transition-colors ${isMobile ? 'w-full py-3 px-4' : 'px-3 py-2'}`}
                  >
                    Skip tour
                  </button>
                </div>
              </LBCardContent>
            </LBCard>
          </motion.div>
        )}

        {/* Walkthrough tooltip card */}
        {!showFallback && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
            className="absolute max-w-[400px] w-full"
            style={{
              ...tooltipStyle,
              pointerEvents: 'auto',
              zIndex: 10,
              margin: '0 16px',
            }}
          >
          <LBCard className="border-2 border-[#FFD447] shadow-2xl">
            <LBCardContent className="p-5">
              {/* Close button */}
              {showSkip && (
                <button
                  onClick={onSkip}
                  className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Skip walkthrough"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}

              {/* Progress indicator */}
              <div className="flex items-center gap-1.5 mb-3">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      index + 1 <= step ? 'bg-[#FFD447]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Step label */}
              <div className="text-xs text-gray-500 mb-3">
                Step {step} of {totalSteps}
              </div>

              {/* Title */}
              <h3 className="font-bold text-lg text-[#342E37] mb-2">
                {title}
              </h3>

              {/* Description */}
              <p className="text-[14px] text-gray-700 leading-relaxed mb-4">
                {description}
              </p>

              {/* Waiting indicator */}
              {isWaitingForUser && (
                <div className="flex items-center gap-2 p-3 bg-[#FFD447]/10 rounded-lg mb-4">
                  <Info className="w-4 h-4 text-[#342E37] flex-shrink-0" />
                  <p className="text-xs text-[#342E37]">
                    {mode === 'wait-for-click' 
                      ? 'Click the highlighted area to continue'
                      : 'Complete the action to continue'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'items-center'}`}>
                {showContinueButton && (onSkip || onNext) && (
                  <LBButton
                    variant="primary"
                    onClick={onNext || onSkip}
                    className={`flex items-center justify-center gap-2 ${isMobile ? 'w-full min-h-[48px]' : 'flex-1'}`}
                  >
                    {ctaText || 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </LBButton>
                )}
                {showSkip && (
                  <button
                    onClick={onSkip}
                    className={`text-xs text-gray-600 hover:text-gray-800 transition-colors ${isMobile ? 'w-full py-3 px-4' : 'px-3 py-2'}`}
                  >
                    Skip tour
                  </button>
                )}
                {showBack && onBack && (
                  <button
                    onClick={onBack}
                    className={`text-xs text-gray-600 hover:text-gray-800 transition-colors ${isMobile ? 'w-full py-3 px-4' : 'px-3 py-2'}`}
                  >
                    Back
                  </button>
                )}
              </div>
            </LBCardContent>
          </LBCard>
        </motion.div>
        )}
      </div>
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
}