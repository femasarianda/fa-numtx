import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import DateRangePicker, { getDateRange } from "@/components/DateRangePicker";

const COLORS = [
  "#A5B4FC", "#818CF8", "#6366F1", "#4F46E5", "#4338CA",
  "#5B21B6", "#6D28D9", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD",
];

function getColorIndex(index: number, total: number): number {
  const len = COLORS.length;
  if (index < len) return index;
  if (index >= len && index < len + 2) return (index - len) + 2;
  return index % len;
}

const renderActiveShape = (props: {
  cx: number; cy: number; innerRadius: number; outerRadius: number;
  startAngle: number; endAngle: number; fill: string;
}) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
            startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="none" />
  );
};

interface TooltipData {
  name: string;
  value: number;
  percentage: number;
}

export default function RegionPieChart() {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const activeIndexRef = useRef<number | undefined>(undefined);

  const lastToggleTimeRef = useRef<number>(0);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const didScrollRef = useRef(false);

  const [isMobile, setIsMobile] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("last_1_month");
  const [startDate, setStartDate] = useState(() => getDateRange("last_1_month").start);
  const [endDate, setEndDate] = useState(() => getDateRange("last_1_month").end);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartDataRef = useRef<TooltipData[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const resetActiveSlice = useCallback(() => {
    if (activeIndexRef.current === undefined) return;
    activeIndexRef.current = undefined;
    setActiveIndex(undefined);
    setTooltipData(null);
  }, []);

  const resetFromScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 300) return;
    resetActiveSlice();
  }, [resetActiveSlice]);

  const activateSlice = useCallback((index: number) => {
    if (!chartDataRef.current[index]) return;
    activeIndexRef.current = index;
    setActiveIndex(index);
    setTooltipData(chartDataRef.current[index]);
  }, []);

  const toggleSlice = useCallback((index: number) => {
    lastToggleTimeRef.current = Date.now();
    if (activeIndexRef.current === index) {
      resetActiveSlice();
    } else {
      activateSlice(index);
    }
  }, [activateSlice, resetActiveSlice]);

  useEffect(() => {
    const onScroll = () => resetFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true });
    window.visualViewport?.addEventListener("scroll", onScroll);
    const matched: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const s = window.getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && el !== document.body) {
        el.addEventListener("scroll", onScroll, { passive: true });
        matched.push(el);
      }
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      matched.forEach((el) => el.removeEventListener("scroll", onScroll));
    };
  }, [resetFromScroll]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      didScrollRef.current = false;
      const container = chartContainerRef.current;
      if (container && !container.contains(e.target as Node)) {
        resetFromScroll();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current);
      const dx = Math.abs(e.touches[0].clientX - touchStartXRef.current);
      if (dy > 8 || dx > 8) {
        didScrollRef.current = true;
        resetFromScroll();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [resetFromScroll]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const container = chartContainerRef.current;
      if (container && !container.contains(e.target as Node)) {
        resetActiveSlice();
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [resetActiveSlice]);

  const handleDateApply = (period: string, start: Date, end: Date) => {
    setSelectedPeriod(period);
    setStartDate(start);
    setEndDate(end);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["vehicle-detections-by-region", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_detections")
        .select("region_name")
        .gte("detected_at", format(startDate, "yyyy-MM-dd"))
        .lte("detected_at", format(endDate, "yyyy-MM-dd") + "T23:59:59");
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      const name = d.region_name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    const total = data.length;
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, percentage: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  useEffect(() => {
    chartDataRef.current = chartData;
    resetActiveSlice();
  }, [chartData, resetActiveSlice]);

  const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>Informasi Kendaraan</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
          <Skeleton className="w-full h-[260px] md:h-[300px] rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>Informasi Kendaraan</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-6 md:pb-6 flex flex-col items-center gap-3 py-6 md:py-8">
          <p className="text-muted-foreground" style={fontResponsive}>Gagal memuat data</p>
          <button onClick={() => refetch()} className="text-primary hover:underline" style={fontResponsive}>Coba lagi</button>
        </CardContent>
      </Card>
    );
  }

  const outerRadius = typeof window !== "undefined" && window.innerWidth >= 768 ? 115 : 95;
  const labelRadius = (typeof window !== "undefined" && window.innerWidth >= 768 ? 110 : 90) + 25;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4 pb-0">
        <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>Informasi Kendaraan</CardTitle>
      </CardHeader>

      <div className="flex justify-center px-3 pt-3 pb-0 md:px-6 md:pt-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          selectedPeriod={selectedPeriod}
          onApply={handleDateApply}
        />
      </div>

      <div ref={chartContainerRef}>
        <div className="px-3 pt-1.5 pb-0 md:px-6 relative" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center pt-6 pb-8" style={fontResponsive}>Belum ada data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={outerRadius * 2 + 70}>
                <PieChart margin={{ top: 30, right: 50, bottom: 30, left: 50 }} accessibilityLayer={false}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={outerRadius}
                    dataKey="value"
                    stroke="none"
                    label={({ percentage, cx, cy, midAngle, index }) => {
                      const RADIAN = Math.PI / 180;
                      const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
                      const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x} y={y}
                          fill={activeIndex === index ? "hsl(var(--primary))" : "#000000"}
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{
                            fontSize: "clamp(11px, 2.8vw, 14px)",
                            fontWeight: activeIndex === index ? 700 : 500,
                            cursor: "pointer",
                          }}
                          onMouseEnter={() => { if (!isMobile) activateSlice(index); }}
                          onMouseLeave={() => { if (!isMobile) resetActiveSlice(); }}
                          onTouchEnd={() => {
                            if (!isMobile) return;
                            if (didScrollRef.current) return;
                            toggleSlice(index);
                          }}
                        >
                          {`${percentage.toFixed(1)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => { if (!isMobile) activateSlice(index); }}
                    onMouseLeave={() => { if (!isMobile) resetActiveSlice(); }}
                    style={{ outline: "none", cursor: "pointer" }}
                    tabIndex={-1}
                    focusable={false}
                    onClick={(_, index) => {
                      if (didScrollRef.current) return;
                      toggleSlice(index);
                    }}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[getColorIndex(i, chartData.length)]}
                            stroke="none" style={{ outline: "none" }} tabIndex={-1} />
                    ))}
                  </Pie>
                  <Tooltip cursor={false} content={() => null} />
                </PieChart>
              </ResponsiveContainer>

              {activeIndex !== undefined && tooltipData && (
                <div
                  className="absolute left-1/2 z-50 bg-background border border-border rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 shadow-md pointer-events-none -translate-x-1/2"
                  style={{ top: "calc(50% - 15px)" }}
                >
                  <span className="font-medium" style={fontResponsive}>{tooltipData.name}</span>{" "}
                  <span className="text-primary font-semibold" style={fontResponsive}>{tooltipData.value}</span>{" "}
                  <span className="text-foreground" style={fontResponsive}>({tooltipData.percentage.toFixed(1)}%)</span>
                </div>
              )}
            </>
          )}
        </div>

        {chartData.length > 0 && (
          <div
            className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2 px-3 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4"
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            {chartData.map((entry, i) => (
              <div
                key={entry.name}
                className="flex items-center gap-1 md:gap-1.5 cursor-pointer"
                onMouseEnter={() => { if (!isMobile) activateSlice(i); }}
                onMouseLeave={() => { if (!isMobile) resetActiveSlice(); }}
                onTouchEnd={() => {
                  if (!isMobile) return;
                  if (didScrollRef.current) return;
                  toggleSlice(i);
                }}
              >
                <div
                  className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[getColorIndex(i, chartData.length)] }}
                />
                <span
                  style={{
                    fontSize: "clamp(11px, 2.8vw, 14px)",
                    fontWeight: activeIndex === i ? 700 : 400,
                    color: activeIndex === i ? "hsl(var(--primary))" : "#111827",
                  }}
                >
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
