
-- Clean up duplicate workout_exercises: keep only the one with the lowest id per (week_id, day, exercise)
DELETE FROM workout_exercises
WHERE id NOT IN (
  SELECT DISTINCT ON (week_id, day, exercise) id
  FROM workout_exercises
  ORDER BY week_id, day, exercise, sort_order ASC, created_at ASC
);

-- Now fix sort_orders to be sequential per (week_id, day)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY week_id, day ORDER BY sort_order) - 1 as new_sort
  FROM workout_exercises
)
UPDATE workout_exercises 
SET sort_order = numbered.new_sort
FROM numbered
WHERE workout_exercises.id = numbered.id;
