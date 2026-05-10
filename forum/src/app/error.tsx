"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen cyber-grid flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-900/20 border border-red-800/40 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-[#ef4444]" />
        </div>
        <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#475569] mb-6">{error.message || "An unexpected error occurred."}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-neon-blue px-5 py-2 rounded-lg text-sm font-semibold">
            Try Again
          </button>
          <Link href="/" className="px-5 py-2 rounded-lg text-sm bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
