"use client";

import { useState, useEffect, useCallback } from "react";

interface DvrSchedule {
  id: string;
  title: string;
  channelId: string;
  startTime: string;
  endTime: string;
  status: string;
  device: { deviceId: string; model: string | null };
  recording: { id: string; sizeBytes: string; completedAt: string | null } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-500/10",
  RECORDING: "text-blue-400 bg-blue-500/10",
  DONE: "text-green-400 bg-green-500/10",
  FAILED: "text-red-400 bg-red-500/10",
  CANCELLED: "text-gray-400 bg-gray-500/10",
};

export default function DvrPage() {
  const [schedules, setSchedules] = useState<DvrSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ ...(filter ? { status: filter } : {}) });
    const res = await fetch(`/api/portal/dvr?${params}`);
    const data = await res.json();
    setSchedules(data.schedules || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  async function cancelSchedule(id: string) {
    await fetch(`/api/portal/dvr?id=${id}`, { method: "DELETE" });
    fetchSchedules();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Cloud DVR <span className="text-muted-foreground text-sm font-normal">({total})</span>
        </h1>
      </div>

      <div className="flex gap-2 mb-4">
        {["", "PENDING", "RECORDING", "DONE", "FAILED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-input border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Device</th>
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">End</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No recordings found</td></tr>
            ) : (
              schedules.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-accent/20">
                  <td className="px-4 py-3 text-foreground">{s.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.device.deviceId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.endTime).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[s.status] || ""}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.recording ? `${(Number(s.recording.sizeBytes) / 1e6).toFixed(1)} MB` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {s.recording?.id && s.status === "DONE" && (
                      <a href={`/api/dvr/play/${s.recording.id}`} className="text-xs text-primary hover:underline mr-2">▶ Play</a>
                    )}
                    {["PENDING"].includes(s.status) && (
                      <button onClick={() => cancelSchedule(s.id)} className="text-xs text-destructive hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
