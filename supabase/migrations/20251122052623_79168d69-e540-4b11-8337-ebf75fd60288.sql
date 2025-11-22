-- Update existing chat message notifications to use correct role-based links
-- First, update notifications for tecnicos (users with tecnico role)
UPDATE notifications n
SET link = format('/tecnico/chat/%s', (n.metadata->>'ticket_id')::uuid)
FROM user_roles ur
WHERE n.type = 'new_chat_message'
  AND n.user_id = ur.user_id
  AND ur.role = 'tecnico'
  AND n.link LIKE '/chat/%';

-- Update notifications for clientes (users with cliente role or default)
UPDATE notifications n
SET link = format('/cliente/ticket/%s', (n.metadata->>'ticket_id')::uuid)
FROM user_roles ur
WHERE n.type = 'new_chat_message'
  AND n.user_id = ur.user_id
  AND ur.role = 'cliente'
  AND n.link LIKE '/chat/%';

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_chat_message_insert ON chat_messages;
CREATE TRIGGER on_chat_message_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();