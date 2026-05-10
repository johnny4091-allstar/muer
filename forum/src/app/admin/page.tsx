import { prisma } from "@/lib/db";
import Link from "next/link";
import { Users, MessageSquare, Flag, Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard | StreamZone" };

export default async function AdminDashboard() {
  const [users, threads, posts, reports, recentUsers, pendingReports] = await Promise.all([
    prisma.user.count(),
    prisma.thread.count({ where: { isDeleted: false } }),
    prisma.post.count({ where: { isDeleted: false } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { profile: { select: { reputation: true } } } }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      take: 5,
      include: {
        reportedBy: { select: { username: true } },
        post: { select: { id: true, threadId: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Total Users", value: formatNumber(users), icon: Users, color: "#00d4ff" },
    { label: "Total Threads", value: formatNumber(threads), icon: MessageSquare, color: "#a855f7" },
    { label: "Total Posts", value: formatNumber(posts), icon: Activity, color: "#06b6d4" },
    { label: "Pending Reports", value: formatNumber(reports), icon: Flag, color: reports > 0 ? "#ef4444" : "#10b981" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#e2e8f0]">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="cyber-card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#475569]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#94a3b8] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00d4ff]" />
              Recent Registrations
            </h2>
            <Link href="/admin/users" className="text-xs text-[#00d4ff] hover:underline">View all →</Link>
          </div>
          <div className="cyber-card overflow-hidden">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1e1e3a] last:border-b-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#e2e8f0] truncate">{user.username}</div>
                  <div className="text-xs text-[#475569]">{formatRelativeTime(user.createdAt)}</div>
                </div>
                <span className={`badge-neon text-xs ${user.role === "ADMIN" ? "badge-purple" : "badge-blue"}`}>{user.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Reports */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#94a3b8] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              Pending Reports
            </h2>
            <Link href="/admin/reports" className="text-xs text-[#00d4ff] hover:underline">View all →</Link>
          </div>
          <div className="cyber-card overflow-hidden">
            {pendingReports.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[#475569] flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                No pending reports
              </div>
            ) : (
              pendingReports.map((r) => (
                <div key={r.id} className="px-4 py-2.5 border-b border-[#1e1e3a] last:border-b-0">
                  <div className="text-sm text-[#e2e8f0]">{r.reason}</div>
                  <div className="text-xs text-[#475569] mt-0.5">by {r.reportedBy.username}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
