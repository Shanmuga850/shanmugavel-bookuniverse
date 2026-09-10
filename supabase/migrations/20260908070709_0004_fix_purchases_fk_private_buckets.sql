/*
# Fix purchases FK, private bucket policies, public cover buckets

## Changes
1. purchases: ebook_id nullable (audiobooks don't have ebook_id), add audiobook_id FK
2. Make cover/founder image buckets public
3. Add policies: authenticated read for private buckets (book-pdfs, audiobook-files, book-epubs)
4. Add policies: public read for cover buckets
*/

-- 1. Alter purchases table
ALTER TABLE purchases ALTER COLUMN ebook_id DROP NOT NULL;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS audiobook_id uuid REFERENCES audiobooks(id) ON DELETE CASCADE;

-- Drop old unique constraint to allow either ebook_id or audiobook_id
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_user_id_ebook_id_key;

-- Add new unique constraint covering (user_id, ebook_id, audiobook_id)
CREATE UNIQUE INDEX IF NOT EXISTS purchases_user_ebook_audiobook_unique
  ON purchases(user_id, ebook_id, audiobook_id)
  WHERE ebook_id IS NOT NULL OR audiobook_id IS NOT NULL;

-- 2. Make cover/founder buckets public
UPDATE storage.buckets SET public = true
  WHERE id IN ('ebook-covers', 'book-covers', 'founder-assets', 'founder-images', 'ebooks');

-- 3. Authenticated read for private buckets
DROP POLICY IF EXISTS "auth_read_private_buckets" ON storage.objects;
CREATE POLICY "auth_read_private_buckets" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('book-pdfs', 'audiobook-files', 'book-epubs'));

-- Authenticated insert for private buckets
DROP POLICY IF EXISTS "auth_insert_private_buckets" ON storage.objects;
CREATE POLICY "auth_insert_private_buckets" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('book-pdfs', 'audiobook-files', 'book-epubs'));

-- Authenticated update for private buckets
DROP POLICY IF EXISTS "auth_update_private_buckets" ON storage.objects;
CREATE POLICY "auth_update_private_buckets" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('book-pdfs', 'audiobook-files', 'book-epubs'))
  WITH CHECK (bucket_id IN ('book-pdfs', 'audiobook-files', 'book-epubs'));

-- 4. Public read for cover/founder buckets (ensure existing policy covers these)
DROP POLICY IF EXISTS "public_read_covers" ON storage.objects;
CREATE POLICY "public_read_covers" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('ebook-covers', 'book-covers', 'founder-assets', 'founder-images', 'ebooks'));
