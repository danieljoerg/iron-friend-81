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
  "Rotator Cuff",
  "Glutes",
  "Calves",
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup> = {
  // === CHEST ===
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
  "Decline Dumbbell Fly": "Chest",
  "Cable Fly (Low to High)": "Chest",
  "Cable Fly (High to Low)": "Chest",
  "Cable Fly (Mid)": "Chest",
  "Machine Chest Press": "Chest",
  "Incline Machine Press": "Chest",
  "Pec Deck": "Chest",
  "Dips (Chest)": "Chest",
  "Push-Up": "Chest",
  "Incline Push-Up": "Chest",
  "Decline Push-Up": "Chest",
  "Diamond Push-Up": "Chest",
  "Weighted Push-Up": "Chest",
  "Svend Press": "Chest",
  "Landmine Press": "Chest",
  "Floor Press (Barbell)": "Chest",
  "Floor Press (Dumbbell)": "Chest",
  "Squeeze Press": "Chest",
  "Cable Crossover": "Chest",

  // === BACK ===
  "Barbell Row": "Back",
  "Dumbbell Row": "Back",
  "Pendlay Row": "Back",
  "T-Bar Row": "Back",
  "Seated Cable Row": "Back",
  "Seated Cable Row (Wide Grip)": "Back",
  "Seated Cable Row (Close Grip)": "Back",
  "Machine Row": "Back",
  "Chest Supported Row": "Back",
  "Chest Supported Dumbbell Row": "Back",
  "Meadows Row": "Back",
  "Kroc Row": "Back",
  "Helms Row": "Back",
  "Seal Row": "Back",
  "Lat Pulldown (Wide)": "Back",
  "Lat Pulldown (Close)": "Back",
  "Lat Pulldown (Neutral)": "Back",
  "Lat Pulldown (Reverse Grip)": "Back",
  "Lat Pulldown (Single Arm)": "Back",
  "Pull-Up": "Back",
  "Chin-Up": "Back",
  "Neutral Grip Pull-Up": "Back",
  "Weighted Pull-Up": "Back",
  "Weighted Chin-Up": "Back",
  "Assisted Pull-Up": "Back",
  "Straight Arm Pulldown": "Back",
  "Cable Pullover": "Back",
  "Machine Pullover": "Back",
  "Inverted Row": "Back",
  "Smith Machine Row": "Back",
  "Rack Pull": "Back",
  "Snatch Grip Deadlift": "Back",
  "Hyperextension": "Back",
  "Reverse Hyperextension": "Back",

  // === SHOULDERS (Anterior / Lateral / Posterior Deltoid) ===
  "Overhead Press (Barbell)": "Shoulders",
  "Overhead Press (Dumbbell)": "Shoulders",
  "Seated Dumbbell Press": "Shoulders",
  "Seated Barbell Press": "Shoulders",
  "Smith Machine Shoulder Press": "Shoulders",
  "Arnold Press": "Shoulders",
  "Push Press": "Shoulders",
  "Z Press": "Shoulders",
  "Viking Press": "Shoulders",
  "Landmine Shoulder Press": "Shoulders",
  "Machine Shoulder Press": "Shoulders",
  "Lateral Raise (Dumbbell)": "Shoulders",
  "Lateral Raise (Cable)": "Shoulders",
  "Lateral Raise (Machine)": "Shoulders",
  "Lateral Raise (Leaning Cable)": "Shoulders",
  "Behind-the-Back Cable Lateral Raise": "Shoulders",
  "Lu Raise": "Shoulders",
  "Front Raise (Dumbbell)": "Shoulders",
  "Front Raise (Barbell)": "Shoulders",
  "Front Raise (Cable)": "Shoulders",
  "Front Raise (Plate)": "Shoulders",
  "Rear Delt Fly (Dumbbell)": "Shoulders",
  "Rear Delt Fly (Machine)": "Shoulders",
  "Rear Delt Fly (Cable)": "Shoulders",
  "Rear Delt Fly (Incline Bench)": "Shoulders",
  "Face Pull": "Shoulders",
  "Face Pull (Rope)": "Shoulders",
  "Face Pull (Band)": "Shoulders",
  "Upright Row (Barbell)": "Shoulders",
  "Upright Row (Dumbbell)": "Shoulders",
  "Upright Row (Cable)": "Shoulders",
  "Shrugs (Barbell)": "Shoulders",
  "Shrugs (Dumbbell)": "Shoulders",
  "Shrugs (Trap Bar)": "Shoulders",
  "Shrugs (Smith Machine)": "Shoulders",
  "Behind-the-Back Shrugs": "Shoulders",
  "Bus Driver": "Shoulders",
  "Bradford Press": "Shoulders",
  "Reverse Pec Deck": "Shoulders",

  // === ROTATOR CUFF ===
  "External Cable Rotation": "Rotator Cuff",
  "Internal Cable Rotation": "Rotator Cuff",
  "External Rotation (Dumbbell, Side Lying)": "Rotator Cuff",
  "Internal Rotation (Dumbbell)": "Rotator Cuff",
  "External Rotation (Band)": "Rotator Cuff",
  "Internal Rotation (Band)": "Rotator Cuff",
  "Cable Rotator Cuff (90° Abduction)": "Rotator Cuff",
  "Cuban Rotation": "Rotator Cuff",
  "Prone Y Raise": "Rotator Cuff",
  "Prone T Raise": "Rotator Cuff",
  "Prone W Raise": "Rotator Cuff",
  "Scaption (Dumbbell)": "Rotator Cuff",
  "Full Can Lateral Raise": "Rotator Cuff",
  "Empty Can Raise": "Rotator Cuff",
  "Wall Slides": "Rotator Cuff",
  "90/90 External Rotation (Dumbbell)": "Rotator Cuff",
  "90/90 External Rotation (Cable)": "Rotator Cuff",
  "Sword Draw": "Rotator Cuff",

  // === LEGS (Quads / Hamstrings / Adductors / Abductors) ===
  "Back Squat": "Legs",
  "Front Squat": "Legs",
  "Smith Machine Squat": "Legs",
  "Hack Squat": "Legs",
  "Leg Press": "Legs",
  "Leg Press (Single Leg)": "Legs",
  "Leg Press (Close Stance)": "Legs",
  "Leg Press (Wide Stance)": "Legs",
  "Bulgarian Split Squat": "Legs",
  "Lunges (Barbell)": "Legs",
  "Lunges (Dumbbell)": "Legs",
  "Walking Lunges": "Legs",
  "Reverse Lunges": "Legs",
  "Deficit Reverse Lunges": "Legs",
  "Goblet Squat": "Legs",
  "Zercher Squat": "Legs",
  "Belt Squat": "Legs",
  "Sissy Squat": "Legs",
  "Pistol Squat": "Legs",
  "Spanish Squat": "Legs",
  "Pendulum Squat": "Legs",
  "V-Squat": "Legs",
  "Leg Extension": "Legs",
  "Leg Extension (Single Leg)": "Legs",
  "Leg Curl (Lying)": "Legs",
  "Leg Curl (Seated)": "Legs",
  "Leg Curl (Standing)": "Legs",
  "Nordic Hamstring Curl": "Legs",
  "Romanian Deadlift (Barbell)": "Legs",
  "Romanian Deadlift (Dumbbell)": "Legs",
  "Romanian Deadlift (Single Leg)": "Legs",
  "Stiff Leg Deadlift": "Legs",
  "Good Morning": "Legs",
  "Seated Good Morning": "Legs",
  "Step-Up (Barbell)": "Legs",
  "Step-Up (Dumbbell)": "Legs",
  "Lateral Lunge": "Legs",
  "Adductor Machine": "Legs",
  "Abductor Machine": "Legs",
  "Copenhagen Adductor": "Legs",
  "Cable Adduction": "Legs",
  "Cable Abduction": "Legs",

  // === GLUTES ===
  "Hip Thrust (Barbell)": "Glutes",
  "Hip Thrust (Machine)": "Glutes",
  "Hip Thrust (Smith Machine)": "Glutes",
  "Hip Thrust (Single Leg)": "Glutes",
  "Hip Thrust (Dumbbell)": "Glutes",
  "Glute Bridge": "Glutes",
  "Glute Bridge (Single Leg)": "Glutes",
  "Glute Bridge (Barbell)": "Glutes",
  "Glute Kickback (Cable)": "Glutes",
  "Glute Kickback (Machine)": "Glutes",
  "Glute Kickback (Band)": "Glutes",
  "Cable Pull-Through": "Glutes",
  "Glute Ham Raise": "Glutes",
  "Donkey Kick (Cable)": "Glutes",
  "Fire Hydrant": "Glutes",
  "Banded Clamshell": "Glutes",
  "Sumo Squat": "Glutes",
  "Frog Pump": "Glutes",
  "Kettlebell Swing": "Glutes",

  // === CALVES ===
  "Calf Raise (Standing)": "Calves",
  "Calf Raise (Seated)": "Calves",
  "Calf Raise (Leg Press)": "Calves",
  "Calf Raise (Smith Machine)": "Calves",
  "Calf Raise (Single Leg)": "Calves",
  "Donkey Calf Raise": "Calves",
  "Tibialis Raise": "Calves",

  // === BICEPS ===
  "Barbell Curl": "Biceps",
  "EZ Bar Curl": "Biceps",
  "Dumbbell Curl": "Biceps",
  "Dumbbell Curl (Alternating)": "Biceps",
  "Hammer Curl": "Biceps",
  "Hammer Curl (Cable, Rope)": "Biceps",
  "Cross Body Hammer Curl": "Biceps",
  "Incline Dumbbell Curl": "Biceps",
  "Preacher Curl (Barbell)": "Biceps",
  "Preacher Curl (Dumbbell)": "Biceps",
  "Preacher Curl (EZ Bar)": "Biceps",
  "Preacher Curl (Machine)": "Biceps",
  "Cable Curl": "Biceps",
  "Cable Curl (EZ Bar)": "Biceps",
  "Cable Curl (Single Arm)": "Biceps",
  "Concentration Curl": "Biceps",
  "Spider Curl": "Biceps",
  "Spider Curl (EZ Bar)": "Biceps",
  "Reverse Curl (Barbell)": "Biceps",
  "Reverse Curl (EZ Bar)": "Biceps",
  "Reverse Curl (Cable)": "Biceps",
  "Drag Curl": "Biceps",
  "21s (Barbell Curl)": "Biceps",
  "Bayesian Curl (Cable)": "Biceps",
  "Scott Curl (Machine)": "Biceps",
  "Waiter Curl": "Biceps",
  "Zottman Curl": "Biceps",

  // === TRICEPS ===
  "Close Grip Bench Press": "Triceps",
  "Tricep Dip": "Triceps",
  "Weighted Tricep Dip": "Triceps",
  "Bench Dip": "Triceps",
  "Skull Crusher (EZ Bar)": "Triceps",
  "Skull Crusher (Dumbbell)": "Triceps",
  "Skull Crusher (Barbell)": "Triceps",
  "Skull Crusher (Cable)": "Triceps",
  "Tricep Pushdown (Rope)": "Triceps",
  "Tricep Pushdown (Bar)": "Triceps",
  "Tricep Pushdown (V-Bar)": "Triceps",
  "Tricep Pushdown (Single Arm)": "Triceps",
  "Tricep Pushdown (Reverse Grip)": "Triceps",
  "Overhead Tricep Extension (Cable)": "Triceps",
  "Overhead Tricep Extension (Dumbbell)": "Triceps",
  "Overhead Tricep Extension (Barbell)": "Triceps",
  "Overhead Tricep Extension (EZ Bar)": "Triceps",
  "Overhead Cable Extension (Rope)": "Triceps",
  "Kickback (Dumbbell)": "Triceps",
  "Kickback (Cable)": "Triceps",
  "JM Press": "Triceps",
  "Tate Press": "Triceps",
  "French Press (Dumbbell)": "Triceps",
  "Diamond Push-Up (Triceps)": "Triceps",
  "Board Press": "Triceps",

  // === DEADLIFTS ===
  "Conventional Deadlift": "Deadlifts",
  "Sumo Deadlift": "Deadlifts",
  "Trap Bar Deadlift": "Deadlifts",
  "Deficit Deadlift": "Deadlifts",
  "Pause Deadlift": "Deadlifts",
  "Block Pull": "Deadlifts",
  "Jefferson Deadlift": "Deadlifts",

  // === CORE ===
  "Cable Crunch": "Core",
  "Machine Crunch": "Core",
  "Hanging Leg Raise": "Core",
  "Hanging Knee Raise": "Core",
  "Captain's Chair Leg Raise": "Core",
  "Ab Wheel Rollout": "Core",
  "Plank": "Core",
  "Side Plank": "Core",
  "Weighted Plank": "Core",
  "Russian Twist": "Core",
  "Russian Twist (Weighted)": "Core",
  "Woodchop (Cable)": "Core",
  "Woodchop (Dumbbell)": "Core",
  "Pallof Press (Cable)": "Core",
  "Pallof Press (Band)": "Core",
  "Decline Sit-Up": "Core",
  "Weighted Decline Sit-Up": "Core",
  "Bicycle Crunch": "Core",
  "Mountain Climber": "Core",
  "Dead Bug": "Core",
  "Dragon Flag": "Core",
  "L-Sit": "Core",
  "Toes to Bar": "Core",
  "Ab Crunch (Floor)": "Core",
  "Reverse Crunch": "Core",
  "V-Up": "Core",
  "Flutter Kicks": "Core",
  "Lying Leg Raise": "Core",
  "Suitcase Carry": "Core",
  "Farmer's Walk (Core)": "Core",
  "Turkish Get-Up": "Core",
  "Landmine Rotation": "Core",
  "Copenhagen Plank": "Core",
  "Bird Dog": "Core",
  "Hollow Body Hold": "Core",
  "Stir the Pot (Stability Ball)": "Core",
  "Oblique Cable Crunch": "Core",

  // === FOREARMS ===
  "Wrist Curl (Barbell)": "Forearms",
  "Wrist Curl (Dumbbell)": "Forearms",
  "Reverse Wrist Curl (Barbell)": "Forearms",
  "Reverse Wrist Curl (Dumbbell)": "Forearms",
  "Farmer's Walk": "Forearms",
  "Dead Hang": "Forearms",
  "Plate Pinch": "Forearms",
  "Gripper": "Forearms",
  "Wrist Roller": "Forearms",
  "Towel Pull-Up": "Forearms",
  "Fat Grip Training": "Forearms",
  "Behind-the-Back Wrist Curl": "Forearms",
  "Finger Extension (Band)": "Forearms",
  "Radial Deviation (Dumbbell)": "Forearms",
  "Ulnar Deviation (Dumbbell)": "Forearms",
};

export const EXERCISES = Object.keys(EXERCISE_MUSCLE_MAP);

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type WorkoutSet = {
  reps: number;
  kg: number;
  rir?: number; // Reps in Reserve (0-5), undefined = not tracked
  done?: boolean; // Whether this set has been completed/submitted
};

export type ExerciseLog = {
  exercise: string;
  sets: WorkoutSet[];
  supersetWithNext?: boolean;
  note?: string;
};

export type DayLog = {
  day: string;
  exercises: ExerciseLog[];
  done?: boolean;
  readiness?: number; // 1-5 readiness score
};

export type WeekLog = {
  weekStart: string; // ISO date string of Monday
  days: DayLog[];
  trainingDays?: string[] | null; // Per-week override, null = use profile default
};

// Format a Date as YYYY-MM-DD in local time (avoids UTC shift from toISOString)
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Get current week's Monday
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return formatDateString(d);
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
