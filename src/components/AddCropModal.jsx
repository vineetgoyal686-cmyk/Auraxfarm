import React, { useState } from 'react'
import { X, Wheat } from 'lucide-react'
import { upsertRow, newLocalId } from '../lib/localStore.js'

export default function AddCropModal({ farmId, onClose, onSaved }) {
  const [form, setForm] = useState({})
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function handleSave() {
    if (!form.name) {
      alert('Enter a crop name')
      return
    }
    const row = {
      id: newLocalId('CR'),
      farm_id: farmId,
      name: form.name,
      season: form.season || '',
      sowing_date: form.sowingDate || '',
      harvest_date: form.harvestDate || '',
      yield: form.yield || '',
      sprays: form.sprays || '0',
      fertilizer: form.fertilizer || '',
      created_at: new Date().toISOString(),
      synced: false,
      pending_op: 'upsert'
    }
    upsertRow('crops', row)
    onSaved(row)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[24px] p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex gap-2 items-center">
            <Wheat className="w-5 h-5 text-amber-600" /> Add Crop &mdash; {farmId}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Crop Name</label>
            <input
              value={form.name || ''}
              onChange={(e) => set('name', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Season</label>
            <select
              value={form.season || ''}
              onChange={(e) => set('season', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            >
              <option value="">Select</option>
              <option>Rabi</option>
              <option>Kharif</option>
              <option>Zaid</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Yield (Qt/acre)</label>
            <input
              value={form.yield || ''}
              onChange={(e) => set('yield', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Sowing Date</label>
            <input
              type="date"
              value={form.sowingDate || ''}
              onChange={(e) => set('sowingDate', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Harvest Date</label>
            <input
              type="date"
              value={form.harvestDate || ''}
              onChange={(e) => set('harvestDate', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Sprays Count</label>
            <input
              value={form.sprays || ''}
              onChange={(e) => set('sprays', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500">Fertilizer Used</label>
            <input
              value={form.fertilizer || ''}
              onChange={(e) => set('fertilizer', e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-white"
            />
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold">
          Save Crop
        </button>
      </div>
    </div>
  )
}
