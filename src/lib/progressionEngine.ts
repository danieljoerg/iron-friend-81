// Auto-Progression Engine
//
// Drei Mechaniken, eine API:
// 1. Wochen-Rampe: Target-RIR sinkt 3 → 2 → 1 → 0 über den Meso, Deload-Woche separat.
// 2. Set-Suggestion: pro Set vorschlagen basierend auf letzter Woche + Target-RIR + Rep-Range.
//    - Reps am Range-Top + RIR ≤ Target → +Gewicht, Reps zurück auf Range-Bottom
//    - RIR deutlich über Target → +Reps
//    - RIR unter Target (zu schwer) → Gewicht halten
//    - Failure (RIR=0) während Target ≥ 1 → Recovery, Werte halten
// 3. Meso-Reset: 90% des Peaks bei neuem Meso (existing logic in getPeakWeekExercisesScaled).

import type { WorkoutSet } from "./workoutData";
import type { RepRange } from "./workoutDb";

export const COMPOUND_INCREMENT_KG = 2.5;
export const ISOLATION_INCREMENT_KG = 1;

// Compound-Liste deckt grosse mehrgelenkige Lifts ab (höherer Plattensprung sinnvoll)
export const COMPOUND_EXERCISES = new Set<string>([
  "Flat Barbell Bench Press",
  "Incline Barbell Bench Press",
  "Decline Barbell Bench Press",
  "Barbell Row",
  "Pendlay Row",
  "T-Bar Row",
  "Overhead Press (Barbell)",
  "Back Squat",
  "Front Squat",
  "Hack Squat",
  "Leg Press",
  "Conventional Deadlift",
  "Sumo Deadlift",
  "Trap Bar Deadlift",
  "Hip Thrust (Barbell)",
  "Close Grip Bench Press",
]);

export type ProgressionContext = {
  weekNumber: number;       // 1-indexed innerhalb des Mesos
  totalWeeks: number;        // inkl. Deload-Woche
  isDeload: boolean;
  isInMeso: boolean;
};

export type SetSuggestion = { reps: number; kg: number };

/**
 * Target-RIR pro Woche im Meso.
 * Wave-Modell: Woche 1 startet bei RIR 3, sinkt um 1 pro Woche, Peak-Woche = 0.
 * Deload-Woche: hoher RIR (4), Loads via getPeakWeekExercisesScaled separat.
 *
 * Beispiel 6W-Meso: 3, 2, 1, 1, 0, deload
 * Beispiel 4W-Meso: 3, 2, 1, deload
 */
export function targetRirForWeek(ctx: ProgressionContext): number {
  if (!ctx.isInMeso) return 2; // Default ausserhalb Meso
  if (ctx.isDeload) return 4;
  const trainingWeeks = ctx.totalWeeks - 1; // ohne Deload
  const idx = ctx.weekNumber - 1; // 0-indexed
  // Lineare Rampe: erste Woche RIR 3, letzte Trainingswoche RIR 0
  // Bei langen Mesos (5-6W) plateaut RIR bei 1 für eine Woche, bevor 0.
  if (trainingWeeks <= 1) return 0;
  const startRir = 3;
  const ramp = startRir - Math.round((idx / (trainingWeeks - 1)) * startRir);
  return Math.max(0, Math.min(3, ramp));
}

/**
 * Hauptfunktion: berechnet die vorgeschlagenen Sets für die nächste Woche.
 *
 * @param prevSets    Sets der Vorwoche (oder leere Liste → Defaults)
 * @param repRange    Optionale Rep-Range pro Übung
 * @param targetRir   Ziel-RIR der nächsten Woche
 * @param exerciseName Für Compound/Isolation-Erkennung (Plattensprung)
 */
