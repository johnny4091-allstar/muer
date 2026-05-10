"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function MessageComposer({ receiverId }: { receiverId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, content: message.trim() }),
    });
    setSending(false);
    setMessage("");
    router.refresh();
  }

  return (
    <form onSubmit={send} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message…"
        className="flex-1 px-3 py-2 cyber-input text-sm rounded-lg"
        disabled={sending}
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="btn-neon-purple px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        Send
      </button>
    </form>
  );
}
