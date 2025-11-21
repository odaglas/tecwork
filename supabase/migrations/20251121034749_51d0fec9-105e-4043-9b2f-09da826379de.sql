-- Create support chat table for cliente-admin communication
CREATE TABLE public.support_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.ticket(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.cliente_profile(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_revision', 'resuelto')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  support_chat_id UUID NOT NULL REFERENCES public.support_chat(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support attachments table
CREATE TABLE public.support_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  support_message_id UUID NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_chat
CREATE POLICY "Clientes can view their own support chats"
  ON public.support_chat FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE cliente_profile.id = support_chat.cliente_id
    AND cliente_profile.user_id = auth.uid()
  ));

CREATE POLICY "Clientes can create support chats"
  ON public.support_chat FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE cliente_profile.id = support_chat.cliente_id
    AND cliente_profile.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all support chats"
  ON public.support_chat FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update support chats"
  ON public.support_chat FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for support_messages
CREATE POLICY "Clientes can view messages in their support chats"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_chat sc
    JOIN public.cliente_profile cp ON sc.cliente_id = cp.id
    WHERE sc.id = support_messages.support_chat_id
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Clientes can insert messages in their support chats"
  ON public.support_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_chat sc
    JOIN public.cliente_profile cp ON sc.cliente_id = cp.id
    WHERE sc.id = support_messages.support_chat_id
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all support messages"
  ON public.support_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for support_attachments
CREATE POLICY "Users can view attachments in accessible support chats"
  ON public.support_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_messages sm
      JOIN public.support_chat sc ON sm.support_chat_id = sc.id
      JOIN public.cliente_profile cp ON sc.cliente_id = cp.id
      WHERE sm.id = support_attachments.support_message_id
      AND cp.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can insert attachments in accessible support chats"
  ON public.support_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_messages sm
      JOIN public.support_chat sc ON sm.support_chat_id = sc.id
      JOIN public.cliente_profile cp ON sc.cliente_id = cp.id
      WHERE sm.id = support_attachments.support_message_id
      AND cp.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for support-attachments bucket
CREATE POLICY "Users can upload to their support chats"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Anyone can view support attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-attachments');

-- Trigger for updating support_chat updated_at
CREATE TRIGGER update_support_chat_updated_at
  BEFORE UPDATE ON public.support_chat
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();