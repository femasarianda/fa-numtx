import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VideoPlayer = lazy(() => import("@/components/VideoPlayer"));
const RegionPieChart = lazy(() => import("@/components/RegionPieChart"));

const CardSkeleton = () => (
  <Card className="rounded-xl shadow-sm">
    <CardHeader className="px-3 py-3 md:px-6 md:py-4">
      <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
        <Skeleton className="h-4 w-32 md:h-5 md:w-40" />
      </CardTitle>
    </CardHeader>
    <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
      <Skeleton className="w-full h-[200px] md:h-[300px] rounded-lg" />
    </CardContent>
  </Card>
);

export default function Dashboard() {
  return (
    <Layout>
      <h1
        className="font-bold text-foreground mb-4 md:mb-6"
        style={{ fontSize: "clamp(18px, 5vw, 24px)" }}
      >
        Dashboard
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        <Suspense fallback={<CardSkeleton />}>
          <VideoPlayer />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <RegionPieChart />
        </Suspense>
      </div>
    </Layout>
  );
}