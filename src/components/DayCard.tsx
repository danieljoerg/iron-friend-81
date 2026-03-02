import { Plus, Trash2, Settings2, Target, Check, ChevronDown } from "lucide-react";
import { DayLog, ExerciseLog, EXERCISES, WorkoutSet, calculateVolume } from "@/lib/workoutData";
import { useState } from "react";
import { computeTargets, type RepRange, type ExerciseTarget } from "@/lib/workoutDb";

interface DayCardProps {
  dayLog: DayLog;
  isToday: boolean;
  weekStart: string;
  onChange: (updated: DayLog) => void;
  repRanges?: Record<string, RepRange>;
  onRepRangeChange?: (exercise: string, min: number, max: number) => void;
  prevDayExercises?: ExerciseLog[];
  expanded: boolean;
  onToggleExpanded: () => void;
}

export default function DayCard({ dayLog, isToday, weekStart, onChange, repRanges, onRepRangeChange, prevDayExercises, expanded, onToggleExpanded }: DayCardProps) {
  const dayIndex = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(dayLog.day);
  const dayDate = new Date(weekStart + "T00:00:00");
  dayDate.setDate(dayDate.getDate() + dayIndex);
  const dateStr = dayDate.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [editingRange, setEditingRange] = useState<string | null>(null);

  const totalVolume = dayLog.exercises.reduce((sum, e) => sum + calculateVolume(e), 0);

  const addExercise = (exercise: string) => {
    const updated: DayLog = {
      ...dayLog,
      exercises: [
        ...dayLog.exercises,
        { exercise, sets: [{ reps: 0, kg: 0 }] },
      ],
    };
    onChange(updated);
    setAdding(false);
  };

  const removeExercise = (idx: number) => {
    onChange({
      ...dayLog,
      exercises: dayLog.exercises.filter((_, i) => i !== idx),
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof WorkoutSet, value: number | boolean) => {
    const exercises = [...dayLog.exercises];
    const sets = [...exercises[exIdx].sets];
    sets[setIdx] = { ...sets[setIdx], [field]: value };
    exercises[exIdx] = { ...exercises[exIdx], sets };
    onChange({ ...dayLog, exercises });
  };

  const toggleSetDone = (exIdx: number, setIdx: number) => {
    const exercises = [...dayLog.exercises];
    const sets = [...exercises[exIdx].sets];
    sets[setIdx] = { ...sets[setIdx], done: !sets[setIdx].done };
    exercises[exIdx] = { ...exercises[exIdx], sets };
    onChange({ ...dayLog, exercises });
  };

  const addSet = (exIdx: number) => {
    const exercises = [...dayLog.exercises];
    const lastSet = exercises[exIdx].sets[exercises[exIdx].sets.length - 1];
    exercises[exIdx] = {
      ...exercises[exIdx],
      sets: [...exercises[exIdx].sets, { reps: lastSet?.reps || 0, kg: lastSet?.kg || 0 }],
    };
    onChange({ ...dayLog, exercises });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    const exercises = [...dayLog.exercises];
    exercises[exIdx] = {
      ...exercises[exIdx],
      sets: exercises[exIdx].sets.filter((_, i) => i !== setIdx),
    };
    onChange({ ...dayLog, exercises });
  };

  const usedExercises = dayLog.exercises.map((e) => e.exercise);
  const availableExercises = EXERCISES.filter((e) => !usedExercises.includes(e));
  const filteredExercises = availableExercises.filter((e) =>
    e.toLowerCase().includes(search.toLowerCase())
  );

  const getRepColor = (reps: number, exercise: string) => {
    const range = repRanges?.[exercise];
    if (!range || reps === 0) return "";
    if (reps < range.min_reps) return "ring-1 ring-yellow-500/50";
    if (reps > range.max_reps) return "ring-1 ring-blue-500/50";
    return "ring-1 ring-primary/50";
  };

    const allSetsDone = dayLog.exercises.length > 0 && dayLog.exercises.every(ex => ex.sets.every(s => s.done));
    const dayDone = dayLog.done === true;

    const toggleDayDone = () => {
      if (dayDone) {
        // Reopen day: unmark day, keep sets as they are
        onChange({ ...dayLog, done: false });
      } else {
        // Mark day done: also mark all sets done
        const exercises = dayLog.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({ ...s, done: true })),
        }));
        onChange({ ...dayLog, exercises, done: true });
      }
    };

    return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        dayDone
          ? "border-primary/40 bg-primary/5"
          : isToday
            ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
            : "border-border bg-card"
      }`}
    >
      <button
        onClick={() => onToggleExpanded()}
        className="flex items-center justify-between w-full mb-0"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? '' : '-rotate-90'}`} />
          <h3 className={`font-heading font-semibold text-sm ${dayDone ? 'text-primary' : ''}`}>
            {dayDone ? '✓ ' : ''}{dayLog.day}
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{dateStr}</span>
          {isToday && !dayDone && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
          {dayDone && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/15 px-1.5 py-0.5 rounded">
              Done
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!expanded && dayLog.exercises.length > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {dayLog.exercises.length} {dayLog.exercises.length === 1 ? 'Übung' : 'Übungen'}
              {totalVolume > 0 && ` · ${totalVolume.toLocaleString()} kg`}
            </span>
          )}
          {expanded && totalVolume > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              {totalVolume.toLocaleString()} kg vol
            </span>
          )}
        </div>
      </button>

      {expanded && <div className="mt-3">

      {dayLog.exercises.map((ex, exIdx) => {
        const range = repRanges?.[ex.exercise];
        return (
          <div key={exIdx} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-medium text-foreground/80 truncate">{ex.exercise}</span>
                {range && (
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                    {range.min_reps}–{range.max_reps}r
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingRange(editingRange === ex.exercise ? null : ex.exercise)}
                  className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                  title="Set rep range"
                >
                  <Settings2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeExercise(exIdx)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {editingRange === ex.exercise && (
              <div className="flex items-center gap-1.5 mb-2 bg-secondary rounded-lg p-2">
                <span className="text-[10px] font-mono text-muted-foreground">Reps:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={range?.min_reps ?? 8}
                  className="w-12 bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onBlur={(e) => {
                    const min = Number(e.target.value) || 8;
                    const max = range?.max_reps ?? 12;
                    onRepRangeChange?.(ex.exercise, min, Math.max(min, max));
                  }}
                />
                <span className="text-[10px] text-muted-foreground">–</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={range?.max_reps ?? 12}
                  className="w-12 bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  onBlur={(e) => {
                    const max = Number(e.target.value) || 12;
                    const min = range?.min_reps ?? 8;
                    onRepRangeChange?.(ex.exercise, Math.min(min, max), max);
                  }}
                />
                <button
                  onClick={() => setEditingRange(null)}
                  className="ml-auto text-[10px] font-mono text-primary"
                >
                  done
                </button>
              </div>
            )}

            {(() => {
              const prevEx = prevDayExercises?.find((p) => p.exercise === ex.exercise);
              const targets = prevEx ? computeTargets(prevEx.sets, repRanges?.[ex.exercise] ? { ...repRanges[ex.exercise] } : undefined) : [];
              return (
                <div className="space-y-1">
                  {targets.length > 0 && (
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-2.5 h-2.5 text-primary/60" />
                      <span className="text-[9px] font-mono text-primary/60">
                        Ziel: {targets.map((t) => `${t.reps}×${t.kg}kg`).join(", ")}
                      </span>
                    </div>
                  )}
                  {ex.sets.map((set, setIdx) => {
                    const target = targets[setIdx];
                    return (
                    <div key={setIdx} className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
                      set.done 
                        ? 'bg-primary/8 border border-primary/20' 
                        : ''
                    }`}>
                        <span className={`font-mono text-[10px] w-4 shrink-0 ${set.done ? 'text-primary' : 'text-muted-foreground'}`}>
                          {set.done ? '✓' : setIdx + 1}
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={set.reps || ""}
                          placeholder={target ? `${target.reps}` : "reps"}
                          onChange={(e) => updateSet(exIdx, setIdx, "reps", Number(e.target.value))}
                          disabled={set.done}
                          className={`flex-1 min-w-0 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed transition-all ${
                            set.done 
                              ? 'bg-primary/5 border border-primary/20 text-primary font-semibold' 
                              : 'bg-secondary border border-border text-foreground placeholder:text-muted-foreground'
                          } ${getRepColor(set.reps, ex.exercise)}`}
                        />
                        <span className={`text-[10px] shrink-0 ${set.done ? 'text-primary/60' : 'text-muted-foreground'}`}>×</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={set.kg || ""}
                          placeholder={target ? `${target.kg}` : "kg"}
                          onChange={(e) => updateSet(exIdx, setIdx, "kg", Number(e.target.value))}
                          disabled={set.done}
                          className={`flex-1 min-w-0 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed transition-all ${
                            set.done 
                              ? 'bg-primary/5 border border-primary/20 text-primary font-semibold' 
                              : 'bg-secondary border border-border text-foreground placeholder:text-muted-foreground'
                          }`}
                        />
                        <span className={`text-[10px] font-mono shrink-0 ${set.done ? 'text-primary/60' : 'text-muted-foreground'}`}>kg</span>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={set.rir !== undefined && set.rir !== null ? set.rir : ""}
                          placeholder="RIR"
                          onChange={(e) => updateSet(exIdx, setIdx, "rir", Number(e.target.value))}
                          disabled={set.done}
                          className={`w-14 shrink-0 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed transition-all ${
                            set.done 
                              ? 'bg-primary/5 border border-primary/20 text-primary font-semibold' 
                              : 'bg-secondary border border-border text-foreground placeholder:text-muted-foreground'
                          }`}
                          title="Reps in Reserve"
                        />
                        <button
                          onClick={() => toggleSetDone(exIdx, setIdx)}
                          className={`p-1.5 rounded-md transition-all shrink-0 ${
                            set.done
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                          }`}
                          title={set.done ? "Set bearbeiten" : "Set abschließen"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        {ex.sets.length > 1 && !set.done && (
                          <button
                            onClick={() => removeSet(exIdx, setIdx)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <button
              onClick={() => addSet(exIdx)}
              className="mt-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
            >
              + set
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="mt-2 bg-secondary rounded-lg p-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Übung suchen..."
            autoFocus
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-2"
          />
          <div className="max-h-36 overflow-y-auto">
            {filteredExercises.map((ex) => (
              <button
                key={ex}
                onClick={() => { addExercise(ex); setSearch(""); }}
                className="block w-full text-left text-xs py-1.5 px-2 rounded hover:bg-border transition-colors text-foreground/80"
              >
                {ex}
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">Keine Übung gefunden</p>
            )}
          </div>
          <button
            onClick={() => { setAdding(false); setSearch(""); }}
            className="mt-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3" />
          Exercise
        </button>
      )}
      {dayLog.exercises.length > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleDayDone(); }}
          className={`mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-mono font-medium transition-all ${
            dayDone
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {dayDone ? 'Tag erledigt ✓' : 'Tag abschließen'}
        </button>
      )}
      </div>}
    </div>
  );
}
