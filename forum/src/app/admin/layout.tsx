export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, FolderOpen, Flag, Settings, ScrollText, Zap, ChevronRight } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Admin Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[#1e1e3a] flex flex-col">
        <div className="p-4 border-b border-[#1e1e3a]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#ec4899] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm gradient-text-blue-purple">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#141428] transition-colors group"
            >
              <Icon className="w-4 h-4" />
              {label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1e1e3a]">
          <Link href="/" className="text-xs text-[#475569] hover:text-[#00d4ff] block text-center">
            ← Back to Forum
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
