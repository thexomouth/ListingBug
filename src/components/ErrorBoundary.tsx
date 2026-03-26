import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  return (
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Importing a module script failed') ||
    error.message?.includes('error loading dynamically imported module') ||
    error.name === 'ChunkLoadError'
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    if (isChunkLoadError(error)) {
      // Use localStorage + timestamp to prevent reload loops
      // Only auto-reload once per 30 seconds
      const lastReload = localStorage.getItem('lb_chunk_reload_at');
      const now = Date.now();
      const thirtySeconds = 30 * 1000;

      if (!lastReload || now - parseInt(lastReload) > thirtySeconds) {
        localStorage.setItem('lb_chunk_reload_at', String(now));
        window.location.reload();
      }
      // If we reloaded recently and still erroring, fall through to show the UI
    }
  }

  private handleReset = () => {
    localStorage.removeItem('lb_chunk_reload_at');
    this.setState({ hasError: false, error: null, isChunkError: false });
    window.location.href = '/';
  };

  private handleRefresh = () => {
    localStorage.removeItem('lb_chunk_reload_at');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="mb-4 text-xl font-bold">
              {this.state.isChunkError ? 'Update available' : 'Something went wrong'}
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {this.state.isChunkError
                ? 'ListingBug was just updated. Tap Refresh to load the latest version.'
                : 'An unexpected error occurred. Please try refreshing the page or return to the homepage.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRefresh} variant="outline">
                Refresh Page
              </Button>
              <Button onClick={this.handleReset}>
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
