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
  Activity,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { translations } from '../lib/i18n.js'
import { listRows } from '../lib/localStore.js'
import { useOnlineSync } from '../lib/useOnlineSync.js'
import NewFarmerModal from '../components/NewFarmerModal.jsx'
import CaptureFarmModal from '../components/CaptureFarmModal.jsx'
import AddCropModal from '../components/AddCropModal.jsx'
import StorageImage from '../components/StorageImage.jsx'

const TABS = [
  { k: 'dash', icon: LayoutDashboard, labelKey: 'dashboard' },
  { k: 'farmers', icon: Users, labelKey: 'farmers' },
  { k: 'farms', icon: Tractor, labelKey: 'farms' },
  { k: 'sync', icon: CloudUpload, labelKey: 'sync' }
]

export default function FieldApp() {
  const { signOut, isSupabaseConfigured } = useAuth()
  const { online, pending, lastSync, lastError, runSync, refreshPending } = useOnlineSync()
  const [lang, setLang] = useState('en')
  const [tab, setTab] = useState('dash')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
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

  const currentTab = TABS.find((tabDef) => tabDef.k === tab)

  return (
    <div className="h-screen overflow-hidden bg-cream text-gray-900 flex">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div
        className={`fixed lg:sticky inset-y-0 lg:inset-y-auto lg:top-0 left-0 z-40 ${
          collapsed ? 'lg:w-[84px]' : 'lg:w-[240px]'
        } w-[240px] h-screen bg-white border-r shadow-sm flex flex-col shrink-0 transition-all ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-bold truncate">{t.appName}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">Field Executive</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 bg-gray-100 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.k}
              title={t[tabDef.labelKey]}
              onClick={() => {
                setTab(tabDef.k)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              } ${tab === tabDef.k ? 'bg-green-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <tabDef.icon className="w-4 h-4 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{t[tabDef.labelKey]}</span>
            </button>
          ))}

          <div className={`mt-4 p-3 rounded-xl border ${collapsed ? 'lg:hidden' : ''} ${
            online ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`text-xs font-bold flex items-center gap-2 ${online ? 'text-green-700' : 'text-red-700'}`}>
              {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {online ? t.online : t.offline}
            </div>
          </div>

          <div className={`flex rounded-xl border bg-gray-50 p-1 mt-2 ${collapsed ? 'lg:hidden' : ''}`}>
            {['en', 'hi', 'pa'].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  lang === code ? 'bg-green-600 text-white' : 'text-gray-600'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t">
          <button
            onClick={signOut}
            title="Logout"
            className={`w-full py-3 rounded-xl border font-bold flex items-center justify-center gap-2 ${collapsed ? 'lg:px-0' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b px-4 lg:px-8 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-gray-100 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-gray-900">
            {currentTab && <currentTab.icon className="w-4 h-4 text-green-700" />}
            {currentTab ? t[currentTab.labelKey] : t.appName}
          </div>
        </div>

        <div className="max-w-[1100px] w-full mx-auto p-4">
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
                      {f.photo ? (
                        <StorageImage
                          src={f.photo}
                          className="w-full h-full object-cover"
                          fallback={<User className="w-6 h-6 text-green-600" />}
                        />
                      ) : (
                        <User className="w-6 h-6 text-green-600" />
                      )}
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
                      {f.photo ? (
                        <StorageImage
                          src={f.photo}
                          className="w-full h-full object-cover"
                          fallback={<User className="w-6 h-6 text-green-500" />}
                        />
                      ) : (
                        <User className="w-6 h-6 text-green-500" />
                      )}
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
              {lastError && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  <strong>Sync failed:</strong> {lastError}. If this keeps happening, make sure
                  you&apos;re signed in (not just browsing) and try signing out and back in.
                </div>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Offline functionality:</strong> new farmers, farms and crops are written to
              this device first, so field work continues with zero signal. Once online, everything
              flushes to your Supabase project automatically.
            </div>
          </div>
        )}
        </div>
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
