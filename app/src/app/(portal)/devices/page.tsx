"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Device {
  id: string;
  deviceId: string;
  model: string | null;
  appVersion: string | null;
  ipAddress: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  registeredAt: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(search ? { search } : {}),
      ...(onlineOnly ? { online: "true" } : {}),
    });
    const res = await fetch(`/api/portal/devices?${params}`);
    const data = await res.json();
    setDevices(data.devices || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, onlineOnly]);

  useEffect(() => {
    const t = setTimeout(fetchDevices, 200);
    return () => clearTimeout(t);
  }, [fetchDevices]);

  function formatTime(t: string | null) {
    if (!t) return "Never";
    const d = new Date(t);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Devices <span className="text-muted-foreground text-sm font-normal">({total})</span>
        </h1>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by device ID, IP, or model..."
          className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => { setOnlineOnly(e.target.checked); setPage(1); }}
            className="accent-primary"
          />
          Online only
        </label>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Device ID</th>
              <th className="px-4 py-3 text-left">Model</th>
              <th className="px-4 py-3 text-left">Version</th>
              <th className="px-4 py-3 text-left">IP</th>
              <th className="px-4 py-3 text-left">Last Seen</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No devices found</td></tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${d.isOnline ? "bg-green-400" : "bg-gray-500"}`} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.deviceId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-foreground">{d.model || "—"}</td>
                  <td className="px-4 py-3 text-foreground">{d.appVersion || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.ipAddress || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTime(d.lastSeenAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/portal/devices/${d.id}`} className="text-xs text-primary hover:underline">
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs border border-border rounded disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-xs text-muted-foreground">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= total} className="px-3 py-1 text-xs border border-border rounded disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
