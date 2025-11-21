-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger: New cotizacion created
CREATE OR REPLACE FUNCTION public.notify_new_cotizacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cliente_user_id UUID;
  ticket_title TEXT;
  tecnico_name TEXT;
BEGIN
  -- Get cliente user_id and ticket title
  SELECT cp.user_id, t.titulo
  INTO cliente_user_id, ticket_title
  FROM ticket t
  JOIN cliente_profile cp ON t.cliente_id = cp.id
  WHERE t.id = NEW.ticket_id;
  
  -- Get tecnico name
  SELECT p.nombre
  INTO tecnico_name
  FROM tecnico_profile tp
  JOIN profiles p ON tp.user_id = p.id
  WHERE tp.id = NEW.tecnico_id;
  
  -- Create notification for cliente
  PERFORM create_notification(
    cliente_user_id,
    'new_cotizacion',
    'Nueva Cotización Recibida',
    format('Has recibido una nueva cotización de %s para "%s"', tecnico_name, ticket_title),
    format('/cliente/ticket/%s', NEW.ticket_id),
    jsonb_build_object('cotizacion_id', NEW.id, 'ticket_id', NEW.ticket_id)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_cotizacion
  AFTER INSERT ON public.cotizacion
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_cotizacion();

-- Trigger: Cotizacion status changed
CREATE OR REPLACE FUNCTION public.notify_cotizacion_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tecnico_user_id UUID;
  ticket_title TEXT;
  status_text TEXT;
BEGIN
  IF OLD.estado != NEW.estado THEN
    -- Get tecnico user_id
    SELECT tp.user_id
    INTO tecnico_user_id
    FROM tecnico_profile tp
    WHERE tp.id = NEW.tecnico_id;
    
    -- Get ticket title
    SELECT titulo INTO ticket_title
    FROM ticket
    WHERE id = NEW.ticket_id;
    
    -- Set status text
    IF NEW.estado = 'aceptada' THEN
      status_text := 'aceptada';
    ELSIF NEW.estado = 'rechazada' THEN
      status_text := 'rechazada';
    ELSE
      status_text := NEW.estado;
    END IF;
    
    -- Create notification for tecnico
    PERFORM create_notification(
      tecnico_user_id,
      'cotizacion_status',
      format('Cotización %s', UPPER(status_text)),
      format('Tu cotización para "%s" ha sido %s', ticket_title, status_text),
      format('/tecnico/ticket/%s', NEW.ticket_id),
      jsonb_build_object('cotizacion_id', NEW.id, 'ticket_id', NEW.ticket_id, 'estado', NEW.estado)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_cotizacion_status
  AFTER UPDATE ON public.cotizacion
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cotizacion_status_change();

-- Trigger: Ticket status changed
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cliente_user_id UUID;
BEGIN
  IF OLD.estado != NEW.estado THEN
    -- Get cliente user_id
    SELECT user_id INTO cliente_user_id
    FROM cliente_profile
    WHERE id = NEW.cliente_id;
    
    -- Create notification for cliente
    PERFORM create_notification(
      cliente_user_id,
      'ticket_status',
      'Estado del Ticket Actualizado',
      format('Tu ticket "%s" cambió a estado: %s', NEW.titulo, NEW.estado),
      format('/cliente/ticket/%s', NEW.id),
      jsonb_build_object('ticket_id', NEW.id, 'estado', NEW.estado)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_ticket_status
  AFTER UPDATE ON public.ticket
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_status_change();

-- Trigger: New chat message
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_rec RECORD;
  cliente_user_id UUID;
  tecnico_user_id UUID;
  sender_name TEXT;
  recipient_user_id UUID;
BEGIN
  -- Get ticket info
  SELECT t.*, cp.user_id as cliente_uid, t.titulo
  INTO ticket_rec
  FROM ticket t
  JOIN cliente_profile cp ON t.cliente_id = cp.id
  WHERE t.id = NEW.ticket_id;
  
  -- Get sender name
  SELECT nombre INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Get tecnico user_id from accepted cotizacion
  SELECT tp.user_id INTO tecnico_user_id
  FROM cotizacion c
  JOIN tecnico_profile tp ON c.tecnico_id = tp.id
  WHERE c.ticket_id = NEW.ticket_id AND c.estado = 'aceptada'
  LIMIT 1;
  
  -- Determine recipient (if sender is cliente, notify tecnico and vice versa)
  IF NEW.sender_id = ticket_rec.cliente_uid THEN
    recipient_user_id := tecnico_user_id;
  ELSE
    recipient_user_id := ticket_rec.cliente_uid;
  END IF;
  
  -- Create notification for recipient
  IF recipient_user_id IS NOT NULL THEN
    PERFORM create_notification(
      recipient_user_id,
      'new_chat_message',
      'Nuevo Mensaje en Chat',
      format('%s te ha enviado un mensaje sobre "%s"', sender_name, ticket_rec.titulo),
      format('/chat/%s', NEW.ticket_id),
      jsonb_build_object('ticket_id', NEW.ticket_id, 'message_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_message();

-- Trigger: New support message
CREATE OR REPLACE FUNCTION public.notify_new_support_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  support_chat_rec RECORD;
  cliente_user_id UUID;
  sender_name TEXT;
BEGIN
  -- Get support chat info
  SELECT sc.*, cp.user_id as cliente_uid
  INTO support_chat_rec
  FROM support_chat sc
  JOIN cliente_profile cp ON sc.cliente_id = cp.id
  WHERE sc.id = NEW.support_chat_id;
  
  -- Get sender name
  SELECT nombre INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Only notify if sender is not the cliente
  IF NEW.sender_id != support_chat_rec.cliente_uid THEN
    PERFORM create_notification(
      support_chat_rec.cliente_uid,
      'new_support_message',
      'Nuevo Mensaje de Soporte',
      format('%s te ha respondido en el chat de soporte', sender_name),
      format('/cliente/home'),
      jsonb_build_object('support_chat_id', NEW.support_chat_id, 'message_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_support_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_support_message();

-- Trigger: Payment ready (ticket finished)
CREATE OR REPLACE FUNCTION public.notify_payment_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tecnico_user_id UUID;
  ticket_title TEXT;
BEGIN
  IF NEW.estado_pago = 'liberado_tecnico' AND (OLD.estado_pago IS NULL OR OLD.estado_pago != 'liberado_tecnico') THEN
    -- Get tecnico user_id
    SELECT tp.user_id, t.titulo
    INTO tecnico_user_id, ticket_title
    FROM cotizacion c
    JOIN tecnico_profile tp ON c.tecnico_id = tp.id
    JOIN ticket t ON c.ticket_id = t.id
    WHERE c.id = NEW.cotizacion_id;
    
    -- Create notification for tecnico
    PERFORM create_notification(
      tecnico_user_id,
      'payment_ready',
      'Pago Liberado',
      format('El pago de $%s por "%s" ha sido liberado', NEW.monto_total, ticket_title),
      '/tecnico/dashboard',
      jsonb_build_object('pago_id', NEW.id, 'monto', NEW.monto_total)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_payment_ready
  AFTER UPDATE ON public.pago
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_ready();