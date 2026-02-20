import { useState } from "react";
import { Icon } from "@iconify/react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const PAGE_SIZE = 10;

export default function HistoricalReport() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["detections", search, page],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_detections")
        .select("id, vehicle_type, detected_at, plate_number, region_name", { count: "exact" })
        .order("detected_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(`plate_number.ilike.%${search}%,region_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], total: count || 0 };
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Historical Report</h1>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nomor polisi atau daerah..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle className="text-base">Jenis Kendaraan</CardTitle></CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">Gagal memuat data</p>
              <button onClick={() => refetch()} className="text-sm text-primary hover:underline">Coba lagi</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-3 px-3 font-medium">Jenis Kendaraan</th>
                    <th className="text-left py-3 px-3 font-medium">Waktu</th>
                    <th className="text-left py-3 px-3 font-medium">Nomor Polisi</th>
                    <th className="text-left py-3 px-3 font-medium">Daerah</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <td key={j} className="py-3 px-3"><Skeleton className="h-4 w-20" /></td>
                          ))}
                        </tr>
                      ))
                    : data?.rows.map((row) => (
                        <tr key={row.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-3 px-3">{row.vehicle_type || "-"}</td>
                          <td className="py-3 px-3">{row.detected_at ? format(new Date(row.detected_at), "HH:mm") : "-"}</td>
                          <td className="py-3 px-3 font-mono">{row.plate_number}</td>
                          <td className="py-3 px-3">{row.region_name || "-"}</td>
                        </tr>
                      ))}
                  {!isLoading && data?.rows.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                Next →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
