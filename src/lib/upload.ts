// Placeholder upload util for future Supabase Storage integration
// Not wired yet; image_url uses pasted URLs for now

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadFile(_file: File, _pathHint?: string): Promise<UploadResult> {
  // TODO: integrate with Supabase Storage buckets
  return { ok: false, error: 'Storage not configured' };
}


