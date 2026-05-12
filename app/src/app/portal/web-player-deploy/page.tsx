"use client";

import { useState, useEffect } from "react";

interface Deployment {
  id: string;
  vpsIp: string;
  instanceId: string;
  label: string | null;
  isOnline: boolean;
  lastHeartbeat: string | null;
  createdAt: string;
}

export default function WebPlayerDeployPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [vpsIp, setVpsIp] = useState("");
  const [label, setLabel] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [installCmd, setInstallCmd] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function fetchDeployments() {
    const res = await fetch("/api/portal/web-player-deploy");
    const data = await res.json();
    setDeployments(data.deployments || []);
  }

  useEffect(() => { fetchDeployments(); }, []);

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    setDeploying(true);
    setResult(null);
    setInstallCmd(null);
    const res = await fetch("/api/portal/web-player-deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vpsIp, label }),
    });
    const data = await res.json();
    setDeploying(false);
    if (res.ok) {
      setInstallCmd(data.installCmd);
      setVpsIp("");
      setLabel("");
      fetchDeployments();
    } else {
      setResult(`Error: ${JSON.stringify(data.error)}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Web Player Deploy</h1>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground mb-1">Deploy to a VPS</h2>
        <p className="text-xs text-muted-foreground mb-4">Enter your VPS IP address to generate a one-line install command</p>
        <form onSubmit={handleDeploy} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">VPS IP Address</label>
              <input
                type="text" value={vpsIp} onChange={(e) => setVpsIp(e.target.value)} required
                className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="1.2.3.4"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Label (optional)</label>
              <input
                type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="US East player"
              />
            </div>
          </div>
          {result && <div className="text-sm text-destructive">{result}</div>}
          <button type="submit" disabled={deploying} className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {deploying ? "Generating..." : "Generate Install Command"}
          </button>
        </form>

        {installCmd && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Run this command on your VPS as root:</p>
            <div className="bg-muted border border-border rounded p-3 flex items-center gap-2">
              <code className="text-xs text-foreground font-mono flex-1 break-all">{installCmd}</code>
              <button
                onClick={() => navigator.clipboard.writeText(installCmd)}
                className="flex-shrink-0 text-xs text-primary hover:underline"
              >Copy</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Deployed Instances</h2>
        </div>
        {deployments.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No web player instances deployed</p>
        ) : (
          <div className="divide-y divide-border">
            {deployments.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.isOnline ? "bg-green-400" : "bg-gray-500"}`} />
                    <span className="text-sm text-foreground font-mono">{d.vpsIp}</span>
                    {d.label && <span className="text-xs text-muted-foreground">{d.label}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last heartbeat: {d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleString() : "Never"}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${d.isOnline ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                  {d.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
