import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Minus, Trophy, ChevronRight, Shield } from "lucide-react";
import { EXERCISE_MUSCLE_MAP, type MuscleGroup } from "@/lib/workoutData";
import { supabase } from "@/integrations/supabase/client";
import type { Mesocycle } from "@/lib/workoutDb";
import { getMesocycleWeekInfo } from "@/lib/workoutDb";
import { formatDateString } from "@/lib/workoutData";

interface MesocycleCompletionScreenProps {
  mesocycle: Mesocycle;
  userId: string;
  deloadCompleted: boolean;
  onStartNextMesocycle: () => void;
  onDoDeloadFirst: () => void;
}

type MuscleVolumeChange = {
  muscle: string;
  startVolume: number;
  endVolume: number;
  changePercent: number;
};

async function getMesocycleVolumeData(
  mesocycle: Mesocycle,
  userId: string
): Promise<{ muscleChanges: MuscleVolumeChange[]; overallChangePercent: number }> {
  // Get all weeks in this mesocycle
  const startDate = new Date(mesocycle.start_week + "T00:00:00");
  const allWeekStarts: string[] = [];
  for (let i = 0; i < mesocycle.duration_weeks; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    allWeekStarts.push(formatDateString(d));
  }

  // Fetch week rows
  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .in("week_start", allWeekStarts)
    .order("week_start");

  if (!weeks || weeks.length < 2) return { muscleChanges: [], overallChangePercent: 0 };

  const weekIds = weeks.map((w) => w.id);

  // Fetch all exercises for these weeks
  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("week_id, exercise, sets")
    .eq("user_id", userId)
    .in("week_id", weekIds);

  if (!exercises || exercises.length === 0) return { muscleChanges: [], overallChangePercent: 0 };

  // Find first training week and last non-deload training week with data
  const trainingWeeks = weeks.filter((w) => {
    const info = getMesocycleWeekInfo(mesocycle, w.week_start);
    return info.isInMeso && !info.isDeload;
  });

  const firstTrainingWeek = trainingWeeks[0];
  const lastTrainingWeek = trainingWeeks[trainingWeeks.length - 1];

  if (!firstTrainingWeek || !lastTrainingWeek || firstTrainingWeek.id === lastTrainingWeek.id) {
    return { muscleChanges: [], overallChangePercent: 0 };
  }

  // Calculate volume per muscle group for first and last training weeks
  const calcMuscleVolumes = (weekId: string): Record<string, number> => {
    const volumes: Record<string, number> = {};
    const weekExs = exercises.filter((e) => e.week_id === weekId);
    weekExs.forEach((e) => {
      const muscle = EXERCISE_MUSCLE_MAP[e.exercise];
      if (!muscle) return;
      const vol = ((e.sets as any[]) || []).reduce(
        (sum: number, s: any) => sum + (s.reps || 0) * (s.kg || 0),
        0
      );
      volumes[muscle] = (volumes[muscle] || 0) + vol;
    });
    return volumes;
  };

  const startVols = calcMuscleVolumes(firstTrainingWeek.id);
  const endVols = calcMuscleVolumes(lastTrainingWeek.id);

  // All muscles that appear in either week
  const allMuscles = new Set([...Object.keys(startVols), ...Object.keys(endVols)]);
  const muscleChanges: MuscleVolumeChange[] = [];

  allMuscles.forEach((muscle) => {
    const sv = startVols[muscle] || 0;
    const ev = endVols[muscle] || 0;
    if (sv === 0 && ev === 0) return;
    const change = sv > 0 ? ((ev - sv) / sv) * 100 : ev > 0 ? 100 : 0;
    muscleChanges.push({ muscle, startVolume: sv, endVolume: ev, changePercent: Math.round(change) });
  });

  // Sort by absolute change descending
  muscleChanges.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  // Overall
  const totalStart = Object.values(startVols).reduce((s, v) => s + v, 0);
  const totalEnd = Object.values(endVols).reduce((s, v) => s + v, 0);
  const overallChangePercent = totalStart > 0 ? Math.round(((totalEnd - totalStart) / totalStart) * 100) : 0;

  return { muscleChanges, overallChangePercent };
}

