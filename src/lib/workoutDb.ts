import { supabase } from "@/integrations/supabase/client";
import { FULL_DAYS, EXERCISE_MUSCLE_MAP, MUSCLE_GROUPS, type WeekLog, type DayLog, type ExerciseLog, type MuscleGroup } from "./workoutData";

export async function getOrCreateWeekDb(weekStart: string, userId: string): Promise<WeekLog> {
  // Get or create week record
  let { data: weekRow } = await supabase
    .from("workout_weeks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

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
