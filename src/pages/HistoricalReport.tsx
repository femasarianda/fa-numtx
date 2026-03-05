import { useState } from "react";
import { Icon } from "@iconify/react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import DateRangePicker, { getDateRange } from "@/components/DateRangePicker";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getPaginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const left = current - 1;
  const right = current + 1;
  pages.push(1);
  if (left > 2) pages.push("...");
  if (left > 1) pages.push(left);
  if (current !== 1 && current !== total) pages.push(current);
  if (right < total) pages.push(right);
  if (right < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export default function HistoricalReport() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedPeriod, setSelectedPeriod] = useState("last_1_month");
  const [startDate, setStartDate] = useState(() => getDateRange("last_1_month").start);
  const [endDate, setEndDate] = useState(() => getDateRange("last_1_month").end);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["detections", search, page, pageSize, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_detections")
        .select("id, vehicle_type, detected_at, plate_number, region_name", { count: "exact" })
        .gte("detected_at", format(startDate, "yyyy-MM-dd"))
        .lte("detected_at", format(endDate, "yyyy-MM-dd") + "T23:59:59")
        .order("detected_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search.trim()) {
        query = query.or(`plate_number.ilike.%${search}%,region_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], total: count || 0 };
    },
  });

  const handleDateApply = (period: string, start: Date, end: Date) => {
    setSelectedPeriod(period);
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const currentPage = page + 1;
  const paginationPages = getPaginationPages(currentPage, totalPages);

  const goToPage = (p: number) => {
    if (p < 0 || p >= totalPages) return;
    setPage(p);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };
  const fontHeader = { fontSize: "clamp(11px, 2.8vw, 13px)" };

  const startRow = data && data.total > 0 ? page * pageSize + 1 : 0;
  const endRow = data ? Math.min((page + 1) * pageSize, data.total) : 0;

  return (
    <Layout>
      <h1 className="font-bold text-foreground mb-4 md:mb-6" style={{ fontSize: "clamp(18px, 5vw, 24px)" }}>
        Historical Report
      </h1>

      {/* Search bar + Date picker */}
      <div className="mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
        <div className="relative flex-1 md:max-w-md">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Nomor polisi atau daerah..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-xl border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={fontResponsive}
          />
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          selectedPeriod={selectedPeriod}
          onApply={handleDateApply}
        />
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 pb-2 md:px-6 md:py-4 md:pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>Tabel Historical</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground whitespace-nowrap" style={fontHeader}>Baris per halaman:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="appearance-none border border-input bg-card text-foreground rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:bg-accent transition-colors"
                  style={fontResponsive}
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Icon icon="mdi:chevron-down" className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 py-0 md:px-6 md:py-2">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-muted-foreground" style={fontResponsive}>Gagal memuat data</p>
              <button onClick={() => refetch()} className="text-primary hover:underline" style={fontResponsive}>Coba lagi</button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table className="w-full" style={{ minWidth: "400px" }}>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold" style={fontHeader}>Jenis</th>
                    <th className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold" style={fontHeader}>Tanggal</th>
                    <th className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold" style={fontHeader}>Waktu</th>
                    <th className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold" style={fontHeader}>Nomor Polisi</th>
                    <th className="text-left py-2.5 px-2 md:py-3 md:px-3 font-semibold" style={fontHeader}>Daerah</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: pageSize }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="py-2.5 px-2 md:py-3 md:px-3">
                              <Skeleton className="h-3.5 w-16 md:h-4 md:w-20" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.rows.map((row) => (
                        <tr key={row.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                          <td className="py-2.5 px-2 md:py-3 md:px-3" style={fontResponsive}>{row.vehicle_type || "-"}</td>
                          <td className="py-2.5 px-2 md:py-3 md:px-3" style={fontResponsive}>
                            {row.detected_at ? format(new Date(row.detected_at), "dd/MM/yyyy") : "-"}
                          </td>
                          <td className="py-2.5 px-2 md:py-3 md:px-3" style={fontResponsive}>
                            {row.detected_at ? format(new Date(row.detected_at), "HH:mm") : "-"}
                          </td>
                          <td className="py-2.5 px-2 md:py-3 md:px-3 font-mono" style={fontResponsive}>{row.plate_number}</td>
                          <td className="py-2.5 px-2 md:py-3 md:px-3" style={fontResponsive}>{row.region_name || "-"}</td>
                        </tr>
                      ))}
                  {!isLoading && data?.rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground" style={fontResponsive}>Tidak ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex flex-col gap-2.5 mt-3 pt-3 pb-3 md:mt-4 md:pt-4 md:pb-2 border-t border-border">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-muted-foreground" style={fontHeader}>
                  {startRow}–{endRow} dari {data?.total} data
                </span>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <button
                    disabled={page === 0}
                    onClick={() => goToPage(page - 1)}
                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <Icon icon="mdi:chevron-left" className="w-4 h-4" />
                  </button>
                  {paginationPages.map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 text-muted-foreground select-none" style={fontHeader}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage((p as number) - 1)}
                        className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border transition-colors font-medium ${
                          currentPage === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent text-foreground"
                        }`}
                        style={fontHeader}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => goToPage(page + 1)}
                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Halaman berikutnya"
                  >
                    <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {totalPages > 7 && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-muted-foreground whitespace-nowrap" style={fontHeader}>Pergi ke halaman:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={currentPage}
                    key={currentPage}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseInt((e.target as HTMLInputElement).value);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) goToPage(val - 1);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) goToPage(val - 1);
                    }}
                    className="w-14 text-center border border-input bg-card text-foreground rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    style={fontResponsive}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
