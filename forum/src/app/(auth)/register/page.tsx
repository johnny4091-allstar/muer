"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", username: "", name: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, username: form.username, name: form.name, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed. Please try again.");
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="cyber-card p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-600/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-lg font-bold text-[#10b981] mb-2">Check Your Email</h2>
          <p className="text-sm text-[#94a3b8]">
            We sent a verification link to <strong className="text-[#e2e8f0]">{form.email}</strong>. Click it to activate your account.
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
        <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">Create Account</h1>
        <p className="text-sm text-[#475569] mb-5">Join the StreamZone community</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="streamzone_fan"
            />
            <p className="text-xs text-[#475569] mt-1">3–20 chars, letters, numbers, underscores only</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              required
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              placeholder="Repeat password"
            />
          </div>

          <p className="text-xs text-[#475569]">
            By registering, you agree to our community guidelines.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-[#475569] mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[#00d4ff] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
