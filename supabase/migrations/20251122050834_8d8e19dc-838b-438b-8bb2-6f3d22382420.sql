-- Drop trigger first, then function
DROP TRIGGER IF EXISTS trigger_notify_new_chat_message ON chat_messages;
DROP FUNCTION IF EXISTS public.notify_new_chat_message();

CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ticket_rec RECORD;
  cliente_user_id UUID;
  tecnico_user_id UUID;
  sender_name TEXT;
  recipient_user_id UUID;
  recipient_role app_role;
  notification_link TEXT;
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
    recipient_role := 'tecnico';
  ELSE
    recipient_user_id := ticket_rec.cliente_uid;
    recipient_role := 'cliente';
  END IF;
  
  -- Set the correct link based on recipient role
  IF recipient_role = 'tecnico' THEN
    notification_link := format('/tecnico/chat/%s', NEW.ticket_id);
  ELSE
    notification_link := format('/cliente/ticket/%s', NEW.ticket_id);
  END IF;
  
  -- Create notification for recipient
  IF recipient_user_id IS NOT NULL THEN
    PERFORM create_notification(
      recipient_user_id,
      'new_chat_message',
      'Nuevo Mensaje en Chat',
      format('%s te ha enviado un mensaje sobre "%s"', sender_name, ticket_rec.titulo),
      notification_link,
      jsonb_build_object('ticket_id', NEW.ticket_id, 'message_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_new_chat_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();