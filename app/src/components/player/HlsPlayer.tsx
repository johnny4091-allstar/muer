"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface HlsPlayerProps {
  src: string;
  onFreeze?: () => void;
  onError?: (type: string) => void;
  className?: string;
}

export function HlsPlayer({ src, onFreeze, onError, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<unknown>(null);
  const lastTimeRef = useRef<number>(0);
  const frozenCountRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");

  const destroy = useCallback(() => {
    if (hlsRef.current) {
      (hlsRef.current as { destroy: () => void }).destroy();
      hlsRef.current = null;
    }
  }, []);

  const loadSrc = useCallback(
    async (url: string) => {
      const video = videoRef.current;
      if (!video) return;

      destroy();
      setStatus("loading");

      const Hls = (await import("hls.js")).default;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => null);
          setStatus("playing");
          retryCountRef.current = 0;
        });

        hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal?: boolean; type?: string }) => {
          if (data.fatal) {
            onError?.(data.type || "PLAYBACK_FAILED");
            handleRetry(url);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(() => null);
        setStatus("playing");
      } else {
        setStatus("error");
        onError?.("PLAYBACK_FAILED");
      }
    },
    [destroy, onError]
  );

  function handleRetry(url: string) {
    const maxRetries = 6;
    if (retryCountRef.current >= maxRetries) {
      setStatus("error");
      onError?.("NUCLEAR_RECOVERY");
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
    retryCountRef.current++;
    setTimeout(() => loadSrc(url), delay);
  }

  // Freeze detection: poll currentTime every 2 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (video.paused || video.ended || status !== "playing") {
        frozenCountRef.current = 0;
        return;
      }
      if (video.currentTime === lastTimeRef.current) {
        frozenCountRef.current++;
        if (frozenCountRef.current >= 3) {
          frozenCountRef.current = 0;
          onFreeze?.();
          handleRetry(src);
        }
      } else {
        frozenCountRef.current = 0;
        lastTimeRef.current = video.currentTime;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [src, status, onFreeze]);

  useEffect(() => {
    if (src) loadSrc(src);
    return () => destroy();
  }, [src, loadSrc, destroy]);

  return (
    <div className={`relative bg-black ${className}`}>
      <video ref={videoRef} className="w-full h-full" controls playsInline />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-white text-sm">Stream unavailable</p>
        </div>
      )}
    </div>
  );
}
