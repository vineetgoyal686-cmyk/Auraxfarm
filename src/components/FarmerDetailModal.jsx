import React, { useState } from 'react'
import { X, User, MapPin, Tractor, Wheat, Paperclip, FileText, Pencil, Plus } from 'lucide-react'
import StorageImage from './StorageImage.jsx'
import { getDisplayUrl } from '../lib/storage.js'
import { displayId, upsertRow } from '../lib/localStore.js'
import EditFarmModal from './EditFarmModal.jsx'
import AddCropModal from './AddCropModal.jsx'
import CaptureFarmModal from './CaptureFarmModal.jsx'

const FARMER_FIELDS = [
  { k: 'mobile', label: 'Mobile' },
  { k: 'age', label: 'Age' },
  { k: 'gender', label: 'Gender' },
  { k: 'pan', label: 'PAN' },
  { k: 'aadhaar', label: 'Aadhaar' },
  { k: 'kcc', label: 'Kisan Credit Card' },
  { k: 'qualification', label: 'Academic Qualification' },
  { k: 'family_members', label: 'Family Members' },
  { k: 'family_income', label: 'Family Income (lacs)' },
  { k: 'state', label: 'State' },
  { k: 'district', label: 'District' },
  { k: 'village', label: 'Village' },
  { k: 'address', label: 'Address' }
]

const TABS = [
  { k: 'farmer', label: 'Farmer Detail', icon: User },
  { k: 'land', label: 'Land Detail', icon: MapPin },
  { k: 'crop', label: 'Crop', icon: Wheat }
]

