"use client";

import { useState, useEffect } from "react";

interface Device {
  id: string;
  deviceId: string;
  model: string | null;
  isOnline: boolean;
}

const COMMAND_TYPES = [
  { value: "MESSAGE", label: "Send Message", hasPayload: true },
  { value: "CLEAR_CACHE", label: "Clear Cache", hasPayload: false },
  { value: "RESTART", label: "Restart App", hasPayload: false },
  { value: "FORCE_UPDATE", label: "Force Update", hasPayload: false },
  { value: "TERMINATE", label: "Terminate App", hasPayload: false },
  { value: "WIPE", label: "Wipe Data", hasPayload: false },
  { value: "PUSH_SETTINGS", label: "Push Settings", hasPayload: true },
];

export default function CommandsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [commandType, setCommandType] = useState("MESSAGE");
  const [message, setMessage] = useState("");
  const [allDevices, setAllDevices] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/devices?limit=200")
      .then((r) => r.json())
      .then((d) => setDevices(d.devices || []));
  }, []);

  const selectedCmd = COMMAND_TYPES.find((c) => c.value === commandType)!;

  async function handleSend() {
    if (!allDevices && selected.size === 0) {
      setResult("Select at least one device or choose 'All Devices'");
      return;
    }
    setSending(true);
    setResult(null);

    const payload: Record<string, unknown> = {};
    if (commandType === "MESSAGE" && message) payload.message = message;

    const res = await fetch("/api/portal/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceIds: Array.from(selected),
        type: commandType,
        payload: Object.keys(payload).length ? payload : undefined,
        allDevices,
      }),
    });

    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(`✓ Command queued for ${data.queued} device(s)`);
      setSelected(new Set());
    } else {
      setResult(`Error: ${JSON.stringify(data.error)}`);
    }
  }

  function toggleDevice(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-foreground mb-6">Remote Commands</h1>

      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Command Type</h2>
        <div className="grid grid-cols-3 gap-2">
          {COMMAND_TYPES.map((cmd) => (
            <button
              key={cmd.value}
              onClick={() => setCommandType(cmd.value)}
              className={`px-3 py-2 rounded text-xs text-left transition-colors ${
                commandType === cmd.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-input border border-border text-foreground hover:bg-accent"
              }`}
            >
              {cmd.label}
            </button>
          ))}
        </div>

        {selectedCmd.hasPayload && commandType === "MESSAGE" && (
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">Message Text</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message to display on devices..."
              className="w-full mt-1 px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Target Devices</h2>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={allDevices} onChange={(e) => setAllDevices(e.target.checked)} className="accent-primary" />
            Select all {devices.length} devices
          </label>
        </div>
        {!allDevices && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {devices.map((d) => (
              <label key={d.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggleDevice(d.id)}
                  className="accent-primary"
                />
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d.isOnline ? "bg-green-400" : "bg-gray-500"}`} />
                <span className="text-xs font-mono text-muted-foreground">{d.deviceId.slice(0, 10)}…</span>
                <span className="text-xs text-foreground">{d.model || "Unknown"}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div className={`mb-4 px-4 py-3 rounded text-sm ${result.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"}`}>
          {result}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? "Sending..." : `Send ${selectedCmd.label}`}
      </button>
    </div>
  );
}
