
CREATE TABLE public.shared_mesocycle_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  display_name text,
  duration_weeks integer NOT NULL,
  start_week text NOT NULL,
  total_volume integer NOT NULL DEFAULT 0,
  total_sets integer NOT NULL DEFAULT 0,
  overall_max_weight numeric NOT NULL DEFAULT 0,
  overall_change_percent integer NOT NULL DEFAULT 0,
  muscle_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_mesocycle_results ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared results (this is the viral mechanic)
CREATE POLICY "Shared results are publicly viewable"
ON public.shared_mesocycle_results
FOR SELECT
USING (true);

-- Only authenticated users can create their own
CREATE POLICY "Users can share their own results"
ON public.shared_mesocycle_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shared results"
ON public.shared_mesocycle_results
FOR DELETE
USING (auth.uid() = user_id);
