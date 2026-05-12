import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getStats(resellerId: string) {
  const now = new Date();
  const tenMin = new Date(now.getTime() - 10 * 60 * 1000);
  const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [total, online, recent, active] = await Promise.all([
    prisma.device.count({ where: { resellerId } }),
    prisma.device.count({ where: { resellerId, isOnline: true } }),
    prisma.device.count({ where: { resellerId, lastSeenAt: { gte: tenMin } } }),
    prisma.device.count({ where: { resellerId, lastSeenAt: { gte: oneDay } } }),
  ]);

  return { total, online, recent, active };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats(session!.user.id);

  const statCards = [
    { label: "Total Devices", value: stats.total, color: "text-blue-400" },
    { label: "Online Now", value: stats.online, color: "text-green-400" },
    { label: "Recent (10min)", value: stats.recent, color: "text-yellow-400" },
    { label: "Active (24h)", value: stats.active, color: "text-purple-400" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-medium text-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/portal/devices" className="px-3 py-1.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors">
            View Devices
          </a>
          <a href="/portal/commands" className="px-3 py-1.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors">
            Send Command
          </a>
          <a href="/portal/broadcasts" className="px-3 py-1.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors">
            Broadcast Message
          </a>
          <a href="/portal/apk-builds" className="px-3 py-1.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors">
            Build APK
          </a>
          <a href="/player" className="px-3 py-1.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors">
            Open Web Player
          </a>
        </div>
      </div>
    </div>
  );
}
