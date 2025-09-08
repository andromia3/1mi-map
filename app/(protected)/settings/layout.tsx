import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="md:col-span-1">
        <nav className="space-y-1 text-sm">
          <div className="font-semibold text-gray-800 mb-2">Settings</div>
          <Link href="/settings/profile" className="block px-2 py-1 rounded hover:bg-gray-50">Profile</Link>
          <Link href="/settings/notifications" className="block px-2 py-1 rounded hover:bg-gray-50">Notifications</Link>
          <Link href="/settings/security" className="block px-2 py-1 rounded hover:bg-gray-50">Security</Link>
        </nav>
      </aside>
      <main className="md:col-span-3">{children}</main>
    </div>
  );
}


