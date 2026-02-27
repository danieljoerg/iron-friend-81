import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface WeekSelectorProps {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
}

export default function WeekSelector({ weekStart, onPrev, onNext, onToday, onDateSelect }: WeekSelectorProps) {
  const [open, setOpen] = useState(false);
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { month: "short", day: "numeric" });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={onToday}
        className="px-2 py-1.5 rounded-lg bg-secondary hover:bg-border transition-colors font-mono text-xs text-muted-foreground"
      >
        Heute
      </button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary hover:bg-border transition-colors font-mono text-sm text-muted-foreground min-w-[140px] justify-center">
            <CalendarIcon className="w-3.5 h-3.5" />
            {fmt(start)} – {fmt(end)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={start}
            onSelect={(date) => {
              if (date) {
                onDateSelect(date);
                setOpen(false);
              }
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <button
        onClick={onNext}
        className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}