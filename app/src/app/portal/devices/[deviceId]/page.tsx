import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DeviceDetailPage({ params }: { params: { deviceId: string } }) {
  const session = await getServerSession(authOptions);

  const device = await prisma.device.findFirst({
    where: { id: params.deviceId, resellerId: session!.user.id },
    include: {
      commands: { orderBy: { createdAt: "desc" }, take: 15 },
      errorLogs: { orderBy: { occurredAt: "desc" }, take: 15 },
      quota: true,
    },
  });

  if (!device) notFound();

  const statusColor = device.isOnline ? "text-green-400" : "text-gray-500";
  const statusLabel = device.isOnline ? "Online" : "Offline";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal/devices" className="text-sm text-muted-foreground hover:text-foreground">← Devices</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-mono text-foreground">{device.deviceId.slice(0, 12)}…</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground">Device Info</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: "Status", value: <span className={statusColor}>{statusLabel}</span> },
              { label: "Model", value: device.model || "—" },
              { label: "App Version", value: device.appVersion || "—" },
              { label: "IP Address", value: <span className="font-mono">{device.ipAddress || "—"}</span> },
              { label: "Last Seen", value: device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never" },
              { label: "Registered", value: new Date(device.registeredAt).toLocaleString() },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground">DVR Quota</h2>
          {device.quota ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used</span>
                <span className="text-foreground">{(Number(device.quota.usedBytes) / 1e9).toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quota</span>
                <span className="text-foreground">{(Number(device.quota.quotaBytes) / 1e9).toFixed(0)} GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (Number(device.quota.usedBytes) / Number(device.quota.quotaBytes)) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No quota assigned</p>
          )}

          <div className="pt-2">
            <Link
              href={`/portal/commands?deviceId=${device.id}`}
              className="inline-block px-3 py-1.5 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition-colors"
            >
              Send Command →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Recent Commands</h2>
          {device.commands.length === 0 ? (
            <p className="text-xs text-muted-foreground">No commands sent</p>
          ) : (
            <div className="space-y-2">
              {device.commands.map((cmd) => (
                <div key={cmd.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-mono">{cmd.type}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    cmd.status === "DELIVERED" ? "bg-green-500/10 text-green-400" :
                    cmd.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>{cmd.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Recent Errors</h2>
          {device.errorLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No errors reported</p>
          ) : (
            <div className="space-y-2">
              {device.errorLogs.map((log) => (
                <div key={log.id} className="text-xs">
                  <span className="text-red-400 font-mono">{log.errorType}</span>
                  {log.streamUrl && (
                    <p className="text-muted-foreground truncate mt-0.5">{log.streamUrl}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
