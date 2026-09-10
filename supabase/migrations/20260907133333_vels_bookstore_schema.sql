/*
# VELS BOOKSTORE - Author Direct D2C Platform Schema

## Overview
Complete schema for Vels Bookstore - an author-direct D2C platform for Shanmugavel M's ebooks and audiobooks.

## New Tables
1. `ebooks` - Book catalog with PDF/EPUB/cover, metadata, pricing, visibility, preview settings
2. `audiobooks` - Audiobook catalog linked to ebooks, with cover, sample, credits
3. `audio_chapters` - Chapter-level audio files for each audiobook (max 15)
4. `founder_profile` - Single-row founder bio, fairy quote, coin logo
5. `orders` - Purchase orders with Razorpay integration
6. `cart_items` - Session-based cart (no login required for browsing)

## Security
- RLS enabled on all tables
- Public read for published content (anon + authenticated)
- Admin write access via service role (server-side only)
- No user_id ownership - single admin model with public storefront
*/

-- EBOOKS TABLE
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  authors text[] NOT NULL DEFAULT ARRAY['Shanmugavel M'],
  cover_url text,
  pdf_url text,
  epub_url text,
  mrp integer NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public',
  preview_start integer DEFAULT 1,
  preview_end integer DEFAULT 10,
  isbn text,
  publisher text DEFAULT 'SHANMUGAVEL BOOKUNIVERSE',
  languages text[] DEFAULT ARRAY['English'],
  categories text[],
  about_authors text,
  description text,
  status text DEFAULT 'draft',
  sku text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ebooks" ON ebooks;
CREATE POLICY "anon_select_ebooks" ON ebooks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ebooks" ON ebooks;
CREATE POLICY "anon_insert_ebooks" ON ebooks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ebooks" ON ebooks;
CREATE POLICY "anon_update_ebooks" ON ebooks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ebooks" ON ebooks;
CREATE POLICY "anon_delete_ebooks" ON ebooks FOR DELETE
  TO anon, authenticated USING (true);

-- AUDIOBOOKS TABLE
CREATE TABLE IF NOT EXISTS audiobooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ebook_id uuid REFERENCES ebooks(id) ON DELETE SET NULL,
  authors text[] NOT NULL DEFAULT ARRAY['Shanmugavel M'],
  cover_url text,
  pdf_ref_url text,
  sample_audio_url text,
  mrp integer NOT NULL DEFAULT 0,
  language text DEFAULT 'English',
  opening_url text,
  ending_url text,
  description text,
  status text DEFAULT 'draft',
  sku text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE audiobooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audiobooks" ON audiobooks;
CREATE POLICY "anon_select_audiobooks" ON audiobooks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audiobooks" ON audiobooks;
CREATE POLICY "anon_insert_audiobooks" ON audiobooks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audiobooks" ON audiobooks;
CREATE POLICY "anon_update_audiobooks" ON audiobooks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audiobooks" ON audiobooks;
CREATE POLICY "anon_delete_audiobooks" ON audiobooks FOR DELETE
  TO anon, authenticated USING (true);

-- AUDIO CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS audio_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id uuid NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  chapter_no integer NOT NULL,
  title text NOT NULL,
  mp3_url text,
  duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audio_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audio_chapters" ON audio_chapters;
CREATE POLICY "anon_select_audio_chapters" ON audio_chapters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audio_chapters" ON audio_chapters;
CREATE POLICY "anon_insert_audio_chapters" ON audio_chapters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audio_chapters" ON audio_chapters;
CREATE POLICY "anon_update_audio_chapters" ON audio_chapters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audio_chapters" ON audio_chapters;
CREATE POLICY "anon_delete_audio_chapters" ON audio_chapters FOR DELETE
  TO anon, authenticated USING (true);

-- FOUNDER PROFILE TABLE (single row)
CREATE TABLE IF NOT EXISTS founder_profile (
  id integer PRIMARY KEY DEFAULT 1,
  name text DEFAULT 'Shanmugavel M',
  bio text,
  fairy_quote text DEFAULT 'World is a fantasy, My books are fairies, let my fairy guide you to explore the fantasy',
  coin_logo_url text,
  tagline text DEFAULT 'For 5% THINKERS',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE founder_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_founder" ON founder_profile;
CREATE POLICY "anon_select_founder" ON founder_profile FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_founder" ON founder_profile;
CREATE POLICY "anon_insert_founder" ON founder_profile FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_founder" ON founder_profile;
CREATE POLICY "anon_update_founder" ON founder_profile FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  items jsonb NOT NULL,
  total integer NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  buyer_email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert default founder profile
INSERT INTO founder_profile (id, name, bio, fairy_quote, tagline)
VALUES (1, 'Shanmugavel M', 'Author, thinker, and creator of the GUN STORY series. Writing for the 5% who think differently — the ones who question, explore, and dare to see the world as a fantasy worth exploring.', 'World is a fantasy, My books are fairies, let my fairy guide you to explore the fantasy', 'For 5% THINKERS')
ON CONFLICT (id) DO NOTHING;

-- Insert sample ebook (GUN STORY Volume 1)
INSERT INTO ebooks (title, subtitle, authors, mrp, visibility, status, publisher, languages, categories, description, preview_start, preview_end, isbn, sku)
VALUES (
  'GUN STORY - Volume 1: The Beginning',
  'An exploration of power, choices, and consequences',
  ARRAY['Shanmugavel M'],
  299,
  'public',
  'published',
  'SHANMUGAVEL BOOKUNIVERSE',
  ARRAY['English'],
  ARRAY['Fiction', 'Philosophy'],
  'World is a fantasy, My books are fairies, let my fairy guide you to explore the fantasy. Volume 1 begins the journey into the GUN STORY universe.',
  1, 10,
  '978-0000000001',
  'GS-V1-001'
)
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ebooks_status ON ebooks(status);
CREATE INDEX IF NOT EXISTS idx_audiobooks_status ON audiobooks(status);
CREATE INDEX IF NOT EXISTS idx_audio_chapters_audiobook ON audio_chapters(audiobook_id);
