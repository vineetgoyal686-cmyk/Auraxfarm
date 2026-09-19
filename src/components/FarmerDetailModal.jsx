import React from 'react'
import { X, User, MapPin, Tractor, Wheat, Paperclip, FileText } from 'lucide-react'
import StorageImage from './StorageImage.jsx'
import { getDisplayUrl } from '../lib/storage.js'

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

export default function FarmerDetailModal({ farmer, farms, crops, onClose }) {
  if (!farmer) return null
  const farmerFarms = farms.filter((f) => f.farmer_id === farmer.id)
  const farmIds = new Set(farmerFarms.map((f) => f.id))
  const farmerCrops = crops.filter((c) => farmIds.has(c.farm_id))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center overflow-hidden">
              {farmer.photo ? (
                <StorageImage
                  src={farmer.photo}
                  className="w-full h-full object-cover"
                  fallback={<User className="w-6 h-6 text-green-600" />}
                />
              ) : (
                <User className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{farmer.name}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  farmer.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {farmer.synced ? 'Synced' : 'Pending Sync'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full shadow">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Farmer Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {FARMER_FIELDS.map((f) => (
                <div key={f.k} className="p-3 rounded-xl bg-gray-50 border">
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
              <div className="grid grid-cols-2 gap-2">
                {farmer.documents.map((doc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={async () => {
                      const url = await getDisplayUrl('documents', doc.url)
                      if (url) window.open(url, '_blank', 'noopener')
                      else alert('Could not open this document right now.')
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border text-xs font-medium truncate hover:bg-green-50 text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Farms ({farmerFarms.length})
            </h4>
            {(farmer.total_farms || farmer.total_farm_area) && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-4">
                {farmer.total_farms && <span><strong>Total Farms:</strong> {farmer.total_farms}</span>}
                {farmer.total_farm_area && (
                  <span>
                    <strong>Total Farm Area:</strong> {farmer.total_farm_area} {farmer.total_farm_area_unit || ''}
                  </span>
                )}
              </div>
            )}
            {farmerFarms.length === 0 && (
              <p className="text-xs text-gray-400">No farms captured for this farmer yet.</p>
            )}
            <div className="space-y-3">
              {farmerFarms.map((farm) => (
                <div key={farm.id} className="p-4 rounded-xl border bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <Tractor className="w-4 h-4 text-amber-600" /> {farm.title || 'Farm'}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        farm.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {farm.synced ? 'Synced' : 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Area: {farm.area || '—'} {farm.area_unit || ''}</div>
                    <div>Topography: {farm.topography || '—'}</div>
                    <div>Irrigation: {farm.irrigation || '—'}%</div>
                    <div>GPS: {farm.geo_tag || '—'}</div>
                    <div>Tractor: {farm.tractor ? 'Yes' : 'No'}</div>
                    <div>Tube Well: {farm.tube_well ? 'Yes' : 'No'}</div>
                    <div>Hired Labour: {farm.hire_labour ? 'Yes' : 'No'}</div>
                  </div>

                  {crops.filter((c) => c.farm_id === farm.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {crops
                        .filter((c) => c.farm_id === farm.id)
                        .map((crop) => (
                          <div key={crop.id} className="p-2.5 rounded-lg bg-green-50 text-xs">
                            <div className="font-bold flex items-center gap-1.5 mb-1">
                              <Wheat className="w-3.5 h-3.5 text-green-700" /> {crop.name} ({crop.season})
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
                  )}
                </div>
              ))}
            </div>
          </div>

          {farmerCrops.length === 0 && farmerFarms.length === 0 && (
            <p className="text-xs text-gray-400">No additional records linked to this farmer.</p>
          )}
        </div>
      </div>
    </div>
  )
}
