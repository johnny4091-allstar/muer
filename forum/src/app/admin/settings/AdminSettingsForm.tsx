"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

const SETTING_FIELDS = [
  { key: "site_name", label: "Site Name", type: "text" },
  { key: "site_description", label: "Site Description", type: "text" },
  { key: "allow_registrations", label: "Allow New Registrations", type: "boolean" },
  { key: "require_email_verification", label: "Require Email Verification", type: "boolean" },
  { key: "maintenance_mode", label: "Maintenance Mode", type: "boolean" },
  { key: "posts_per_page", label: "Posts Per Page", type: "number" },
  { key: "max_attachment_size_mb", label: "Max Attachment Size (MB)", type: "number" },
  { key: "contact_email", label: "Contact Email", type: "email" },
];

export default function AdminSettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(settings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      } else {
        setError(data.error ?? "Failed to save settings.");
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
          {error}
        </div>
      )}
      {saved && (
        <div className="px-3 py-2 rounded-lg bg-green-900/20 border border-green-800/40 text-sm text-green-400">
          Settings saved successfully.
        </div>
      )}

      <div className="cyber-card p-5 flex flex-col gap-4">
        {SETTING_FIELDS.map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">{label}</label>
            {type === "boolean" ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      [key]: prev[key] === "true" ? "false" : "true",
                    }))
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    values[key] === "true" ? "bg-[#00d4ff]" : "bg-[#1e1e3a]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      values[key] === "true" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-[#94a3b8]">
                  {values[key] === "true" ? "Enabled" : "Disabled"}
                </span>
              </div>
            ) : (
              <input
                type={type}
                value={values[key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </form>
  );
}
