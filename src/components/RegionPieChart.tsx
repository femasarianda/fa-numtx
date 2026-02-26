import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { useState, useMemo, useRef } from "react";
import { format, subDays, subMonths, startOfMonth, startOfYear } from "date-fns";
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
  "#A5B4FC", // (Indigo 300)
  "#818CF8", // (Indigo 400)
  "#6366F1", // (Indigo 500)
  "#4F46E5", // (Indigo 600)
  "#4338CA", // (Indigo 700)
  "#5B21B6", // (Violet 900)
  "#6D28D9", // (Violet 800)
  "#7C3AED", // (Violet 700)
  "#8B5CF6", // (Violet 600)
  "#A78BFA", // (Violet 400)
  "#C4B5FD", // (Violet 300)
];


function getColorIndex(index: number, total: number): number {
  const len = COLORS.length;

  if (index < len) {
    return index;
  }

  if (index >= len && index < len + 2) {
    return (index - len) + 2;
  }

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
    case "latest":
      return { start: today, end: today };
    case "previous_day":
      return { start: subDays(today, 1), end: subDays(today, 1) };
    case "last_7_days":
      return { start: subDays(today, 6), end: today };
    case "this_month":
      return { start: startOfMonth(today), end: today };
    case "previous_month": {
      const prevMonth = subMonths(today, 1);
      return { start: startOfMonth(prevMonth), end: new Date(today.getFullYear(), today.getMonth(), 0) };
    }
    case "last_1_month":
      return { start: subMonths(today, 1), end: today };
    case "last_3_months":
      return { start: subMonths(today, 3), end: today };
    case "last_6_months":
      return { start: subMonths(today, 6), end: today };
    case "year_to_date":
      return { start: startOfYear(today), end: today };
    case "last_1_year":
      return { start: subMonths(today, 12), end: today };
    default:
      return { start: subDays(today, 6), end: today };
  }
}

function adjustDate(date: Date, delta: number): Date {
  return subDays(date, -delta);
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="none" />
  );
};

