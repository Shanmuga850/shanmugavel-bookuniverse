import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min for 300MB audiobook

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'vels-books/covers';
    const resource_type = (formData.get('resource_type') as string) || 'auto'; // NEW: read from client

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Uploading ${file.name} (${(file.size/1024/1024).toFixed(2)}MB) to ${folder} as ${resource_type}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary 25GB free - FIXED FOR 300MB AUDIOBOOKS
    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resource_type as any, // image = cover, video = 300MB MP3, auto = PDF
          chunk_size: 6000000, // 6MB chunks - MUST for 300MB files
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    console.log('Cloudinary success:', result.secure_url);

    return NextResponse.json({
      success: true,
      provider: 'cloudinary',
      secure_url: result.secure_url, // your audiobook page expects secure_url
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
    });

  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: e.message || 'Upload failed' },
      { status: 500 }
    );
  }
}