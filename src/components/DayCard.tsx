import { Plus, Trash2 } from "lucide-react";
import { DayLog, ExerciseLog, EXERCISES, WorkoutSet, calculateVolume } from "@/lib/workoutData";
import { useState } from "react";

interface DayCardProps {
  dayLog: DayLog;
  isToday: boolean;
  onChange: (updated: DayLog) => void;
}

export default function DayCard({ dayLog, isToday, onChange }: DayCardProps) {
  const [adding, setAdding] = useState(false);

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

  const updateSet = (exIdx: number, setIdx: number, field: keyof WorkoutSet, value: number) => {
    const exercises = [...dayLog.exercises];
    const sets = [...exercises[exIdx].sets];
    sets[setIdx] = { ...sets[setIdx], [field]: value };
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

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isToday
          ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-sm">
            {dayLog.day}
          </h3>
          {isToday && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
        </div>
        {totalVolume > 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            {totalVolume.toLocaleString()} kg vol
          </span>
        )}
      </div>

      {dayLog.exercises.map((ex, exIdx) => (
        <div key={exIdx} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground/80">{ex.exercise}</span>
            <button
              onClick={() => removeExercise(exIdx)}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground w-4">
                  {setIdx + 1}
                </span>
                <input
                  type="number"
                  min={0}
                  value={set.reps || ""}
                  placeholder="reps"
                  onChange={(e) => updateSet(exIdx, setIdx, "reps", Number(e.target.value))}
                  className="w-16 bg-secondary border border-border rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground text-[10px]">×</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={set.kg || ""}
                  placeholder="kg"
                  onChange={(e) => updateSet(exIdx, setIdx, "kg", Number(e.target.value))}
                  className="w-16 bg-secondary border border-border rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground text-[10px] font-mono">kg</span>
                {ex.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(exIdx, setIdx)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-auto"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => addSet(exIdx)}
            className="mt-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
          >
            + set
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-2 bg-secondary rounded-lg p-2 max-h-36 overflow-y-auto">
          {availableExercises.map((ex) => (
            <button
              key={ex}
              onClick={() => addExercise(ex)}
              className="block w-full text-left text-xs py-1.5 px-2 rounded hover:bg-border transition-colors text-foreground/80"
            >
              {ex}
            </button>
          ))}
          {availableExercises.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">All exercises added</p>
          )}
          <button
            onClick={() => setAdding(false)}
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
    </div>
  );
}
