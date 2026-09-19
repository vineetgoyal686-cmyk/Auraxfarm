import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { X, Tractor, Navigation as NavIcon, Wheat, Search, Plus, Trash2, User } from 'lucide-react'
import { upsertRow, newLocalId } from '../lib/localStore.js'
import { useGeo } from '../lib/useGeo.js'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const CropRow = ({ crop, onRemove }) => (
  <div className="p-2.5 rounded-xl bg-cream border flex justify-between items-center text-xs">
    <div>
      <span className="font-bold">{crop.name}</span>
      {crop.season && <span className="text-gray-500"> • {crop.season}</span>}
      {crop.yield && <span className="text-gray-500"> • {crop.yield} Qt</span>}
    </div>
    <button onClick={onRemove} className="p-1 rounded-full hover:bg-red-50 text-red-500">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
)

const FarmAreaCard = forwardRef(function FarmAreaCard({ index, onRemove }, ref) {
  const [title] = useState('Owner')
  const [area, setArea] = useState('')
  const [areaUnit, setAreaUnit] = useState('Acres')
  const [topography, setTopography] = useState('Plain')
  const [irrigation, setIrrigation] = useState('50')
  const [tractor, setTractor] = useState(false)
  const [hireLabour, setHireLabour] = useState(false)
  const [tubeWell, setTubeWell] = useState(false)
  const { position, error, capture } = useGeo()

  const [crops, setCrops] = useState([])
  const [showCropForm, setShowCropForm] = useState(false)
  const [cropDraft, setCropDraft] = useState({})
  const setCrop = (k, v) => setCropDraft((c) => ({ ...c, [k]: v }))

  function addCrop() {
    if (!cropDraft.name) {
      alert('Enter a crop name')
      return
    }
    setCrops((c) => [...c, { ...cropDraft, key: uid() }])
    setCropDraft({})
  }

  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({ title, area, areaUnit, topography, irrigation, tractor, hireLabour, tubeWell, geo: position, crops })
  }))

  return (
    <div className="p-4 rounded-2xl border-2 border-green-100 bg-green-50/30 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase text-green-700">Farm Area #{index + 1}</span>
        <button onClick={onRemove} className="p-1.5 rounded-full hover:bg-red-50 text-red-500" title="Remove this farm area">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">Farm Area</label>
          <div className="flex gap-2">
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. 2.5"
              className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-white"
            />
            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value)}
              className="w-28 px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold"
            >
              <option>Acres</option>
              <option>Bigha</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">Topography</label>
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
                {position.lat}, {position.lng}
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
              <Wheat className="w-3.5 h-3.5 text-amber-600" /> Crops in this farm area ({crops.length})
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
                <CropRow key={c.key} crop={c} onRemove={() => setCrops((list) => list.filter((x) => x.key !== c.key))} />
              ))}
            </div>
          )}

          {showCropForm && (
            <div className="p-3 rounded-xl bg-white border grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">Crop Name</label>
                <input
                  value={cropDraft.name || ''}
                  onChange={(e) => setCrop('name', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Season</label>
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
                <label className="text-[10px] font-bold uppercase text-gray-500">Yield (Qt/acre)</label>
                <input
                  value={cropDraft.yield || ''}
                  onChange={(e) => setCrop('yield', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Sowing Date</label>
                <input
                  type="date"
                  value={cropDraft.sowingDate || ''}
                  onChange={(e) => setCrop('sowingDate', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Harvest Date</label>
                <input
                  type="date"
                  value={cropDraft.harvestDate || ''}
                  onChange={(e) => setCrop('harvestDate', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Sprays Count</label>
                <input
                  value={cropDraft.sprays || ''}
                  onChange={(e) => setCrop('sprays', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border bg-white text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">Fertilizer Used</label>
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
                  className="px-4 py-2.5 rounded-xl border text-sm font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default function CaptureFarmModal({ farmers, onClose, onSaved }) {
  const [farmerSearch, setFarmerSearch] = useState('')
  const [farmerId, setFarmerId] = useState('')
  const [totalFarms, setTotalFarms] = useState('')
  const [totalFarmArea, setTotalFarmArea] = useState('')
  const [totalFarmAreaUnit, setTotalFarmAreaUnit] = useState('Acres')
  const [farmAreaKeys, setFarmAreaKeys] = useState([])
  const cardRefs = useRef({})

  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.trim().toLowerCase()
    if (!q) return farmers
    return farmers.filter((f) => f.name?.toLowerCase().includes(q) || f.id?.toLowerCase().includes(q) || f.village?.toLowerCase().includes(q))
  }, [farmers, farmerSearch])

  const selectedFarmer = farmers.find((f) => f.id === farmerId)

  function addFarmArea() {
    setFarmAreaKeys((keys) => [...keys, uid()])
  }

  function removeFarmArea(key) {
    setFarmAreaKeys((keys) => keys.filter((k) => k !== key))
    delete cardRefs.current[key]
  }

  function handleSaveAll() {
    if (!farmerId) {
      alert('Select a farmer to link this farm to.')
      return
    }
    if (farmAreaKeys.length === 0) {
      alert('Add at least one farm area.')
      return
    }

    if (selectedFarmer) {
      upsertRow('farmers', {
        ...selectedFarmer,
        total_farms: totalFarms || selectedFarmer.total_farms || '',
        total_farm_area: totalFarmArea || selectedFarmer.total_farm_area || '',
        total_farm_area_unit: totalFarmAreaUnit,
        synced: false,
        pending_op: 'upsert'
      })
    }

    let savedFarms = 0
    for (const key of farmAreaKeys) {
      const card = cardRefs.current[key]
      if (!card) continue
      const snap = card.getSnapshot()
      if (!snap.area) continue

      const farmId = newLocalId('FARM', 'farms')
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
        created_at: new Date().toISOString(),
        synced: false,
        pending_op: 'upsert'
      })
      savedFarms++

      for (const crop of snap.crops) {
        upsertRow('crops', {
          id: newLocalId('CR', 'crops'),
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

    if (savedFarms === 0) {
      alert('Fill in the farm area (at least Farm Area size) before saving.')
      return
    }

    onSaved()
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
              <div className="max-h-64 overflow-y-auto rounded-xl border divide-y">
                {filteredFarmers.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFarmerId(f.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-green-50 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
                      {f.photo ? <img src={f.photo} className="w-full h-full object-cover" alt="" /> : <User className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{f.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{f.id} {f.village ? `• ${f.village}` : ''}</div>
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
                      <img src={selectedFarmer.photo} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedFarmer?.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono">{selectedFarmer?.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFarmerId('')
                    setFarmAreaKeys([])
                    cardRefs.current = {}
                  }}
                  className="text-xs font-bold text-green-700 underline"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Total Farm</label>
                  <input
                    value={totalFarms}
                    onChange={(e) => setTotalFarms(e.target.value)}
                    placeholder="No. of farms"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Total Farm Area</label>
                  <div className="flex gap-2">
                    <input
                      value={totalFarmArea}
                      onChange={(e) => setTotalFarmArea(e.target.value)}
                      placeholder="e.g. 5"
                      className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-white"
                    />
                    <select
                      value={totalFarmAreaUnit}
                      onChange={(e) => setTotalFarmAreaUnit(e.target.value)}
                      className="w-24 px-2 py-3 rounded-xl border border-gray-200 bg-white text-sm font-bold"
                    >
                      <option>Acres</option>
                      <option>Bigha</option>
                    </select>
                  </div>
                </div>
              </div>

              {totalFarms && totalFarmArea && farmAreaKeys.length === 0 && (
                <button
                  onClick={addFarmArea}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Farm Area
                </button>
              )}

              <div className="space-y-4">
                {farmAreaKeys.map((key, i) => (
                  <FarmAreaCard
                    key={key}
                    index={i}
                    ref={(el) => (cardRefs.current[key] = el)}
                    onRemove={() => removeFarmArea(key)}
                  />
                ))}
              </div>

              {farmAreaKeys.length > 0 && (
                <button
                  onClick={addFarmArea}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-green-300 text-green-700 font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Farm Area
                </button>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border">
            Cancel
          </button>
          <button onClick={handleSaveAll} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg">
            Save Farm
          </button>
        </div>
      </div>
    </div>
  )
}
