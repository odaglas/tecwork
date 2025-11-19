-- Allow admins to delete tickets
CREATE POLICY "Admins can delete tickets"
ON public.ticket
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));