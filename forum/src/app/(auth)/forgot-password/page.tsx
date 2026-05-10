"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else setError("Something went wrong. Please try again.");
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="cyber-card p-6 text-center">
          <div className="text-4xl mb-3">📧</div>
          <h2 className="text-lg font-bold text-[#00d4ff] mb-2">Check Your Email</h2>
          <p className="text-sm text-[#94a3b8]">
            If that email exists, we sent a password reset link. Check your inbox.
          </p>
          <Link href="/login" className="block mt-4 text-sm text-[#00d4ff] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="cyber-card p-6">
        <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">Forgot Password</h1>
        <p className="text-sm text-[#475569] mb-5">Enter your email to receive a reset link</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Reset Link
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-[#475569] mt-4">
        <Link href="/login" className="text-[#00d4ff] hover:underline">Back to Sign In</Link>
      </p>
    </div>
  );
}
