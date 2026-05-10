"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, Star, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { key: "reliabilityRating", label: "Reliability & Uptime" },
  { key: "contentRating", label: "Content Quality" },
  { key: "priceRating", label: "Value for Money" },
  { key: "supportRating", label: "Customer Support" },
] as const;

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className="w-6 h-6"
            color={(hovered || value) >= star ? "#f59e0b" : "#1e1e3a"}
            fill={(hovered || value) >= star ? "#f59e0b" : "transparent"}
          />
        </button>
      ))}
    </div>
  );
}

export default function SubmitReviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [providerName, setProviderName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ratings, setRatings] = useState({
    reliabilityRating: 0,
    contentRating: 0,
    priceRating: 0,
    supportRating: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return null;
  if (!session) {
    return (
      <div className="max-w-lg cyber-card p-8 text-center">
        <p className="text-[#94a3b8] mb-4">You must be signed in to submit a review.</p>
        <Link href="/login" className="btn-neon-blue px-5 py-2 rounded-lg text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const overallRating =
    Object.values(ratings).every((v) => v > 0)
      ? Math.round((Object.values(ratings).reduce((a, b) => a + b, 0) / 4) * 10) / 10
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.values(ratings).some((v) => v === 0)) {
      setError("Please rate all categories before submitting.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerName, title, body: content, ...ratings, overallRating }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/reviews?submitted=1");
      } else {
        setError(data.error ?? "Failed to submit review.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#475569]">
        <Link href="/" className="hover:text-[#94a3b8] transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/reviews" className="hover:text-[#94a3b8] transition-colors">Reviews</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#94a3b8]">Submit Review</span>
      </nav>

      <div className="cyber-card p-6">
        <h1 className="text-xl font-bold text-[#e2e8f0] mb-1">Submit Provider Review</h1>
        <p className="text-sm text-[#475569] mb-6">
          Share your experience with an IPTV provider to help the community.
        </p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/40 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">
              Provider Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              required
              placeholder="e.g. StreamFast Pro"
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">
              Review Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg"
            />
          </div>

          {/* Star ratings */}
          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-3">
              Ratings <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-3">
              {CATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-[#94a3b8]">{label}</span>
                  <StarRating
                    value={ratings[key]}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
              {overallRating > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-[#1e1e3a]">
                  <span className="text-sm font-semibold text-[#e2e8f0]">Overall</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" color="#f59e0b" fill="#f59e0b" />
                    <span className="text-lg font-bold" style={{ color: "#f59e0b" }}>
                      {overallRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#94a3b8] block mb-1.5">
              Detailed Review <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              placeholder="Share your detailed experience — channels, stability, customer service, pricing, etc."
              className="w-full px-3 py-2 cyber-input text-sm rounded-lg resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 btn-neon-blue rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Review
            </button>
            <Link
              href="/reviews"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#141428] border border-[#1e1e3a] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#2d2d5a] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
