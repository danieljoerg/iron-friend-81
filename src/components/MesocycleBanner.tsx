import { useState } from "react";
import { Repeat, Plus, Trash2, ChevronRight } from "lucide-react";
import type { Mesocycle } from "@/lib/workoutDb";
import { getMesocycleWeekInfo } from "@/lib/workoutDb";

interface MesocycleBannerProps {
  mesocycle: Mesocycle | null;
  weekStart: string;
  onCreateMesocycle: (durationWeeks: number) => void;
  onDeleteMesocycle: () => void;
}

export default function MesocycleBanner({ mesocycle, weekStart, onCreateMesocycle, onDeleteMesocycle }: MesocycleBannerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [duration, setDuration] = useState(6);

  if (!mesocycle) {
    if (showCreate) {
      return (
        <div className="rounded-xl border border-border bg-card p-3 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono font-semibold text-foreground">Neuen Mesocycle starten</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-muted-foreground">Dauer:</span>
            <div className="flex gap-1">
              {[4, 5, 6, 7, 8].map((w) => (
                <button
                  key={w}
                  onClick={() => setDuration(w)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                    duration === w
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w}W
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3 font-mono">
            {duration - 1} Trainingswochen + 1 Deload Week
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { onCreateMesocycle(duration); setShowCreate(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-mono font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Starten
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 rounded-lg py-2 text-xs font-mono text-muted-foreground hover:text-foreground bg-secondary transition-all"
            >
              Abbrechen
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowCreate(true)}
        className="w-full rounded-xl border border-dashed border-border hover:border-primary/50 bg-card/50 p-3 mb-4 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-all"
      >
        <Repeat className="w-3.5 h-3.5" />
        Mesocycle starten
      </button>
    );
  }

  const info = getMesocycleWeekInfo(mesocycle, weekStart);

  if (!info.isInMeso) {
    // Past the mesocycle
    const isPast = info.weekNumber > info.totalWeeks;
    return (
      <div className="rounded-xl border border-border bg-card p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {isPast ? "Mesocycle abgeschlossen ✓" : "Vor dem Mesocycle"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isPast && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
              >
                Neuer Meso
              </button>
            )}
            <button
              onClick={onDeleteMesocycle}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
              title="Mesocycle löschen"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {isPast && showCreate && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-muted-foreground">Dauer:</span>
              <div className="flex gap-1">
                {[4, 5, 6, 7, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setDuration(w)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      duration === w
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {w}W
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3 font-mono">
              {duration - 1} Trainingswochen + 1 Deload Week
            </p>
            <button
              onClick={() => { onCreateMesocycle(duration); setShowCreate(false); }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-mono font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Starten
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active mesocycle
  const progressPercent = (info.weekNumber / info.totalWeeks) * 100;

  return (
    <div className={`rounded-xl border p-3 mb-4 transition-all ${
      info.isDeload
        ? "border-yellow-500/40 bg-yellow-500/5"
        : "border-primary/30 bg-primary/5"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Repeat className={`w-4 h-4 ${info.isDeload ? "text-yellow-500" : "text-primary"}`} />
          <span className="text-xs font-mono font-semibold text-foreground">
            {info.isDeload ? "🔄 Deload Week" : `Woche ${info.weekNumber} / ${info.totalWeeks}`}
          </span>
          {info.isDeload && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-600 bg-yellow-500/15 px-1.5 py-0.5 rounded">
              Deload
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!info.isDeload && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {info.totalWeeks - info.weekNumber} {info.totalWeeks - info.weekNumber === 1 ? 'Woche' : 'Wochen'} bis Deload
            </span>
          )}
          <button
            onClick={onDeleteMesocycle}
            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
            title="Mesocycle löschen"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${info.isDeload ? "bg-yellow-500" : "bg-primary"}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {info.isDeload && (
        <p className="text-[10px] font-mono text-yellow-600/80 mt-2">
          Gewicht auf ~55% reduzieren, gleiche Reps. Erholung steht im Fokus.
        </p>
      )}
    </div>
  );
}
