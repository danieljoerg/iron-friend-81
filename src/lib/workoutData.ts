export const EXERCISES = [
  // Chest
  "Flat Barbell Bench Press",
  "Incline Barbell Bench Press",
  "Decline Barbell Bench Press",
  "Flat Dumbbell Bench Press",
  "Incline Dumbbell Bench Press",
  "Decline Dumbbell Bench Press",
  "Flat Smith Machine Bench Press",
  "Incline Smith Machine Bench Press",
  "Decline Smith Machine Bench Press",
  "Flat Dumbbell Fly",
  "Incline Dumbbell Fly",
  "Cable Fly (Low to High)",
  "Cable Fly (High to Low)",
  "Cable Fly (Mid)",
  "Machine Chest Press",
  "Pec Deck",
  "Dips (Chest)",
  "Push-Up",
  // Back
  "Barbell Row",
  "Dumbbell Row",
  "Pendlay Row",
  "T-Bar Row",
  "Seated Cable Row",
  "Machine Row",
  "Lat Pulldown (Wide)",
  "Lat Pulldown (Close)",
  "Lat Pulldown (Neutral)",
  "Pull-Up",
  "Chin-Up",
  "Assisted Pull-Up",
  "Straight Arm Pulldown",
  "Face Pull",
  "Cable Pullover",
  "Machine Pullover",
  // Shoulders
  "Overhead Press (Barbell)",
  "Overhead Press (Dumbbell)",
  "Seated Dumbbell Press",
  "Smith Machine Shoulder Press",
  "Arnold Press",
  "Lateral Raise (Dumbbell)",
  "Lateral Raise (Cable)",
  "Lateral Raise (Machine)",
  "Front Raise",
  "Rear Delt Fly (Dumbbell)",
  "Rear Delt Fly (Machine)",
  "Rear Delt Fly (Cable)",
  "Upright Row",
  "Shrugs (Barbell)",
  "Shrugs (Dumbbell)",
  // Legs
  "Back Squat",
  "Front Squat",
  "Smith Machine Squat",
  "Hack Squat",
  "Leg Press",
  "Leg Press (Single Leg)",
  "Bulgarian Split Squat",
  "Lunges (Barbell)",
  "Lunges (Dumbbell)",
  "Walking Lunges",
  "Goblet Squat",
  "Leg Extension",
  "Leg Curl (Lying)",
  "Leg Curl (Seated)",
  "Romanian Deadlift (Barbell)",
  "Romanian Deadlift (Dumbbell)",
  "Stiff Leg Deadlift",
  "Hip Thrust (Barbell)",
  "Hip Thrust (Machine)",
  "Glute Kickback (Cable)",
  "Glute Kickback (Machine)",
  "Calf Raise (Standing)",
  "Calf Raise (Seated)",
  "Calf Raise (Leg Press)",
  "Adductor Machine",
  "Abductor Machine",
  // Arms - Biceps
  "Barbell Curl",
  "EZ Bar Curl",
  "Dumbbell Curl",
  "Hammer Curl",
  "Incline Dumbbell Curl",
  "Preacher Curl (Barbell)",
  "Preacher Curl (Dumbbell)",
  "Cable Curl",
  "Concentration Curl",
  "Spider Curl",
  // Arms - Triceps
  "Close Grip Bench Press",
  "Tricep Dip",
  "Skull Crusher (EZ Bar)",
  "Skull Crusher (Dumbbell)",
  "Tricep Pushdown (Rope)",
  "Tricep Pushdown (Bar)",
  "Overhead Tricep Extension (Cable)",
  "Overhead Tricep Extension (Dumbbell)",
  "Kickback (Dumbbell)",
  "Kickback (Cable)",
  // Deadlifts
  "Conventional Deadlift",
  "Sumo Deadlift",
  "Trap Bar Deadlift",
  // Core
  "Cable Crunch",
  "Hanging Leg Raise",
  "Ab Wheel Rollout",
  "Plank",
  "Russian Twist",
  "Woodchop (Cable)",
  // Forearms
  "Wrist Curl",
  "Reverse Wrist Curl",
  "Farmer's Walk",
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
