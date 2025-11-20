-- Allow clientes to view profiles of tecnicos who have submitted quotes on their tickets
CREATE POLICY "Clientes can view profiles of tecnicos on their tickets"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM cotizacion c
    JOIN tecnico_profile tp ON c.tecnico_id = tp.id
    JOIN ticket t ON c.ticket_id = t.id
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE tp.user_id = profiles.id
      AND cp.user_id = auth.uid()
  )
);