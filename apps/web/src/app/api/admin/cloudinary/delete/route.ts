import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyAdminAccess } from '../../../../../lib/admin-auth';

export const runtime = 'nodejs';

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
  const authResult = await verifyAdminAccess();
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'No tienes permisos de administrador' },
      { status: 401 }
    );
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error: 'CONFIG_MISSING',
        message: 'Credenciales de Cloudinary no configuradas',
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json(
        { error: 'MISSING_PARAM', message: 'Falta public_id de la imagen a eliminar' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      invalidate: true,
      resource_type: 'image',
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Error deleting image from Cloudinary:', err);
    return NextResponse.json(
      {
        error: 'DELETE_FAILED',
        message: err.message || 'Error al eliminar el asset en Cloudinary',
      },
      { status: 500 }
    );
  }
}
