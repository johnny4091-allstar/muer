import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { Star, Plus, CheckCircle } from "lucide-react";

export const metadata = { title: "Provider Reviews | StreamZone" };

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          fill={i <= Math.round(value) ? "#f59e0b" : "none"}
          stroke={i <= Math.round(value) ? "#f59e0b" : "#475569"}
        />
      ))}
      <span className="text-xs text-[#475569] ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

export default async function ReviewsPage() {
  const session = await auth();

  const reviews = await prisma.review.findMany({
    include: { author: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const providers = [...new Set(reviews.map((r) => r.providerName))];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
            <Star className="w-6 h-6 text-[#f59e0b]" />
            Provider Reviews
          </h1>
          <p className="text-sm text-[#475569] mt-1">Honest reviews from the community</p>
        </div>
        {session?.user && (
          <Link href="/reviews/submit" className="btn-neon-blue px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Write Review
          </Link>
        )}
      </div>

      {/* Provider summary cards */}
      {providers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {providers.slice(0, 6).map((provider) => {
            const providerReviews = reviews.filter((r) => r.providerName === provider);
            const avg = providerReviews.reduce((a, r) => a + r.overallRating, 0) / providerReviews.length;
            return (
              <div key={provider} className="cyber-card p-3">
                <div className="font-semibold text-[#e2e8f0] text-sm truncate">{provider}</div>
                <StarRating value={avg} />
                <div className="text-xs text-[#475569] mt-1">{providerReviews.length} reviews</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review list */}
      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div key={review.id} className="cyber-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#e2e8f0]">{review.providerName}</span>
                  {review.isVerified && (
                    <span className="badge-neon badge-green flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" />Verified
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-[#94a3b8] text-sm mb-1">{review.title}</h3>
                <StarRating value={review.overallRating} />
                <p className="text-sm text-[#94a3b8] mt-2 line-clamp-3">{review.body}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[
                    ["Reliability", review.reliabilityRating],
                    ["Content", review.contentRating],
                    ["Price", review.priceRating],
                    ["Support", review.supportRating],
                  ].map(([label, val]) => (
                    <div key={label as string} className="text-xs">
                      <div className="text-[#475569]">{label}</div>
                      <StarRating value={val as number} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-[#475569] border-t border-[#1e1e3a] pt-2">
              <span>by {review.author.username}</span>
              <span>{formatRelativeTime(review.createdAt)}</span>
              <span className="ml-auto">{review.helpfulCount} found helpful</span>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="cyber-card p-10 text-center text-[#475569]">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No reviews yet. Share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );
}
