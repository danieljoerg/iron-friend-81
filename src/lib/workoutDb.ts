import { supabase } from "@/integrations/supabase/client";

export type RepRange = { exercise: string; min_reps: number; max_reps: number };

export async function getRepRangesDb(userId: string): Promise<Record<string, RepRange>> {
  const { data } = await supabase
    .from("exercise_rep_ranges")
    .select("exercise, min_reps, max_reps")
    .eq("user_id", userId);
  const map: Record<string, RepRange> = {};
  (data || []).forEach((r: any) => {
    map[r.exercise] = { exercise: r.exercise, min_reps: r.min_reps, max_reps: r.max_reps };
  });
  return map;
}

export async function setRepRangeDb(userId: string, exercise: string, minReps: number, maxReps: number): Promise<void> {
  await supabase
    .from("exercise_rep_ranges")
    .upsert({ user_id: userId, exercise, min_reps: minReps, max_reps: maxReps }, { onConflict: "user_id,exercise" });
}
import { FULL_DAYS, EXERCISE_MUSCLE_MAP, MUSCLE_GROUPS, type WeekLog, type DayLog, type ExerciseLog, type WorkoutSet, type MuscleGroup } from "./workoutData";

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

  // Check if all sets hit max reps → increase weight
  const allMaxed = prevSets.every((s) => s.reps >= max);

  return prevSets.map((s) => {
    if (s.reps === 0 && s.kg === 0) return { reps: min, kg: 0 };
    if (allMaxed) {
      return { reps: min, kg: s.kg + increment };
    }
    // Otherwise: try +1 rep, capped at max
    return { reps: Math.min(s.reps + 1, max), kg: s.kg };
  });
}

export async function getPreviousWeekData(weekStart: string, userId: string): Promise<Record<string, ExerciseLog[]>> {
  const { data: prevWeeks } = await supabase
    .from("workout_weeks")
    .select("id, week_start")
    .eq("user_id", userId)
    .lt("week_start", weekStart)
    .order("week_start", { ascending: false })
    .limit(1);

  if (!prevWeeks || prevWeeks.length === 0) return {};

  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("day, exercise, sets, sort_order")
    .eq("week_id", prevWeeks[0].id)
    .order("sort_order");

  if (!exercises) return {};

  const result: Record<string, ExerciseLog[]> = {};
  for (const day of FULL_DAYS) {
    result[day] = exercises
      .filter((e) => e.day === day)
      .map((e) => ({ exercise: e.exercise, sets: (e.sets as any[]) || [] }));
  }
  return result;
}

export async function getOrCreateWeekDb(weekStart: string, userId: string): Promise<WeekLog> {
  // Get or create week record
  let { data: weekRow } = await supabase
    .from("workout_weeks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  const isNew = !weekRow;

  if (!weekRow) {
    const { data: newWeek } = await supabase
      .from("workout_weeks")
      .insert({ user_id: userId, week_start: weekStart })
      .select("id")
      .single();
    weekRow = newWeek;
  }

  if (!weekRow) {
    return { weekStart, days: FULL_DAYS.map((day) => ({ day, exercises: [] })) };
  }

  // Get exercises for this week
  const { data: exercises } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("week_id", weekRow.id)
    .order("sort_order");

  // If new week with no exercises, copy structure from most recent previous week
  if (isNew && (!exercises || exercises.length === 0)) {
    const { data: prevWeeks } = await supabase
      .from("workout_weeks")
      .select("id, week_start")
      .eq("user_id", userId)
      .lt("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(1);

    if (prevWeeks && prevWeeks.length > 0) {
      const { data: prevExercises } = await supabase
        .from("workout_exercises")
        .select("day, exercise, sort_order")
        .eq("week_id", prevWeeks[0].id)
        .order("sort_order");

      if (prevExercises && prevExercises.length > 0) {
        const rows = prevExercises.map((e) => ({
          week_id: weekRow!.id,
          user_id: userId,
          day: e.day,
          exercise: e.exercise,
          sets: [{ reps: 0, kg: 0 }],
          sort_order: e.sort_order,
        }));
        await supabase.from("workout_exercises").insert(rows);

        // Build result from copied exercises
        const days: DayLog[] = FULL_DAYS.map((day) => {
          const dayExercises: ExerciseLog[] = prevExercises
            .filter((e) => e.day === day)
            .map((e) => ({ exercise: e.exercise, sets: [{ reps: 0, kg: 0 }] }));
          return { day, exercises: dayExercises };
        });
        return { weekStart, days };
      }
    }
  }

  // Build the WeekLog structure
  const days: DayLog[] = FULL_DAYS.map((day) => {
    const dayExercises: ExerciseLog[] = (exercises || [])
      .filter((e) => e.day === day)
      .map((e) => ({
        exercise: e.exercise,
        sets: (e.sets as any[]) || [],
      }));
    return { day, exercises: dayExercises };
  });

  return { weekStart, days };
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

  // Delete existing exercises for this week
  await supabase
    .from("workout_exercises")
    .delete()
    .eq("week_id", weekRow.id);

  // Insert all exercises
  const rows: any[] = [];
  week.days.forEach((day) => {
    day.exercises.forEach((ex, idx) => {
      rows.push({
        week_id: weekRow!.id,
        user_id: userId,
        day: day.day,
        exercise: ex.exercise,
        sets: ex.sets,
        sort_order: idx,
      });
    });
  });

  if (rows.length > 0) {
    await supabase.from("workout_exercises").insert(rows);
  }
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
