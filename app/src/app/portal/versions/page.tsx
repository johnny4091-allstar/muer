"use client";

import { useState, useEffect } from "react";

interface VersionConfig {
  masterVersion: string;
  autoUpdate: boolean;
  pins: Array<{ id: string; deviceId: string; pinnedVersion: string }>;
}

export default function VersionsPage() {
  const [config, setConfig] = useState<VersionConfig | null>(null);
  const [masterVersion, setMasterVersion] = useState("1.0.0");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/versions").then(async (r) => {
      const data = await r.json();
      if (data) {
        setConfig(data);
        setMasterVersion(data.masterVersion);
        setAutoUpdate(data.autoUpdate);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/portal/versions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterVersion, autoUpdate }),
    });
    setSaving(false);
    setResult(res.ok ? "✓ Version config saved" : "Error saving");
  }

  async function removePin(deviceId: string) {
    await fetch("/api/portal/versions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removePin: deviceId }),
    });
    const res = await fetch("/api/portal/versions");
    setConfig(await res.json());
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Version Control</h1>

      <form onSubmit={handleSave} className="bg-card border border-border rounded-lg p-5 space-y-4 mb-5">
        <h2 className="text-sm font-medium text-foreground">Master Version</h2>
        <div>
          <label className="text-xs text-muted-foreground">Version Number</label>
          <input
            type="text" value={masterVersion} onChange={(e) => setMasterVersion(e.target.value)}
            pattern="^\d+\.\d+\.\d+$"
            className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="1.0.0"
          />
          <p className="text-xs text-muted-foreground mt-1">Devices without a version pin will be updated to this version</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={autoUpdate} onChange={(e) => setAutoUpdate(e.target.checked)} className="accent-primary" />
          Auto-update enabled (devices apply silently)
        </label>
        {result && (
          <div className={`px-3 py-2 rounded text-sm ${result.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
            {result}
          </div>
        )}
        <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : "Save Version Config"}
        </button>
      </form>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-medium text-foreground mb-3">Per-Device Version Pins</h2>
        {!config?.pins?.length ? (
          <p className="text-sm text-muted-foreground">No device pins configured</p>
        ) : (
          <div className="space-y-2">
            {config.pins.map((pin) => (
              <div key={pin.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-muted-foreground text-xs">{pin.deviceId.slice(0, 12)}…</span>
                <span className="text-foreground">{pin.pinnedVersion}</span>
                <button onClick={() => removePin(pin.deviceId)} className="text-xs text-destructive hover:underline">Remove Pin</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
