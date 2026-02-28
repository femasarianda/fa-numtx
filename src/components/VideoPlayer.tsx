import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const { data: camera, isLoading, error, refetch } = useQuery({
    queryKey: ["active-camera"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cameras")
        .select("stream_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  // Shared responsive font style (same pattern as HistoricalReport)
  const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
            Video Kendaraan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
          <Skeleton className="w-full aspect-video rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
            Video Kendaraan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-6 md:pb-6 flex flex-col items-center gap-3 py-6 md:py-8">
          <p className="text-muted-foreground" style={fontResponsive}>
            Gagal memuat kamera
          </p>
          <button
            onClick={() => refetch()}
            className="text-primary hover:underline"
            style={fontResponsive}
          >
            Coba lagi
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4">
        <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
          Video Kendaraan
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
        {camera?.stream_url ? (
          <div className="space-y-2.5 md:space-y-3">
            <video
              ref={videoRef}
              src={camera.stream_url}
              className="w-full aspect-video rounded-lg bg-black object-cover"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <button
                onClick={() => skip(-30)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Mundur 30 detik"
              >
                <Icon icon="mdi:rewind" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={() => skip(-10)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Mundur 10 detik"
              >
                <Icon icon="mdi:skip-previous" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={togglePlay}
                className="bg-primary text-primary-foreground rounded-full p-1.5 md:p-2 hover:opacity-90 transition-opacity"
                aria-label={playing ? "Pause" : "Play"}
              >
                <Icon
                  icon={playing ? "mdi:pause" : "mdi:play"}
                  className="w-5 h-5 md:w-6 md:h-6"
                />
              </button>
              <button
                onClick={() => skip(10)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Maju 10 detik"
              >
                <Icon icon="mdi:skip-next" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={() => skip(30)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Maju 30 detik"
              >
                <Icon icon="mdi:fast-forward" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center aspect-video rounded-lg bg-muted text-muted-foreground gap-2">
            <Icon icon="mdi:video-off-outline" className="w-9 h-9 md:w-12 md:h-12" />
            <p style={fontResponsive}>Tidak ada stream tersedia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}