-- Add RLS policies for technicians to access support chat

-- Allow technicians to view support chats for their tickets
CREATE POLICY "Tecnicos can view support chats for their tickets"
  ON public.support_chat FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cotizacion c
    JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE c.ticket_id = support_chat.ticket_id
    AND tp.user_id = auth.uid()
    AND c.estado = 'aceptada'
  ));

-- Allow technicians to create support chats for their accepted tickets
CREATE POLICY "Tecnicos can create support chats for their tickets"
  ON public.support_chat FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cotizacion c
    JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE c.ticket_id = support_chat.ticket_id
    AND tp.user_id = auth.uid()
    AND c.estado = 'aceptada'
  ));

-- Allow technicians to view messages in support chats for their tickets
CREATE POLICY "Tecnicos can view support messages for their tickets"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_chat sc
    JOIN public.cotizacion c ON c.ticket_id = sc.ticket_id
    JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE sc.id = support_messages.support_chat_id
    AND tp.user_id = auth.uid()
    AND c.estado = 'aceptada'
  ));

-- Allow technicians to insert messages in support chats for their tickets
CREATE POLICY "Tecnicos can insert support messages for their tickets"
  ON public.support_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_chat sc
    JOIN public.cotizacion c ON c.ticket_id = sc.ticket_id
    JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE sc.id = support_messages.support_chat_id
    AND tp.user_id = auth.uid()
    AND c.estado = 'aceptada'
  ));