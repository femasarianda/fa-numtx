import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STREAM_URL = "https://stream.parkiranku.my.id/cctv/";
const STREAM_ORIGIN = "https://stream.parkiranku.my.id";
// Probe an image asset on the stream origin. Cloudflare 502 returns HTML,
// so Image.onerror fires when the upstream is down.
const PROBE_URL = `${STREAM_ORIGIN}/favicon.ico`;
const CHECK_INTERVAL_MS = 15000;

type Status = "checking" | "online" | "offline";

function checkStream(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    const timeout = setTimeout(() => finish(false), 5000);
    img.onload = () => {
      clearTimeout(timeout);
      finish(true);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      finish(false);
    };
    img.src = `${PROBE_URL}?_=${Date.now()}`;
  });
}

export default function VideoPlayer() {
  const [status, setStatus] = useState<Status>("checking");
  const [retryNonce, setRetryNonce] = useState(0);
  const statusRef = useRef<Status>("checking");
  statusRef.current = status;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Don't disrupt a working stream.
      if (statusRef.current === "online") return;
      const ok = await checkStream();
      if (cancelled) return;
      setStatus(ok ? "online" : "offline");
    };

    // Initial check (force checking state on manual retry)
    setStatus("checking");
    run();

    const id = window.setInterval(run, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [retryNonce]);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
            Video Kendaraan
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span
              className={
                "w-2 h-2 rounded-full " +
                (status === "online"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "checking"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-destructive")
              }
            />
            <span
              className="text-muted-foreground font-medium"
              style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}
            >
              {status === "online" ? "Live" : status === "checking" ? "Menghubungkan" : "Offline"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          {status === "online" ? (
            <iframe
              src={STREAM_URL}
              className="w-full h-full bg-black"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ border: "none" }}
              title="Video Kendaraan"
            />
          ) : (
            <OfflineState
              status={status}
              onRetry={() => setRetryNonce((n) => n + 1)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OfflineState({
  status,
  onRetry,
}: {
  status: Status;
  onRetry: () => void;
}) {
  const isChecking = status === "checking";
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.18),transparent_60%)]" />
      <div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        style={{ animation: "vp-scan 3.2s linear infinite", top: "-2px" }}
      />

      <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-4 md:px-6">
        <div className="relative mb-3 md:mb-4">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
          <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center">
            <Icon
              icon={isChecking ? "mdi:cctv" : "mdi:cctv-off"}
              className={
                "w-6 h-6 md:w-8 md:h-8 text-white/90 " +
                (isChecking ? "animate-pulse" : "")
              }
            />
          </div>
        </div>

        <p className="font-semibold text-white" style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
          {isChecking ? "Menghubungkan ke kamera…" : "Kamera tidak terhubung"}
        </p>
        <p
          className="mt-1 text-white/60 max-w-[260px] md:max-w-xs"
          style={{ fontSize: "clamp(11px, 2.8vw, 13px)" }}
        >
          {isChecking
            ? "Mencoba mendapatkan sinyal streaming."
            : "Sinyal streaming tidak tersedia saat ini. Sistem akan otomatis mencoba kembali."}
        </p>

        {!isChecking && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors backdrop-blur-sm"
            style={{ fontSize: "clamp(11px, 2.8vw, 13px)" }}
          >
            <Icon icon="mdi:refresh" className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Coba lagi
          </button>
        )}
      </div>

      <style>{`
        @keyframes vp-scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}
