"use client";

import { useState, useEffect } from "react";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  targetAll: boolean;
  status: string;
  sentAt: string;
  _count: { deliveries: number };
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function fetchBroadcasts() {
    const res = await fetch("/api/portal/broadcasts");
    const data = await res.json();
    setBroadcasts(data.broadcasts || []);
  }

  useEffect(() => { fetchBroadcasts(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    const res = await fetch("/api/portal/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, targetAll }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`✓ Broadcast sent to ${data.sent} devices`);
      setTitle("");
      setBody("");
      fetchBroadcasts();
    } else {
      setResult(`Error: ${JSON.stringify(data.error)}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Broadcasts</h1>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-foreground mb-4">Compose Broadcast</h2>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Maintenance Notice"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Message</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} required rows={3}
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="We will be performing maintenance tonight from 2–4am..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} className="accent-primary" />
            Send to all devices
          </label>
          {result && (
            <div className={`px-3 py-2 rounded text-sm ${result.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
              {result}
            </div>
          )}
          <button type="submit" disabled={sending} className="px-5 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {sending ? "Sending..." : "Send Broadcast"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">History</h2>
        </div>
        {broadcasts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No broadcasts sent yet</p>
        ) : (
          <div className="divide-y divide-border">
            {broadcasts.map((b) => (
              <div key={b.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{b.title}</span>
                  <span className="text-xs text-muted-foreground">{new Date(b.sentAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">{b.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{b._count.deliveries} recipient(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
