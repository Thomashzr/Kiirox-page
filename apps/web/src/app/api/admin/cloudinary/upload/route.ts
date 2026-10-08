import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAdminAccess } from '../../../../../lib/admin-auth';
import { checkRateLimit } from '../../../../../lib/rate-limit';

export const runtime = 'nodejs';

// Configure Cloudinary from server environment
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function POST(req: NextRequest) {
  // 1. Verify admin permissions
  const authResult = await verifyAdminAccess();
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'No tienes permisos de administrador' },
      { status: 401 }
    );
  }

  // 1b. Rate limiting check (max 30 uploads per minute per admin)
  const rl = checkRateLimit(`upload:${authResult.admin.id}`, { limit: 30, windowMs: 60000 });
  if (!rl.success) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Límite de subidas alcanzado. Intenta nuevamente en ${rl.reset} segundos.`,
      },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    );
  }

  // 2. Check if Cloudinary is configured
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error: 'CONFIG_MISSING',
        message:
          'Las credenciales de Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) no están configuradas en el entorno.',
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No se envió ningún archivo de imagen' },
        { status: 400 }
      );
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: 'El archivo supera el límite de 10MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary stream
    const uploadResult = await new Promise<{
      public_id: string;
      secure_url: string;
      format: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kiirox/products',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Error al subir a Cloudinary'));
          } else {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      image: {
        public_id: uploadResult.public_id,
        public_url: uploadResult.secure_url,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });
  } catch (err: any) {
    console.error('Error uploading to Cloudinary:', err);
    return NextResponse.json(
      {
        error: 'UPLOAD_FAILED',
        message: err.message || 'Error al procesar y subir la imagen a Cloudinary',
      },
      { status: 500 }
    );
  }
}
