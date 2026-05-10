"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SubmitPlaylistPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", m3uUrl: "", tags: "" });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; channelCount?: number; errors?: string[] } | null>(null);
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function validateUrl() {
    if (!form.m3uUrl) return;
    setValidating(true);
    setValidation(null);
    const res = await fetch("/api/playlists/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.m3uUrl }),
    });
    const data = await res.json();
    setValidation(data);
    setValidating(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        channelCount: validation?.channelCount,
        status: validation?.valid ? "VALID" : "PENDING",
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error ?? "Failed to submit");
    else router.push(`/playlists/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-[#e2e8f0] mb-4">Submit M3U Playlist</h1>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="cyber-card p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Playlist Name *</label>
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} required className="w-full px-3 py-2 cyber-input text-sm rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full px-3 py-2 cyber-input text-sm rounded-lg resize-none" placeholder="What does this playlist include?" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">M3U URL *</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={form.m3uUrl}
              onChange={(e) => { set("m3uUrl", e.target.value); setValidation(null); }}
              required
              className="flex-1 px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="https://example.com/playlist.m3u"
            />
            <button
              type="button"
              onClick={validateUrl}
              disabled={validating || !form.m3uUrl}
              className="px-4 py-2 rounded-lg text-sm bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#00d4ff] hover:border-[#00d4ff]/40 transition-colors disabled:opacity-50"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate"}
            </button>
          </div>
          {validation && (
            <div className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${validation.valid ? "bg-green-900/20 border border-green-800/40 text-[#10b981]" : "bg-red-900/20 border border-red-800/40 text-[#ef4444]"}`}>
              {validation.valid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {validation.valid ? `Valid M3U — ${validation.channelCount} channels found` : validation.errors?.join(", ")}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Tags (comma-separated)</label>
          <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)} className="w-full px-3 py-2 cyber-input text-sm rounded-lg" placeholder="e.g. sports, movies, english" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-neon-blue px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Playlist
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
