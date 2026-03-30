import { supabase } from "@/integrations/supabase/client";

export type RepRange = { exercise: string; min_reps: number; max_reps: number; youtube_url?: string };

// ===== Mesocycle functions =====

export type Mesocycle = {
  id: string;
  user_id: string;
  start_week: string;
  duration_weeks: number;
  created_at: string;
};

export async function getActiveMesocycle(userId: string): Promise<Mesocycle | null> {
  const { data } = await supabase
    .from("mesocycles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1) as any;
  if (!data || data.length === 0) return null;
  return data[0] as Mesocycle;
}

export async function createMesocycle(userId: string, startWeek: string, durationWeeks: number): Promise<Mesocycle> {
  const { data } = await supabase
    .from("mesocycles")
    .insert({ user_id: userId, start_week: startWeek, duration_weeks: durationWeeks } as any)
    .select("*")
    .single() as any;
  return data as Mesocycle;
}

export async function deleteMesocycle(mesocycleId: string): Promise<void> {
  await supabase.from("mesocycles").delete().eq("id", mesocycleId) as any;
}

export function getMesocycleWeekInfo(mesocycle: Mesocycle, currentWeekStart: string): { weekNumber: number; totalWeeks: number; isDeload: boolean; isInMeso: boolean } {
  const start = new Date(mesocycle.start_week + "T00:00:00");
  const current = new Date(currentWeekStart + "T00:00:00");
  const diffMs = current.getTime() - start.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  const weekNumber = diffWeeks + 1;
  const isInMeso = weekNumber >= 1 && weekNumber <= mesocycle.duration_weeks;
  const isDeload = isInMeso && weekNumber === mesocycle.duration_weeks;
  return { weekNumber, totalWeeks: mesocycle.duration_weeks, isDeload, isInMeso };
}

export function computeDeloadTargets(prevSets: { reps: number; kg: number }[]): { reps: number; kg: number }[] {
  return prevSets.map((s) => ({
    reps: s.reps,
    kg: Math.round(s.kg * 0.55 * 2) / 2, // ~55% weight, rounded to 0.5
  }));
}

export async function getRepRangesDb(userId: string): Promise<Record<string, RepRange>> {
  const { data } = await supabase
    .from("exercise_rep_ranges")
    .select("*")
    .eq("user_id", userId);
  const map: Record<string, RepRange> = {};
  (data || []).forEach((r: any) => {
    map[r.exercise] = { exercise: r.exercise, min_reps: r.min_reps, max_reps: r.max_reps, youtube_url: r.youtube_url || undefined };
  });
  return map;
}

export async function setRepRangeDb(userId: string, exercise: string, minReps: number, maxReps: number): Promise<void> {
  await supabase
    .from("exercise_rep_ranges")
    .upsert({ user_id: userId, exercise, min_reps: minReps, max_reps: maxReps } as any, { onConflict: "user_id,exercise" });
}

export async function setYoutubeUrlDb(userId: string, exercise: string, youtubeUrl: string | null): Promise<void> {
  await supabase
    .from("exercise_rep_ranges")
    .upsert({ user_id: userId, exercise, youtube_url: youtubeUrl } as any, { onConflict: "user_id,exercise" });
}
import { FULL_DAYS, EXERCISE_MUSCLE_MAP, MUSCLE_GROUPS, formatDateString, type WeekLog, type DayLog, type ExerciseLog, type WorkoutSet, type MuscleGroup } from "./workoutData";

// Double Progression: increase reps first, then weight
const COMPOUND_INCREMENT = 2.5;
const ISOLATION_INCREMENT = 1;
const COMPOUND_EXERCISES = new Set([
  "Flat Barbell Bench Press", "Incline Barbell Bench Press", "Decline Barbell Bench Press",
  "Barbell Row", "Pendlay Row", "T-Bar Row",
  "Overhead Press (Barbell)", "Back Squat", "Front Squat", "Hack Squat", "Leg Press",
  "Conventional Deadlift", "Sumo Deadlift", "Trap Bar Deadlift",
  "Hip Thrust (Barbell)", "Close Grip Bench Press",
]);

export type ExerciseTarget = { reps: number; kg: number };

export function computeTargets(
  prevSets: WorkoutSet[],
  repRange: RepRange | undefined
): ExerciseTarget[] {
  if (!prevSets || prevSets.length === 0) return [];
  const min = repRange?.min_reps ?? 8;
  const max = repRange?.max_reps ?? 12;
  const exercise = repRange?.exercise ?? "";
  const increment = COMPOUND_EXERCISES.has(exercise) ? COMPOUND_INCREMENT : ISOLATION_INCREMENT;

  // RIR-aware progression:
  // - If any set had RIR 0 (failure), don't increase → repeat same targets
  // - If average RIR >= 3, push harder: +2 reps or weight bump
  // - If all sets hit max reps with RIR >= 1 → increase weight
  // - Default (no RIR data): standard double progression
  const hasRirData = prevSets.some((s) => s.rir !== undefined && s.rir !== null);
  const anyFailure = hasRirData && prevSets.some((s) => s.rir === 0);
  const avgRir = hasRirData
    ? prevSets.reduce((sum, s) => sum + (s.rir ?? 2), 0) / prevSets.length
    : null;

  const allMaxed = prevSets.every((s) => s.reps >= max);
  const getNextRepTarget = (currentReps: number, step: number) => {
    // If actual performance is already above configured max, never regress it
    if (currentReps >= max) return currentReps;
    return Math.min(currentReps + step, max);
  };

  return prevSets.map((s) => {
    if (s.reps === 0 && s.kg === 0) return { reps: min, kg: 0 };

    // Hit failure last time → repeat same target (recovery)
    if (anyFailure) {
      return { reps: s.reps, kg: s.kg };
    }

    // All sets at max reps → weight bump
    if (allMaxed) {
      return { reps: min, kg: s.kg + increment };
    }

    // Lots of reserve (RIR >= 3) → push +2 reps instead of +1
    if (avgRir !== null && avgRir >= 3) {
      return { reps: getNextRepTarget(s.reps, 2), kg: s.kg };
    }

    // Standard: +1 rep
    return { reps: getNextRepTarget(s.reps, 1), kg: s.kg };
  });
}

// Detect stagnation: returns number of consecutive weeks with no volume increase
export async function detectStagnation(
  exercise: string,
  userId: string
): Promise<number> {
  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(5);

  if (!weeks || weeks.length < 2) return 0;

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("week_id, sets")
    .eq("user_id", userId)
    .eq("exercise", exercise)
    .in("week_id", weeks.map((w) => w.id));

  if (!exercises) return 0;

  const volumes = weeks.map((w) => {
    const exs = exercises.filter((e) => e.week_id === w.id);
    let vol = 0;
    exs.forEach((e) => {
      ((e.sets as any[]) || []).forEach((s: any) => {
        vol += (s.reps || 0) * (s.kg || 0);
      });
    });
    return vol;
  });

  // Count consecutive weeks from most recent where volume didn't increase
  let stagnant = 0;
  for (let i = 0; i < volumes.length - 1; i++) {
    if (volumes[i] <= volumes[i + 1] && volumes[i] > 0) {
      stagnant++;
    } else {
      break;
    }
  }
  return stagnant;
}

// Suggest deload: returns true if user has been training 4+ consecutive weeks
export async function shouldDeload(userId: string): Promise<boolean> {
  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("week_start")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(6);

  if (!weeks || weeks.length < 4) return false;

  // Check if the last 4 weeks are consecutive
  for (let i = 0; i < 3; i++) {
    const d1 = new Date(weeks[i].week_start);
    const d2 = new Date(weeks[i + 1].week_start);
    const diffDays = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.abs(diffDays - 7) > 1) return false;
  }

  return weeks.length >= 4;
}

