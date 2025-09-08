"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function getAllTimezones(): string[] {
  try {
    const anyIntl: any = Intl as any;
    const zones: string[] | undefined = anyIntl.supportedValuesOf?.("timeZone");
    if (zones && Array.isArray(zones) && zones.length) return zones;
  } catch {}
  return [
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Los_Angeles",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
}

function score(candidate: string, query: string): number {
  const c = candidate.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;
  if (c === q) return -100; // best
  const idx = c.indexOf(q);
  if (idx >= 0) return idx; // earlier match is better (lower)
  // token match
  const parts = c.split(/[\/_-]/g);
  for (const p of parts) {
    const i = p.indexOf(q);
    if (i >= 0) return 50 + i;
  }
  return 9999;
}

export default function TimezoneSelect({
  value,
  onChange,
  placeholder = "Search timezones…",
  defaultToBrowser = true,
}: {
  value: string;
  onChange: (tz: string) => void;
  placeholder?: string;
  defaultToBrowser?: boolean;
}) {
  const all = useMemo(() => getAllTimezones(), []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!value && defaultToBrowser) {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) onChange(tz);
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    if (!query) return all.slice(0, 20);
    return all
      .map((z) => ({ z, s: score(z, query) }))
      .filter((x) => x.s < 9999)
      .sort((a, b) => a.s - b.s || a.z.localeCompare(b.z))
      .slice(0, 20)
      .map((x) => x.z);
  }, [all, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [results.length, query]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
      listRef.current?.children?.[Math.min(results.length - 1, activeIdx + 1)]?.scrollIntoView?.({ block: 'nearest' });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      listRef.current?.children?.[Math.max(0, activeIdx - 1)]?.scrollIntoView?.({ block: 'nearest' });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIdx] || query;
      if (pick) {
        onChange(pick);
        setOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="tz-listbox"
        className="border rounded px-2 py-1 w-full"
        placeholder={placeholder}
        value={query || value || ""}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id="tz-listbox"
          role="listbox"
          ref={listRef}
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow"
        >
          {results.map((tz, i) => (
            <li
              role="option"
              aria-selected={i === activeIdx}
              key={tz}
              className={`px-2 py-1 cursor-pointer ${i === activeIdx ? 'bg-gray-100' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); onChange(tz); setOpen(false); setQuery(""); }}
            >
              {tz}
            </li>
          ))}
          {!results.length && (
            <li className="px-2 py-2 text-sm text-gray-500">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}


