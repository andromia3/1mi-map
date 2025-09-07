"use client";

import { ReactNode } from "react";
import { ErrorBoundary as Reb, FallbackProps } from "react-error-boundary";

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  if (process.env.NODE_ENV !== "production") {
    // Log full error for developers
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught", error);
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-semibold">Something went wrong.</h1>
        <p className="text-gray-600 mt-2">Please reload the page. If the problem persists, try again later.</p>
        <button
          className="mt-4 inline-flex items-center rounded bg-black text-white px-4 py-2"
          onClick={() => resetErrorBoundary()}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Reb FallbackComponent={Fallback} onError={(e) => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.groupCollapsed("UI ErrorBoundary");
        // eslint-disable-next-line no-console
        console.error(e);
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
    }}>
      {children}
    </Reb>
  );
}


