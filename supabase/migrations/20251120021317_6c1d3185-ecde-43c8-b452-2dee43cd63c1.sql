-- Create chat_messages table for client-technician communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.ticket(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow clients to view messages for their tickets
CREATE POLICY "Clientes can view messages for their tickets"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = chat_messages.ticket_id
      AND cp.user_id = auth.uid()
  )
);

-- Allow technicians to view messages for tickets they quoted
CREATE POLICY "Tecnicos can view messages for their quoted tickets"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM cotizacion c
    JOIN tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE c.ticket_id = chat_messages.ticket_id
      AND tp.user_id = auth.uid()
      AND c.estado = 'aceptada'
  )
);

-- Allow clients to insert messages to their tickets
CREATE POLICY "Clientes can insert messages to their tickets"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = chat_messages.ticket_id
      AND cp.user_id = auth.uid()
  )
);

-- Allow technicians to insert messages to tickets they quoted
CREATE POLICY "Tecnicos can insert messages to their quoted tickets"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM cotizacion c
    JOIN tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE c.ticket_id = chat_messages.ticket_id
      AND tp.user_id = auth.uid()
      AND c.estado = 'aceptada'
  )
);

-- Enable realtime for chat messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;