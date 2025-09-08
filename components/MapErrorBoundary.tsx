"use client";

import { ErrorBoundary } from 'react-error-boundary';

function Fallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm bg-white/80 backdrop-blur rounded-md p-4 shadow">
        <h2 className="text-lg font-semibold mb-1">We couldn’t load the map</h2>
        <p className="text-sm text-gray-600 mb-3">{error?.message || 'An unexpected error occurred.'}</p>
        <div className="flex items-center justify-center gap-3">
          <button className="text-blue-600 underline" onClick={() => resetErrorBoundary()}>Try again</button>
          <button className="text-blue-600 underline" onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}>Reload</button>
        </div>
      </div>
    </div>
  );
}

export default function MapErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={Fallback} onReset={() => { /* noop; child effects will rerun */ }}>
      {children}
    </ErrorBoundary>
  );
}


