import { describe, it, expect } from "vitest";
import {
  targetRirForWeek,
  suggestNextWeekSets,
  detectMrvBreach,
  COMPOUND_INCREMENT_KG,
  ISOLATION_INCREMENT_KG,
} from "@/lib/progressionEngine";
import type { WorkoutSet } from "@/lib/workoutData";
import type { RepRange } from "@/lib/workoutDb";

const ctx = (weekNumber: number, totalWeeks: number) => ({
  weekNumber,
  totalWeeks,
  isInMeso: weekNumber >= 1 && weekNumber <= totalWeeks,
  isDeload: weekNumber === totalWeeks,
});

const range = (min: number, max: number, exercise = "X"): RepRange => ({
  exercise,
  min_reps: min,
  max_reps: max,
});

describe("targetRirForWeek — RIR-Rampe übers Mesozyklus", () => {
  it("6-Wochen-Meso: 3, 2, 1, 1, 0, deload", () => {
    expect(targetRirForWeek(ctx(1, 6))).toBe(3);
    expect(targetRirForWeek(ctx(2, 6))).toBe(2);
    expect(targetRirForWeek(ctx(3, 6))).toBe(2); // mittlere Wochen plateau-nah
    expect(targetRirForWeek(ctx(4, 6))).toBe(1);
    expect(targetRirForWeek(ctx(5, 6))).toBe(0); // Peak
    expect(targetRirForWeek(ctx(6, 6))).toBe(4); // Deload
  });

  it("4-Wochen-Meso: 3, 2, 0, deload", () => {
    expect(targetRirForWeek(ctx(1, 4))).toBe(3);
    expect(targetRirForWeek(ctx(2, 4))).toBe(2);
    expect(targetRirForWeek(ctx(3, 4))).toBe(0);
    expect(targetRirForWeek(ctx(4, 4))).toBe(4);
  });

  it("ausserhalb Meso: Default-RIR 2", () => {
    expect(targetRirForWeek(ctx(0, 6))).toBe(2);
    expect(targetRirForWeek(ctx(7, 6))).toBe(2);
  });

  it("RIR bleibt im Bereich [0, 4]", () => {
    for (let w = 1; w <= 10; w++) {
      for (let t = 2; t <= 10; t++) {
        const r = targetRirForWeek(ctx(w, t));
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe("suggestNextWeekSets — Set-für-Set-Suggestion", () => {
  it("leere Vorwoche → leere Suggestion", () => {
    expect(suggestNextWeekSets([], range(8, 12), 2, "X")).toEqual([]);
  });

  it("ungeloggte Sets (reps=0,kg=0) → Range-Bottom bei kg=0", () => {
    const prev: WorkoutSet[] = [{ reps: 0, kg: 0 }, { reps: 0, kg: 0 }];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 8, kg: 0 },
      { reps: 8, kg: 0 },
    ]);
  });

  it("Standard +1 Rep wenn RIR ungefähr im Target", () => {
    const prev: WorkoutSet[] = [
      { reps: 10, kg: 50, rir: 2 },
      { reps: 10, kg: 50, rir: 2 },
    ];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 11, kg: 50 },
      { reps: 11, kg: 50 },
    ]);
  });

  it("alle Sets am Range-Top + RIR ≤ Target → +Gewicht, Reps zurück auf Min", () => {
    const prev: WorkoutSet[] = [
      { reps: 12, kg: 50, rir: 1 },
      { reps: 12, kg: 50, rir: 1 },
    ];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 8, kg: 50 + ISOLATION_INCREMENT_KG },
      { reps: 8, kg: 50 + ISOLATION_INCREMENT_KG },
    ]);
  });

  it("Compound-Übung bekommt 2.5 kg Sprung", () => {
    const prev: WorkoutSet[] = [
      { reps: 8, kg: 80, rir: 1 },
      { reps: 8, kg: 80, rir: 1 },
    ];
    const result = suggestNextWeekSets(prev, range(6, 8), 2, "Back Squat");
    expect(result).toEqual([
      { reps: 6, kg: 80 + COMPOUND_INCREMENT_KG },
      { reps: 6, kg: 80 + COMPOUND_INCREMENT_KG },
    ]);
  });

  it("hoher RIR-Überschuss → +2 Reps statt +1", () => {
    const prev: WorkoutSet[] = [
      { reps: 9, kg: 50, rir: 4 },
      { reps: 9, kg: 50, rir: 4 },
    ];
    // Target 2, avg 4 → Differenz ≥ 1.5
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 11, kg: 50 },
      { reps: 11, kg: 50 },
    ]);
  });

  it("Failure (RIR=0) bei Target ≥1 → Recovery, gleiche Werte", () => {
    const prev: WorkoutSet[] = [
      { reps: 10, kg: 50, rir: 0 },
      { reps: 9, kg: 50, rir: 1 },
    ];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 10, kg: 50 },
      { reps: 9, kg: 50 },
    ]);
  });

  it("Failure (RIR=0) bei Target 0 → keine Recovery (Peak-Woche, soll bis Failure)", () => {
    const prev: WorkoutSet[] = [{ reps: 10, kg: 50, rir: 0 }];
    const result = suggestNextWeekSets(prev, range(8, 12), 0, "X");
    // Target 0, RIR 0 → unter Target um 0 → standard +1 Rep
    expect(result[0].reps).toBe(11);
    expect(result[0].kg).toBe(50);
  });

  it("RIR unter Target → Gewicht halten, keine Rep-Erhöhung", () => {
    const prev: WorkoutSet[] = [
      { reps: 8, kg: 50, rir: 0 },
      { reps: 7, kg: 50, rir: 0 },
    ];
    // Target 2, avg 0 → unter Target um >0.5 → halten
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 8, kg: 50 },
      { reps: 7, kg: 50 },
    ]);
  });

  it("kein RIR getrackt → Default +1 Rep", () => {
    const prev: WorkoutSet[] = [
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
    ];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 11, kg: 50 },
      { reps: 11, kg: 50 },
    ]);
  });

  it("nicht alle Sets am Range-Top: Über-Max-Set wird nicht regressed", () => {
    // Ein Set über Max (14), ein Set drunter (10) → nicht allMaxed → default +1 Pfad
    const prev: WorkoutSet[] = [
      { reps: 14, kg: 50, rir: 2 },
      { reps: 10, kg: 50, rir: 2 },
    ];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result[0].reps).toBe(14); // nicht regressed
    expect(result[1].reps).toBe(11); // +1 in Range
  });

  it("alle Sets über Max → korrekt Weight-Bump + Reset auf Min (Double Progression)", () => {
    const prev: WorkoutSet[] = [
      { reps: 14, kg: 50, rir: 1 },
      { reps: 14, kg: 50, rir: 1 },
    ];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    expect(result).toEqual([
      { reps: 8, kg: 51 },
      { reps: 8, kg: 51 },
    ]);
  });

  it("ohne Rep-Range → Defaults 8-12", () => {
    const prev: WorkoutSet[] = [{ reps: 10, kg: 50, rir: 2 }];
    const result = suggestNextWeekSets(prev, undefined, 2, "X");
    expect(result[0].reps).toBe(11);
  });

  it("Gewichtssprünge werden auf 0.5 kg gerundet", () => {
    const prev: WorkoutSet[] = [{ reps: 12, kg: 22.3, rir: 1 }];
    const result = suggestNextWeekSets(prev, range(8, 12), 2, "X");
    // 22.3 + 1 = 23.3 → rounds to 23.5
    expect(result[0].kg).toBe(23.5);
  });
});