export async function getPreviousWeekData(weekStart: string, userId: string): Promise<Record<string, ExerciseLog[]>> {
  // Find the most recent previous week that actually has exercises
  const { data: prevWeeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start, workout_exercises(id)")
    .eq("user_id", userId)
    .lt("week_start", weekStart)
    .order("week_start", { ascending: false })
    .limit(10);

  const prevWeek = prevWeeks?.find((w: any) => w.workout_exercises && w.workout_exercises.length > 0);
  if (!prevWeek) return {};

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("day, exercise, sets, sort_order")
    .eq("week_id", prevWeek.id)
    .order("sort_order");

  if (!exercises) return {};

  const result: Record<string, ExerciseLog[]> = {};
  for (const day of FULL_DAYS) {
    const dayExs = exercises.filter((e) => e.day === day);
    // Deduplicate by exercise name
    const seen = new Set<string>();
    const unique = dayExs.filter((e) => {
      if (seen.has(e.exercise)) return false;
      seen.add(e.exercise);
      return true;
    });
    result[day] = unique.map((e) => ({ exercise: e.exercise, sets: (e.sets as any[]) || [], supersetWithNext: (e as any).superset_with_next || false, note: (e as any).note || undefined }));
  }
  return result;
}

// Simple in-flight deduplication to prevent concurrent getOrCreateWeekDb calls
const _weekLocks = new Map<string, Promise<WeekLog>>();

export async function getOrCreateWeekDb(weekStart: string, userId: string): Promise<WeekLog> {
  const lockKey = `${userId}:${weekStart}`;
  const existing = _weekLocks.get(lockKey);
  if (existing) return existing;

  const promise = _getOrCreateWeekDbImpl(weekStart, userId).finally(() => {
    _weekLocks.delete(lockKey);
  });
  _weekLocks.set(lockKey, promise);
  return promise;
}

async function _getOrCreateWeekDbImpl(weekStart: string, userId: string): Promise<WeekLog> {
  console.log("[getOrCreateWeek] START for", weekStart);
  
  // Get or create week record
  let { data: weekRow } = await supabase
    .from("workout_weeks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (!weekRow) {
    console.log("[getOrCreateWeek] Creating new week row for", weekStart);
    const { data: newWeek } = await supabase
      .from("workout_weeks")
      .insert({ user_id: userId, week_start: weekStart })
      .select("id")
      .single();
    weekRow = newWeek;
  }

  if (!weekRow) {
    console.error("[getOrCreateWeek] Failed to get/create week row for", weekStart);
    return { weekStart, days: FULL_DAYS.map((day) => ({ day, exercises: [] })) };
  }

  console.log("[getOrCreateWeek] Week row id:", weekRow.id);

  // Get exercises for this week
  const { data: exercises, error: exErr } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("week_id", weekRow.id)
    .order("sort_order");

  console.log("[getOrCreateWeek] Found", exercises?.length ?? 0, "exercises for week", weekStart, exErr ? `ERROR: ${exErr.message}` : "");

  // If week has no exercises, copy structure from most recent previous week
  if (!exercises || exercises.length === 0) {
    // Double-check no exercises were inserted by a concurrent call
    const { count } = await supabase
      .from("workout_exercises")
      .select("id", { count: "exact", head: true })
      .eq("week_id", weekRow.id);

    console.log("[getOrCreateWeek] Double-check count:", count);

    if ((count ?? 0) === 0) {
      // Find the most recent previous week that HAS exercises (skip empty orphan weeks)
      const { data: prevWeeks } = await supabase
        .from("workout_weeks")
        .select("id, week_start, workout_exercises(id)")
        .eq("user_id", userId)
        .lt("week_start", weekStart)
        .order("week_start", { ascending: false })
        .limit(10);

      // Find first previous week that actually has exercises
      const prevWeekWithExercises = prevWeeks?.find((w: any) => 
        w.workout_exercises && w.workout_exercises.length > 0
      );
      
      console.log("[getOrCreateWeek] Previous week with exercises:", prevWeekWithExercises?.week_start, prevWeekWithExercises?.id);

      if (prevWeekWithExercises) {
        const { data: prevExercises } = await supabase
          .from("workout_exercises")
          .select("day, exercise, sets, sort_order, superset_with_next, note")
          .eq("week_id", prevWeekWithExercises.id)
          .order("sort_order");

        console.log("[getOrCreateWeek] Previous week exercises:", prevExercises?.length ?? 0);

        if (prevExercises && prevExercises.length > 0) {
          // Deduplicate prev exercises per day+exercise name
          const dedupedPrev: typeof prevExercises = [];
          const seenKeys = new Set<string>();
          for (const e of prevExercises) {
            const key = `${e.day}:${e.exercise}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              dedupedPrev.push(e);
            }
          }

          console.log("[getOrCreateWeek] After dedup:", dedupedPrev.length, "exercises to copy");

          const rows = dedupedPrev.map((e, idx) => ({
            week_id: weekRow!.id,
            user_id: userId,
            day: e.day,
            exercise: e.exercise,
            sets: ((e.sets as any[]) || []).map((s: any) => ({ reps: s.reps || 0, kg: s.kg || 0 })),
            sort_order: idx,
            superset_with_next: (e as any).superset_with_next || false,
            note: (e as any).note || null,
          }));
          const { error: insertErr } = await supabase.from("workout_exercises").insert(rows);
          console.log("[getOrCreateWeek] Insert result:", insertErr ? `ERROR: ${insertErr.message}` : "OK");

          // Build result from copied exercises with last week's values
          const days: DayLog[] = FULL_DAYS.map((day) => {
            const dayExercises: ExerciseLog[] = dedupedPrev
              .filter((e) => e.day === day)
              .map((e) => ({
                exercise: e.exercise,
                sets: ((e.sets as any[]) || []).map((s: any) => ({ reps: s.reps || 0, kg: s.kg || 0 })),
                supersetWithNext: (e as any).superset_with_next || false,
                note: (e as any).note || undefined,
              }));
            return { day, exercises: dayExercises };
          });
          return { weekStart, days };
        }
      }
    }
  }

  // Get days_done, training_days, and readiness from week record
  const { data: weekMeta } = await supabase
    .from("workout_weeks")
    .select("*")
    .eq("id", weekRow.id)
    .single();
  const daysDone: string[] = ((weekMeta as any)?.days_done as string[]) || [];
  const weekTrainingDays: string[] | null = (weekMeta as any)?.training_days ?? null;
  const readinessMap: Record<string, number> = ((weekMeta as any)?.readiness as Record<string, number>) || {};

  // Build the WeekLog structure, deduplicating exercises by day+sort_order
  const days: DayLog[] = FULL_DAYS.map((day) => {
    const dayExs = (exercises || []).filter((e) => e.day === day);
    // Deduplicate: keep only one entry per unique exercise name per day
    const seenExercises = new Set<string>();
    const uniqueExs = dayExs.filter((e) => {
      if (seenExercises.has(e.exercise)) return false;
      seenExercises.add(e.exercise);
      return true;
    });
    const dayExercises: ExerciseLog[] = uniqueExs
      .map((e) => ({
        exercise: e.exercise,
        sets: (e.sets as any[]) || [],
        supersetWithNext: (e as any).superset_with_next || false,
        note: (e as any).note || undefined,
      }));
    return { day, exercises: dayExercises, done: daysDone.includes(day), readiness: readinessMap[day] };
  });

  return { weekStart, days, trainingDays: weekTrainingDays };
}

export async function saveWeekDb(week: WeekLog, userId: string): Promise<void> {
  // Get or create week record
  let { data: weekRow } = await supabase
    .from("workout_weeks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", week.weekStart)
    .maybeSingle();

  if (!weekRow) {
    const { data: newWeek } = await supabase
      .from("workout_weeks")
      .insert({ user_id: userId, week_start: week.weekStart })
      .select("id")
      .single();
    weekRow = newWeek;
  }

  if (!weekRow) return;

  // Save days_done, training_days, and readiness status
  const daysDone = week.days.filter((d) => d.done).map((d) => d.day);
  const readinessMap: Record<string, number> = {};
  week.days.forEach((d) => { if (d.readiness) readinessMap[d.day] = d.readiness; });
  await supabase
    .from("workout_weeks")
    .update({ days_done: daysDone, training_days: week.trainingDays ?? null, readiness: readinessMap } as any)
    .eq("id", weekRow.id);

  // Delete existing exercises for this week
  await supabase
    .from("workout_exercises")
    .delete()
    .eq("week_id", weekRow.id);

  // Insert all exercises (deduplicate: one entry per day+exercise name)
  const rows: any[] = [];
  week.days.forEach((day) => {
    const seenExercises = new Set<string>();
    day.exercises.forEach((ex, idx) => {
      // Skip duplicate exercise names within the same day
      if (seenExercises.has(ex.exercise)) return;
      seenExercises.add(ex.exercise);
      rows.push({
        week_id: weekRow!.id,
        user_id: userId,
        day: day.day,
        exercise: ex.exercise,
        sets: ex.sets,
        sort_order: rows.filter(r => r.day === day.day).length,
        superset_with_next: ex.supersetWithNext || false,
        note: ex.note || null,
      });
    });
  });

  if (rows.length > 0) {
    await supabase.from("workout_exercises").insert(rows);
  }
}

/**
 * Complete a week and prepare the next week with copied exercises.
 * Returns the next week's WeekLog ready for display.
 */
export async function completeWeekAndPrepareNext(
  completedWeek: WeekLog,
  userId: string
): Promise<WeekLog> {
  // 1. Save the completed week
  await saveWeekDb(completedWeek, userId);

  // 2. Calculate next week start
  const d = new Date(completedWeek.weekStart + "T00:00:00");
  d.setDate(d.getDate() + 7);
  const nextWeekStart = formatDateString(d);

  // 3. Get or create the next week row
  let { data: nextWeekRow } = await supabase
    .from("workout_weeks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", nextWeekStart)
    .maybeSingle();

  if (!nextWeekRow) {
    const { data: newWeek, error: createErr } = await supabase
      .from("workout_weeks")
      .insert({ user_id: userId, week_start: nextWeekStart })
      .select("id")
      .single();
    if (createErr) {
      console.error("[completeWeek] Failed to create next week row:", createErr);
    }
    nextWeekRow = newWeek;
  }

  if (!nextWeekRow) {
    console.error("[completeWeek] No next week row available, returning empty");
    return { weekStart: nextWeekStart, days: FULL_DAYS.map((day) => ({ day, exercises: [] })) };
  }

  // 4. Check if next week already has exercises
  const { data: existingExercises } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("week_id", nextWeekRow.id)
    .limit(1);

  if (existingExercises && existingExercises.length > 0) {
    console.log("[completeWeek] Next week already has exercises, loading normally");
    return getOrCreateWeekDb(nextWeekStart, userId);
  }

  // 5. Build exercise rows from completed week (copy structure with clean sets)
  const exerciseRows: any[] = [];
  const nextDays: DayLog[] = [];

  for (const day of FULL_DAYS) {
    const completedDay = completedWeek.days.find((cd) => cd.day === day);
    const dayExercises: ExerciseLog[] = [];
    const seenExercises = new Set<string>();

    if (completedDay && completedDay.exercises.length > 0) {
      completedDay.exercises.forEach((ex) => {
        // Skip duplicate exercise names within the same day
        if (seenExercises.has(ex.exercise)) return;
        seenExercises.add(ex.exercise);
        const cleanSets = ex.sets.map((s) => ({ reps: s.reps || 0, kg: s.kg || 0 }));
        exerciseRows.push({
          week_id: nextWeekRow!.id,
          user_id: userId,
          day,
          exercise: ex.exercise,
          sets: cleanSets,
          sort_order: dayExercises.length,
          superset_with_next: ex.supersetWithNext || false,
          note: ex.note || null,
        });
        dayExercises.push({ exercise: ex.exercise, sets: cleanSets, supersetWithNext: ex.supersetWithNext, note: ex.note });
      });
    }

    nextDays.push({ day, exercises: dayExercises });
  }

  console.log("[completeWeek] Copying", exerciseRows.length, "exercises to next week", nextWeekStart);

  if (exerciseRows.length > 0) {
    const { error: insertErr } = await supabase.from("workout_exercises").insert(exerciseRows);
    if (insertErr) {
      console.error("[completeWeek] Failed to insert exercises:", insertErr);
      // Fallback: return the in-memory data anyway so UI shows something
    }
  }

  return { weekStart: nextWeekStart, days: nextDays };
}

export async function getExerciseProgressDb(
  exercise: string,
  userId: string
): Promise<{ week: string; volume: number; maxWeight: number }[]> {
  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .order("week_start");

  if (!weeks || weeks.length === 0) return [];

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("week_id, sets")
    .eq("user_id", userId)
    .eq("exercise", exercise);

  if (!exercises) return [];

  return weeks
    .map((w) => {
      const weekExercises = exercises.filter((e) => e.week_id === w.id);
      let totalVolume = 0;
      let maxWeight = 0;
      weekExercises.forEach((e) => {
        const sets = (e.sets as any[]) || [];
        sets.forEach((s: any) => {
          totalVolume += (s.reps || 0) * (s.kg || 0);
          if (s.kg > maxWeight) maxWeight = s.kg;
        });
      });
      return { week: w.week_start, volume: totalVolume, maxWeight };
    })
    .filter((d) => d.volume > 0);
}

export async function getMuscleGroupProgressDb(
  muscleGroup: MuscleGroup,
  userId: string
): Promise<{ week: string; volume: number; maxWeight: number }[]> {
  const exercisesInGroup = Object.entries(EXERCISE_MUSCLE_MAP)
    .filter(([_, mg]) => mg === muscleGroup)
    .map(([ex]) => ex);

  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .order("week_start");

  if (!weeks || weeks.length === 0) return [];

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("week_id, sets")
    .eq("user_id", userId)
    .in("exercise", exercisesInGroup);

  if (!exercises) return [];

  return weeks
    .map((w) => {
      const weekExercises = exercises.filter((e) => e.week_id === w.id);
      let totalVolume = 0;
      let maxWeight = 0;
      weekExercises.forEach((e) => {
        const sets = (e.sets as any[]) || [];
        sets.forEach((s: any) => {
          totalVolume += (s.reps || 0) * (s.kg || 0);
          if (s.kg > maxWeight) maxWeight = s.kg;
        });
      });
      return { week: w.week_start, volume: totalVolume, maxWeight };
    })
    .filter((d) => d.volume > 0);
}

export async function getOverallProgressDb(
  userId: string
): Promise<{ week: string; volume: number; maxWeight: number }[]> {
  const { data: weeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .order("week_start");

  if (!weeks || weeks.length === 0) return [];

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("week_id, sets")
    .eq("user_id", userId);

  if (!exercises) return [];

  return weeks
    .map((w) => {
      const weekExercises = exercises.filter((e) => e.week_id === w.id);
      let totalVolume = 0;
      let maxWeight = 0;
      weekExercises.forEach((e) => {
        const sets = (e.sets as any[]) || [];
        sets.forEach((s: any) => {
          totalVolume += (s.reps || 0) * (s.kg || 0);
          if (s.kg > maxWeight) maxWeight = s.kg;
        });
      });
      return { week: w.week_start, volume: totalVolume, maxWeight };
    })
    .filter((d) => d.volume > 0);
}
