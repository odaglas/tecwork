-- Add RLS policies for admins to update tickets and cotizaciones

-- Admin can update tickets
CREATE POLICY "Admins can update tickets"
ON public.ticket
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin can update cotizaciones
CREATE POLICY "Admins can update cotizaciones"
ON public.cotizacion
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));