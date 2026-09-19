import React, { useEffect, useState } from 'react'
import { getDisplayUrl } from '../lib/storage.js'

// Renders an <img> for a value that might be a bare Supabase Storage path,
// a legacy public/signed URL, or a local data:/blob: preview — resolving
// storage paths to a fresh signed URL first (both buckets are private).
export default function StorageImage({ src, bucket = 'media', alt = '', className, fallback = null }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    let active = true
    setUrl('')
    if (!src) return undefined
    getDisplayUrl(bucket, src).then((resolved) => {
      if (active) setUrl(resolved)
    })
    return () => {
      active = false
    }
  }, [src, bucket])

  if (!url) return fallback
  return <img src={url} alt={alt} className={className} />
}
