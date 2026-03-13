ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS superset_with_next boolean NOT NULL DEFAULT false;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS note text;