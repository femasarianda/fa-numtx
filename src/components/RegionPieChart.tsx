import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { useState, useMemo } from "react";
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

const COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF", "#8B5CF6", "#7C3AED"];

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
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
  );
};

export default function RegionPieChart() {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState("last_7_days");
  const [startDate, setStartDate] = useState(() => getDateRange("last_7_days").start);
  const [endDate, setEndDate] = useState(() => getDateRange("last_7_days").end);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  // Temp state for sheet
  const [tempPeriod, setTempPeriod] = useState(selectedPeriod);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

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
    queryKey: ["region-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dashboard_region_stats").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = useMemo(() =>
    (data || []).map((d) => ({
      name: d.region_name || "Unknown",
      value: Number(d.total) || 0,
      percentage: Number(d.percentage) || 0,
    })), [data]);

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
      <CardHeader><CardTitle className="text-base">Informasi Kendaraan</CardTitle></CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
        ) : (
          <div className="pt-10 pb-4">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ percentage }) => `${percentage.toFixed(1)}%`}
                  labelLine={true}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  onClick={(_, index) => setActiveIndex(activeIndex === index ? undefined : index)}
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

        {/* Date range display + calendar icon - entire area clickable */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              onClick={handleOpenSheet}
              className="flex items-center justify-center gap-2 pt-2 w-full cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-sm text-primary font-medium">
                {format(startDate, "dd MMM yy")} - {format(endDate, "dd MMM yy")}
              </span>
              <CalendarIcon className="h-5 w-5 text-primary" />
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto mx-auto lg:max-w-[33vw]">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center">Periode</SheetTitle>
            </SheetHeader>

            <RadioGroup value={tempPeriod} onValueChange={handlePeriodChange} className="space-y-1">
              {PERIOD_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center justify-between py-3 px-1">
                  <Label htmlFor={opt.value} className="text-sm font-normal cursor-pointer flex-1">
                    {opt.label}
                  </Label>
                  <RadioGroupItem value={opt.value} id={opt.value} />
                </div>
              ))}
            </RadioGroup>

            <Separator className="my-4" />

            {/* Start / End date controls with clickable date picker */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Start</p>
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
                <p className="text-sm font-semibold text-primary mb-2">End</p>
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
      </CardContent>
    </Card>
  );
}
