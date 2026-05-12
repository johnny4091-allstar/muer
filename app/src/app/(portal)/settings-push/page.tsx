"use client";

import { useState, useEffect } from "react";

export default function SettingsPushPage() {
  const [bufferSize, setBufferSize] = useState(3000);
  const [epgRefresh, setEpgRefresh] = useState(3600);
  const [panelUrl, setPanelUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/settings").then(async (r) => {
      const data = await r.json();
      if (data.settings) {
        setBufferSize(data.settings.bufferSize);
        setEpgRefresh(data.settings.epgRefreshInterval);
      }
      if (data.xtream) {
        setPanelUrl(data.xtream.panelUrl);
        setUsername(data.xtream.username);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const body: Record<string, unknown> = {
      settings: { bufferSize, epgRefreshInterval: epgRefresh },
    };
    if (panelUrl && username) {
      body.xtream = { panelUrl, username, password: password || undefined };
    }
    const res = await fetch("/api/portal/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setResult(res.ok ? "✓ Settings saved" : "Error saving settings");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Push Settings</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Player Settings</h2>
          <div>
            <label className="text-xs text-muted-foreground">Buffer Size (ms)</label>
            <input
              type="number" min={500} max={30000} value={bufferSize} onChange={(e) => setBufferSize(+e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">How much data to buffer before playback starts (500–30000ms)</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">EPG Refresh Interval (seconds)</label>
            <input
              type="number" min={300} max={86400} value={epgRefresh} onChange={(e) => setEpgRefresh(+e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Xtream Panel Configuration</h2>
          <div>
            <label className="text-xs text-muted-foreground">Panel URL</label>
            <input
              type="url" value={panelUrl} onChange={(e) => setPanelUrl(e.target.value)}
              placeholder="http://panel.example.com:8080"
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Username</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password (leave blank to keep existing)</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {result && (
          <div className={`px-4 py-3 rounded text-sm ${result.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
            {result}
          </div>
        )}

        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : "Save & Push to Fleet"}
        </button>
      </form>
    </div>
  );
}
