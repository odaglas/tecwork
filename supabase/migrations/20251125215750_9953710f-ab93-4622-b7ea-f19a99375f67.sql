-- Drop the insecure policy that allows anyone to insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a new policy that only allows authenticated users to insert their own notifications
-- This will rely on SECURITY DEFINER triggers for system-generated notifications
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);