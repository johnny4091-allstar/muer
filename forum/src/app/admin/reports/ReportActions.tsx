"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReportActions({ reportId, postId }: { reportId: string; postId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve(action: string) {
    setLoading(true);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, postId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1 flex-shrink-0">
      <button
        onClick={() => resolve("dismiss")}
        disabled={loading}
        className="px-2 py-1 rounded text-xs bg-[#141428] border border-[#1e1e3a] text-[#475569] hover:text-[#94a3b8] transition-colors disabled:opacity-40"
      >
        Dismiss
      </button>
      {postId && (
        <button
          onClick={() => resolve("delete_post")}
          disabled={loading}
          className="px-2 py-1 rounded text-xs bg-red-900/20 border border-red-800/30 text-[#ef4444] hover:bg-red-900/40 transition-colors disabled:opacity-40"
        >
          Delete Post
        </button>
      )}
      <button
        onClick={() => resolve("resolve")}
        disabled={loading}
        className="px-2 py-1 rounded text-xs bg-green-900/20 border border-green-800/30 text-[#10b981] hover:bg-green-900/40 transition-colors disabled:opacity-40"
      >
        Resolve
      </button>
    </div>
  );
}
