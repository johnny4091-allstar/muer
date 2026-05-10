"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export function useNotifications(userId?: string) {
  const { socket } = useSocket(userId);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread ?? 0);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    function onNotification(n: NotificationItem) {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    }

    socket.on("notification", onNotification);
    return () => { socket.off("notification", onNotification); };
  }, [socket]);

  async function markAllRead() {
    await fetch("/api/notifications/mark-read", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return { notifications, unreadCount, markAllRead };
}
