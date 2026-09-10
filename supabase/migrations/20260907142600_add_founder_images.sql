/*
# Add founder images columns and storage bucket

## Changes
1. Add `founder_image_1_url` and `founder_image_2_url` nullable TEXT columns to `founder_profile`
2. Create public storage bucket `founder-images` for author photos
3. Add storage policies for public read + authenticated write

## Notes
- Both columns are optional (nullable) — existing rows are unaffected
- Images are public (readable by anon) since they appear on the public /about page
*/

ALTER TABLE founder_profile
  ADD COLUMN IF NOT EXISTS founder_image_1_url TEXT,
  ADD COLUMN IF NOT EXISTS founder_image_2_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('founder-images', 'founder-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_founder_images" ON storage.objects;
CREATE POLICY "anon_read_founder_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'founder-images');

DROP POLICY IF EXISTS "anon_write_founder_images" ON storage.objects;
CREATE POLICY "anon_write_founder_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'founder-images');

DROP POLICY IF EXISTS "anon_update_founder_images" ON storage.objects;
CREATE POLICY "anon_update_founder_images" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'founder-images');
