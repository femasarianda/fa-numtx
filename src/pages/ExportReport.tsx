import { useState } from "react";
import { Icon } from "@iconify/react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import DateRangePicker, { getDateRange } from "@/components/DateRangePicker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExportReport() {
  const [selectedPeriod, setSelectedPeriod] = useState("last_1_month");
  const [startDate, setStartDate] = useState(() => getDateRange("last_1_month").start);
  const [endDate, setEndDate] = useState(() => getDateRange("last_1_month").end);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["export-region-stats", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_detections")
        .select("region_name")
        .gte("detected_at", format(startDate, "yyyy-MM-dd"))
        .lte("detected_at", format(endDate, "yyyy-MM-dd") + "T23:59:59");
      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((d) => {
        const name = d.region_name || "Unknown";
        counts[name] = (counts[name] || 0) + 1;
      });
      const total = (data || []).length;
      const sorted = Object.entries(counts)
        .map(([name, value]) => ({ name, value, percentage: total > 0 ? (value / total) * 100 : 0 }))
        .sort((a, b) => b.value - a.value);
      return { regions: sorted, total };
    },
  });

  const handleDateApply = (period: string, start: Date, end: Date) => {
    setSelectedPeriod(period);
    setStartDate(start);
    setEndDate(end);
  };

  const generatePDF = () => {
    if (!data || data.regions.length === 0) {
      toast.error("Tidak ada data untuk dicetak");
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Statistik Kendaraan per Daerah", pageWidth / 2, 20, { align: "center" });

      // Period
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Periode: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`,
        pageWidth / 2, 30, { align: "center" }
      );

      // Total
      doc.setFontSize(10);
      doc.text(`Total Kendaraan: ${data.total}`, pageWidth / 2, 38, { align: "center" });

      // Table
      const tableData = data.regions.map((r, i) => [
        (i + 1).toString(),
        r.name,
        r.value.toLocaleString("id-ID"),
        `${r.percentage.toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: 45,
        head: [["No", "Daerah", "Jumlah", "Persentase"]],
        body: tableData,
        styles: { fontSize: 10, cellPadding: 4, halign: "center" },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
          1: { halign: "left", cellWidth: "auto" },
          2: { halign: "center", cellWidth: 30 },
          3: { halign: "center", cellWidth: 30 },
        },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        margin: { left: 20, right: 20 },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        pageWidth / 2, finalY + 15, { align: "center" }
      );

      doc.save(`laporan-daerah_${format(startDate, "yyyyMMdd")}-${format(endDate, "yyyyMMdd")}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };
  const fontHeader = { fontSize: "clamp(11px, 2.8vw, 13px)" };

  return (
    <Layout>
      <h1 className="font-bold text-foreground mb-4 md:mb-6" style={{ fontSize: "clamp(18px, 5vw, 24px)" }}>
        Export Report
      </h1>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>Cetak Laporan Daerah</CardTitle>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              selectedPeriod={selectedPeriod}
              onApply={handleDateApply}
            />
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-4 md:px-6 md:pb-6">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-muted-foreground" style={fontResponsive}>Gagal memuat data</p>
              <button onClick={() => refetch()} className="text-primary hover:underline" style={fontResponsive}>Coba lagi</button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : data && data.regions.length > 0 ? (
            <div className="space-y-4">
              {/* Preview list */}
              <div className="space-y-1.5">
                {data.regions.map((r, i) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-3 px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-semibold text-primary w-6 md:w-8 text-center flex-shrink-0" style={fontResponsive}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground truncate block" style={fontResponsive}>{r.name}</span>
                    </div>
                    <span className="text-foreground font-semibold flex-shrink-0" style={fontResponsive}>
                      {r.value.toLocaleString("id-ID")}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0 w-14 text-right" style={fontHeader}>
                      {r.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center px-3 md:px-4 pt-2 border-t border-border">
                <span className="font-semibold text-foreground" style={fontResponsive}>Total</span>
                <span className="font-bold text-primary" style={fontResponsive}>
                  {data.total.toLocaleString("id-ID")} kendaraan
                </span>
              </div>

              {/* Print button */}
              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="w-full gap-2"
                style={fontResponsive}
              >
                <Icon icon="mdi:file-pdf-box" className="w-5 h-5" />
                {isGenerating ? "Membuat PDF..." : "Cetak PDF"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Icon icon="mdi:file-document-outline" className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground" style={fontResponsive}>Tidak ada data pada periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
