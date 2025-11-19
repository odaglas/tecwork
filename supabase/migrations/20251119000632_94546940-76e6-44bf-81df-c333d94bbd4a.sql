-- Make the tecnico-documents bucket public so documents can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'tecnico-documents';