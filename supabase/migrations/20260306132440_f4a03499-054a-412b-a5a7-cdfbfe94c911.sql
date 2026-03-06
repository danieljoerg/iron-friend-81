
-- Delete orphan week records that have no exercises and no days_done
DELETE FROM workout_weeks
WHERE id NOT IN (
  SELECT DISTINCT week_id FROM workout_exercises
)
AND days_done = '[]'::jsonb;
