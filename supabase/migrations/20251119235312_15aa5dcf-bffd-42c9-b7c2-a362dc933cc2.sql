-- Add RLS policy to allow admins to view all ticket adjuntos
CREATE POLICY "Admins can view all adjuntos"
ON ticket_adjunto
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));