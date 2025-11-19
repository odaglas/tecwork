-- Backfill missing tecnico roles for existing users with tecnico_profile
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT tp.user_id, 'tecnico'::app_role
FROM public.tecnico_profile tp
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.user_roles ur 
  WHERE ur.user_id = tp.user_id 
  AND ur.role = 'tecnico'::app_role
);

-- Create trigger function to automatically assign tecnico role when tecnico_profile is created
CREATE OR REPLACE FUNCTION public.assign_tecnico_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert tecnico role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'tecnico'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tecnico_profile table
DROP TRIGGER IF EXISTS on_tecnico_profile_created ON public.tecnico_profile;
CREATE TRIGGER on_tecnico_profile_created
  AFTER INSERT ON public.tecnico_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_tecnico_role();

-- Do the same for cliente role
CREATE OR REPLACE FUNCTION public.assign_cliente_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert cliente role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'cliente'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on cliente_profile table
DROP TRIGGER IF EXISTS on_cliente_profile_created ON public.cliente_profile;
CREATE TRIGGER on_cliente_profile_created
  AFTER INSERT ON public.cliente_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_cliente_role();