import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format, subDays, subMonths, startOfMonth } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

const PERIOD_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "previous_day", label: "Previous Day" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "previous_month", label: "Previous Month" },
  { value: "last_1_month", label: "Last 1 Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "year_to_date", label: "Year to Date" },
  { value: "last_1_year", label: "Last 1 Year" },
] as const;

function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "latest": return { start: today, end: today };
    case "previous_day": return { start: subDays(today, 1), end: subDays(today, 1) };
    case "last_7_days": return { start: subDays(today, 6), end: today };
    case "this_month": return { start: startOfMonth(today), end: today };
    case "previous_month": {
      const prevMonth = subMonths(today, 1);
      return { start: startOfMonth(prevMonth), end: new Date(today.getFullYear(), today.getMonth(), 0) };
    }
    case "last_1_month": return { start: subMonths(today, 1), end: today };
    case "last_3_months": return { start: subMonths(today, 3), end: today };
    case "last_6_months": return { start: subMonths(today, 6), end: today };
    case "year_to_date": return { start: startOfMonth(today), end: today };
    case "last_1_year": return { start: subMonths(today, 12), end: today };
    default: return { start: subMonths(today, 1), end: today };
  }
}

function adjustDate(date: Date, delta: number): Date {
  return subDays(date, -delta);
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const [tempPeriod, setTempPeriod] = useState(selectedPeriod);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

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

  const handleOpenSheet = () => {
    setTempPeriod(selectedPeriod);
    setTempStart(startDate);
    setTempEnd(endDate);
    setSheetOpen(true);
  };

  const handlePeriodChange = (value: string) => {
    setTempPeriod(value);
    const range = getDateRange(value);
    setTempStart(range.start);
    setTempEnd(range.end);
  };

  const handleApply = () => {
    setSelectedPeriod(tempPeriod);
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setSheetOpen(false);
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

  // Shared responsive font styles (same pattern as HistoricalReport)
  const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };
  const fontHeader = { fontSize: "clamp(11px, 2.8vw, 13px)" };

  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="px-3 py-3 md:px-6 md:py-4">
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
            Informasi Kendaraan
          </CardTitle>
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
          <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
            Informasi Kendaraan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-6 md:pb-6 flex flex-col items-center gap-3 py-6 md:py-8">
          <p className="text-muted-foreground" style={fontResponsive}>Gagal memuat data</p>
          <button onClick={() => refetch()} className="text-primary hover:underline" style={fontResponsive}>
            Coba lagi
          </button>
        </CardContent>
      </Card>
    );
  }

  const outerRadius = typeof window !== "undefined" && window.innerWidth >= 768 ? 115 : 95;
  const labelRadius = (typeof window !== "undefined" && window.innerWidth >= 768 ? 110 : 90) + 25;

  return (
    <Card className="rounded-xl shadow-sm">

      {/* Card Header */}
      <CardHeader className="px-3 py-3 md:px-6 md:py-4 pb-0">
        <CardTitle style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}>
          Informasi Kendaraan
        </CardTitle>
      </CardHeader>

      {/* Date range picker trigger */}
      <div className="flex justify-center px-3 pt-3 pb-0 md:px-6 md:pt-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              onClick={handleOpenSheet}
              className="flex items-center gap-2 cursor-pointer hover:opacity-60 transition-opacity bg-muted/90 rounded-full px-3 py-1 md:px-4 md:py-1.5"
            >
              <span className="text-primary font-medium" style={fontHeader}>
                {format(startDate, "dd MMM yy")} - {format(endDate, "dd MMM yy")}
              </span>
              <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto mx-auto lg:max-w-[33vw] lg:rounded-2xl pt-4 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-center" style={fontResponsive}>Periode</SheetTitle>
            </SheetHeader>

            <RadioGroup value={tempPeriod} onValueChange={handlePeriodChange} className="space-y-0">
              {PERIOD_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center justify-between py-1.5 px-1">
                  <Label htmlFor={opt.value} className="font-normal cursor-pointer flex-1" style={fontResponsive}>
                    {opt.label}
                  </Label>
                  <RadioGroupItem value={opt.value} id={opt.value} />
                </div>
              ))}
            </RadioGroup>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
              <div>
                <p className="font-semibold text-primary mb-2 text-center" style={fontHeader}>Start</p>
                <div className="flex items-center justify-between gap-1">
                  <button onClick={() => setTempStart(adjustDate(tempStart, -1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                  <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="hover:text-primary hover:underline transition-colors cursor-pointer" style={fontHeader}>
                        {format(tempStart, "dd MMM yy")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar mode="single" selected={tempStart}
                                onSelect={(date) => { if (date) { setTempStart(date); setStartPopoverOpen(false); } }}
                                captionLayout="dropdown-buttons" fromYear={2025} toYear={new Date().getFullYear()}
                                initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <button onClick={() => setTempStart(adjustDate(tempStart, 1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-primary mb-2 text-center" style={fontHeader}>End</p>
                <div className="flex items-center justify-between gap-1">
                  <button onClick={() => setTempEnd(adjustDate(tempEnd, -1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                  <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="hover:text-primary hover:underline transition-colors cursor-pointer" style={fontHeader}>
                        {format(tempEnd, "dd MMM yy")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar mode="single" selected={tempEnd}
                                onSelect={(date) => { if (date) { setTempEnd(date); setEndPopoverOpen(false); } }}
                                captionLayout="dropdown-buttons" fromYear={2025} toYear={new Date().getFullYear()}
                                initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <button onClick={() => setTempEnd(adjustDate(tempEnd, 1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleApply} className="w-full" style={fontResponsive}>Apply</Button>
          </SheetContent>
        </Sheet>
      </div>

      <div ref={chartContainerRef}>

        {/* Pie chart */}
        <div
          className="px-3 pt-1.5 pb-0 md:px-6 relative"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-center pt-6 pb-8" style={fontResponsive}>
              Belum ada data
            </p>
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

        {/* Legend */}
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