"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react";

export default function Setup2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (data.qrCode && data.secret) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("verify");
      } else {
        setError("Failed to generate 2FA secret.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  async function verifyToken() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/?2fa=enabled");
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="cyber-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#e2e8f0]">Two-Factor Auth</h1>
            <p className="text-xs text-[#475569]">Secure your account with TOTP</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === "setup" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#94a3b8]">
              Two-factor authentication adds an extra layer of security to your account.
              You&apos;ll need an authenticator app like Google Authenticator or Authy.
            </p>
            <button
              onClick={startSetup}
              disabled={loading}
              className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Set Up 2FA
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#94a3b8]">
              Scan this QR code with your authenticator app:
            </p>
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-[#0a0a0f] rounded-lg border border-[#1e1e3a]">
              <code className="flex-1 text-xs text-[#00d4ff] font-mono truncate">{secret}</code>
              <button onClick={copySecret} className="text-[#475569] hover:text-[#94a3b8] transition-colors">
                {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-[#475569]">
              Or enter the secret key manually if you can&apos;t scan the QR code.
            </p>
            <div>
              <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">
                Enter 6-digit code from your app
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-2 cyber-input text-sm rounded-lg text-center tracking-widest text-lg"
              />
            </div>
            <button
              onClick={verifyToken}
              disabled={loading || token.length !== 6}
              className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify & Enable
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
