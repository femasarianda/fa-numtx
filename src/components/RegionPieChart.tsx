import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { useState } from "react";

const COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF", "#8B5CF6", "#7C3AED"];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

export default function RegionPieChart() {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["region-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_region_stats")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle className="text-base">Informasi Kendaraan</CardTitle></CardHeader>
        <CardContent><Skeleton className="w-full h-[300px] rounded-lg" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle className="text-base">Informasi Kendaraan</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">Gagal memuat data</p>
          <button onClick={() => refetch()} className="text-sm text-primary hover:underline">Coba lagi</button>
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || []).map((d) => ({
    name: d.region_name || "Unknown",
    value: Number(d.total) || 0,
    percentage: Number(d.percentage) || 0,
  }));

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader><CardTitle className="text-base">Informasi Kendaraan</CardTitle></CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        ) : (
          // py-6 untuk tambah space atas bawah supaya label persentase tidak terpotong
          <div className="py-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ percentage }) => `${percentage.toFixed(1)}%`}
                  labelLine={false}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  onClick={(_, index) =>
                    setActiveIndex(activeIndex === index ? undefined : index)
                  }
                  style={{ outline: "none", cursor: "pointer" }}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ outline: "none" }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
