import React, { useMemo, useState } from 'react'
import { X, Tractor, Navigation as NavIcon, Wheat } from 'lucide-react'
import { upsertRow, newLocalId } from '../lib/localStore.js'
import { useGeo } from '../lib/useGeo.js'
import { MASTER_DATA } from '../lib/masterData.js'

export default function CaptureFarmModal({ farmers, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: 'Owner',
    topography: 'Plain',
    irrigation: '50',
    tractor: false,
    tubeWell: false,
    hireLabour: false,
    farmerId: farmers[0]?.id || ''
  })
  const { position, error, capture } = useGeo()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const autoId = useMemo(
    () => `FARM-${(form.state || 'HR').slice(0, 2).toUpperCase()}-${(form.district || 'KARN').slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    [form.state, form.district]
  )

  function handleSave() {
    if (!form.farmerId) {
      alert('Select a farmer to link this farm to.')
      return
    }
    const row = {
      id: autoId,
      farmer_id: form.farmerId,
      title: form.title,
      area: form.area || '',
      area_unit: form.areaUnit,
      topography: form.topography,
      geo_tag: position ? `${position.lat},${position.lng}` : '',
      tractor: !!form.tractor,
      hire_labour: !!form.hireLabour,
      irrigation: form.irrigation,
      tube_well: !!form.tubeWell,
      created_at: new Date().toISOString(),
      synced: false,
      pending_op: 'upsert'
    }
    upsertRow('farms', row)

    if (form.cropName) {
      const cropRow = {
        id: newLocalId('CR'),
        farm_id: autoId,
        name: form.cropName,
        season: form.season || 'Rabi',
        sowing_date: form.sowingDate || '',
        harvest_date: form.harvestDate || '',
        yield: form.yield || '',
        sprays: form.sprays || '0',
        fertilizer: form.fertilizer || '',
        created_at: new Date().toISOString(),
        synced: false,
        pending_op: 'upsert'
      }
      upsertRow('crops', cropRow)
    }

    onSaved(row)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-amber-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Tractor className="w-5 h-5 text-green-600" /> Capture Farm
          </h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-800 uppercase">Farm ID (auto)</span>
            <span className="font-mono text-sm font-bold text-amber-900">{autoId}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Link Farmer</label>
              <select
                value={form.farmerId}
                onChange={(e) => set('farmerId', e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
              >
                {farmers.length === 0 && <option value="">No farmers yet — add one first</option>}
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.village}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Farm Area</label>
              <div className="flex gap-2">
                <input
                  value={form.area || ''}
                  onChange={(e) => set('area', e.target.value)}
                  placeholder="e.g. 5.5"
                  className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                />
                <select
                  value={form.areaUnit || ''}
                  onChange={(e) => set('areaUnit', e.target.value)}
                  className="w-28 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold"
                >
                  <option value="">Unit</option>
                  <option>Acres</option>
                  <option>Bigha</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Irrigation %</label>
              <input
                type="range"
                min="0"
                max="100"
                value={form.irrigation}
                onChange={(e) => set('irrigation', e.target.value)}
                className="w-full accent-green-600"
              />
              <div className="text-sm font-bold text-green-700">{form.irrigation}%</div>
            </div>

            <div className="sm:col-span-2 grid grid-cols-3 gap-3">
              {[
                { k: 'tractor', label: 'Tractor' },
                { k: 'hireLabour', label: 'Hire Labour' },
                { k: 'tubeWell', label: 'Tube Well' }
              ].map((item) => (
                <label
                  key={item.k}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition ${
                    form[item.k] ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!form[item.k]}
                    onChange={(e) => set(item.k, e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-xs font-bold">{item.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      form[item.k] ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {form[item.k] ? 'YES' : 'NO'}
                  </span>
                </label>
              ))}
            </div>

            <div className="sm:col-span-2 pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Wheat className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-700 uppercase">Crop Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Crop Name</label>
                  <select
                    value={form.cropName || ''}
                    onChange={(e) => set('cropName', e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <option value="">Select Crop</option>
                    {MASTER_DATA.crops.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Season</label>
                  <select
                    value={form.season || ''}
                    onChange={(e) => set('season', e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <option value="">Select</option>
                    <option>Rabi</option>
                    <option>Kharif</option>
                    <option>Zaid</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Yield (Qt/acre)</label>
                  <input
                    value={form.yield || ''}
                    onChange={(e) => set('yield', e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                    placeholder="e.g. 22"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Sowing Date</label>
                  <input
                    type="date"
                    value={form.sowingDate || ''}
                    onChange={(e) => set('sowingDate', e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Harvest Date</label>
                  <input
                    type="date"
                    value={form.harvestDate || ''}
                    onChange={(e) => set('harvestDate', e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">Sprays Count</label>
                  <input
                    value={form.sprays || ''}
                    onChange={(e) => set('sprays', e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Fertilizer Used</label>
                  <select
                    value={form.fertilizer || ''}
                    onChange={(e) => set('fertilizer', e.target.value)}
                    className="w-full mt-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <option value="">Select Fertilizer</option>
                    {MASTER_DATA.fertilizers.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">GPS Tag</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={capture}
                  className="px-4 py-3 rounded-xl bg-gray-900 text-white flex items-center gap-2 text-sm font-bold"
                >
                  <NavIcon className="w-4 h-4" /> Capture GPS
                </button>
                {position && (
                  <div className="flex-1 p-2 rounded-xl bg-green-50 border border-green-200 text-xs font-mono flex items-center">
                    {position.lat}, {position.lng} • {position.ts}
                  </div>
                )}
              </div>
              {error && <div className="text-xs text-red-600">{error}</div>}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg">
            Save Farm
          </button>
        </div>
      </div>
    </div>
  )
}
