import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Tractor, Navigation as NavIcon, Wheat, Search, Plus, Trash2, User, Pencil } from 'lucide-react'
import { upsertRow, newTempId, displayId } from '../lib/localStore.js'
import { useGeo } from '../lib/useGeo.js'
import StorageImage from './StorageImage.jsx'
import { AREA_UNITS } from '../lib/units.js'
import { notify } from '../lib/notify.js'
import AddCropModal from './AddCropModal.jsx'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const CropRow = ({ crop, onRemove, onEdit }) => (
  <div className="p-3 rounded-xl bg-cream border text-xs space-y-2">
    <div className="flex items-center justify-between">
      <div className="font-bold flex items-center gap-1.5">
        <Wheat className="w-3.5 h-3.5 text-amber-600" />
        {crop.name} {crop.season && <span className="text-gray-500 font-normal">({crop.season})</span>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {crop.existingId && (
          <button
            onClick={onEdit}
            title="Edit crop"
            className="w-6 h-6 rounded-full border bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        {!crop.existingId && (
          <button onClick={onRemove} className="p-1 rounded-full hover:bg-red-50 text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-1 text-gray-600">
      <div>Sowing: {crop.sowingDate || '—'}</div>
      <div>Harvest: {crop.harvestDate || '—'}</div>
      <div>Yield: {crop.yield || '—'}</div>
      <div>Sprays: {crop.sprays || '—'}</div>
      <div className="col-span-2">Fertilizer: {crop.fertilizer || '—'}</div>
    </div>
  </div>
)

const FarmAreaCard = forwardRef(function FarmAreaCard({ index, onRemove, initialFarm, initialCrops = [] }, ref) {
  const [editCropRecord, setEditCropRecord] = useState(null)
  const [title] = useState(initialFarm?.title || 'Owner')
  const [area, setArea] = useState(initialFarm?.area || '')
  const [areaUnit, setAreaUnit] = useState(initialFarm?.area_unit || 'Acres')
  const [topography, setTopography] = useState(initialFarm?.topography || 'Plain')
  const [irrigation, setIrrigation] = useState(initialFarm?.irrigation || '50')
  const [tractor, setTractor] = useState(!!initialFarm?.tractor)
  const [hireLabour, setHireLabour] = useState(!!initialFarm?.hire_labour)
  const [tubeWell, setTubeWell] = useState(!!initialFarm?.tube_well)
  const { position, error, capture } = useGeo()

  const [crops, setCrops] = useState(() =>
    (initialCrops || []).map((c) => ({
      existingId: c.id,
      name: c.name,
      season: c.season,
      yield: c.yield,
      sowingDate: c.sowing_date,
      harvestDate: c.harvest_date,
      sprays: c.sprays,
      fertilizer: c.fertilizer,
      key: c.id
    }))
  )
  const [showCropForm, setShowCropForm] = useState(false)
  const [cropDraft, setCropDraft] = useState({})
  const setCrop = (k, v) => setCropDraft((c) => ({ ...c, [k]: v }))

  function addCrop() {
    if (!cropDraft.name) {
      notify('Enter a crop name')
      return
    }
    if (!cropDraft.season) {
      notify('Select a season')
      return
    }
    if (!cropDraft.yield) {
      notify('Enter the yield')
      return
    }
    if (!cropDraft.sowingDate) {
      notify('Enter the sowing date')
      return
    }
    if (!cropDraft.harvestDate) {
      notify('Enter the harvest date')
      return
    }
    if (!cropDraft.sprays) {
      notify('Enter the sprays count')
      return
    }
    if (!cropDraft.fertilizer) {
      notify('Enter the fertilizer used')
      return
    }
    setCrops((c) => [...c, { ...cropDraft, key: uid() }])
    setCropDraft({})
  }

  const geo = position || (initialFarm?.geo_tag ? { lat: initialFarm.geo_tag.split(',')[0], lng: initialFarm.geo_tag.split(',')[1] } : null)

  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({
      farmId: initialFarm?.id || null,
      title,
      area,
      areaUnit,
      topography,
      irrigation,
      tractor,
      hireLabour,
      tubeWell,
      geo,
      crops
    })
  }))

  return (
    <div className="p-4 rounded-2xl border-2 border-green-100 bg-green-50/30 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase text-green-700">
          {initialFarm ? 'Land Area (already captured)' : `Land Area #${index + 1}`}
        </span>
        {!initialFarm && (
          <button
            onClick={onRemove}
            className="px-3 py-1.5 rounded-full border border-red-200 bg-white text-red-600 text-xs font-bold flex items-center gap-1 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1 min-w-0">
          <label className="text-xs font-semibold text-gray-600 uppercase">
            Land Area <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              value={area}
              onChange={(e) => setArea(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              placeholder="e.g. 2.5"
              className="flex-1 min-w-[100px] px-3 py-3 rounded-xl border border-gray-200 bg-white"
            />
            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value)}
              className="w-28 px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold"
            >
              {AREA_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <label className="text-xs font-semibold text-gray-600 uppercase">
            Topography <span className="text-red-500">*</span>
          </label>
          <select
            value={topography}
            onChange={(e) => setTopography(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white"
          >
            <option>Plain</option>
            <option>Sloped</option>
            <option>Hilly</option>
            <option>Low-lying</option>
          </select>
        </div>

        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">Irrigation %</label>
          <input
            type="range"
            min="0"
            max="100"
            value={irrigation}
            onChange={(e) => setIrrigation(e.target.value)}
            className="w-full accent-green-600"
          />
          <div className="text-sm font-bold text-green-700">{irrigation}%</div>
        </div>

        <div className="sm:col-span-2 grid grid-cols-3 gap-3">
          {[
            { k: 'tractor', label: 'Tractor', val: tractor, set: setTractor },
            { k: 'hireLabour', label: 'Hire Labour', val: hireLabour, set: setHireLabour },
            { k: 'tubeWell', label: 'Tube Well', val: tubeWell, set: setTubeWell }
          ].map((item) => (
            <label
              key={item.k}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition ${
                item.val ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <input type="checkbox" checked={item.val} onChange={(e) => item.set(e.target.checked)} className="hidden" />
              <span className="text-xs font-bold">{item.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.val ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {item.val ? 'YES' : 'NO'}
              </span>
            </label>
          ))}
        </div>

        <div className="sm:col-span-2 space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase">
            GPS Tag <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capture}
              className="px-4 py-3 rounded-xl bg-gray-900 text-white flex items-center gap-2 text-sm font-bold"
            >
              <NavIcon className="w-4 h-4" /> Capture GPS
            </button>
            {geo && (
              <div className="flex-1 p-2 rounded-xl bg-green-50 border border-green-200 text-xs font-mono flex items-center">
                {geo.lat}, {geo.lng}
              </div>
            )}
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      </div>

      {area && (
        <div className="pt-3 border-t border-green-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
              <Wheat className="w-3.5 h-3.5 text-amber-600" /> Crops in this land area ({crops.length}) <span className="text-red-500">*</span>
            </span>
            {!showCropForm && (
              <button
                onClick={() => setShowCropForm(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-500 text-white font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Crop
              </button>
            )}
          </div>

          {crops.length > 0 && (
            <div className="space-y-1.5">
              {crops.map((c) => (
                <CropRow
                  key={c.key}
                  crop={c}
                  onRemove={() => setCrops((list) => list.filter((x) => x.key !== c.key))}
                  onEdit={() => setEditCropRecord(initialCrops.find((ic) => ic.id === c.existingId))}
                />
              ))}
            </div>
          )}

          {showCropForm && (
            <div className="p-3 rounded-xl bg-white border grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Crop Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={cropDraft.name || ''}
                  onChange={(e) => setCrop('name', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Season <span className="text-red-500">*</span>
                </label>
                <select
                  value={cropDraft.season || ''}
                  onChange={(e) => setCrop('season', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                >
                  <option value="">Select</option>
                  <option>Rabi</option>
                  <option>Kharif</option>
                  <option>Zaid</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Yield (Qt/acre) <span className="text-red-500">*</span>
                </label>
                <input
                  value={cropDraft.yield || ''}
                  onChange={(e) => setCrop('yield', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Sowing Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={cropDraft.sowingDate || ''}
                  onChange={(e) => setCrop('sowingDate', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Harvest Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={cropDraft.harvestDate || ''}
                  onChange={(e) => setCrop('harvestDate', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Sprays Count <span className="text-red-500">*</span>
                </label>
                <input
                  value={cropDraft.sprays || ''}
                  onChange={(e) => setCrop('sprays', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Fertilizer Used <span className="text-red-500">*</span>
                </label>
                <input
                  value={cropDraft.fertilizer || ''}
                  onChange={(e) => setCrop('fertilizer', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div className="col-span-2 flex gap-2 pt-1">
                <button onClick={addCrop} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm">
                  + Add Crop
                </button>
                <button
                  onClick={() => {
                    setShowCropForm(false)
                    setCropDraft({})
                  }}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-600 text-sm font-bold flex items-center gap-1 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {editCropRecord && (
        <AddCropModal
          crop={editCropRecord}
          onClose={() => setEditCropRecord(null)}
          onSaved={(row) => {
            setCrops((list) =>
              list.map((c) =>
                c.existingId === row.id
                  ? {
                      ...c,
                      name: row.name,
                      season: row.season,
                      yield: row.yield,
                      sowingDate: row.sowing_date,
                      harvestDate: row.harvest_date,
                      sprays: row.sprays,
                      fertilizer: row.fertilizer
                    }
                  : c
              )
            )
          }}
        />
      )}
    </div>
  )
})

export default function CaptureFarmModal({ farmers, farms = [], crops = [], initialFarmerId, onClose, onSaved }) {
  const [farmerSearch, setFarmerSearch] = useState('')
  const [farmerId, setFarmerId] = useState(initialFarmerId || '')
  const [totalFarms, setTotalFarms] = useState(() => farmers.find((f) => f.id === initialFarmerId)?.total_farms || '')
  const [confirmedTotalFarms, setConfirmedTotalFarms] = useState(
    () => farmers.find((f) => f.id === initialFarmerId)?.total_farms || ''
  )
  const existingFarmsFor = (fid) => farms.filter((f) => f.farmer_id === fid)
  const [farmAreaKeys, setFarmAreaKeys] = useState(() => existingFarmsFor(initialFarmerId).map((f) => f.id))
  const [farmMeta, setFarmMeta] = useState(() => {
    const map = {}
    for (const f of existingFarmsFor(initialFarmerId)) map[f.id] = f
    return map
  })
  const cardRefs = useRef({})

  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.trim().toLowerCase()
    if (!q) return farmers
    return farmers.filter((f) => f.name?.toLowerCase().includes(q) || f.id?.toLowerCase().includes(q) || f.village?.toLowerCase().includes(q))
  }, [farmers, farmerSearch])

  const selectedFarmer = farmers.find((f) => f.id === farmerId)

  function loadExistingFarms(fid) {
    const existing = existingFarmsFor(fid)
    setFarmAreaKeys(existing.map((f) => f.id))
    const map = {}
    for (const f of existing) map[f.id] = f
    setFarmMeta(map)
    cardRefs.current = {}
  }

  function saveTotalFarms() {
    if (!totalFarms) {
      notify('Enter the total number of land areas first.')
      return
    }
    setConfirmedTotalFarms(totalFarms)
    if (selectedFarmer) {
      upsertRow('farmers', {
        ...selectedFarmer,
        total_farms: totalFarms,
        synced: false,
        pending_op: 'upsert'
      })
    }
  }

  function addFarmArea() {
    const cap = parseInt(confirmedTotalFarms, 10) || 0
    if (!confirmedTotalFarms) {
      notify('Enter Total Land and tap Save before adding land areas.')
      return
    }
    if (farmAreaKeys.length >= cap) {
      notify(`Total Land is set to ${cap} — you can't add more than that. Increase Total Land above and tap Save first.`)
      return
    }
    setFarmAreaKeys((keys) => [...keys, uid()])
  }

  function removeFarmArea(key) {
    setFarmAreaKeys((keys) => keys.filter((k) => k !== key))
    delete cardRefs.current[key]
    setFarmMeta((m) => {
      const next = { ...m }
      delete next[key]
      return next
    })
  }

  function handleSaveAll() {
    if (!farmerId) {
      notify('Select a farmer to link this land to.')
      return
    }
    if (!confirmedTotalFarms) {
      notify('Enter Total Land and tap Save first.')
      return
    }
    if (farmAreaKeys.length === 0) {
      notify('Add at least one land area.')
      return
    }

    const snapshots = []
    for (let i = 0; i < farmAreaKeys.length; i++) {
      const key = farmAreaKeys[i]
      const card = cardRefs.current[key]
      if (!card) continue
      const snap = card.getSnapshot()
      const label = `Land Area #${i + 1}`
      if (!snap.area) {
        notify(`${label}: enter the land area size before saving.`)
        return
      }
      if (!snap.geo) {
        notify(`${label}: capture GPS before saving.`)
        return
      }
      if (!snap.topography) {
        notify(`${label}: select the topography before saving.`)
        return
      }
      if (!snap.crops || snap.crops.length === 0) {
        notify(`${label}: add at least one crop before saving.`)
        return
      }
      snapshots.push({ key, snap })
    }

    if (selectedFarmer) {
      upsertRow('farmers', {
        ...selectedFarmer,
        total_farms: confirmedTotalFarms || selectedFarmer.total_farms || '',
        synced: false,
        pending_op: 'upsert'
      })
    }

    for (const { snap } of snapshots) {
      const isExisting = !!snap.farmId
      const farmId = snap.farmId || newTempId('LAND')
      upsertRow('farms', {
        id: farmId,
        farmer_id: farmerId,
        title: snap.title,
        area: snap.area,
        area_unit: snap.areaUnit,
        topography: snap.topography,
        geo_tag: snap.geo ? `${snap.geo.lat},${snap.geo.lng}` : '',
        tractor: !!snap.tractor,
        hire_labour: !!snap.hireLabour,
        irrigation: snap.irrigation,
        tube_well: !!snap.tubeWell,
        ...(isExisting ? {} : { created_at: new Date().toISOString() }),
        synced: false,
        pending_op: 'upsert'
      })

      for (const crop of snap.crops) {
        if (crop.existingId) continue // already saved earlier — nothing changed here
        upsertRow('crops', {
          id: newTempId('CR'),
          farm_id: farmId,
          name: crop.name,
          season: crop.season || '',
          sowing_date: crop.sowingDate || '',
          harvest_date: crop.harvestDate || '',
          yield: crop.yield || '',
          sprays: crop.sprays || '0',
          fertilizer: crop.fertilizer || '',
          created_at: new Date().toISOString(),
          synced: false,
          pending_op: 'upsert'
        })
      }
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col">
      <div className="shrink-0 px-3 sm:px-5 py-3 border-b flex justify-between items-center gap-2 bg-gradient-to-r from-green-50 to-amber-50">
        <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 min-w-0">
          <Tractor className="w-5 h-5 text-green-600 shrink-0" />
          <span className="truncate">Capture Land</span>
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white text-xs sm:text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="px-3 sm:px-4 py-2 rounded-md bg-green-600 text-white text-xs sm:text-sm font-semibold shadow"
          >
            Save Land
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-8 space-y-5">
          {!farmerId ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Select Farmer</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  placeholder="Search by name or farmer ID"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none"
                  autoFocus
                />
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase">{filteredFarmers.length} result{filteredFarmers.length === 1 ? '' : 's'} found</div>
              <div className="max-h-[calc(100vh-320px)] min-h-[200px] overflow-y-auto rounded-xl border divide-y">
                {filteredFarmers.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFarmerId(f.id)
                      setTotalFarms(f.total_farms || '')
                      setConfirmedTotalFarms(f.total_farms || '')
                      loadExistingFarms(f.id)
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-green-50 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
                      {f.photo ? (
                        <StorageImage
                          src={f.photo}
                          className="w-full h-full object-cover"
                          fallback={<User className="w-4 h-4 text-green-600" />}
                        />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{f.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{displayId(f.id)} {f.village ? `• ${f.village}` : ''}</div>
                    </div>
                  </button>
                ))}
                {filteredFarmers.length === 0 && (
                  <div className="p-4 text-sm text-gray-400 text-center">No farmers match your search.</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {selectedFarmer?.photo ? (
                      <StorageImage
                        src={selectedFarmer.photo}
                        className="w-full h-full object-cover"
                        fallback={<User className="w-4 h-4 text-green-600" />}
                      />
                    ) : (
                      <User className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedFarmer?.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{displayId(selectedFarmer?.id)}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFarmerId('')
                    setTotalFarms('')
                    setConfirmedTotalFarms('')
                    setFarmAreaKeys([])
                    setFarmMeta({})
                    cardRefs.current = {}
                  }}
                  className="text-xs font-bold text-green-700 underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  Total Land <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={totalFarms}
                    onChange={(e) => setTotalFarms(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-24 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                  />
                  <button
                    onClick={saveTotalFarms}
                    className="px-3 py-2 rounded-lg bg-gray-900 text-white font-bold text-xs"
                  >
                    Save
                  </button>
                </div>
                {confirmedTotalFarms && (
                  <p className="text-[11px] font-bold text-green-700">
                    Land areas: {farmAreaKeys.length} / {confirmedTotalFarms}
                  </p>
                )}
              </div>

              {confirmedTotalFarms && (
                <button
                  onClick={addFarmArea}
                  className={
                    farmAreaKeys.length === 0
                      ? 'w-full py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2'
                      : 'w-full py-2.5 rounded-xl border-2 border-dashed border-green-300 text-green-700 font-bold flex items-center justify-center gap-2'
                  }
                >
                  <Plus className="w-4 h-4" /> {farmAreaKeys.length === 0 ? 'Add Land Area' : 'Add Another Land Area'}
                </button>
              )}

              <div className="space-y-4">
                {farmAreaKeys.map((key, i) => (
                  <FarmAreaCard
                    key={key}
                    index={i}
                    ref={(el) => (cardRefs.current[key] = el)}
                    onRemove={() => removeFarmArea(key)}
                    initialFarm={farmMeta[key]}
                    initialCrops={farmMeta[key] ? crops.filter((c) => c.farm_id === key) : []}
                  />
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
