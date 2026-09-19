import React, { useRef, useState } from 'react'
import { User, Camera, Paperclip, FileText, X } from 'lucide-react'
import VoiceInputButton from './VoiceInputButton.jsx'
import { upsertRow, newLocalId } from '../lib/localStore.js'
import { uploadPhoto, uploadDocument, fileToDataUrl } from '../lib/storage.js'

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function sanitizeValue(filter, value) {
  if (filter === 'digits') return value.replace(/[^0-9]/g, '')
  if (filter === 'alpha') return value.replace(/[^a-zA-Z\s]/g, '')
  return value
}

const FIELDS = [
  { k: 'name', label: 'Name', req: true, filter: 'alpha' },
  { k: 'mobile', label: 'Mobile', req: true, filter: 'digits', maxLength: 10, inputMode: 'numeric' },
  { k: 'age', label: 'Age', req: true, filter: 'digits', maxLength: 2, inputMode: 'numeric' },
  { k: 'gender', label: 'Gender', type: 'select', opts: ['Male', 'Female', 'Other'], req: true },
  { k: 'pan', label: 'PAN (Optional)' },
  { k: 'aadhaar', label: 'Aadhaar (Optional)', filter: 'digits', maxLength: 12, inputMode: 'numeric' },
  { k: 'kcc', label: 'Kisan Credit Card', type: 'select', opts: ['Yes', 'No'], req: true },
  { k: 'qualification', label: 'Academic Qualification', req: true },
  { k: 'family_members', label: 'Family Members', req: true, filter: 'digits', inputMode: 'numeric' },
  { k: 'family_income', label: 'Family Income (lacs)', req: true, filter: 'digits', inputMode: 'numeric' },
  { k: 'state', label: 'State', req: true, filter: 'alpha' },
  { k: 'district', label: 'District', req: true, filter: 'alpha' },
  { k: 'village', label: 'Village', req: true, filter: 'alpha' }
]

const PAN_PARTS = [
  { len: 5, filter: 'alpha', placeholder: 'AAAAA', width: 'w-20' },
  { len: 4, filter: 'digits', placeholder: '9999', width: 'w-16' },
  { len: 1, filter: 'alpha', placeholder: 'A', width: 'w-11' }
]

