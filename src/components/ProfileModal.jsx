import React, { useEffect, useState } from 'react'
import { X, UserCircle, Camera, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { uploadPhoto, fileToDataUrl } from '../lib/storage.js'
import StorageImage from './StorageImage.jsx'

export default function ProfileModal({ session, role, isSupabaseConfigured, onClose, onSignOut }) {
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return
    supabase
      .from('profiles')
      .select('id, name, email, role, avatar_url, created_at')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [isSupabaseConfigured, session])

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    setSaving(true)
    const url = (await uploadPhoto(file, 'profiles')) || (await fileToDataUrl(file))
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id)
    if (!error) setProfile((p) => ({ ...p, avatar_url: url }))
    setSaving(false)
  }

  const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'Field User'
  const displayEmail = profile?.email || session?.user?.email || ''
  const displayRole = profile?.role || role || ''

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-amber-50">
          <h3 className="font-bold text-lg">Profile</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!isSupabaseConfigured ? (
            <p className="text-sm text-gray-500">Running in local demo mode &mdash; connect Supabase to manage a real profile.</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-dashed border-green-200 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <StorageImage
                        src={profile.avatar_url}
                        className="w-full h-full object-cover"
                        fallback={<UserCircle className="w-8 h-8 text-green-400" />}
                      />
                    ) : (
                      <UserCircle className="w-8 h-8 text-green-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center cursor-pointer shadow">
                    <Camera className="w-3 h-3" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{displayName}</div>
                  <div className="text-xs text-gray-500 truncate">{displayEmail}</div>
                  <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 uppercase">
                    {displayRole}
                  </span>
                </div>
              </div>
              {saving && <p className="text-xs text-gray-400">Uploading photo…</p>}
              <div className="p-3 rounded-xl bg-gray-50 border text-sm">
                <div className="text-[10px] font-bold uppercase text-gray-400">Member Since</div>
                <div className="font-medium mt-0.5">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onSignOut}
            className="w-full py-3 rounded-xl border font-bold flex items-center justify-center gap-2 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}
