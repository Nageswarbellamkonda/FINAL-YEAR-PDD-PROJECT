import { supabase } from '@/lib/supabase';
import { config } from '@/lib/config';

/**
 * Upload a file to Supabase Storage under the user's folder.
 * @returns {{ path: string, publicUrl: string | null, error: Error | null }}
 */
export async function uploadFile(userId, bucketKey, file, options = {}) {
  const bucket = config.storage.buckets[bucketKey] || bucketKey;
  const ext = file.name.split('.').pop();
  const fileName = options.fileName || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${userId}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: options.upsert ?? false,
    contentType: file.type,
  });

  if (error) return { path: null, publicUrl: null, error };

  const isPublic = bucketKey === 'profilePhotos';
  let publicUrl = null;
  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    publicUrl = data.publicUrl;
  }

  return { path, publicUrl, error: null, bucket };
}

export async function getSignedUrl(bucketKey, path, expiresIn = 3600) {
  const bucket = config.storage.buckets[bucketKey] || bucketKey;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return { url: data?.signedUrl ?? null, error };
}

export async function removeFile(bucketKey, path) {
  const bucket = config.storage.buckets[bucketKey] || bucketKey;
  return supabase.storage.from(bucket).remove([path]);
}

/**
 * Record uploaded file metadata in evidence_files table.
 */
export async function recordEvidenceFile({
  userId,
  complaintId,
  bucket,
  storagePath,
  fileName,
  mimeType,
  fileSize,
  fileCategory = 'evidence',
}) {
  return supabase.from('evidence_files').insert({
    uploaded_by: userId,
    complaint_id: complaintId || null,
    bucket,
    storage_path: storagePath,
    file_name: fileName,
    mime_type: mimeType,
    file_size: fileSize,
    file_category: fileCategory,
  });
}
