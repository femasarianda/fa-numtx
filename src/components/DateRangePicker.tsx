import { useState } from "react";
import { format, subDays, subMonths, startOfMonth } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

export function getDateRange(period: string): { start: Date; end: Date } {
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

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  selectedPeriod: string;
  onApply: (period: string, start: Date, end: Date) => void;
}

const fontResponsive = { fontSize: "clamp(11px, 3vw, 14px)" };
const fontHeader = { fontSize: "clamp(11px, 2.8vw, 13px)" };

export default function DateRangePicker({ startDate, endDate, selectedPeriod, onApply }: DateRangePickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
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
    onApply(tempPeriod, tempStart, tempEnd);
    setSheetOpen(false);
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <button
          onClick={handleOpenSheet}
          className="flex items-center gap-2 cursor-pointer hover:opacity-60 transition-opacity bg-muted/90 rounded-full px-3 py-1 md:px-4 md:py-1.5"
        >
          <span className="text-primary font-medium whitespace-nowrap" style={fontHeader}>
            {format(startDate, "dd MMM yy")} - {format(endDate, "dd MMM yy")}
          </span>
          <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
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
  );
}
