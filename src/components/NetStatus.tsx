"use client";

import { useEffect, useState } from "react";

export default function NetStatus() {
  if (process.env.NODE_ENV !== "development") return null;
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [visible, setVisible] = useState<boolean>(!online);

  useEffect(() => {
    const on = () => { setOnline(true); setVisible(true); setTimeout(() => setVisible(false), 1500); };
    const off = () => { setOnline(false); setVisible(true); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[100] rounded px-2 py-1 text-xs shadow"
      style={{ background: online ? '#dcfce7' : '#fee2e2', color: online ? '#166534' : '#991b1b' }}>
      {online ? 'Online' : 'Offline'}
    </div>
  );
}


