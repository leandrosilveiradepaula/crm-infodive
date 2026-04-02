-- Advanced User Management Migration
-- Add status and transition role to roles[] array

-- 1. Add status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 2. Add roles column (array) to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY[]::text[];

-- 3. Migration script: Copy current single 'role' to 'roles' array
UPDATE public.profiles 
SET roles = ARRAY[role]
WHERE role IS NOT NULL AND (roles IS NULL OR array_length(roles, 1) IS NULL);

-- 4. Constraint for organization_id (if missing)
-- Ensure policies respect the new status
-- We can eventually remove the 'role' column after verifying everything works.
