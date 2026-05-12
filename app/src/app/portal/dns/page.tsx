"use client";

import { useState, useEffect } from "react";

interface DnsEntry {
  id: string;
  subdomain: string;
  targetIp: string;
  createdAt: string;
}

export default function DnsPage() {
  const [entries, setEntries] = useState<DnsEntry[]>([]);
  const [limit, setLimit] = useState(1);
  const [subdomain, setSubdomain] = useState("");
  const [targetIp, setTargetIp] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function fetchEntries() {
    const res = await fetch("/api/portal/dns");
    const data = await res.json();
    setEntries(data.entries || []);
    setLimit(data.limit || 1);
  }

  useEffect(() => { fetchEntries(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const res = await fetch("/api/portal/dns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain, targetIp }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setResult("✓ DNS entry added");
      setSubdomain("");
      setTargetIp("");
      fetchEntries();
    } else {
      setResult(typeof data.error === "string" ? data.error : "Error adding DNS entry");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/portal/dns?id=${id}`, { method: "DELETE" });
    fetchEntries();
  }

  const atLimit = isFinite(limit) && entries.length >= limit;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-foreground mb-1">DNS Management</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {isFinite(limit) ? `${entries.length} / ${limit} entries used` : `${entries.length} entries (unlimited)`}
      </p>

      {!atLimit && (
        <div className="bg-card border border-border rounded-lg p-5 mb-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Add DNS Entry</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Subdomain</label>
              <input
                type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase())} required
                pattern="^[a-z0-9-]+"
                className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="player"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Target IP Address</label>
              <input
                type="text" value={targetIp} onChange={(e) => setTargetIp(e.target.value)} required
                className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="1.2.3.4"
              />
            </div>
            {result && (
              <div className={`px-3 py-2 rounded text-sm ${result.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
                {result}
              </div>
            )}
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? "Adding..." : "Add Entry"}
            </button>
          </form>
        </div>
      )}

      {atLimit && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-5 text-sm text-yellow-400">
          DNS limit reached for your tier. Upgrade to add more entries.
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No DNS entries</p>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-mono text-foreground">{e.subdomain}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="text-sm font-mono text-muted-foreground">{e.targetIp}</span>
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
