import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekSelectorProps {
  weekStart: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function WeekSelector({ weekStart, onPrev, onNext, onToday }: WeekSelectorProps) {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={onToday}
        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-border transition-colors font-mono text-sm text-muted-foreground"
      >
        Today
      </button>
      <span className="font-mono text-sm text-muted-foreground min-w-[140px] text-center">
        {fmt(start)} – {fmt(end)}
      </span>
      <button
        onClick={onNext}
        className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
