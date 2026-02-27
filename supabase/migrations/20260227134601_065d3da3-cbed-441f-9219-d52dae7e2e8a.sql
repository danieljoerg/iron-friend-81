-- Create workout_weeks table
CREATE TABLE public.workout_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.workout_weeks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day TEXT NOT NULL,
  exercise TEXT NOT NULL,
  sets JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_weeks
CREATE POLICY "Users can view their own weeks" ON public.workout_weeks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weeks" ON public.workout_weeks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weeks" ON public.workout_weeks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weeks" ON public.workout_weeks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for workout_exercises
CREATE POLICY "Users can view their own exercises" ON public.workout_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own exercises" ON public.workout_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercises" ON public.workout_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercises" ON public.workout_exercises FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_workout_weeks_user ON public.workout_weeks(user_id);
CREATE INDEX idx_workout_exercises_week ON public.workout_exercises(week_id);
CREATE INDEX idx_workout_exercises_user ON public.workout_exercises(user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workout_weeks_updated_at BEFORE UPDATE ON public.workout_weeks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON public.workout_exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();