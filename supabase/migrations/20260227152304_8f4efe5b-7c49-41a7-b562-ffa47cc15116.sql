CREATE TABLE public.exercise_rep_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise TEXT NOT NULL,
  min_reps INTEGER NOT NULL DEFAULT 8,
  max_reps INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise)
);

ALTER TABLE public.exercise_rep_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rep ranges" ON public.exercise_rep_ranges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own rep ranges" ON public.exercise_rep_ranges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rep ranges" ON public.exercise_rep_ranges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rep ranges" ON public.exercise_rep_ranges FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_exercise_rep_ranges_updated_at BEFORE UPDATE ON public.exercise_rep_ranges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();