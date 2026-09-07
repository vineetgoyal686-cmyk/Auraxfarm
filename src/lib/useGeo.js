import { useState, useCallback } from 'react'

export function useGeo() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState('')

  const capture = useCallback(() => {
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          alt: (pos.coords.altitude || 0).toFixed(1),
          ts: new Date().toLocaleString()
        })
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return { position, error, capture }
}
