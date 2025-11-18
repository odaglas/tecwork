-- Create security definer function to check if user owns a ticket
CREATE OR REPLACE FUNCTION public.user_owns_ticket(_ticket_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = _ticket_id 
      AND cp.user_id = _user_id
  )
$$;

-- Create security definer function to check if user is cliente who owns ticket
CREATE OR REPLACE FUNCTION public.user_is_ticket_cliente(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cliente_profile
    WHERE id = _cliente_id 
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check if tecnico can view ticket
CREATE OR REPLACE FUNCTION public.tecnico_can_view_ticket(_ticket_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM ticket t
    WHERE t.id = _ticket_id
      AND (
        t.estado IN ('abierto', 'cotizando')
        OR EXISTS (
          SELECT 1
          FROM cotizacion c
          JOIN tecnico_profile tp ON c.tecnico_id = tp.id
          WHERE c.ticket_id = t.id 
            AND tp.user_id = _user_id
        )
      )
  )
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Clientes can insert their own tickets" ON ticket;
DROP POLICY IF EXISTS "Clientes can update their own tickets" ON ticket;
DROP POLICY IF EXISTS "Clientes can view their own tickets" ON ticket;
DROP POLICY IF EXISTS "Tecnicos can view tickets with cotizaciones" ON ticket;

-- Recreate policies using security definer functions
CREATE POLICY "Clientes can insert their own tickets"
ON ticket
FOR INSERT
TO authenticated
WITH CHECK (public.user_is_ticket_cliente(auth.uid(), cliente_id));

CREATE POLICY "Clientes can update their own tickets"
ON ticket
FOR UPDATE
TO authenticated
USING (public.user_is_ticket_cliente(auth.uid(), cliente_id));

CREATE POLICY "Clientes can view their own tickets"
ON ticket
FOR SELECT
TO authenticated
USING (public.user_is_ticket_cliente(auth.uid(), cliente_id));

CREATE POLICY "Tecnicos can view tickets"
ON ticket
FOR SELECT
TO authenticated
USING (public.tecnico_can_view_ticket(id, auth.uid()));