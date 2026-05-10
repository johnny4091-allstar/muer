"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

export function useSocket(userId?: string) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    if (!globalSocket) {
      globalSocket = io(window.location.origin, {
        auth: { userId },
        path: "/socket.io",
        transports: ["websocket", "polling"],
      });
    }

    socketRef.current = globalSocket;

    globalSocket.on("connect", () => setConnected(true));
    globalSocket.on("disconnect", () => setConnected(false));

    if (globalSocket.connected) setConnected(true);

    return () => {
      globalSocket?.off("connect");
      globalSocket?.off("disconnect");
    };
  }, [userId]);

  return { socket: socketRef.current, connected };
}
