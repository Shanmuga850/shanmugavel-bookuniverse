import { v2 as cloudinary } from 'cloudinary';

// Support both CLOUDINARY_ and NEXT_PUBLIC_ for cloud_name
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

if (!cloudName) {
  console.warn('Cloudinary cloud_name missing! Check .env');
}

cloudinary.config({
  cloud_name: cloudName!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export default cloudinary;

// Helper: generate optimized URL with auto format + quality
export function getOptimizedUrl(publicId: string, options: any = {}) {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
    ...options,
  });
}

// Helper: generate thumbnail
export function getThumbnailUrl(publicId: string, width = 300) {
  return cloudinary.url(publicId, {
    width,
    crop: 'scale',
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
  });
}