export default function FarmerDetailModal({ farmer, farms, crops, onClose, onEdit, onFarmSaved }) {
  const [tab, setTab] = useState('farmer')
  const [editFarmRecord, setEditFarmRecord] = useState(null)
  const [addCropForFarmId, setAddCropForFarmId] = useState(null)
  const [editCropRecord, setEditCropRecord] = useState(null)
  const [showAddFarm, setShowAddFarm] = useState(false)
  const [totalLandInput, setTotalLandInput] = useState(farmer?.total_farms || '')
  if (!farmer) return null

  function saveTotalLand() {
    if (!totalLandInput) {
      alert('Enter the total number of land parcels first.')
      return
    }
    upsertRow('farmers', { ...farmer, total_farms: totalLandInput, synced: false, pending_op: 'upsert' })
    onFarmSaved?.()
  }

  const farmerFarms = farms.filter((f) => f.farmer_id === farmer.id)
  const farmIds = new Set(farmerFarms.map((f) => f.id))
  const farmerCrops = crops.filter((c) => farmIds.has(c.farm_id))

  // Calculated from what's actually been captured, not typed in by hand,
  // so it can never drift out of sync with the individual farm records
  // (grouped by unit since Acres and Bigha can't just be added together).
  const areaByUnit = farmerFarms.reduce((acc, f) => {
    const val = parseFloat(f.area)
    if (!val) return acc
    const unit = f.area_unit || 'Acres'
    acc[unit] = (acc[unit] || 0) + val
    return acc
  }, {})
  const calculatedArea = Object.entries(areaByUnit)
    .map(([unit, val]) => `${val} ${unit}`)
    .join(', ')

  async function openDoc(doc) {
    const url = await getDisplayUrl('documents', doc.url)
    if (url) window.open(url, '_blank', 'noopener')
    else alert('Could not open this document right now.')
  }

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col">
      <div className="shrink-0 px-3 sm:px-5 py-3 border-b flex justify-between items-center gap-2 bg-gradient-to-r from-green-50 to-amber-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
            {farmer.photo ? (
              <StorageImage
                src={farmer.photo}
                className="w-full h-full object-cover"
                fallback={<User className="w-5 h-5 text-green-600" />}
              />
            ) : (
              <User className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg truncate">{farmer.name}</h3>
              <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 shadow-sm text-xs font-mono font-bold text-gray-700 shrink-0">
                {displayId(farmer.id)}
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                farmer.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {farmer.synced ? 'Synced' : 'Pending Sync'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(farmer)}
              className="px-3 sm:px-4 py-2 rounded-md bg-green-600 text-white text-xs sm:text-sm font-semibold shadow flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-md border border-gray-200 bg-white text-xs sm:text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>

      <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-3 bg-white border-b flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${
              tab === t.k ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.k === 'land' && (
              <span className="text-xs font-normal text-gray-400">
                ({farmerFarms.length}
                {farmer.total_farms ? `/${farmer.total_farms}` : ''})
              </span>
            )}
            {t.k === 'crop' && <span className="text-xs font-normal text-gray-400">({farmerCrops.length})</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-8 space-y-6">
            {tab === 'farmer' && (
              <>
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Farmer Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {FARMER_FIELDS.map((f) => (
                      <div key={f.k} className="p-3 rounded-md bg-gray-50 border">
                        <div className="text-[10px] font-bold uppercase text-gray-400">{f.label}</div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5">{farmer[f.k] || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {farmer.documents?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5" /> Documents ({farmer.documents.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {farmer.documents.map((doc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openDoc(doc)}
                          className="flex items-center gap-2 p-2.5 rounded-md bg-gray-50 border text-xs font-medium truncate hover:bg-green-50 text-left"
                        >
                          <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'land' && (
              <div className="space-y-5">
                <div className="p-4 rounded-md bg-amber-50 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Overall Land Summary
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <strong>Total Land:</strong>
                      <input
                        value={totalLandInput}
                        onChange={(e) => setTotalLandInput(e.target.value.replace(/[^0-9]/g, ''))}
                        inputMode="numeric"
                        className="w-16 px-2 py-1 rounded-md border border-amber-300 bg-white text-xs"
                      />
                      <button
                        onClick={saveTotalLand}
                        className="px-2 py-1 rounded-md bg-gray-900 text-white text-[11px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                    {calculatedArea && (
                      <span>
                        <strong>Total Land Area (captured):</strong> {calculatedArea}
                      </span>
                    )}
                    <span className="text-amber-700">
                      ({farmerFarms.length} of {farmer.total_farms || farmerFarms.length} captured)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Land Records
                  </h4>
                  <button
                    onClick={() => setShowAddFarm(true)}
                    className="text-xs px-3 py-1.5 rounded-full bg-green-600 text-white font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Land
                  </button>
                </div>
                {farmerFarms.length === 0 && !farmer.total_farms ? (
                  <p className="text-xs text-gray-400">No farms captured for this farmer yet.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {Array.from({ length: Math.max(parseInt(farmer.total_farms, 10) || 0, farmerFarms.length) }).map(
                      (_, idx) => {
                        const farm = farmerFarms[idx]
                        if (!farm) {
                          return (
                            <div
                              key={`empty-${idx}`}
                              className="p-4 rounded-md border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-center min-h-[120px]"
                            >
                              <span className="text-xs font-bold text-gray-400">Land {idx + 1}</span>
                              <span className="text-[11px] text-gray-400 mt-1">Not captured yet</span>
                            </div>
                          )
                        }
                        return (
                          <div key={farm.id} className="p-4 rounded-md border bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-bold text-sm flex items-center gap-2">
                                <Tractor className="w-4 h-4 text-amber-600" />
                                Land {idx + 1} — {farm.title || 'Land'}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    farm.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {farm.synced ? 'Synced' : 'Pending'}
                                </span>
                                <button
                                  onClick={() => setEditFarmRecord(farm)}
                                  title="Edit farm"
                                  className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>
                                Area: {farm.area || '—'} {farm.area_unit || ''}
                              </div>
                              <div>Topography: {farm.topography || '—'}</div>
                              <div>Irrigation: {farm.irrigation || '—'}%</div>
                              <div>GPS: {farm.geo_tag || '—'}</div>
                              <div>Tractor: {farm.tractor ? 'Yes' : 'No'}</div>
                              <div>Tube Well: {farm.tube_well ? 'Yes' : 'No'}</div>
                              <div>Hired Labour: {farm.hire_labour ? 'Yes' : 'No'}</div>
                            </div>

                            <div className="mt-3 pt-3 border-t space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold uppercase text-gray-400">
                                  Crops ({crops.filter((c) => c.farm_id === farm.id).length})
                                </div>
                                <button
                                  onClick={() => setAddCropForFarmId(farm.id)}
                                  className="text-[10px] px-2 py-1 rounded-full bg-amber-500 text-white font-bold flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Crop
                                </button>
                              </div>
                              {crops
                                .filter((c) => c.farm_id === farm.id)
                                .map((crop) => (
                                  <div key={crop.id} className="p-2.5 rounded-md bg-green-50 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="font-bold flex items-center gap-1.5">
                                        <Wheat className="w-3.5 h-3.5 text-green-700" /> {crop.name} ({crop.season})
                                      </div>
                                      <button
                                        onClick={() => setEditCropRecord(crop)}
                                        title="Edit crop"
                                        className="w-6 h-6 rounded-full border border-green-200 bg-white flex items-center justify-center text-gray-500 hover:bg-green-100 shrink-0"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-gray-600">
                                      <div>Sowing: {crop.sowing_date || '—'}</div>
                                      <div>Harvest: {crop.harvest_date || '—'}</div>
                                      <div>Yield: {crop.yield || '—'}</div>
                                      <div>Sprays: {crop.sprays || '—'}</div>
                                      <div className="col-span-2">Fertilizer: {crop.fertilizer || '—'}</div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === 'crop' && (
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                  <Wheat className="w-3.5 h-3.5" /> Crops ({farmerCrops.length})
                </h4>
                {farmerCrops.length === 0 ? (
                  <p className="text-xs text-gray-400">No crops recorded for this farmer yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {farmerCrops.map((crop) => {
                      const farmIdx = farmerFarms.findIndex((f) => f.id === crop.farm_id)
                      const farm = farmIdx >= 0 ? farmerFarms[farmIdx] : null
                      return (
                        <div key={crop.id} className="p-3 rounded-md bg-green-50 border border-green-100 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <Wheat className="w-3.5 h-3.5 text-green-700" /> {crop.name} ({crop.season})
                            </div>
                            <button
                              onClick={() => setEditCropRecord(crop)}
                              title="Edit crop"
                              className="w-6 h-6 rounded-full border border-green-200 bg-white flex items-center justify-center text-gray-500 hover:bg-green-100 shrink-0"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          {farm && (
                            <div className="text-[10px] text-gray-500 mb-2 font-mono">
                              Land {farmIdx + 1} ({displayId(farm.id)})
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-1 text-gray-600">
                            <div>Sowing: {crop.sowing_date || '—'}</div>
                            <div>Harvest: {crop.harvest_date || '—'}</div>
                            <div>Yield: {crop.yield || '—'}</div>
                            <div>Sprays: {crop.sprays || '—'}</div>
                            <div className="col-span-2">Fertilizer: {crop.fertilizer || '—'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editFarmRecord && (
        <EditFarmModal
          farm={editFarmRecord}
          onClose={() => setEditFarmRecord(null)}
          onSaved={() => onFarmSaved?.()}
        />
      )}
      {addCropForFarmId && (
        <AddCropModal
          farmId={addCropForFarmId}
          onClose={() => setAddCropForFarmId(null)}
          onSaved={() => onFarmSaved?.()}
        />
      )}
      {editCropRecord && (
        <AddCropModal
          crop={editCropRecord}
          onClose={() => setEditCropRecord(null)}
          onSaved={() => onFarmSaved?.()}
        />
      )}
      {showAddFarm && (
        <CaptureFarmModal
          farmers={[farmer]}
          farms={farms}
          crops={crops}
          initialFarmerId={farmer.id}
          onClose={() => setShowAddFarm(false)}
          onSaved={() => onFarmSaved?.()}
        />
      )}
    </div>
  )
}
