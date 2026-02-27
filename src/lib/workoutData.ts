export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Biceps",
  "Triceps",
  "Deadlifts",
  "Core",
  "Forearms",
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup> = {
  // Chest
  "Flat Barbell Bench Press": "Chest",
  "Incline Barbell Bench Press": "Chest",
  "Decline Barbell Bench Press": "Chest",
  "Flat Dumbbell Bench Press": "Chest",
  "Incline Dumbbell Bench Press": "Chest",
  "Decline Dumbbell Bench Press": "Chest",
  "Flat Smith Machine Bench Press": "Chest",
  "Incline Smith Machine Bench Press": "Chest",
  "Decline Smith Machine Bench Press": "Chest",
  "Flat Dumbbell Fly": "Chest",
  "Incline Dumbbell Fly": "Chest",
  "Cable Fly (Low to High)": "Chest",
  "Cable Fly (High to Low)": "Chest",
  "Cable Fly (Mid)": "Chest",
  "Machine Chest Press": "Chest",
  "Pec Deck": "Chest",
  "Dips (Chest)": "Chest",
  "Push-Up": "Chest",
  // Back
  "Barbell Row": "Back",
  "Dumbbell Row": "Back",
  "Pendlay Row": "Back",
  "T-Bar Row": "Back",
  "Seated Cable Row": "Back",
  "Machine Row": "Back",
  "Lat Pulldown (Wide)": "Back",
  "Lat Pulldown (Close)": "Back",
  "Lat Pulldown (Neutral)": "Back",
  "Pull-Up": "Back",
  "Chin-Up": "Back",
  "Assisted Pull-Up": "Back",
  "Straight Arm Pulldown": "Back",
  "Face Pull": "Back",
  "Cable Pullover": "Back",
  "Machine Pullover": "Back",
  // Shoulders
  "Overhead Press (Barbell)": "Shoulders",
  "Overhead Press (Dumbbell)": "Shoulders",
  "Seated Dumbbell Press": "Shoulders",
  "Smith Machine Shoulder Press": "Shoulders",
  "Arnold Press": "Shoulders",
  "Lateral Raise (Dumbbell)": "Shoulders",
  "Lateral Raise (Cable)": "Shoulders",
  "Lateral Raise (Machine)": "Shoulders",
  "Front Raise": "Shoulders",
  "Rear Delt Fly (Dumbbell)": "Shoulders",
  "Rear Delt Fly (Machine)": "Shoulders",
  "Rear Delt Fly (Cable)": "Shoulders",
  "Upright Row": "Shoulders",
  "Shrugs (Barbell)": "Shoulders",
  "Shrugs (Dumbbell)": "Shoulders",
  // Legs
  "Back Squat": "Legs",
  "Front Squat": "Legs",
  "Smith Machine Squat": "Legs",
  "Hack Squat": "Legs",
  "Leg Press": "Legs",
  "Leg Press (Single Leg)": "Legs",
  "Bulgarian Split Squat": "Legs",
  "Lunges (Barbell)": "Legs",
  "Lunges (Dumbbell)": "Legs",
  "Walking Lunges": "Legs",
  "Goblet Squat": "Legs",
  "Leg Extension": "Legs",
  "Leg Curl (Lying)": "Legs",
  "Leg Curl (Seated)": "Legs",
  "Romanian Deadlift (Barbell)": "Legs",
  "Romanian Deadlift (Dumbbell)": "Legs",
  "Stiff Leg Deadlift": "Legs",
  "Hip Thrust (Barbell)": "Legs",
  "Hip Thrust (Machine)": "Legs",
  "Glute Kickback (Cable)": "Legs",
  "Glute Kickback (Machine)": "Legs",
  "Calf Raise (Standing)": "Legs",
  "Calf Raise (Seated)": "Legs",
  "Calf Raise (Leg Press)": "Legs",
  "Adductor Machine": "Legs",
  "Abductor Machine": "Legs",
  // Biceps
  "Barbell Curl": "Biceps",
  "EZ Bar Curl": "Biceps",
  "Dumbbell Curl": "Biceps",
  "Hammer Curl": "Biceps",
  "Incline Dumbbell Curl": "Biceps",
  "Preacher Curl (Barbell)": "Biceps",
  "Preacher Curl (Dumbbell)": "Biceps",
  "Cable Curl": "Biceps",
  "Concentration Curl": "Biceps",
  "Spider Curl": "Biceps",
  // Triceps
  "Close Grip Bench Press": "Triceps",
  "Tricep Dip": "Triceps",
  "Skull Crusher (EZ Bar)": "Triceps",
  "Skull Crusher (Dumbbell)": "Triceps",
  "Tricep Pushdown (Rope)": "Triceps",
  "Tricep Pushdown (Bar)": "Triceps",
  "Overhead Tricep Extension (Cable)": "Triceps",
  "Overhead Tricep Extension (Dumbbell)": "Triceps",
  "Kickback (Dumbbell)": "Triceps",
  "Kickback (Cable)": "Triceps",
  // Deadlifts
  "Conventional Deadlift": "Deadlifts",
  "Sumo Deadlift": "Deadlifts",
  "Trap Bar Deadlift": "Deadlifts",
  // Core
  "Cable Crunch": "Core",
  "Hanging Leg Raise": "Core",
  "Ab Wheel Rollout": "Core",
  "Plank": "Core",
  "Russian Twist": "Core",
  "Woodchop (Cable)": "Core",
  // Forearms
  "Wrist Curl": "Forearms",
  "Reverse Wrist Curl": "Forearms",
  "Farmer's Walk": "Forearms",
};

export const EXERCISES = Object.keys(EXERCISE_MUSCLE_MAP);

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
