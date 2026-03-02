CREATE TABLE public.mesocycles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  start_week text NOT NULL,
  duration_weeks integer NOT NULL DEFAULT 6 CHECK (duration_weeks >= 4 AND duration_weeks <= 8),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mesocycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mesocycles" ON public.mesocycles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mesocycles" ON public.mesocycles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mesocycles" ON public.mesocycles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mesocycles" ON public.mesocycles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_mesocycles_updated_at BEFORE UPDATE ON public.mesocycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();