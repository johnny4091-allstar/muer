"use client";

import { useState, useEffect } from "react";

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

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "text-yellow-400 bg-yellow-500/10",
  BUILDING: "text-blue-400 bg-blue-500/10",
  SUCCESS: "text-green-400 bg-green-500/10",
  FAILED: "text-red-400 bg-red-500/10",
};

export default function ApkBuildsPage() {
  const [builds, setBuilds] = useState<AppBuild[]>([]);
  const [appName, setAppName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1D6BFF");
  const [accentColor, setAccentColor] = useState("#0EA5E9");
  const [branch, setBranch] = useState("main");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function fetchBuilds() {
    const res = await fetch("/api/portal/apk-builds");
    const data = await res.json();
    setBuilds(data.builds || []);
  }

  useEffect(() => { fetchBuilds(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const res = await fetch("/api/portal/apk-builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appName, primaryColor, accentColor, branch }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setResult(`✓ Build queued (ID: ${data.id})`);
      setAppName("");
      fetchBuilds();
    } else {
      setResult(`Error: ${JSON.stringify(data.error)}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">APK Build Farm</h1>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground mb-4">New Build</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">App Name</label>
            <input
              type="text" value={appName} onChange={(e) => setAppName(e.target.value)} required
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="My IPTV Player"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Primary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Accent Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="main">main (stable)</option>
              <option value="beta">beta (cutting edge)</option>
            </select>
          </div>
          {result && (
            <div className={`px-3 py-2 rounded text-sm ${result.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
              {result}
            </div>
          )}
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {submitting ? "Queuing..." : "Queue Build"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Build History</h2>
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
                  <td className="px-4 py-3 text-foreground">{b.appName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.branch}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: b.primaryColor }} title={b.primaryColor} />
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: b.accentColor }} title={b.accentColor} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[b.status] || ""}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {b.downloadUrl && (
                      <a href={b.downloadUrl} className="text-xs text-primary hover:underline">Download APK</a>
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
