import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/shared/SessionProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "StreamZone — The Ultimate IPTV Community",
    template: "%s | StreamZone",
  },
  description:
    "StreamZone is the ultimate IPTV community forum. Discuss providers, share playlists, review add-ons, and connect with the IPTV community.",
  keywords: ["IPTV", "streaming", "M3U", "playlists", "Kodi", "Tivimate", "forum", "community"],
  openGraph: {
    type: "website",
    siteName: "StreamZone",
    images: ["/og-default.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0a0a0f] text-[#e2e8f0] antialiased`}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
