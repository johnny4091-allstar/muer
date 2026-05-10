"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";

const PostEditor = dynamic(() => import("@/components/forum/PostEditor"), { ssr: false });

export default function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content === "<p></p>") {
      setError("Reply cannot be empty.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch(`/api/threads/${threadId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to post reply");
    } else {
      setContent("");
      router.refresh();
    }
  }

  return (
    <div className="cyber-card p-4">
      <h3 className="text-sm font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#a855f7]" />
        Post a Reply
      </h3>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <PostEditor content={content} onChange={setContent} placeholder="Write your reply…" minHeight="120px" />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-neon-purple px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Post Reply
          </button>
        </div>
      </form>
    </div>
  );
}
