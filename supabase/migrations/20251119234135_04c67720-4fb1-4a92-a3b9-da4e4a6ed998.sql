-- Add RLS policy for admins to insert ticket adjuntos
CREATE POLICY "Admins can insert adjuntos to any ticket"
ON public.ticket_adjunto
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add RLS policy for admins to delete ticket adjuntos
CREATE POLICY "Admins can delete any adjuntos"
ON public.ticket_adjunto
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);