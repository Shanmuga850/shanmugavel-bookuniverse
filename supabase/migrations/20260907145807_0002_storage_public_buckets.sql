/*
# Ensure public storage buckets for ebooks, covers, founder images

## Changes
1. Ensure 'ebooks', 'ebook-covers', 'founder-images' buckets exist and are public
2. Public read policy for all three buckets
3. Authenticated write/update/delete policies for all three buckets
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('ebooks', 'ebooks', true),
  ('ebook-covers', 'ebook-covers', true),
  ('founder-images', 'founder-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
DROP POLICY IF EXISTS "public_read_book_buckets" ON storage.objects;
CREATE POLICY "public_read_book_buckets" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('ebooks', 'ebook-covers', 'founder-images'));

-- Authenticated insert
DROP POLICY IF EXISTS "auth_insert_book_buckets" ON storage.objects;
CREATE POLICY "auth_insert_book_buckets" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('ebooks', 'ebook-covers', 'founder-images'));

-- Authenticated update
DROP POLICY IF EXISTS "auth_update_book_buckets" ON storage.objects;
CREATE POLICY "auth_update_book_buckets" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('ebooks', 'ebook-covers', 'founder-images'))
  WITH CHECK (bucket_id IN ('ebooks', 'ebook-covers', 'founder-images'));

-- Authenticated delete
DROP POLICY IF EXISTS "auth_delete_book_buckets" ON storage.objects;
CREATE POLICY "auth_delete_book_buckets" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('ebooks', 'ebook-covers', 'founder-images'));
