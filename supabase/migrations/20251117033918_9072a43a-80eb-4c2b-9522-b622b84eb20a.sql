-- Add unique constraints to email and rut in profiles table
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_email_key,
  DROP CONSTRAINT IF EXISTS profiles_rut_key;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_email_key UNIQUE (email),
  ADD CONSTRAINT profiles_rut_key UNIQUE (rut);