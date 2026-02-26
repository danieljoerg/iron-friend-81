export const EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-Up",
  "Dumbbell Curl",
  "Tricep Dip",
  "Lat Pulldown",
  "Leg Press",
  "Romanian Deadlift",
  "Incline Bench Press",
  "Cable Fly",
  "Lateral Raise",
  "Face Pull",
] as const;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type WorkoutSet = {
  reps: number;
  kg: number;
};

export type ExerciseLog = {
  exercise: string;
  sets: WorkoutSet[];
};

export type DayLog = {
  day: string;
  exercises: ExerciseLog[];
};

export type WeekLog = {
  weekStart: string; // ISO date string of Monday
  days: DayLog[];
};

// Get current week's Monday
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// Calculate total volume for an exercise log
export function calculateVolume(exerciseLog: ExerciseLog): number {
  return exerciseLog.sets.reduce((total, set) => total + set.reps * set.kg, 0);
}

// Get all weeks data from localStorage
export function getWeeksData(): WeekLog[] {
  const data = localStorage.getItem("workout-tracker");
  return data ? JSON.parse(data) : [];
}

// Save weeks data
export function saveWeeksData(weeks: WeekLog[]) {
  localStorage.setItem("workout-tracker", JSON.stringify(weeks));
}

// Get or create current week
export function getOrCreateWeek(weekStart: string): WeekLog {
  const weeks = getWeeksData();
  let week = weeks.find((w) => w.weekStart === weekStart);
  if (!week) {
    week = {
      weekStart,
      days: FULL_DAYS.map((day) => ({ day, exercises: [] })),
    };
    weeks.push(week);
    weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    saveWeeksData(weeks);
  }
  return week;
}

// Save a specific week
export function saveWeek(week: WeekLog) {
  const weeks = getWeeksData();
  const idx = weeks.findIndex((w) => w.weekStart === week.weekStart);
  if (idx >= 0) {
    weeks[idx] = week;
  } else {
    weeks.push(week);
    weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }
  saveWeeksData(weeks);
}

// Get progress data for an exercise across weeks
export function getExerciseProgress(exercise: string): { week: string; volume: number; maxWeight: number }[] {
  const weeks = getWeeksData();
  return weeks
    .map((week) => {
      let totalVolume = 0;
      let maxWeight = 0;
      week.days.forEach((day) => {
        day.exercises
          .filter((e) => e.exercise === exercise)
          .forEach((e) => {
            totalVolume += calculateVolume(e);
            e.sets.forEach((s) => {
              if (s.kg > maxWeight) maxWeight = s.kg;
            });
          });
      });
      return { week: week.weekStart, volume: totalVolume, maxWeight };
    })
    .filter((d) => d.volume > 0);
}
