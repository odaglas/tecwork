-- Update the tecnico-documents bucket to allow webp images
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
WHERE id = 'tecnico-documents';