-- Fix critical privilege escalation vulnerability in user_roles table
-- Drop the permissive policy that allows anyone to assign any role
DROP POLICY IF EXISTS "Allow role assignment during signup" ON public.user_roles;

-- Create a secure policy that only allows cliente or tecnico roles during self-signup
CREATE POLICY "Users can only self-assign cliente or tecnico roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('cliente'::app_role, 'tecnico'::app_role)
  );

-- Allow admins to assign any role (including admin role to other users)
CREATE POLICY "Admins can assign any role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
  );