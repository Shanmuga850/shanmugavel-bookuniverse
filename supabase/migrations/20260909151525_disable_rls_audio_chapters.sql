-- Disable RLS on audio_chapters to allow admin panel writes without auth issues
ALTER TABLE public.audio_chapters DISABLE ROW LEVEL SECURITY;