export default function RegionPieChart() {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("last_7_days");
  const [startDate, setStartDate] = useState(() => getDateRange("last_7_days").start);
  const [endDate, setEndDate] = useState(() => getDateRange("last_7_days").end);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  const [tempPeriod, setTempPeriod] = useState(selectedPeriod);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const isCoarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  const clearLongPressTimeout = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const resetActiveSlice = () => {
    setActiveIndex(undefined);
    setTooltipData(null);
    setTooltipPos(null);
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
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

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

  return (
    <Card className="rounded-xl shadow-sm">

      {/* Div 1: Judul */}
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Informasi Kendaraan</CardTitle>
      </CardHeader>

      {/* Div 2: Tombol tanggal */}
      <div className="flex justify-center px-6 pt-4 pb-0">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              onClick={handleOpenSheet}
              className="flex items-center gap-2 cursor-pointer hover:opacity-60 transition-opacity bg-muted/90 rounded-full px-4 py-1.5"
            >
              <span className="text-sm text-primary font-medium">
                {format(startDate, "dd MMM yy")} - {format(endDate, "dd MMM yy")}
              </span>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto mx-auto lg:max-w-[33vw] lg:rounded-2xl pt-4 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-center">Periode</SheetTitle>
            </SheetHeader>

            <RadioGroup value={tempPeriod} onValueChange={handlePeriodChange} className="space-y-0">
              {PERIOD_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center justify-between py-1.5 px-1">
                  <Label htmlFor={opt.value} className="text-sm font-normal cursor-pointer flex-1">
                    {opt.label}
                  </Label>
                  <RadioGroupItem value={opt.value} id={opt.value} />
                </div>
              ))}
            </RadioGroup>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-primary mb-2 text-center">Start</p>
                <div className="flex items-center justify-between gap-1">
                  <button onClick={() => setTempStart(adjustDate(tempStart, -1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="text-sm hover:text-primary hover:underline transition-colors cursor-pointer">
                        {format(tempStart, "dd MMM yy")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={tempStart}
                        onSelect={(date) => { if (date) { setTempStart(date); setStartPopoverOpen(false); } }}
                        captionLayout="dropdown-buttons"
                        fromYear={2025}
                        toYear={new Date().getFullYear()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <button onClick={() => setTempStart(adjustDate(tempStart, 1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary mb-2 text-center">End</p>
                <div className="flex items-center justify-between gap-1">
                  <button onClick={() => setTempEnd(adjustDate(tempEnd, -1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="text-sm hover:text-primary hover:underline transition-colors cursor-pointer">
                        {format(tempEnd, "dd MMM yy")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={tempEnd}
                        onSelect={(date) => { if (date) { setTempEnd(date); setEndPopoverOpen(false); } }}
                        captionLayout="dropdown-buttons"
                        fromYear={2025}
                        toYear={new Date().getFullYear()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <button onClick={() => setTempEnd(adjustDate(tempEnd, 1))} className="p-1 text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleApply} className="w-full">
              Apply
            </Button>
          </SheetContent>
        </Sheet>
      </div>

      {/* Div 3: Pie chart saja (tanpa legend) */}
      <div className="px-6 pt-3.5 pb-0 relative">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={
              (typeof window !== "undefined" && window.innerWidth >= 768 ? 110 : 95) * 2 + 70
            }>
              <PieChart margin={{ top: 30, right: 50, bottom: 30, left: 50 }} accessibilityLayer={false}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={typeof window !== "undefined" && window.innerWidth >= 768 ? 115 : 95}
                  dataKey="value"
                  stroke="none"
                  label={({ percentage, cx, cy, midAngle }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = (typeof window !== "undefined" && window.innerWidth >= 768 ? 110 : 90) + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#000000"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: "clamp(12px, 3vw, 14px)", fontWeight: 500 }}
                      >
                        {`${percentage.toFixed(1)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(data, index) => {
                    if (isCoarsePointer) return;
                    setActiveIndex(index);
                    setTooltipData(data);
                  }}
                  onMouseLeave={() => {
                    if (isCoarsePointer) return;
                    resetActiveSlice();
                  }}
                  onTouchStart={(data, index, event) => {
                    if (!isCoarsePointer) return;

                    clearLongPressTimeout();

                    const nativeEvent = (event as { nativeEvent?: TouchEvent })?.nativeEvent;
                    const touch = nativeEvent?.touches?.[0];

                    if (touch) {
                      setTooltipPos({ x: touch.clientX, y: touch.clientY });
                    }

                    longPressTimeoutRef.current = setTimeout(() => {
                      setActiveIndex(index);
                      setTooltipData(data);
                    }, 220);
                  }}
                  onTouchMove={(_, index, event) => {
                    if (!isCoarsePointer || activeIndex !== index) return;

                    const nativeEvent = (event as { nativeEvent?: TouchEvent })?.nativeEvent;
                    const touch = nativeEvent?.touches?.[0];

                    if (touch) {
                      setTooltipPos({ x: touch.clientX, y: touch.clientY });
                    }
                  }}
                  onTouchEnd={() => {
                    if (!isCoarsePointer) return;
                    clearLongPressTimeout();
                    resetActiveSlice();
                  }}
                  onTouchCancel={() => {
                    if (!isCoarsePointer) return;
                    clearLongPressTimeout();
                    resetActiveSlice();
                  }}
                  style={{ outline: "none", cursor: "pointer" }}
                  tabIndex={-1}
                  focusable={false}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[getColorIndex(i, chartData.length)]}
                      stroke="none"
                      style={{ outline: "none" }}
                      tabIndex={-1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (isCoarsePointer) {
                      return null;
                    }

                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-md text-sm">
                          <span className="font-medium">{d.name}</span>{" "}
                          <span className="text-primary font-semibold">{d.value}</span>{" "}
                          <span style={{ color: "#000000" }}>({d.percentage.toFixed(1)}%)</span>
                        </div>
                      );
                    }

                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Mobile tooltip overlay */}
            {isCoarsePointer && tooltipData && tooltipPos && (
              <div
                className="fixed z-50 bg-background border border-border rounded-lg px-3 py-2 shadow-md text-sm pointer-events-none"
                style={{ top: tooltipPos.y - 60, left: tooltipPos.x - 80 }}
              >
                <span className="font-medium">{tooltipData.name}</span>{" "}
                <span className="text-primary font-semibold">{tooltipData.value}</span>{" "}
                <span style={{ color: "#000000" }}>({tooltipData.percentage.toFixed(1)}%)</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Div 4: Legend nama kota/kabupaten */}
      {chartData.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-6 pb-6 pt-4">
          {chartData.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[getColorIndex(i, chartData.length)] }}
              />
              <span style={{ color: "#111827", fontSize: "clamp(12px, 3vw, 14px)" }}>
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      )}

    </Card>
  );
}