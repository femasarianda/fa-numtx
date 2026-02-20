import { Icon } from "@iconify/react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ExportReport() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["weekly-exports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_exports")
        .select("*")
        .order("period_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const handleDownload = (url: string | null) => {
    if (!url) {
      toast.error("File tidak tersedia");
      return;
    }
    window.open(url, "_blank");
    toast.success("Download dimulai");
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Export Report</h1>

      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle className="text-base">Export</CardTitle></CardHeader>
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
                    <th className="text-left py-3 px-3 font-medium w-16">No</th>
                    <th className="text-left py-3 px-3 font-medium">Waktu & Tanggal</th>
                    <th className="text-left py-3 px-3 font-medium w-24">Unduh</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="py-3 px-3"><Skeleton className="h-4 w-8" /></td>
                          <td className="py-3 px-3"><Skeleton className="h-4 w-48" /></td>
                          <td className="py-3 px-3"><Skeleton className="h-8 w-8 rounded-full" /></td>
                        </tr>
                      ))
                    : data?.map((row, i) => (
                        <tr key={row.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-3 px-3">{i + 1}</td>
                          <td className="py-3 px-3">
                            {format(new Date(row.period_start), "dd/MM/yyyy")} - {format(new Date(row.period_end), "dd/MM/yyyy")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleDownload(row.file_url)}
                              className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                            >
                              <Icon icon="mdi:download" className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  {!isLoading && data?.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
