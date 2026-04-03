import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Called on every touchmove with the current horizontal delta (px). Only fires during a recognised horizontal swipe. */
  onSwipeDrag?: (deltaX: number) => void;
  /** Called when a drag is released without triggering a full swipe (finger lifted too early / snapped back). */
  onSwipeCancel?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

/**
 * Custom hook for detecting swipe gestures on mobile devices.
 * Adds onSwipeDrag so callers can follow the finger in real time.
 */
export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeDrag,
    onSwipeCancel,
    threshold = 50,
    velocityThreshold = 0.3,
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Recognise as a horizontal swipe once it's clearly more horizontal than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping.current = true;
      }

      // Only fire drag updates for rightward swipes (modal slides to the right to dismiss)
      if (isSwiping.current && deltaX > 0 && onSwipeDrag) {
        onSwipeDrag(deltaX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current || !touchStartX.current) {
        touchStartX.current = 0;
        touchStartY.current = 0;
        touchStartTime.current = 0;
        isSwiping.current = false;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const velocity = Math.abs(deltaX) / deltaTime;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold || velocity > velocityThreshold) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Didn't meet threshold — snap back
          onSwipeCancel?.();
        }
      } else {
        onSwipeCancel?.();
      }

      touchStartX.current = 0;
      touchStartY.current = 0;
      touchStartTime.current = 0;
      isSwiping.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeDrag, onSwipeCancel, threshold, velocityThreshold]);
}
