import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VideoPlayer = lazy(() => import("@/components/VideoPlayer"));
const RegionPieChart = lazy(() => import("@/components/RegionPieChart"));

const CardSkeleton = () => (
  <Card className="rounded-xl shadow-sm">
    <CardHeader><CardTitle className="text-base"><Skeleton className="h-5 w-40" /></CardTitle></CardHeader>
    <CardContent><Skeleton className="w-full h-[300px] rounded-lg" /></CardContent>
  </Card>
);

export default function Dashboard() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
