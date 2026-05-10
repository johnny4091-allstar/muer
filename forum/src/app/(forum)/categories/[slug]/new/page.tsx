"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const PostEditor = dynamic(() => import("@/components/forum/PostEditor"), { ssr: false });

export default function NewThreadPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content === "<p></p>") {
      setError("Post content cannot be empty.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, categorySlug: slug, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create thread");
    } else {
      router.push(`/threads/${data.id}`);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-[#e2e8f0] mb-4">New Thread</h1>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="cyber-card p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Thread Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="Enter a descriptive title…"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Content *</label>
            <PostEditor content={content} onChange={setContent} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="e.g. kodi, m3u, review"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-neon-blue px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Post Thread
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
