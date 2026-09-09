import { supabase, isSupabaseConfigured } from './supabaseClient'

const BUCKET = 'media'

// Uploads a file to the Supabase Storage `media` bucket and returns its
// public URL. Returns null if Supabase isn't configured or the upload
// fails (e.g. offline) so callers can fall back to a local-only copy.
export async function uploadPhoto(file, folder = 'farmers') {
  if (!isSupabaseConfigured || !file) return null

  const ext = file.name?.split('.').pop() || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (error) {
    console.warn('Photo upload failed, will keep it local-only:', error.message)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
