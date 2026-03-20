interface PageLoaderProps {
  isLoading: boolean;
}

export function PageLoader({ isLoading }: PageLoaderProps) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center pointer-events-none"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div
            className="absolute inset-0 border-4 border-[#342e37]/10 rounded-full"
            aria-hidden="true"
          />
          {/* Spinning ring */}
          <div
            className="absolute inset-0 border-4 border-transparent border-t-[#ffd447] rounded-full"
            aria-hidden="true"
            style={{
              animation: 'spin 0.8s linear infinite'
            }}
          />
          {/* Inner dot */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div
              className="w-3 h-3 bg-[#ffd447] rounded-full"
              style={{
                animation: 'pulse 1s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}