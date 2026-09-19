import { supabase, isSupabaseConfigured } from './supabaseClient'

const SIGNED_URL_TTL = 3600 // seconds

async function uploadToBucket(bucket, file, folder) {
  if (!isSupabaseConfigured || !file) return null

  const ext = file.name?.split('.').pop() || 'bin'
  const path = `${folder}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (error) {
    console.warn(`Upload to ${bucket} failed, will keep it local-only:`, error.message)
    return null
  }

  // Stored value is the bare storage path, not a public URL — both buckets
  // are read through short-lived signed URLs (see getDisplayUrl below), so
  // this works whether the bucket is public or private.
  return path
}

// Uploads a file to the Supabase Storage `media` bucket and returns its
// storage path. Returns null if Supabase isn't configured or the upload
// fails (e.g. offline) so callers can fall back to a local-only copy.
export function uploadPhoto(file, folder = 'farmers') {
  return uploadToBucket('media', file, folder)
}

// Uploads a farmer document (Aadhaar/PAN copy, land papers, etc.) to the
// Supabase Storage `documents` bucket and returns its storage path.
export function uploadDocument(file, folder = 'farmers') {
  return uploadToBucket('documents', file, folder)
}

// Older records may hold a full Supabase public/signed URL (from before
// buckets moved to signed-URL-only access) instead of a bare path — pull
// the path back out of it so we can re-sign it.
function extractStoragePath(bucket, value) {
  if (!value.startsWith('http')) return value
  const marker = `/${bucket}/`
  const idx = value.indexOf(marker)
  if (idx === -1) return null
  return value.slice(idx + marker.length).split('?')[0]
}

// Resolves any stored photo/document value (bare storage path, legacy
// public URL, local data: URL, or blob: preview) into something an <img>
// or link can use right now. For real storage paths this signs a fresh,
// short-lived URL each time — required now that both buckets are private.
export async function getDisplayUrl(bucket, value) {
  if (!value) return ''
  if (value.startsWith('data:') || value.startsWith('blob:')) return value
  if (!isSupabaseConfigured) return value

  const path = extractStoragePath(bucket, value)
  if (!path) return ''

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL)
  if (error) {
    console.warn(`Could not sign URL for ${bucket}/${path}:`, error.message)
    return ''
  }
  return data.signedUrl
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
