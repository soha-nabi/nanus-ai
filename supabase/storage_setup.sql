-- ============================================================================
-- NANU'S AI — Supabase Storage Setup & Private Bucket Policies
-- File: supabase/storage_setup.sql
-- Private Document Vault & Family Journal Media
-- ============================================================================

-- Create private storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 26214400, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('journal-media', 'journal-media', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies: Private Document Vault
CREATE POLICY "Family members can view stored documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Family members can upload medical documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Family owners can delete stored documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Storage RLS Policies: Family Journal Media
CREATE POLICY "Family members can view journal media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Family members can upload journal media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-media' AND
  auth.role() = 'authenticated'
);
