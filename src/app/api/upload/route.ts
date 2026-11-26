import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from '@/lib/auth/session';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/service-role';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/heic',
]);

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: 'Authentication required to upload photos.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image exceeds maximum size of 8 MB. Please compress or choose a smaller photo.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique sanitized filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const storagePath = `spaces/${session.user.id}/${Date.now()}-${uniqueId}.${ext}`;

    // 1. Attempt upload to Supabase Storage bucket 'parking-photos'
    const supabase = getSupabaseServiceRoleClient();
    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('parking-photos')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('parking-photos')
            .getPublicUrl(storagePath);

          if (urlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: urlData.publicUrl,
              storagePath,
              name: file.name,
              size: file.size,
              storage: 'supabase',
            });
          }
        }
      } catch (err) {
        console.warn('[Upload] Supabase Storage upload fallback triggered:', err);
      }
    }

    // 2. High-res Data-URL Fallback (guarantees zero-failure in local dev and staging without bucket provisioning)
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      storagePath: `data-url-${uniqueId}`,
      name: file.name,
      size: file.size,
      storage: 'inline_data',
    });
  } catch (err) {
    console.error('[Upload] Error processing image upload:', err);
    return NextResponse.json(
      { error: 'Server error processing image. Please try again.' },
      { status: 500 }
    );
  }
}
