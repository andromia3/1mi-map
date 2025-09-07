"use client";

export default function MapVignetteOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
        <defs>
          <radialGradient id="map-vignette-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.07" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#map-vignette-gradient)" />
      </svg>
    </div>
  );
}


