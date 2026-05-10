import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen cyber-grid flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black gradient-text-blue-purple mb-4 neon-text-animate">404</div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-[#00d4ff]" />
          <span className="text-xl font-bold text-[#e2e8f0]">Page Not Found</span>
        </div>
        <p className="text-[#475569] mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="btn-neon-blue px-6 py-2.5 rounded-lg font-semibold inline-block">
          Back to StreamZone
        </Link>
      </div>
    </div>
  );
}
