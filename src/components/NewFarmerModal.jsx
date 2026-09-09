import React, { useState } from 'react'
import { X, User, Camera } from 'lucide-react'
import VoiceInputButton from './VoiceInputButton.jsx'
import { upsertRow, newLocalId } from '../lib/localStore.js'
import { MASTER_DATA } from '../lib/masterData.js'
import { uploadPhoto, fileToDataUrl } from '../lib/storage.js'

const FIELDS = [
  { k: 'name', label: 'Name', req: true },
  { k: 'mobile', label: 'Mobile', req: true },
  { k: 'age', label: 'Age' },
  { k: 'gender', label: 'Gender', type: 'select', opts: ['Male', 'Female', 'Other'] },
  { k: 'pan', label: 'PAN (Optional)' },
  { k: 'aadhaar', label: 'Aadhaar (Optional)' },
  { k: 'kcc', label: 'Kisan Credit Card', type: 'select', opts: ['Yes', 'No'] },
  {
    k: 'qualification',
    label: 'Academic Qualification',
    type: 'select',
    opts: ['No Formal', '5th', '10th', '12th', 'Graduate', 'Post Graduate']
  },
  { k: 'familyMembers', label: 'Family Members' },
  { k: 'familyIncome', label: 'Family Income (lacs)' },
  { k: 'state', label: 'State', type: 'select', opts: MASTER_DATA.states },
  { k: 'district', label: 'District', type: 'select', opts: MASTER_DATA.districts },
  { k: 'village', label: 'Village', type: 'select', opts: MASTER_DATA.villages }
]

export default function NewFarmerModal({ lang, onClose, onSaved }) {
  const [form, setForm] = useState({
    gender: 'Male',
    kcc: 'No',
    qualification: '10th',
    state: 'Haryana',
    district: 'Karnal',
    village: 'Samalkha'
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.name || !form.mobile) {
      alert('Name & Mobile are required')
      return
    }
    setSaving(true)
    let photo = ''
    if (photoFile) {
      photo = (await uploadPhoto(photoFile, 'farmers')) || (await fileToDataUrl(photoFile))
    }
    const row = {
      id: newLocalId('FRM'),
      ...form,
      photo,
      created_at: new Date().toISOString(),
      synced: false,
      pending_op: 'upsert'
    }
    upsertRow('farmers', row)
    setSaving(false)
    onSaved(row)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-amber-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" /> New Farmer
          </h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl bg-green-50 border-2 border-dashed border-green-200 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <Camera className="w-6 h-6 text-green-400" />
              )}
            </div>
            <label className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium cursor-pointer hover:bg-green-700">
              Add Photo
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.k} className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {f.label} {f.req && <span className="text-red-500">*</span>}
                </label>
                <div className="flex gap-2">
                  {f.type === 'select' ? (
                    <select
                      value={form[f.k] || ''}
                      onChange={(e) => set(f.k, e.target.value)}
                      className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-200 outline-none text-sm"
                    >
                      <option value="">Select</option>
                      {f.opts.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form[f.k] || ''}
                      onChange={(e) => set(f.k, e.target.value)}
                      className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-200 outline-none text-sm"
                      placeholder={f.label}
                    />
                  )}
                  <VoiceInputButton lang={lang} onResult={(text) => set(f.k, text)} />
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Address</label>
              <div className="flex gap-2">
                <textarea
                  value={form.address || ''}
                  onChange={(e) => set('address', e.target.value)}
                  rows={2}
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none text-sm"
                  placeholder="Full address"
                />
                <VoiceInputButton lang={lang} onResult={(text) => set('address', text)} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Farmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
