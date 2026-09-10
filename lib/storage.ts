import { supabase } from './supabase-client';

const PRIVATE_BUCKETS = ['book-pdfs', 'audiobook-files', 'book-epubs'];
const ALL_BUCKETS = ['book-pdfs', 'audiobook-files', 'book-epubs', 'ebook-covers', 'book-covers', 'founder-assets', 'founder-images', 'ebooks'];

/**
 * Resolves a stored path or full URL to a usable URL.
 * - Extracts the storage path from full Supabase URLs (handles private bucket 403s).
 * - Private buckets get a 1-hour signed URL (requires auth).
 * - Public buckets get a public URL.
 */
export async function getSignedUrl(bucket: string, pathOrUrl: string | null): Promise<string> {
  if (!pathOrUrl) return '';

  let path = pathOrUrl;
  let resolvedBucket = bucket;

  // If it's a full URL, extract the bucket and path from it
  if (pathOrUrl.includes('http')) {
    for (const b of ALL_BUCKETS) {
      const marker = `/${b}/`;
      const idx = pathOrUrl.indexOf(marker);
      if (idx !== -1) {
        resolvedBucket = b;
        path = pathOrUrl.substring(idx + marker.length).split('?')[0];
        break;
      }
    }
    // If we couldn't extract a path, return as-is (might be an external URL)
    if (path === pathOrUrl) return pathOrUrl;
  } else {
    // It's a path — check if it starts with a bucket name
    for (const b of ALL_BUCKETS) {
      if (path.startsWith(`${b}/`)) {
        resolvedBucket = b;
        path = path.substring(b.length + 1);
        break;
      }
    }
    // Strip query params if any
    path = path.split('?')[0];
  }

  // Private buckets use signed URLs
  if (PRIVATE_BUCKETS.includes(resolvedBucket)) {
    const { data } = await supabase.storage
      .from(resolvedBucket)
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) return data.signedUrl;
    // Fallback to public URL (will 403 but at least won't crash)
    return supabase.storage.from(resolvedBucket).getPublicUrl(path).data.publicUrl;
  }

  return supabase.storage.from(resolvedBucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Legacy alias for backwards compatibility.
 */
export const getUrl = getSignedUrl;
