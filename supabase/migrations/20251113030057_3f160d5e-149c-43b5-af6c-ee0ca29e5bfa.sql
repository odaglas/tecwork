-- Fix critical payment table RLS policy vulnerability
-- Replace the overly permissive 'System can update pagos' policy

DROP POLICY IF EXISTS "System can update pagos" ON pago;

-- Only allow clients to update their own pending payments (e.g., to confirm payment)
CREATE POLICY "Clientes can update their pending pagos" ON pago
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = pago.ticket_id
    AND cp.user_id = auth.uid()
  )
  AND estado_pago = 'pendiente_cliente'
)
WITH CHECK (
  estado_pago IN ('pendiente_cliente', 'pagado_retenido')
);

-- Add admin moderation policies for calificacion table
CREATE POLICY "Admins can update calificaciones" 
ON calificacion FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete calificaciones" 
ON calificacion FOR DELETE 
USING (has_role(auth.uid(), 'admin'));