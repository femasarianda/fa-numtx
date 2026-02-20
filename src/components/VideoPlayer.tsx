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

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle className="text-base">Video Kendaraan</CardTitle></CardHeader>
        <CardContent><Skeleton className="w-full aspect-video rounded-lg" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle className="text-base">Video Kendaraan</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">Gagal memuat kamera</p>
          <button onClick={() => refetch()} className="text-sm text-primary hover:underline">Coba lagi</button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader><CardTitle className="text-base">Video Kendaraan</CardTitle></CardHeader>
      <CardContent>
        {camera?.stream_url ? (
          <div className="space-y-3">
            <video
              ref={videoRef}
              src={camera.stream_url}
              className="w-full aspect-video rounded-lg bg-black object-cover"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => skip(-30)} className="text-muted-foreground hover:text-foreground"><Icon icon="mdi:rewind" className="w-6 h-6" /></button>
              <button onClick={() => skip(-10)} className="text-muted-foreground hover:text-foreground"><Icon icon="mdi:skip-previous" className="w-6 h-6" /></button>
              <button onClick={togglePlay} className="bg-primary text-primary-foreground rounded-full p-2 hover:opacity-90">
                <Icon icon={playing ? "mdi:pause" : "mdi:play"} className="w-6 h-6" />
              </button>
              <button onClick={() => skip(10)} className="text-muted-foreground hover:text-foreground"><Icon icon="mdi:skip-next" className="w-6 h-6" /></button>
              <button onClick={() => skip(30)} className="text-muted-foreground hover:text-foreground"><Icon icon="mdi:fast-forward" className="w-6 h-6" /></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center aspect-video rounded-lg bg-muted text-muted-foreground gap-2">
            <Icon icon="mdi:video-off-outline" className="w-12 h-12" />
            <p className="text-sm">Tidak ada stream tersedia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
