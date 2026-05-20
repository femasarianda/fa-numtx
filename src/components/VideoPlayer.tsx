import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STREAM_URL = "https://stream.parkiranku.my.id/cctv/";

export default function VideoPlayer() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4">
        <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
          Video Kendaraan
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
        <iframe
          src={STREAM_URL}
          className="w-full aspect-video rounded-lg bg-black"
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ border: "none" }}
          title="Video Kendaraan"
        />
      </CardContent>
    </Card>
  );
}
