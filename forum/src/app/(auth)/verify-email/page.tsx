"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => setStatus(r.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="cyber-card p-6 text-center">
      {status === "loading" && (
        <>
          <div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">Verifying your email…</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-lg font-bold text-[#10b981] mb-2">Email Verified!</h2>
          <p className="text-sm text-[#94a3b8] mb-4">Your account is active. You can now sign in.</p>
          <Link href="/login" className="btn-neon-blue px-6 py-2 rounded-lg text-sm font-semibold inline-block">
            Sign In
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Verification Failed</h2>
          <p className="text-sm text-[#94a3b8] mb-4">This link may be expired or invalid.</p>
          <Link href="/register" className="text-[#00d4ff] hover:underline text-sm">
            Back to Register
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm">
      <Suspense fallback={<div className="cyber-card p-6 text-center text-[#475569]">Loading…</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
