import { Suspense, lazy, ComponentType } from 'react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * LazyWrapper - Utility component for lazy loading non-critical components
 * Provides Suspense boundary with optional fallback
 */
export function LazyWrapper({ children, fallback = null }: LazyWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * createLazyComponent - Factory function for creating lazy-loaded components
 * @param importFn - Dynamic import function
 * @param fallback - Optional fallback component while loading
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || null}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
