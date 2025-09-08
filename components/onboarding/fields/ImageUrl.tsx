"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function ImageUrl({
  value,
  onChange,
  placeholder = "https://...",
  label = "Avatar URL",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(value || "");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const timer = useRef<any>(null);

  useEffect(() => { setUrl(value || ""); }, [value]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!url || url.trim().length < 5) {
      setStatus("idle"); setPreviewSrc(null); return;
    }
    setStatus("checking");
    timer.current = setTimeout(async () => {
      const tryImage = () => new Promise<boolean>((resolve) => {
        try {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        } catch { resolve(false); }
      });
      let ok = false;
      try {
        // Try a HEAD request first (may be opaque/no-cors)
        const res = await fetch(url, { method: 'HEAD', mode: 'cors' }).catch(() => null);
        if (res && (res.ok || res.type === 'opaque')) ok = true;
      } catch { /* ignore */ }
      if (!ok) ok = await tryImage();
      if (ok) { setStatus("ok"); setPreviewSrc(url); } else { setStatus("error"); setPreviewSrc(null); }
    }, 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [url]);

  const border = status === 'error' ? 'border-red-400' : 'border-gray-300';

  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-700" htmlFor="image_url_input">{label}</label>
      <div className="flex items-center gap-3">
        <div className={`w-16 h-16 rounded overflow-hidden bg-gray-100 border ${border} flex items-center justify-center`}
             aria-label="avatar preview">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400">
              {status === 'checking' ? '…' : status === 'error' ? '!' : '—'}
            </span>
          )}
        </div>
        <input
          id="image_url_input"
          className={`flex-1 border rounded px-2 py-1 ${border}`}
          placeholder={placeholder}
          value={url}
          onChange={(e) => { setUrl(e.target.value); onChange(e.target.value); }}
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' ? 'image_url_error' : undefined}
        />
      </div>
      {status === 'error' && (
        <p id="image_url_error" className="text-xs text-red-600">We couldn’t load that image URL.</p>
      )}
    </div>
  );
}


