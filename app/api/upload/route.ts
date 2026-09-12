import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'vels-books/covers';
    let resource_type = (formData.get('resource_type') as string) || 'auto';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // AUTO-FIX resource_type for ebook + audiobook 300MB purpose
    if (file.type === 'application/pdf') {
      resource_type = 'raw'; // ebook PDF MUST be raw -> /raw/upload/ -> readable
    } else if (file.type.startsWith('audio/') || file.name.endsWith('.mp3')) {
      resource_type = 'video'; // audiobook 300MB MP3 MUST be video -> /video/upload/ -> streamable
    } else if (file.type.startsWith('image/')) {
      resource_type = 'image';
    }

    console.log(`Uploading ${file.name} (${(file.size/1024/1024).toFixed(2)}MB) to ${folder} as ${resource_type}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resource_type as any,
          chunk_size: 6000000,
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
      secure_url: result.secure_url,
      url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      format: result.format,
      resource_type,
    });

  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: e.message || 'Upload failed' },
      { status: 500 }
    );
  }
}