"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center p-6">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-gray-600">{error?.message || 'An unexpected error occurred.'}</p>
          <div className="flex gap-4">
            <button onClick={() => reset()} className="text-blue-600 underline">Try again</button>
            <a href="/map" className="text-blue-600 underline">Back to map</a>
          </div>
        </div>
      </body>
    </html>
  );
}


