import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#1e1e3a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text-blue-purple">StreamZone</span>
            </div>
            <p className="text-xs text-[#475569]">The Ultimate IPTV Community</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-3">Community</h4>
            <div className="flex flex-col gap-1.5">
              <FooterLink href="/" label="Home" />
              <FooterLink href="/categories/iptv-providers" label="Providers" />
              <FooterLink href="/playlists" label="Playlists" />
              <FooterLink href="/reviews" label="Reviews" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-3">Resources</h4>
            <div className="flex flex-col gap-1.5">
              <FooterLink href="/categories/tutorials" label="Tutorials" />
              <FooterLink href="/categories/addons-apps" label="Add-ons" />
              <FooterLink href="/categories/epg-guides" label="EPG Guides" />
              <FooterLink href="/leaderboard" label="Leaderboard" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475569] mb-3">Account</h4>
            <div className="flex flex-col gap-1.5">
              <FooterLink href="/login" label="Sign In" />
              <FooterLink href="/register" label="Register" />
              <FooterLink href="/search" label="Search" />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#1e1e3a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#475569]">
            © {new Date().getFullYear()} StreamZone. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" style={{ boxShadow: "0 0 6px #10b981" }} />
            <span className="text-xs text-[#475569]">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-xs text-[#475569] hover:text-[#00d4ff] transition-colors">
      {label}
    </Link>
  );
}
