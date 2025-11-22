-- Add RLS policy for admins to view all pagos
CREATE POLICY "Admins can view all pagos"
ON public.pago
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update pagos
CREATE POLICY "Admins can update all pagos"
ON public.pago
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));