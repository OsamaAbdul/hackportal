-- Make user_id nullable in submissions for anonymous participant submissions
ALTER TABLE public.submissions ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies on submissions
DROP POLICY IF EXISTS "Participants can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Participants can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Participants can view own submissions" ON public.submissions;

-- Allow anonymous users to insert submissions (participants via shareable link)
CREATE POLICY "Anyone can create submissions"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep organizer view policy (already exists)
-- Organizers can view submissions for their hackathons is already in place

-- Update profiles table to remove role requirement
-- Drop the role column since only organizers will exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update the handle_new_user function to not set role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, google_id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'sub',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$function$;