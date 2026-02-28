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

  const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };
  const fontHeader = { fontSize: "clamp(11px, 2.8vw, 13px)" };

  return (
    <Layout>
      <h1
        className="font-bold text-foreground mb-4 md:mb-6"
        style={{ fontSize: "clamp(18px, 5vw, 24px)" }}
      >
        Export Report
      </h1>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
            Export
          </CardTitle>
        </CardHeader>

        <CardContent className="px-2 py-0 md:px-6 md:py-2">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-muted-foreground" style={fontResponsive}>
                Gagal memuat data
              </p>
              <button
                onClick={() => refetch()}
                className="text-primary hover:underline"
                style={fontResponsive}
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table className="w-full" style={{ minWidth: "280px" }}>
                <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th
                    className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold w-12 md:w-16"
                    style={fontHeader}
                  >
                    No
                  </th>
                  <th
                    className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold"
                    style={fontHeader}
                  >
                    Waktu & Tanggal
                  </th>
                  <th
                    className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold w-16 md:w-24"
                    style={fontHeader}
                  >
                    Unduh
                  </th>
                </tr>
                </thead>
                <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2.5 px-2 md:py-3 md:px-3">
                        <Skeleton className="h-3.5 w-6 md:h-4 md:w-8" />
                      </td>
                      <td className="py-2.5 px-2 md:py-3 md:px-3">
                        <Skeleton className="h-3.5 w-36 md:h-4 md:w-48" />
                      </td>
                      <td className="py-2.5 px-2 md:py-3 md:px-3">
                        <Skeleton className="h-7 w-7 md:h-8 md:w-8 rounded-full" />
                      </td>
                    </tr>
                  ))
                  : data?.map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td
                        className="py-2.5 px-2 md:py-3 md:px-3"
                        style={fontResponsive}
                      >
                        {i + 1}
                      </td>
                      <td
                        className="py-2.5 px-2 md:py-3 md:px-3"
                        style={fontResponsive}
                      >
                        {format(new Date(row.period_start), "dd/MM/yyyy")} -{" "}
                        {format(new Date(row.period_end), "dd/MM/yyyy")}
                      </td>
                      <td className="py-2.5 px-2 md:py-3 md:px-3">
                        <button
                          onClick={() => handleDownload(row.file_url)}
                          className="p-1.5 md:p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                          aria-label="Download file"
                        >
                          <Icon icon="mdi:download" className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                {!isLoading && data?.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                      style={fontResponsive}
                    >
                      Tidak ada data
                    </td>
                  </tr>
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