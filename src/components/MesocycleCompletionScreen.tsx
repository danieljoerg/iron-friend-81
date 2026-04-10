import { useState, useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, Minus, Trophy, ChevronRight, Shield, Share2, Dumbbell, Check, Link } from "lucide-react";
import { EXERCISE_MUSCLE_MAP, type MuscleGroup } from "@/lib/workoutData";
import { supabase } from "@/integrations/supabase/client";
import type { Mesocycle } from "@/lib/workoutDb";
import { getMesocycleWeekInfo } from "@/lib/workoutDb";
import { formatDateString } from "@/lib/workoutData";

interface MesocycleCompletionScreenProps {
  mesocycle: Mesocycle;
  userId: string;
  displayName?: string | null;
  deloadCompleted: boolean;
  onStartNextMesocycle: () => void;
  onDoDeloadFirst: () => void;
}

type MuscleDetail = {
  muscle: string;
  startVolume: number;
  endVolume: number;
  changePercent: number;
  startMaxWeight: number;
  endMaxWeight: number;
  weightChange: number;
  totalSets: number;
  topExercise: string;
  topExerciseEndVol: number;
};

type MesoSummary = {
  muscleDetails: MuscleDetail[];
  overallChangePercent: number;
  totalVolume: number;
  totalSets: number;
  trainingWeeks: number;
  overallMaxWeight: number;
  bestMuscle: string | null;
};

async function getMesocycleDetailedData(
  mesocycle: Mesocycle,
  userId: string
): Promise<MesoSummary> {
  const startDate = new Date(mesocycle.start_week + "T00:00:00");
  const allWeekStarts: string[] = [];
  for (let i = 0; i < mesocycle.duration_weeks; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);
    allWeekStarts.push(formatDateString(d));
  }

  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .in("week_start", allWeekStarts)
    .order("week_start");

  if (!weeks || weeks.length < 2)
    return { muscleDetails: [], overallChangePercent: 0, totalVolume: 0, totalSets: 0, trainingWeeks: 0, overallMaxWeight: 0, bestMuscle: null };

  const weekIds = weeks.map((w) => w.id);

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("week_id, exercise, sets")
    .eq("user_id", userId)
    .in("week_id", weekIds);

  if (!exercises || exercises.length === 0)
    return { muscleDetails: [], overallChangePercent: 0, totalVolume: 0, totalSets: 0, trainingWeeks: 0, overallMaxWeight: 0, bestMuscle: null };

  const trainingWeeks = weeks.filter((w) => {
    const info = getMesocycleWeekInfo(mesocycle, w.week_start);
    return info.isInMeso && !info.isDeload;
  });

  const firstWeek = trainingWeeks[0];
  const lastWeek = trainingWeeks[trainingWeeks.length - 1];

  if (!firstWeek || !lastWeek || firstWeek.id === lastWeek.id)
    return { muscleDetails: [], overallChangePercent: 0, totalVolume: 0, totalSets: 0, trainingWeeks: trainingWeeks.length, overallMaxWeight: 0, bestMuscle: null };

  // Per-week, per-muscle volume and max weight
  const calcWeekData = (weekId: string) => {
    const volumes: Record<string, number> = {};
    const maxWeights: Record<string, number> = {};
    const exVolumes: Record<string, Record<string, number>> = {}; // muscle -> exercise -> volume
    const weekExs = exercises.filter((e) => e.week_id === weekId);
    weekExs.forEach((e) => {
      const muscle = EXERCISE_MUSCLE_MAP[e.exercise];
      if (!muscle) return;
      const sets = (e.sets as any[]) || [];
      let vol = 0;
      sets.forEach((s: any) => {
        vol += (s.reps || 0) * (s.kg || 0);
        if ((s.kg || 0) > (maxWeights[muscle] || 0)) maxWeights[muscle] = s.kg;
      });
      volumes[muscle] = (volumes[muscle] || 0) + vol;
      if (!exVolumes[muscle]) exVolumes[muscle] = {};
      exVolumes[muscle][e.exercise] = (exVolumes[muscle][e.exercise] || 0) + vol;
    });
    return { volumes, maxWeights, exVolumes };
  };

  const startData = calcWeekData(firstWeek.id);
  const endData = calcWeekData(lastWeek.id);

  // Total stats across all training weeks
  let totalVolume = 0;
  let totalSets = 0;
  let overallMaxWeight = 0;
  const trainingWeekIds = new Set(trainingWeeks.map((w) => w.id));
  exercises.forEach((e) => {
    if (!trainingWeekIds.has(e.week_id)) return;
    const sets = (e.sets as any[]) || [];
    sets.forEach((s: any) => {
      totalVolume += (s.reps || 0) * (s.kg || 0);
      totalSets++;
      if ((s.kg || 0) > overallMaxWeight) overallMaxWeight = s.kg;
    });
  });

  const allMuscles = new Set([...Object.keys(startData.volumes), ...Object.keys(endData.volumes)]);
  const muscleDetails: MuscleDetail[] = [];

  allMuscles.forEach((muscle) => {
    const sv = startData.volumes[muscle] || 0;
    const ev = endData.volumes[muscle] || 0;
    if (sv === 0 && ev === 0) return;
    const change = sv > 0 ? ((ev - sv) / sv) * 100 : ev > 0 ? 100 : 0;
    const smw = startData.maxWeights[muscle] || 0;
    const emw = endData.maxWeights[muscle] || 0;

    // Find top exercise by end volume
    const endExVols = endData.exVolumes[muscle] || {};
    const topEx = Object.entries(endExVols).sort((a, b) => b[1] - a[1])[0];

    // Count total sets for this muscle across all training weeks
    let muscleSets = 0;
    exercises.forEach((e) => {
      if (!trainingWeekIds.has(e.week_id)) return;
      if (EXERCISE_MUSCLE_MAP[e.exercise] !== muscle) return;
      muscleSets += ((e.sets as any[]) || []).length;
    });

    muscleDetails.push({
      muscle,
      startVolume: Math.round(sv),
      endVolume: Math.round(ev),
      changePercent: Math.round(change),
      startMaxWeight: smw,
      endMaxWeight: emw,
      weightChange: emw - smw,
      totalSets: muscleSets,
      topExercise: topEx ? topEx[0] : "",
      topExerciseEndVol: topEx ? Math.round(topEx[1]) : 0,
    });
  });

  muscleDetails.sort((a, b) => b.changePercent - a.changePercent);

  const totalStart = Object.values(startData.volumes).reduce((s, v) => s + v, 0);
  const totalEnd = Object.values(endData.volumes).reduce((s, v) => s + v, 0);
  const overallChangePercent = totalStart > 0 ? Math.round(((totalEnd - totalStart) / totalStart) * 100) : 0;

  const bestMuscle = muscleDetails.length > 0 ? muscleDetails[0].muscle : null;

  return { muscleDetails, overallChangePercent, totalVolume: Math.round(totalVolume), totalSets, trainingWeeks: trainingWeeks.length, overallMaxWeight, bestMuscle };
}

