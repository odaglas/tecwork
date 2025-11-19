-- Add RLS policy for admins to view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.ticket
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to view all cotizaciones
CREATE POLICY "Admins can view all cotizaciones"
ON public.cotizacion
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to view all cliente profiles
CREATE POLICY "Admins can view all cliente profiles"
ON public.cliente_profile
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));