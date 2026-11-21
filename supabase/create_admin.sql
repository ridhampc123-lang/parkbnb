-- ============================================================================
-- SQL Helper: Promote or Create an Admin in ParkBnB
-- Run this in your Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/vfgagycdlphosxkjfxuv/sql
-- ============================================================================

-- METHOD 1: Promote an already registered user to Admin
-- 1. First register your account at http://localhost:3000/register
-- 2. Then run this query replacing 'your-email@example.com' with your actual email:

UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'your-email@example.com';

-- Verify the change:
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
WHERE email = 'your-email@example.com';


-- ============================================================================
-- METHOD 2: Check all current administrators
-- ============================================================================
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
WHERE role IN ('admin', 'super_admin');
