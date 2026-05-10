import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function slugifyStr(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function getReputationLevel(reputation: number): {
  level: number;
  title: string;
  color: string;
  next: number;
} {
  if (reputation >= 5000) return { level: 5, title: "Legend", color: "#ec4899", next: Infinity };
  if (reputation >= 2000) return { level: 4, title: "Veteran", color: "#f59e0b", next: 5000 };
  if (reputation >= 500)  return { level: 3, title: "Regular", color: "#06b6d4", next: 2000 };
  if (reputation >= 100)  return { level: 2, title: "Member", color: "#a855f7", next: 500 };
  return { level: 1, title: "Newcomer", color: "#94a3b8", next: 100 };
}
