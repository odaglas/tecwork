-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Users can view adjuntos of their tickets" ON ticket_adjunto;

-- Create a new policy that allows technicians to view adjuntos for tickets they can access
CREATE POLICY "Users can view adjuntos of accessible tickets" 
ON ticket_adjunto 
FOR SELECT 
USING (
  -- Clientes can view their own ticket adjuntos
  EXISTS (
    SELECT 1
    FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = ticket_adjunto.ticket_id 
      AND cp.user_id = auth.uid()
  )
  OR
  -- Tecnicos can view adjuntos for tickets they can access (using existing function)
  EXISTS (
    SELECT 1
    FROM ticket t
    WHERE t.id = ticket_adjunto.ticket_id
      AND tecnico_can_view_ticket(t.id, auth.uid())
  )
);