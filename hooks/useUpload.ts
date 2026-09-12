'use client';
import { useState } from 'react';

export async function uploadFile(file: File, folder = 'vels-books/covers', resource_type = 'auto') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  fd.append('resource_type', resource_type); // 'image' for covers, 'video' for 300MB MP3, 'auto' for PDF

  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  
  // route.ts returns secure_url, fallback to url
  return (data.secure_url || data.url) as string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, options: { folder?: string; resource_type?: string } = {}) => {
    try {
      setUploading(true);
      setProgress(10);
      const url = await uploadFile(file, options.folder, options.resource_type);
      setProgress(100);
      return { secure_url: url, url };
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return { upload, uploadFile, uploading, progress };
}