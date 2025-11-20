-- Add RLS policies for clients to manage photos in storage
CREATE POLICY "Clientes can upload photos to their tickets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tecnico-documents'
  AND EXISTS (
    SELECT 1 FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE cp.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
  )
);

CREATE POLICY "Clientes can delete their ticket photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tecnico-documents'
  AND EXISTS (
    SELECT 1 FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE cp.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
  )
);

CREATE POLICY "Clientes can view their ticket photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tecnico-documents'
  AND EXISTS (
    SELECT 1 FROM ticket t
    JOIN cliente_profile cp ON t.cliente_id = cp.id
    WHERE cp.user_id = auth.uid()
      AND (storage.foldername(name))[1] = t.id::text
  )
);