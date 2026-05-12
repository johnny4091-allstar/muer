"use client";

import { useState, useEffect, useRef } from "react";

interface AppBuild {
  id: string;
  appName: string;
  primaryColor: string;
  accentColor: string;
  branch: string;
  status: string;
  downloadUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; spin?: boolean }> = {
  QUEUED:   { label: "Queued",   className: "text-gray-400 bg-gray-500/10" },
  BUILDING: { label: "Building", className: "text-yellow-400 bg-yellow-500/10", spin: true },
  SUCCESS:  { label: "Success",  className: "text-green-400 bg-green-500/10" },
  FAILED:   { label: "Failed",   className: "text-red-400 bg-red-500/10" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: "text-muted-foreground bg-muted/10" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
      {cfg.spin && (
        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {cfg.label}
    </span>
  );
}

export default function ApkBuildsPage() {
  const [builds, setBuilds] = useState<AppBuild[]>([]);
  const [appName, setAppName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1D6BFF");
  const [accentColor, setAccentColor] = useState("#0EA5E9");
  const [branch, setBranch] = useState("main");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchBuilds() {
    try {
      const res = await fetch("/api/portal/apk-builds");
      const data = await res.json();
      setBuilds(data.builds || []);
    } catch {
      // ignore
    }
  }

  // Auto-refresh every 5s while any build is BUILDING or QUEUED
  useEffect(() => {
    fetchBuilds();
  }, []);

  useEffect(() => {
    const hasActiveBuilds = builds.some(
      (b) => b.status === "BUILDING" || b.status === "QUEUED"
    );

    if (hasActiveBuilds) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchBuilds, 5000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [builds]);

  async function uploadLogo(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/portal/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.path || null;
      }
    } catch {
      // ignore upload errors
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    let logoPath: string | undefined;
    if (logoFile) {
      const uploaded = await uploadLogo(logoFile);
      if (uploaded) logoPath = uploaded;
    }

    const res = await fetch("/api/portal/apk-builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appName, primaryColor, accentColor, branch, logoPath }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setResult(`Build queued successfully (ID: ${data.id})`);
      setAppName("");
      setLogoFile(null);
      fetchBuilds();
    } else {
      setResult(`Error: ${JSON.stringify(data.error)}`);
    }
  }

  const isSuccess = result?.startsWith("Build queued");

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">APK Build Farm</h1>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground mb-4">New Build</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">App Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="My IPTV Player"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Primary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-border bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Accent Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer border border-border bg-transparent"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">App Logo (PNG, optional)</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:bg-primary file:text-primary-foreground file:rounded cursor-pointer"
            />
            {logoFile && (
              <p className="mt-1 text-xs text-muted-foreground">{logoFile.name}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="main">main (stable)</option>
              <option value="beta">beta (cutting edge)</option>
            </select>
          </div>

          {result && (
            <div
              className={`px-3 py-2 rounded text-sm ${
                isSuccess
                  ? "bg-green-500/10 text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Queuing..." : "Queue Build"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Build History</h2>
          {builds.some((b) => b.status === "BUILDING" || b.status === "QUEUED") && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Auto-refreshing
            </span>
          )}
        </div>
        {builds.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No builds yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">App Name</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Colors</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-accent/20">
                  <td className="px-4 py-3 text-foreground font-medium">{b.appName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{b.branch}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <span
                        className="w-5 h-5 rounded border border-border/50"
                        style={{ backgroundColor: b.primaryColor }}
                        title={`Primary: ${b.primaryColor}`}
                      />
                      <span
                        className="w-5 h-5 rounded border border-border/50"
                        style={{ backgroundColor: b.accentColor }}
                        title={`Accent: ${b.accentColor}`}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {b.status === "SUCCESS" && b.downloadUrl && (
                      <a
                        href={b.downloadUrl}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        Download APK
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
