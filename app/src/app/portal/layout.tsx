import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

const NAV = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/portal/devices", label: "Devices", icon: "⬡" },
  { href: "/portal/commands", label: "Commands", icon: "↗" },
  { href: "/portal/errors", label: "Error Logs", icon: "⚠" },
  { href: "/portal/settings-push", label: "Push Settings", icon: "⚙" },
  { href: "/portal/broadcasts", label: "Broadcasts", icon: "◎" },
  { href: "/portal/dvr", label: "Cloud DVR", icon: "⏺" },
  { href: "/portal/dns", label: "DNS", icon: "◑" },
  { href: "/portal/versions", label: "Versions", icon: "⬆" },
  { href: "/portal/apk-builds", label: "APK Builds", icon: "⬛" },
  { href: "/portal/web-player-deploy", label: "Web Player", icon: "▶" },
  { href: "/player", label: "Watch TV", icon: "📺" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <span className="text-sm font-bold text-primary tracking-wide">IPTV SAAS</span>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{session.user.email}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <span className="text-xs w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-border">
          <Link
            href="/api/auth/signout"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
