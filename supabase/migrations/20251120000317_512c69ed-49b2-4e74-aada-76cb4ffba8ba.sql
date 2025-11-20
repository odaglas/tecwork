-- Add RLS policy for technicians to upload quote PDFs to storage
CREATE POLICY "Tecnicos can upload quote documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tecnico-documents'
  AND EXISTS (
    SELECT 1 FROM tecnico_profile
    WHERE tecnico_profile.user_id = auth.uid()
  )
);