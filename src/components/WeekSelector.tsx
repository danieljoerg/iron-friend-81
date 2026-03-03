import { ChevronLeft, ChevronRight, CalendarIcon, Repeat, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Mesocycle } from "@/lib/workoutDb";
import { getMesocycleWeekInfo } from "@/lib/workoutDb";

interface WeekSelectorProps {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
  mesocycle: Mesocycle | null;
  onCreateMesocycle: (durationWeeks: number) => void;
  onDeleteMesocycle: () => void;
}

export default function WeekSelector({ weekStart, onPrev, onNext, onToday, onDateSelect, mesocycle, onCreateMesocycle, onDeleteMesocycle }: WeekSelectorProps) {
  const [calOpen, setCalOpen] = useState(false);
  const [mesoOpen, setMesoOpen] = useState(false);
  const [duration, setDuration] = useState(6);
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { month: "short", day: "numeric" });

  const mesoInfo = mesocycle ? getMesocycleWeekInfo(mesocycle, weekStart) : null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Row 1: week navigation */}
      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={onToday} className="px-2 py-1.5 rounded-lg bg-secondary hover:bg-border transition-colors font-mono text-xs text-muted-foreground">
          Heute
        </button>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
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
              onSelect={(date) => { if (date) { onDateSelect(date); setCalOpen(false); } }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <button onClick={onNext} className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: mesocycle indicator */}
      {!mesocycle && !mesoOpen && (
        <button
          onClick={() => setMesoOpen(true)}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <Repeat className="w-3 h-3" />
          <span>Mesocycle starten</span>
        </button>
      )}

      {!mesocycle && mesoOpen && (
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex gap-0.5">
            {[4, 5, 6, 7, 8].map((w) => (
              <button
                key={w}
                onClick={() => setDuration(w)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                  duration === w
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {w}W
              </button>
            ))}
          </div>
          <button
            onClick={() => { onCreateMesocycle(duration); setMesoOpen(false); }}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="w-2.5 h-2.5" />
            Start
          </button>
          <button
            onClick={() => setMesoOpen(false)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {mesocycle && mesoInfo && mesoInfo.isInMeso && (
        <div className="flex items-center gap-2">
          <Repeat className={`w-3 h-3 ${mesoInfo.isDeload ? "text-yellow-500" : "text-primary"}`} />
          <div className="flex items-center gap-1.5">
            {/* Mini progress dots */}
            <div className="flex gap-0.5">
              {Array.from({ length: mesoInfo.totalWeeks }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i < mesoInfo.weekNumber
                      ? i === mesoInfo.totalWeeks - 1
                        ? "bg-yellow-500"
                        : "bg-primary"
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-mono ${mesoInfo.isDeload ? "text-yellow-500 font-semibold" : "text-muted-foreground"}`}>
              {mesoInfo.isDeload ? "Deload" : `W${mesoInfo.weekNumber}/${mesoInfo.totalWeeks}`}
            </span>
          </div>
          <button
            onClick={onDeleteMesocycle}
            className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
            title="Mesocycle löschen"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {mesocycle && mesoInfo && !mesoInfo.isInMeso && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60">
            {mesoInfo.weekNumber > mesoInfo.totalWeeks ? "Meso abgeschlossen ✓" : "Vor dem Mesocycle"}
          </span>
          {mesoInfo.weekNumber > mesoInfo.totalWeeks && (
            <button
              onClick={() => { setMesoOpen(true); }}
              className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
            >
              Neuer Meso
            </button>
          )}
          <button
            onClick={onDeleteMesocycle}
            className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
            title="Mesocycle löschen"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}
