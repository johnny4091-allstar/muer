"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Zap, Search, Bell, LogOut, User, Settings, Shield,
  ChevronDown, Menu, X, MessageSquare
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-[#1e1e3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text-blue-purple hidden sm:block">StreamZone</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              type="text"
              placeholder="Search threads, posts, users…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 cyber-input text-sm rounded-full"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {session?.user ? (
            <>
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-lg text-[#94a3b8] hover:text-[#00d4ff] hover:bg-[#141428] transition-colors"
              >
                <Bell className="w-5 h-5" />
              </Link>

              {/* Messages */}
              <Link
                href="/messages"
                className="p-2 rounded-lg text-[#94a3b8] hover:text-[#a855f7] hover:bg-[#141428] transition-colors hidden sm:flex"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* User menu */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-[#141428] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {session.user.name ? getInitials(session.user.name) : "?"}
                  </div>
                  <span className="text-sm text-[#e2e8f0] hidden sm:block max-w-[100px] truncate">
                    {session.user.username || session.user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#475569]" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 cyber-card py-1 z-50">
                    <Link
                      href={`/profile/${session.user.username}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#141428] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#141428] transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#a855f7] hover:bg-[#141428] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-[#1e1e3a] my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:bg-[#141428] transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-medium btn-neon-blue rounded-lg"
              >
                Join Free
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-2 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#141428] md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-[#1e1e3a]">
          <form onSubmit={handleSearch} className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 cyber-input text-sm rounded-lg"
              />
            </div>
          </form>
        </div>
      )}
    </nav>
  );
}
