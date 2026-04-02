-- Fix check constraint error for multi-role support
-- The 'role' column in 'profiles' has a constraint that prevents it from being empty or 
-- having a value not in the original list. When we moved to 'roles[]' array, the UI 
-- is sending an empty or different value for the legacy 'role' column.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_role;
