import { prisma } from "@/lib/db";
import { formatRelativeTime } from "@/lib/utils";
import ReportActions from "./ReportActions";
import { Flag } from "lucide-react";

export const metadata = { title: "Reports | Admin | StreamZone" };

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reportedBy: { select: { username: true } },
      reportedUser: { select: { username: true } },
      post: { select: { id: true, threadId: true, content: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
        <Flag className="w-6 h-6 text-[#ef4444]" />
        Pending Reports ({reports.length})
      </h1>

      {reports.length === 0 ? (
        <div className="cyber-card p-10 text-center text-[#475569]">No pending reports 🎉</div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <div key={report.id} className="cyber-card p-4 border-l-2 border-[#ef4444]/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#ef4444]">{report.reason}</span>
                    <span className="text-xs text-[#475569]">by {report.reportedBy.username}</span>
                    <span className="text-xs text-[#475569]">· {formatRelativeTime(report.createdAt)}</span>
                  </div>
                  {report.description && (
                    <p className="text-sm text-[#94a3b8]">{report.description}</p>
                  )}
                  {report.post && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-[#141428] border border-[#1e1e3a]">
                      <p className="text-xs text-[#94a3b8] line-clamp-2">
                        {report.post.content.replace(/<[^>]*>/g, "").slice(0, 200)}
                      </p>
                    </div>
                  )}
                </div>
                <ReportActions reportId={report.id} postId={report.post?.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
