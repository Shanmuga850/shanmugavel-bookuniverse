/*
# Create Storage Buckets for VELS BOOKSTORE

## Buckets:
1. `book-covers` - eBook and audiobook cover JPGs (public)
2. `book-pdfs` - eBook PDF files (private, accessed via signed URLs)
3. `book-epubs` - eBook EPUB files (private)
4. `audiobook-files` - Audio MP3 files for audiobooks (private)
5. `founder-assets` - Founder coin logo and bio images (public)
*/

INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('book-pdfs', 'book-pdfs', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('book-epubs', 'book-epubs', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audiobook-files', 'audiobook-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('founder-assets', 'founder-assets', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon/authenticated to upload and read
DROP POLICY IF EXISTS "anon_read_book_covers" ON storage.objects;
CREATE POLICY "anon_read_book_covers" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "anon_write_book_covers" ON storage.objects;
CREATE POLICY "anon_write_book_covers" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "anon_update_book_covers" ON storage.objects;
CREATE POLICY "anon_update_book_covers" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "anon_read_book_pdfs" ON storage.objects;
CREATE POLICY "anon_read_book_pdfs" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'book-pdfs');

DROP POLICY IF EXISTS "anon_write_book_pdfs" ON storage.objects;
CREATE POLICY "anon_write_book_pdfs" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'book-pdfs');

DROP POLICY IF EXISTS "anon_update_book_pdfs" ON storage.objects;
CREATE POLICY "anon_update_book_pdfs" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'book-pdfs');

DROP POLICY IF EXISTS "anon_read_book_epubs" ON storage.objects;
CREATE POLICY "anon_read_book_epubs" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'book-epubs');

DROP POLICY IF EXISTS "anon_write_book_epubs" ON storage.objects;
CREATE POLICY "anon_write_book_epubs" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'book-epubs');

DROP POLICY IF EXISTS "anon_read_audiobook_files" ON storage.objects;
CREATE POLICY "anon_read_audiobook_files" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'audiobook-files');

DROP POLICY IF EXISTS "anon_write_audiobook_files" ON storage.objects;
CREATE POLICY "anon_write_audiobook_files" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'audiobook-files');

DROP POLICY IF EXISTS "anon_update_audiobook_files" ON storage.objects;
CREATE POLICY "anon_update_audiobook_files" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'audiobook-files');

DROP POLICY IF EXISTS "anon_read_founder_assets" ON storage.objects;
CREATE POLICY "anon_read_founder_assets" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'founder-assets');

DROP POLICY IF EXISTS "anon_write_founder_assets" ON storage.objects;
CREATE POLICY "anon_write_founder_assets" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'founder-assets');

DROP POLICY IF EXISTS "anon_update_founder_assets" ON storage.objects;
CREATE POLICY "anon_update_founder_assets" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'founder-assets');
