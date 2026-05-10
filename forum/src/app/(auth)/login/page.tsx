"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        res.error === "Email not verified"
          ? "Please verify your email before signing in."
          : res.error === "Account banned"
          ? "Your account has been banned."
          : "Invalid email or password."
      );
    } else {
      const callbackUrl = params.get("callbackUrl") ?? "/";
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="cyber-card p-6">
      <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">Sign In</h1>
      <p className="text-sm text-[#475569] mb-5">Welcome back to StreamZone</p>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#94a3b8]">Password</label>
            <Link href="/forgot-password" className="text-xs text-[#00d4ff] hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[#1e1e3a]" />
        <span className="text-xs text-[#475569]">or continue with</span>
        <div className="flex-1 h-px bg-[#1e1e3a]" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#141428] border border-[#1e1e3a] text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d2d5a] transition-colors"
        >
          <Mail className="w-4 h-4" />
          Google
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#141428] border border-[#1e1e3a] text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d2d5a] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
          GitHub
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<div className="cyber-card p-6 text-center text-[#475569]">Loading…</div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-[#475569] mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#00d4ff] hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  );
}
