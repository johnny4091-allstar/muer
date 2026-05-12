"use client";

import { useState, useEffect, useCallback } from "react";

const ERROR_TYPES = ["", "STUCK_PLAYER", "PLAYBACK_FAILED", "NUCLEAR_RECOVERY", "UNKNOWN"];

interface ErrorLog {
  id: string;
  errorType: string;
  streamUrl: string | null;
  recoveryStatus: string | null;
  occurredAt: string;
  device: { deviceId: string; model: string | null };
}

export default function ErrorsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), ...(filter ? { type: filter } : {}) });
    const res = await fetch(`/api/portal/errors?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const typeColor: Record<string, string> = {
    STUCK_PLAYER: "text-yellow-400 bg-yellow-500/10",
    PLAYBACK_FAILED: "text-red-400 bg-red-500/10",
    NUCLEAR_RECOVERY: "text-orange-400 bg-orange-500/10",
    UNKNOWN: "text-gray-400 bg-gray-500/10",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Error Logs <span className="text-muted-foreground text-sm font-normal">({total})</span>
        </h1>
      </div>

      <div className="flex gap-2 mb-4">
        {ERROR_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => { setFilter(t); setPage(1); }}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              filter === t ? "bg-primary text-primary-foreground" : "bg-input border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t || "All"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Device</th>
              <th className="px-4 py-3 text-left">Stream URL</th>
              <th className="px-4 py-3 text-left">Recovery</th>
              <th className="px-4 py-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No errors found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-accent/20">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${typeColor[log.errorType] || "text-gray-400"}`}>
                      {log.errorType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.device.deviceId.slice(0, 8)}…
                    {log.device.model && <span className="ml-1 text-foreground">{log.device.model}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-xs">{log.streamUrl || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.recoveryStatus || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(log.occurredAt).toLocaleString()}
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
