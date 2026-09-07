import React, { useEffect, useState } from 'react'
import {
  Sprout,
  LayoutDashboard,
  Users,
  Tractor,
  CloudUpload,
  LogOut,
  Wifi,
  WifiOff,
  Plus,
  Search,
  User,
  Clock,
  RotateCcw,
  Activity
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { translations } from '../lib/i18n.js'
import { listRows } from '../lib/localStore.js'
import { useOnlineSync } from '../lib/useOnlineSync.js'
import NewFarmerModal from '../components/NewFarmerModal.jsx'
import CaptureFarmModal from '../components/CaptureFarmModal.jsx'
import AddCropModal from '../components/AddCropModal.jsx'

const TABS = [
  { k: 'dash', icon: LayoutDashboard },
  { k: 'farmers', icon: Users },
  { k: 'farms', icon: Tractor },
  { k: 'sync', icon: CloudUpload }
]

export default function FieldApp() {
  const { signOut, isSupabaseConfigured } = useAuth()
  const { online, pending, lastSync, runSync, refreshPending } = useOnlineSync()
  const [lang, setLang] = useState('en')
  const [tab, setTab] = useState('dash')
  const [farmers, setFarmers] = useState(() => listRows('farmers'))
  const [farms, setFarms] = useState(() => listRows('farms'))
  const [crops, setCrops] = useState(() => listRows('crops'))
  const [showNewFarmer, setShowNewFarmer] = useState(false)
  const [showCaptureFarm, setShowCaptureFarm] = useState(false)
  const [addCropFor, setAddCropFor] = useState(null)
  const [query, setQuery] = useState('')
  const t = translations[lang]

  function refreshAll() {
    setFarmers(listRows('farmers'))
    setFarms(listRows('farms'))
    setCrops(listRows('crops'))
    refreshPending()
  }

  useEffect(() => {
    const id = setInterval(refreshAll, 3000)
    return () => clearInterval(id)
  }, [])

  const filteredFarmers = farmers.filter(
    (f) => f.name?.toLowerCase().includes(query.toLowerCase()) || f.village?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cream text-gray-900">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold leading-none">{t.appName}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Field Executive</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold border ${
              online ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {online ? t.online : t.offline}
          </div>
          <div className="flex rounded-full border bg-gray-50 p-1">
            {['en', 'hi', 'pa'].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  lang === code ? 'bg-green-600 text-white' : 'text-gray-600'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={signOut} className="p-2 rounded-full bg-gray-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto p-4 pb-24">
        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Running in local demo mode &mdash; entries are saved on this device only. Connect Supabase
            (see README.md) to enable real cloud sync between devices.
          </div>
        )}

        {tab === 'dash' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: t.todayEntries, val: farmers.length + farms.length, color: 'bg-green-600', icon: Activity },
                { label: t.pendingSync, val: pending, color: 'bg-amber-500', icon: CloudUpload },
                {
                  label: 'Total Area',
                  val: farms.reduce((s, f) => s + (parseFloat(f.area) || 0), 0).toFixed(1) + ' Ac',
                  color: 'bg-lime-600',
                  icon: Tractor
                },
                {
                  label: 'Last Sync',
                  val: lastSync ? lastSync.toLocaleTimeString() : '—',
                  color: 'bg-emerald-600',
                  icon: Clock
                }
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-[20px] bg-white shadow-sm border border-gray-100">
                  <div className={`w-8 h-8 rounded-xl ${s.color} text-white flex items-center justify-center mb-3`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</div>
                  <div className="text-xl font-bold mt-1">{s.val}</div>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-[20px] bg-white border shadow-sm">
              <h3 className="font-bold mb-4">{t.quickActions}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowNewFarmer(true)}
                  className="p-5 rounded-2xl bg-green-600 text-white text-left hover:bg-green-700 shadow-lg shadow-green-200"
                >
                  <Users className="w-6 h-6 mb-3" />
                  <div className="font-bold">{t.newFarmer}</div>
                  <div className="text-xs opacity-80 mt-1">Name, mobile, photo, voice input</div>
                </button>
                <button
                  onClick={() => setShowCaptureFarm(true)}
                  className="p-5 rounded-2xl bg-amber-500 text-white text-left hover:bg-amber-600 shadow-lg shadow-amber-200"
                >
                  <Tractor className="w-6 h-6 mb-3" />
                  <div className="font-bold">{t.captureFarm}</div>
                  <div className="text-xs opacity-80 mt-1">Area, GPS, irrigation, equipment</div>
                </button>
                <button
                  onClick={runSync}
                  className="p-5 rounded-2xl bg-white border-2 border-gray-900 text-gray-900 text-left hover:bg-gray-50"
                >
                  <RotateCcw className="w-6 h-6 mb-3" />
                  <div className="font-bold">{t.sync} Now</div>
                  <div className="text-xs opacity-70 mt-1">{online ? 'Ready' : 'Offline — will retry'}</div>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-[20px] bg-white border shadow-sm">
              <h3 className="font-bold mb-4">{t.recent}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {farmers.slice(0, 3).map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl border bg-cream flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center overflow-hidden">
                      {f.photo ? <img src={f.photo} className="w-full h-full object-cover" alt="" /> : <User className="w-6 h-6 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{f.name}</div>
                      <div className="text-[11px] text-gray-600">
                        {f.village}, {f.district} • {f.mobile}
                      </div>
                      <span
                        className={`mt-1 inline-block text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          f.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.synced ? 'Synced' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {farmers.length === 0 && <div className="text-sm text-gray-400">No entries yet.</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'farmers' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search farmer, village"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white outline-none"
                />
              </div>
              <button
                onClick={() => setShowNewFarmer(true)}
                className="px-5 py-3 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFarmers.map((f) => (
                <div key={f.id} className="p-4 rounded-[20px] bg-white border shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-green-50 overflow-hidden flex items-center justify-center">
                      {f.photo ? <img src={f.photo} className="w-full h-full object-cover" alt="" /> : <User className="w-6 h-6 text-green-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{f.name}</div>
                      <div className="text-xs text-gray-600">
                        {f.gender}, {f.age}y • {f.qualification}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {f.village}, {f.district}, {f.state}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        f.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {f.synced ? '✓ Synced' : '◍ Pending Sync'}
                    </span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100">{f.id}</span>
                  </div>
                </div>
              ))}
              {filteredFarmers.length === 0 && <div className="text-sm text-gray-400">No farmers match your search.</div>}
            </div>
          </div>
        )}

        {tab === 'farms' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Farmlands ({farms.length})</h2>
              <button
                onClick={() => setShowCaptureFarm(true)}
                className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Capture Farm
              </button>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              {farms.map((farm) => {
                const owner = farmers.find((f) => f.id === farm.farmer_id)
                const farmCrops = crops.filter((c) => c.farm_id === farm.id)
                return (
                  <div key={farm.id} className="p-5 rounded-[24px] bg-white border shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-xs font-bold px-2 py-1 rounded-full bg-amber-50 border border-amber-200 inline-block">
                          {farm.id}
                        </div>
                        <div className="font-bold mt-2">
                          {owner?.name || 'Unknown'} • {farm.title} • {farm.area} {farm.area_unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {farm.topography} • Irrigation {farm.irrigation}% • {farm.geo_tag || 'No GPS tag'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                          farm.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {farm.synced ? 'Synced' : 'Pending'}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-gray-500">Crops ({farmCrops.length})</span>
                        <button
                          onClick={() => setAddCropFor(farm.id)}
                          className="text-xs px-3 py-1 rounded-full bg-amber-500 text-white font-bold"
                        >
                          + Add Crop
                        </button>
                      </div>
                      {farmCrops.length ? (
                        <div className="space-y-2">
                          {farmCrops.map((c) => (
                            <div key={c.id} className="p-2.5 rounded-xl bg-cream border flex justify-between text-xs">
                              <span className="font-bold">
                                {c.name} • {c.season}
                              </span>
                              <span className="text-gray-600">
                                {c.sowing_date} → {c.harvest_date} • {c.yield}Qt
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 p-3 rounded-xl bg-gray-50">No crops recorded yet.</div>
                      )}
                    </div>
                  </div>
                )
              })}
              {farms.length === 0 && <div className="text-sm text-gray-400">No farms captured yet.</div>}
            </div>
          </div>
        )}

        {tab === 'sync' && (
          <div className="space-y-4 max-w-3xl">
            <div className="p-5 rounded-[24px] bg-white border shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <CloudUpload className="w-5 h-5 text-green-600" /> Sync Center
              </h3>
              <button
                onClick={runSync}
                className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Sync Now • {online ? 'Online' : 'Offline — queued'}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                {pending} record{pending === 1 ? '' : 's'} waiting to sync. The app also auto-syncs
                every 20 seconds while online, and immediately when your connection comes back.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Offline functionality:</strong> new farmers, farms and crops are written to
              this device first, so field work continues with zero signal. Once online, everything
              flushes to your Supabase project automatically.
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-2 py-2 flex justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.k}
            onClick={() => setTab(tabDef.k)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl ${
              tab === tabDef.k ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500'
            }`}
          >
            <tabDef.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{t[{ dash: 'dashboard', farmers: 'farmers', farms: 'farms', sync: 'sync' }[tabDef.k]]}</span>
          </button>
        ))}
      </div>

      {showNewFarmer && (
        <NewFarmerModal lang={lang} onClose={() => setShowNewFarmer(false)} onSaved={refreshAll} />
      )}
      {showCaptureFarm && (
        <CaptureFarmModal farmers={farmers} onClose={() => setShowCaptureFarm(false)} onSaved={refreshAll} />
      )}
      {addCropFor && (
        <AddCropModal farmId={addCropFor} onClose={() => setAddCropFor(null)} onSaved={refreshAll} />
      )}
    </div>
  )
}