function getRecommendation(overallChange: number, deloadCompleted: boolean): string {
  if (deloadCompleted) {
    // User already did the deload week
    if (overallChange > 15) {
      return "Starke Fortschritte! Nächster Mesozyklus: Intensität erhöhen (Gewicht ↑, Volumen gleich).";
    }
    if (overallChange >= 5) {
      return "Gute Entwicklung! Nächster Mesozyklus: Volumen weiter steigern (+1 Set pro Hauptübung).";
    }
    return "Überprüfe dein Recovery und Ernährung für den nächsten Mesozyklus.";
  } else {
    // User skipped the deload week
    if (overallChange > 15) {
      return "Starke Fortschritte! Eine Deload-Woche hilft deinem Körper, sich zu erholen und stärker zurückzukommen.";
    }
    if (overallChange >= 5) {
      return "Gute Entwicklung! Eine Deload-Woche vor dem nächsten Zyklus kann die Leistung weiter verbessern.";
    }
    return "Eine Deload-Woche wird empfohlen, um dein Recovery zu verbessern.";
  }
}

export default function MesocycleCompletionScreen({
  mesocycle,
  userId,
  deloadCompleted,
  onStartNextMesocycle,
  onDoDeloadFirst,
}: MesocycleCompletionScreenProps) {
  const [loading, setLoading] = useState(true);
  const [muscleChanges, setMuscleChanges] = useState<MuscleVolumeChange[]>([]);
  const [overallChange, setOverallChange] = useState(0);

  useEffect(() => {
    getMesocycleVolumeData(mesocycle, userId).then((data) => {
      setMuscleChanges(data.muscleChanges);
      setOverallChange(data.overallChangePercent);
      setLoading(false);
    });
  }, [mesocycle, userId]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg space-y-6 overflow-y-auto max-h-[90vh] py-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <Trophy className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-2xl font-heading font-bold">
            Mesozyklus abgeschlossen 🏁
          </h2>
          <p className="text-sm text-muted-foreground font-mono">
            {mesocycle.duration_weeks} Wochen · {mesocycle.start_week}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Volume Progress */}
            {muscleChanges.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Volume Progress
                </h3>
                <div className="flex flex-wrap gap-2">
                  {muscleChanges.map((mc) => (
                    <div
                      key={mc.muscle}
                      className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1.5"
                    >
                      <span className="text-xs font-medium">{mc.muscle}</span>
                      {mc.changePercent > 0 ? (
                        <ArrowUp className="w-3 h-3 text-green-400" />
                      ) : mc.changePercent < 0 ? (
                        <ArrowDown className="w-3 h-3 text-red-400" />
                      ) : (
                        <Minus className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span
                        className={`text-xs font-mono font-bold ${
                          mc.changePercent > 0
                            ? "text-green-400"
                            : mc.changePercent < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {mc.changePercent > 0 ? "+" : ""}
                        {mc.changePercent}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      Gesamt
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        overallChange > 0
                          ? "text-green-400"
                          : overallChange < 0
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {overallChange > 0 ? "+" : ""}
                      {overallChange}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium leading-relaxed">
                {getRecommendation(overallChange, deloadCompleted)}
              </p>
            </div>

            {/* CTAs */}
            {deloadCompleted ? (
              /* Deload was done — single CTA */
              <button
                onClick={onStartNextMesocycle}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-mono font-bold transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              >
                Nächsten Mesozyklus starten
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              /* Deload was skipped — two options */
              <div className="space-y-3">
                <button
                  onClick={onDoDeloadFirst}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-mono font-bold transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                >
                  <Shield className="w-4 h-4" />
                  Erst Deload-Woche machen
                </button>
                <button
                  onClick={onStartNextMesocycle}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-mono font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                >
                  Deload überspringen → direkt neuer Mesozyklus
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
