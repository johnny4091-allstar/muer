"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminUserActions({ userId, isBanned, role }: { userId: string; isBanned: boolean; role: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function action(act: string) {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => action(isBanned ? "unban" : "ban")}
        disabled={loading || role === "ADMIN"}
        className={`px-2 py-1 rounded text-xs transition-colors disabled:opacity-40 ${isBanned ? "bg-green-900/30 text-[#10b981] hover:bg-green-900/50" : "bg-red-900/30 text-[#ef4444] hover:bg-red-900/50"}`}
      >
        {isBanned ? "Unban" : "Ban"}
      </button>
      {role === "USER" && (
        <button
          onClick={() => action("make_mod")}
          disabled={loading}
          className="px-2 py-1 rounded text-xs bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 transition-colors disabled:opacity-40"
        >
          Mod
        </button>
      )}
    </div>
  );
}