export function suggestNextWeekSets(
  prevSets: WorkoutSet[],
  repRange: RepRange | undefined,
  targetRir: number,
  exerciseName: string
): SetSuggestion[] {
  if (!prevSets || prevSets.length === 0) return [];

  const min = repRange?.min_reps ?? 8;
  const max = repRange?.max_reps ?? 12;
  const increment = COMPOUND_EXERCISES.has(exerciseName)
    ? COMPOUND_INCREMENT_KG
    : ISOLATION_INCREMENT_KG;

  // Sets ohne Daten (frische, ungeloggte) → unverändert mit Range-Bottom
  // RIR-Aggregat über alle geloggten Sets
  const loggedSets = prevSets.filter((s) => s.reps > 0 && s.kg > 0);
  const ratedSets = loggedSets.filter((s) => s.rir !== undefined && s.rir !== null);
  const hasRirData = ratedSets.length > 0;
  const anyFailure = hasRirData && ratedSets.some((s) => s.rir === 0);
  const avgRir = hasRirData
    ? ratedSets.reduce((sum, s) => sum + (s.rir as number), 0) / ratedSets.length
    : null;
  const allMaxed = loggedSets.length > 0 && loggedSets.every((s) => s.reps >= max);

  return prevSets.map((s) => {
    // Set wurde letzte Woche nicht geloggt → Bottom-of-Range, gleiches Gewicht (oder 0)
    if (s.reps === 0 && s.kg === 0) return { reps: min, kg: 0 };

    // Failure trotz Target ≥ 1 → Recovery, gleiche Werte
    if (anyFailure && targetRir >= 1) {
      return { reps: s.reps, kg: s.kg };
    }

    // Alle Sets am Range-Top + RIR im/unter Target → Gewicht hoch, Reps zurück
    if (allMaxed && avgRir !== null && avgRir <= targetRir + 0.5) {
      return { reps: min, kg: roundToPlate(s.kg + increment) };
    }

    // RIR deutlich über Target (Reserve da) → +2 Reps, Cap am Max
    if (avgRir !== null && avgRir >= targetRir + 1.5) {
      return { reps: nextRepTarget(s.reps, 2, max), kg: s.kg };
    }

    // RIR unter Target (zu schwer) → halten
    if (avgRir !== null && avgRir < targetRir - 0.5) {
      return { reps: s.reps, kg: s.kg };
    }

    // Default: +1 Rep
    return { reps: nextRepTarget(s.reps, 1, max), kg: s.kg };
  });
}

function nextRepTarget(currentReps: number, step: number, max: number): number {
  if (currentReps >= max) return currentReps; // Nie regress
  return Math.min(currentReps + step, max);
}

function roundToPlate(kg: number): number {
  // Auf 0.5 kg runden (kleinster Plattensprung mit Microplates)
  return Math.round(kg * 2) / 2;
}

/**
 * MRV-Detection: hat der User seinen Volume-Ceiling diese Woche überschritten?
 * Heuristik aus dem Forschungs-Doc: zwei aufeinanderfolgende Sessions mit Rep-Drop
 * von ≥15% bei gleichem Gewicht → MRV-Flag.
 *
 * Diese Funktion ist *pro Übung* — die UI aggregiert pro Muskel.
 */
export function detectMrvBreach(
  thisWeek: WorkoutSet[],
  lastWeek: WorkoutSet[]
): boolean {
  if (thisWeek.length === 0 || lastWeek.length === 0) return false;
  // Match Set-Positionen
  let breachCount = 0;
  for (let i = 0; i < Math.min(thisWeek.length, lastWeek.length); i++) {
    const t = thisWeek[i];
    const l = lastWeek[i];
    if (!t || !l || t.kg === 0 || l.kg === 0) continue;
    // Gleiche Last (±2.5%), Rep-Drop ≥15%
    const loadEqual = Math.abs(t.kg - l.kg) / l.kg < 0.025;
    const repDrop = l.reps > 0 ? (l.reps - t.reps) / l.reps : 0;
    if (loadEqual && repDrop >= 0.15) breachCount++;
  }
  // Mindestens die Hälfte der Sets dropt → Flag
  return breachCount >= Math.ceil(thisWeek.length / 2);
}
