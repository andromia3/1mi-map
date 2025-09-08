export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">The page you’re looking for doesn’t exist.</p>
      <a href="/map" className="text-blue-600 underline">Back to map</a>
    </div>
  );
}


