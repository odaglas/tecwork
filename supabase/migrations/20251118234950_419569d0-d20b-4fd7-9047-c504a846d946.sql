-- Add RLS policies for admins to view all profiles and tecnico profiles

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all tecnico profiles (including non-validated)
CREATE POLICY "Admins can view all tecnico profiles"
ON public.tecnico_profile
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));