function getRecommendation(overallChange: number, deloadCompleted: boolean): string {
  if (deloadCompleted) {
    if (overallChange > 15) return "Starke Fortschritte! Nächster Mesozyklus: Intensität erhöhen (Gewicht ↑, Volumen gleich).";
    if (overallChange >= 5) return "Gute Entwicklung! Nächster Mesozyklus: Volumen weiter steigern (+1 Set pro Hauptübung).";
    return "Überprüfe dein Recovery und Ernährung für den nächsten Mesozyklus.";
  } else {
    if (overallChange > 15) return "Starke Fortschritte! Eine Deload-Woche hilft deinem Körper, sich zu erholen und stärker zurückzukommen.";
    if (overallChange >= 5) return "Gute Entwicklung! Eine Deload-Woche vor dem nächsten Zyklus kann die Leistung weiter verbessern.";
    return "Eine Deload-Woche wird empfohlen, um dein Recovery zu verbessern.";
  }
}

export default function MesocycleCompletionScreen({
  mesocycle,
  userId,
  displayName,
  deloadCompleted,
  onStartNextMesocycle,
  onDoDeloadFirst,
}: MesocycleCompletionScreenProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MesoSummary | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getMesocycleDetailedData(mesocycle, userId).then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, [mesocycle, userId]);

  const handleShare = async () => {
    if (!summary) return;
    setSharing(true);
    try {
      // Save to DB
      const { data, error } = await supabase
        .from("shared_mesocycle_results")
        .insert({
          user_id: userId,
          display_name: displayName || null,
          duration_weeks: mesocycle.duration_weeks,
          start_week: mesocycle.start_week,
          total_volume: summary.totalVolume,
          total_sets: summary.totalSets,
          overall_max_weight: summary.overallMaxWeight,
          overall_change_percent: summary.overallChangePercent,
          muscle_details: summary.muscleDetails,
        } as any)
        .select("id")
        .single();

      if (error || !data) {
        console.error("Failed to share:", error);
        setSharing(false);
        return;
      }

      const url = `${window.location.origin}/shared/${data.id}`;
      setShareUrl(url);

      // Try native share
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Mein Mesozyklus-Ergebnis 💪",
            text: `Schau dir meine Fortschritte an: ${summary.overallChangePercent > 0 ? "+" : ""}${summary.overallChangePercent}% Volumen-Steigerung!`,
            url,
          });
        } catch { /* user cancelled */ }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error("Share error:", err);
    }
    setSharing(false);
  };

  const s = summary;
  const overallChange = s?.overallChangePercent ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] py-4">
        {/* Shareable area */}
        <div className="space-y-5 bg-background rounded-2xl p-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <Trophy className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-2xl font-heading font-bold">Mesozyklus abgeschlossen 🏁</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {mesocycle.duration_weeks} Wochen · ab {new Date(mesocycle.start_week + "T00:00:00").toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : s && (
            <>
              {/* Headline stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-wider">Gesamt Vol.</p>
                  <p className="font-mono text-lg font-bold text-foreground">{(s.totalVolume / 1000).toFixed(0)}t</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-wider">Total Sets</p>
                  <p className="font-mono text-lg font-bold text-foreground">{s.totalSets}</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-wider">Max Gewicht</p>
                  <p className="font-mono text-lg font-bold text-foreground">{s.overallMaxWeight}kg</p>
                </div>
              </div>

              {/* Overall change badge */}
              <div className="flex items-center justify-center">
                <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-mono font-bold text-sm ${overallChange > 0 ? "bg-primary/15 text-primary" : overallChange < 0 ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                  {overallChange > 0 ? <ArrowUp className="w-4 h-4" /> : overallChange < 0 ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  Volumen {overallChange > 0 ? "+" : ""}{overallChange}% gestiegen
                </div>
              </div>

              {/* Per-muscle detailed cards */}
              {s.muscleDetails.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Fortschritt pro Muskelgruppe
                  </h3>
                  {s.muscleDetails.map((md) => (
                    <div key={md.muscle} className="rounded-xl border border-border bg-card p-3 space-y-2">
                      {/* Muscle header with change */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-bold">{md.muscle}</span>
                        </div>
                        <span className={`font-mono text-sm font-bold ${md.changePercent > 0 ? "text-primary" : md.changePercent < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {md.changePercent > 0 ? "+" : ""}{md.changePercent}%
                        </span>
                      </div>

                      {/* Detail row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[9px] font-mono text-muted-foreground uppercase">Volumen</p>
                          <p className="text-xs font-mono">
                            <span className="text-muted-foreground">{md.startVolume.toLocaleString()}</span>
                            <span className="text-muted-foreground mx-0.5">→</span>
                            <span className="font-bold text-foreground">{md.endVolume.toLocaleString()}</span>
                            <span className="text-muted-foreground text-[9px]"> kg</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono text-muted-foreground uppercase">Max Gew.</p>
                          <p className="text-xs font-mono">
                            <span className="text-muted-foreground">{md.startMaxWeight}</span>
                            <span className="text-muted-foreground mx-0.5">→</span>
                            <span className="font-bold text-foreground">{md.endMaxWeight}</span>
                            <span className="text-muted-foreground text-[9px]"> kg</span>
                            {md.weightChange !== 0 && (
                              <span className={`ml-1 text-[9px] font-bold ${md.weightChange > 0 ? "text-primary" : "text-destructive"}`}>
                                {md.weightChange > 0 ? "+" : ""}{md.weightChange}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-mono text-muted-foreground uppercase">Sets</p>
                          <p className="text-xs font-mono font-bold text-foreground">{md.totalSets}</p>
                        </div>
                      </div>

                      {/* Top exercise */}
                      {md.topExercise && (
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Top: {md.topExercise}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Branding for shared image */}
              <p className="text-center text-[10px] font-mono text-muted-foreground/50">
                Lift Log · Progressive Overload Tracker
              </p>
            </>
          )}
        </div>

        {/* Actions (outside shareable area) */}
        {!loading && s && (
          <div className="space-y-3 mt-5">
            {/* Recommendation */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium leading-relaxed">
                {getRecommendation(overallChange, deloadCompleted)}
              </p>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-mono font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? "Wird erstellt..." : "Ergebnis teilen"}
            </button>

            {/* CTAs */}
            {deloadCompleted ? (
              <button
                onClick={onStartNextMesocycle}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-mono font-bold transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
              >
                Nächsten Mesozyklus starten
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
