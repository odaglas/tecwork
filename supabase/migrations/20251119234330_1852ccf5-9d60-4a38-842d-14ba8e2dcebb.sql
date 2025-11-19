-- Add storage policy for admins to upload files to tecnico-documents bucket
CREATE POLICY "Admins can upload to tecnico-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tecnico-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add storage policy for admins to delete files from tecnico-documents bucket
CREATE POLICY "Admins can delete from tecnico-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tecnico-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add storage policy for admins to view files in tecnico-documents bucket
CREATE POLICY "Admins can view tecnico-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tecnico-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);