export default function NewFarmerModal({ lang, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [docFiles, setDocFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [panParts, setPanParts] = useState(['', '', ''])
  const panRefs = [useRef(null), useRef(null), useRef(null)]

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function updatePan(idx, rawValue) {
    const { len, filter } = PAN_PARTS[idx]
    const clean = sanitizeValue(filter, rawValue).replace(/\s/g, '').toUpperCase().slice(0, len)
    setPanParts((parts) => {
      const next = [...parts]
      next[idx] = clean
      set('pan', next.join(''))
      return next
    })
    if (clean.length === len && idx < PAN_PARTS.length - 1) {
      panRefs[idx + 1].current?.focus()
    }
  }

  function handlePanKeyDown(idx, e) {
    if (e.key === 'Backspace' && !panParts[idx] && idx > 0) {
      panRefs[idx - 1].current?.focus()
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview('')
  }

  function handleDocsChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setDocFiles((list) => [...list, ...files.map((file) => ({ key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`, file }))])
    e.target.value = ''
  }

  function removeDoc(key) {
    setDocFiles((list) => list.filter((d) => d.key !== key))
  }

  function openDoc(file) {
    const url = URL.createObjectURL(file)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  async function handleSave() {
    const missing = FIELDS.filter((f) => f.req && !String(form[f.k] || '').trim())
    if (missing.length > 0 || !String(form.address || '').trim()) {
      const names = missing.map((f) => f.label).concat(!String(form.address || '').trim() ? ['Address'] : [])
      alert(`Please fill required fields: ${names.join(', ')}`)
      return
    }
    const age = parseInt(form.age, 10)
    if (age <= 15 || age > 99) {
      alert('Age must be between 16 and 99')
      return
    }
    if (String(form.mobile || '').length !== 10) {
      alert('Mobile number must be exactly 10 digits')
      return
    }
    setSaving(true)
    let photo = ''
    if (photoFile) {
      photo = (await uploadPhoto(photoFile, 'farmers')) || (await fileToDataUrl(photoFile))
    }
    const documents = []
    for (const { file } of docFiles) {
      const url = (await uploadDocument(file, 'farmers')) || (await fileToDataUrl(file))
      documents.push({ name: file.name, url })
    }
    const row = {
      id: newLocalId('FRM', 'farmers'),
      ...form,
      photo,
      documents,
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
    <div className="fixed inset-0 z-50 bg-cream flex flex-col">
      <div className="shrink-0 px-3 sm:px-5 py-3 border-b flex justify-between items-center gap-2 bg-gradient-to-r from-green-50 to-amber-50">
        <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 min-w-0">
          <User className="w-5 h-5 text-green-600 shrink-0" />
          <span className="truncate">New Farmer</span>
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white text-xs sm:text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 sm:px-4 py-2 rounded-md bg-green-600 text-white text-xs sm:text-sm font-semibold shadow disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Farmer'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-8 space-y-5">
          <div className="flex gap-4 items-center">
            <div className="relative w-20 h-20 rounded-lg bg-green-50 border-2 border-dashed border-green-200 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <Camera className="w-6 h-6 text-green-400" />
              )}
              {photoPreview && (
                <button
                  type="button"
                  onClick={removePhoto}
                  title="Remove photo"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <label className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-green-700">
              {photoPreview ? 'Change Photo' : 'Add Photo'}
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FIELDS.map((f) => (
              <div key={f.k} className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {f.label} {f.req && <span className="text-red-500">*</span>}
                </label>
                <div className="flex gap-2">
                  {f.k === 'pan' ? (
                    <div className="flex gap-1.5">
                      {PAN_PARTS.map((part, idx) => (
                        <input
                          key={idx}
                          ref={panRefs[idx]}
                          value={panParts[idx]}
                          onChange={(e) => updatePan(idx, e.target.value)}
                          onKeyDown={(e) => handlePanKeyDown(idx, e)}
                          maxLength={part.len}
                          placeholder={part.placeholder}
                          className={`${part.width} px-2 py-3 rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-200 outline-none text-sm text-center uppercase tracking-wider`}
                        />
                      ))}
                    </div>
                  ) : f.type === 'select' ? (
                    <select
                      value={form[f.k] || ''}
                      onChange={(e) => set(f.k, e.target.value)}
                      className="flex-1 px-3 py-3 rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-200 outline-none text-sm"
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
                      onChange={(e) => set(f.k, sanitizeValue(f.filter, e.target.value).slice(0, f.maxLength))}
                      inputMode={f.inputMode}
                      maxLength={f.maxLength}
                      className="flex-1 px-3 py-3 rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-200 outline-none text-sm"
                      placeholder={f.label}
                    />
                  )}
                  {f.k !== 'pan' && (
                    <VoiceInputButton
                      lang={lang}
                      onResult={(text) => set(f.k, sanitizeValue(f.filter, text).slice(0, f.maxLength))}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <textarea
                  value={form.address || ''}
                  onChange={(e) => set('address', e.target.value)}
                  rows={2}
                  className="flex-1 px-3 py-3 rounded-md border border-gray-200 bg-gray-50 focus:bg-white outline-none text-sm"
                  placeholder="Full address"
                />
                <VoiceInputButton lang={lang} onResult={(text) => set('address', text)} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Document Attachments
              </label>
              <label className="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-amber-600 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Add Document
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleDocsChange}
                />
              </label>
            </div>

            {docFiles.length === 0 ? (
              <div className="text-xs text-gray-400">No documents attached yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {docFiles.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center gap-2 p-2.5 rounded-md border border-gray-200 bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => openDoc(d.file)}
                      title="Open document"
                      className="flex items-center gap-2 min-w-0 flex-1 text-left hover:underline"
                    >
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{d.file.name}</div>
                        <div className="text-[10px] text-gray-500">{formatSize(d.file.size)}</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDoc(d.key)}
                      title="Remove document"
                      className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
