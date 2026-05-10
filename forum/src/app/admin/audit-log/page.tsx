import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export const metadata = { title: "Audit Log | Admin | StreamZone" };

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const ACTION_COLORS: Record<string, string> = {
    BAN_USER: "#ef4444",
    UNBAN_USER: "#10b981",
    DELETE_POST_FROM_REPORT: "#f59e0b",
    DISMISS_REPORT: "#475569",
    RESOLVE_REPORT: "#10b981",
    PROMOTE_MODERATOR: "#a855f7",
    DEMOTE_USER: "#94a3b8",
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
        <ScrollText className="w-6 h-6 text-[#06b6d4]" />
        Audit Log
      </h1>

      <div className="cyber-card overflow-hidden">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-4 px-4 py-3 border-b border-[#1e1e3a] last:border-b-0">
            <div
              className="text-xs font-mono font-bold px-2 py-0.5 rounded flex-shrink-0"
              style={{ color: ACTION_COLORS[log.action] ?? "#94a3b8", backgroundColor: `${ACTION_COLORS[log.action] ?? "#94a3b8"}15` }}
            >
              {log.action}
            </div>
            <div className="flex-1 text-sm text-[#94a3b8]">
              <span className="text-[#e2e8f0]">{log.actor.username}</span> → {log.targetType}:{log.targetId.slice(0, 8)}
            </div>
            <div className="text-xs text-[#475569] flex-shrink-0">{formatDateTime(log.createdAt)}</div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-8 text-center text-[#475569]">No audit log entries yet</div>
        )}
      </div>
    </div>
  );
}
