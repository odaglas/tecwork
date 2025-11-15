-- Create storage bucket for tecnico documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tecnico-documents',
  'tecnico-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- RLS policies for tecnico documents bucket
CREATE POLICY "Tecnicos can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tecnico-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Tecnicos can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tecnico-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all tecnico documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tecnico-documents' 
  AND has_role(auth.uid(), 'admin')
);

-- Update tecnico profile policies to allow clientes to view validated tecnicos
DROP POLICY IF EXISTS "Everyone can view validated tecnicos" ON tecnico_profile;

CREATE POLICY "Anyone can view validated tecnico profiles"
ON tecnico_profile
FOR SELECT
TO authenticated
USING (is_validated = true OR auth.uid() = user_id);