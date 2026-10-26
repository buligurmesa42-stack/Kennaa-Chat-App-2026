import { supabase } from '@/lib/supabase';

export async function uploadMedia(
  userId: string,
  file: File,
  folder: string
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${folder}/${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('kennaa-media')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('kennaa-media')
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, path: filePath };
}

export async function uploadVoiceMessage(
  userId: string,
  blob: Blob,
  durationSec: number
): Promise<{ url: string; path: string; size: number; duration: number } | null> {
  const fileName = `voice/${Date.now()}.webm`;
  const filePath = `${userId}/${fileName}`;
  const file = new File([blob], fileName, { type: 'audio/webm' });

  const { error } = await supabase.storage
    .from('kennaa-media')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('Voice upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('kennaa-media')
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, path: filePath, size: blob.size, duration: durationSec };
}
