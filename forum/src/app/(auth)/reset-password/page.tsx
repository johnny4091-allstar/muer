"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else {
      const d = await res.json();
      setError(d.error ?? "Reset failed. Link may be expired.");
    }
  }

  if (!token) return (
    <div className="cyber-card p-6 text-center">
      <p className="text-sm text-[#ef4444]">Invalid reset link.</p>
      <Link href="/forgot-password" className="mt-3 block text-sm text-[#00d4ff] hover:underline">Request new link</Link>
    </div>
  );

  if (done) return (
    <div className="cyber-card p-6 text-center">
      <div className="text-4xl mb-3">✅</div>
      <h2 className="text-lg font-bold text-[#10b981] mb-2">Password Reset!</h2>
      <p className="text-sm text-[#94a3b8] mb-4">You can now sign in with your new password.</p>
      <Link href="/login" className="btn-neon-blue px-6 py-2 rounded-lg text-sm font-semibold inline-block">Sign In</Link>
    </div>
  );

  return (
    <div className="cyber-card p-6">
      <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">Set New Password</h1>
      <p className="text-sm text-[#475569] mb-5">Choose a strong new password</p>
      {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 cyber-input text-sm rounded-lg" placeholder="Min. 8 characters" />
        </div>
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full px-3 py-2 cyber-input text-sm rounded-lg" placeholder="Repeat password" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Reset Password
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<div className="cyber-card p-6 text-center text-[#475569]">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
