'use client';

export async function uploadFile(file: File, folder = 'vels-books/covers') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  fd.append('useCloudinary', file.type.startsWith('image/') ? 'true' : 'false');

  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.url as string;
}

// Optional hook version
export function useUpload() {
  const upload = async (file: File, folder?: string) => {
    return uploadFile(file, folder);
  };
  return { upload, uploadFile };
}