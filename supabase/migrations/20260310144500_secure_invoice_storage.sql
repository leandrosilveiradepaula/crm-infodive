-- 20260310144500_secure_invoice_storage.sql
-- Create the invoices bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
-- (Assuming it's already enabled, but let's be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Policy for users to upload invoices to their organization folder
CREATE POLICY "Users can upload invoices to their organization folder" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'invoices' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'organization_id')::text
);

-- 2. Policy for users to see invoices from their organization
CREATE POLICY "Users can see invoices from their organization folder" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'invoices' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'organization_id')::text
);

-- 3. Policy for users to delete invoices from their organization
CREATE POLICY "Users can delete invoices from their organization folder" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'invoices' AND 
  (storage.foldername(name))[1] = (auth.jwt() ->> 'organization_id')::text
);