describe("detectMrvBreach — Volume-Ceiling-Detection", () => {
  it("kein Drop bei gleicher Performance → kein Breach", () => {
    const last: WorkoutSet[] = [
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
    ];
    const now: WorkoutSet[] = [
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
    ];
    expect(detectMrvBreach(now, last)).toBe(false);
  });

  it("≥15% Rep-Drop bei gleicher Last in beiden Sets → Breach", () => {
    const last: WorkoutSet[] = [
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
    ];
    const now: WorkoutSet[] = [
      { reps: 8, kg: 50 }, // 20% drop
      { reps: 8, kg: 50 }, // 20% drop
    ];
    expect(detectMrvBreach(now, last)).toBe(true);
  });

  it("Drop nur bei einem von zwei Sets → kein Breach (unter 50% Schwelle)", () => {
    // Ceil(2/2)=1, mindestens 1 Drop reicht eigentlich → Test mit 3 Sets
    const last: WorkoutSet[] = [
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
    ];
    const now: WorkoutSet[] = [
      { reps: 8, kg: 50 },
      { reps: 10, kg: 50 },
      { reps: 10, kg: 50 },
    ];
    // ceil(3/2) = 2, nur 1 Drop → kein Breach
    expect(detectMrvBreach(now, last)).toBe(false);
  });

  it("Gewichtsänderung ≥2.5% disqualifiziert Vergleich", () => {
    const last: WorkoutSet[] = [{ reps: 10, kg: 50 }];
    const now: WorkoutSet[] = [{ reps: 7, kg: 55 }]; // höhere Last
    expect(detectMrvBreach(now, last)).toBe(false);
  });

  it("leere Daten → kein Breach", () => {
    expect(detectMrvBreach([], [{ reps: 10, kg: 50 }])).toBe(false);
    expect(detectMrvBreach([{ reps: 10, kg: 50 }], [])).toBe(false);
  });
});
