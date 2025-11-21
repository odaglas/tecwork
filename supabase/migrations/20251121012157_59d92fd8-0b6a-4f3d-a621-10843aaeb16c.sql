-- Add documento_url column to cotizacion table to store PDF attachments
ALTER TABLE public.cotizacion
ADD COLUMN documento_url text;