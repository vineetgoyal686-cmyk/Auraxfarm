import React, { useEffect, useState } from 'react'
import { Tractor, Navigation as NavIcon } from 'lucide-react'
import { upsertRow } from '../lib/localStore.js'
import { useGeo } from '../lib/useGeo.js'
import { AREA_UNITS } from '../lib/units.js'

export default function EditFarmModal({ farm, onClose, onSaved }) {
  const [title] = useState(farm.title || 'Owner')
  const [area, setArea] = useState(farm.area || '')
  const [areaUnit, setAreaUnit] = useState(farm.area_unit || 'Acres')
  const [topography, setTopography] = useState(farm.topography || 'Plain')
  const [irrigation, setIrrigation] = useState(farm.irrigation || '50')
  const [tractor, setTractor] = useState(!!farm.tractor)
  const [hireLabour, setHireLabour] = useState(!!farm.hire_labour)
  const [tubeWell, setTubeWell] = useState(!!farm.tube_well)
  const [geoTag, setGeoTag] = useState(farm.geo_tag || '')
  const { position, error, capture } = useGeo()

  useEffect(() => {
    if (position) setGeoTag(`${position.lat},${position.lng}`)
  }, [position])

  function handleSave() {
    upsertRow('farms', {
      ...farm,
      title,
      area,
      area_unit: areaUnit,
      topography,
      irrigation,
      tractor,
      hire_labour: hireLabour,
      tube_well: tubeWell,
      geo_tag: geoTag,
      synced: false,
      pending_op: 'upsert'
    })
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-cream flex flex-col">
      <div className="shrink-0 px-3 sm:px-5 py-3 border-b flex justify-between items-center gap-2 bg-gradient-to-r from-green-50 to-amber-50">
        <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 min-w-0">
          <Tractor className="w-5 h-5 text-green-600 shrink-0" />
          <span className="truncate">Edit Land</span>
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
            className="px-3 sm:px-4 py-2 rounded-md bg-green-600 text-white text-xs sm:text-sm font-semibold shadow"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:p-6 lg:p-8">
          <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Land Area</label>
                <div className="flex gap-2">
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value.replace(/[^0-9.]/g, ''))}
                    inputMode="decimal"
                    className="flex-1 px-3 py-3 rounded-md border border-gray-200 bg-gray-50 focus:bg-white"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="w-28 px-3 py-3 rounded-md border border-gray-200 bg-gray-50 text-sm font-bold"
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Topography</label>
                <select
                  value={topography}
                  onChange={(e) => setTopography(e.target.value)}
                  className="w-full px-3 py-3 rounded-md border border-gray-200 bg-gray-50"
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
                    className={`p-3 rounded-md border-2 flex flex-col items-center gap-1 cursor-pointer transition ${
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
                    className="px-4 py-3 rounded-md bg-gray-900 text-white flex items-center gap-2 text-sm font-bold"
                  >
                    <NavIcon className="w-4 h-4" /> Capture GPS
                  </button>
                  {geoTag && (
                    <div className="flex-1 p-2 rounded-md bg-green-50 border border-green-200 text-xs font-mono flex items-center">
                      {geoTag}
                    </div>
                  )}
                </div>
                {error && <div className="text-xs text-red-600">{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
