import React, { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Sprout,
  LayoutDashboard,
  Users,
  Tractor,
  CloudUpload,
  LogOut,
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
  PanelLeftOpen,
  LayoutGrid,
  List,
  Eye,
  Download,
  ChevronDown,
  Pencil,
  MapPin,
  Wheat,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { translations } from '../lib/i18n.js'
import { listRows, displayId } from '../lib/localStore.js'
import { useOnlineSync } from '../lib/useOnlineSync.js'
import NewFarmerModal from '../components/NewFarmerModal.jsx'
import CaptureFarmModal from '../components/CaptureFarmModal.jsx'
import AddCropModal from '../components/AddCropModal.jsx'
import StorageImage from '../components/StorageImage.jsx'
import FarmerDetailModal from '../components/FarmerDetailModal.jsx'
import DateRangePicker from '../components/DateRangePicker.jsx'
import Pagination from '../components/Pagination.jsx'
import ProfileModal from '../components/ProfileModal.jsx'

const TABS = [
  { k: 'dash', icon: LayoutDashboard, labelKey: 'dashboard' },
  { k: 'farmers', icon: Users, labelKey: 'farmers' },
  { k: 'farms', icon: Tractor, labelKey: 'farms' },
  { k: 'sync', icon: CloudUpload, labelKey: 'sync' }
]

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export default function FieldApp() {
  const { signOut, isSupabaseConfigured, session, role } = useAuth()
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
  const [farmerView, setFarmerView] = useState('table')
  const [dateRange, setDateRange] = useState([null, null])
  const [viewFarmer, setViewFarmer] = useState(null)
  const [editFarmer, setEditFarmer] = useState(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [farmerPage, setFarmerPage] = useState(0)
  const [farmerPageSize, setFarmerPageSize] = useState(10)
  const [showProfile, setShowProfile] = useState(false)
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

  const [rangeStart, rangeEnd] = dateRange
  const filteredFarmers = farmers.filter((f) => {
    const matchesQuery =
      f.name?.toLowerCase().includes(query.toLowerCase()) || f.village?.toLowerCase().includes(query.toLowerCase())
    if (!matchesQuery) return false
    if (!rangeStart || !rangeEnd) return true
    if (!f.created_at) return false
    const created = new Date(f.created_at)
    const endOfDay = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59, 999)
    return created >= rangeStart && created <= endOfDay
  })

  useEffect(() => {
    setFarmerPage(0)
  }, [query, dateRange, farmerPageSize])

  const farmerTotalPages = Math.max(1, Math.ceil(filteredFarmers.length / farmerPageSize))
  const farmerCurrentPage = Math.min(farmerPage, farmerTotalPages - 1)
  const pagedFarmers = filteredFarmers.slice(
    farmerCurrentPage * farmerPageSize,
    farmerCurrentPage * farmerPageSize + farmerPageSize
  )

  function exportFarmersCSV() {
    setExportMenuOpen(false)
    const header = ['S.No', 'ID', 'Name', 'Mobile', 'Age', 'Gender', 'Village', 'District', 'State', 'Status', 'Added Date']
    const lines = filteredFarmers.map((f, i) =>
      [
        i + 1,
        displayId(f.id),
        f.name || '',
        f.mobile || '',
        f.age || '',
        f.gender || '',
        f.village || '',
        f.district || '',
        f.state || '',
        f.synced ? 'Synced' : 'Pending',
        formatDate(f.created_at)
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Farmers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportFarmersPDF() {
    setExportMenuOpen(false)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Farmers', 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['S.No', 'ID', 'Name', 'Mobile', 'Age/Gender', 'Village, District, State', 'Status', 'Added Date']],
      body: filteredFarmers.map((f, i) => [
        i + 1,
        displayId(f.id),
        f.name || '',
        f.mobile || '',
        `${f.age || '—'}y, ${f.gender || '—'}`,
        [f.village, f.district, f.state].filter(Boolean).join(', '),
        f.synced ? 'Synced' : 'Pending',
        formatDate(f.created_at)
      ]),
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 9 }
    })
    doc.save('Farmers.pdf')
  }

  const currentTab = TABS.find((tabDef) => tabDef.k === tab)
  const sidebarEmail = session?.user?.email || ''
  const sidebarName = sidebarEmail ? sidebarEmail.split('@')[0] : role || 'Field User'
  const sidebarInitials = sidebarName.slice(0, 2).toUpperCase()

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

          {!online && (
            <div className={`mt-4 p-3 rounded-md border bg-red-50 border-red-200 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="text-xs font-bold flex items-center gap-2 text-red-700">
                <WifiOff className="w-4 h-4" />
                {t.offline}
              </div>
            </div>
          )}

          {!collapsed && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 px-1">Language</div>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-gray-100 p-1">
                {['en', 'hi', 'pa'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`py-1.5 rounded text-xs font-bold text-center transition-colors ${
                      lang === code ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <div className="flex items-center gap-1 rounded-xl hover:bg-gray-50">
            <button
              onClick={() => setShowProfile(true)}
              title="View profile"
              className={`flex-1 flex items-center gap-2 p-1.5 rounded-lg text-left min-w-0 ${
                collapsed ? 'lg:justify-center' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {sidebarInitials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{sidebarName}</div>
                  <div className="text-[11px] text-gray-500 truncate">{sidebarEmail}</div>
                </div>
              )}
            </button>
            {!collapsed && (
              <button
                onClick={signOut}
                title="Logout"
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b shrink-0">
          <div className="px-4 lg:px-8 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-gray-100 rounded-xl">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 font-bold text-gray-900">
              {currentTab && <currentTab.icon className="w-4 h-4 text-green-700" />}
              {currentTab ? t[currentTab.labelKey] : t.appName}
            </div>
            {tab === 'farmers' && (
              <div className="ml-auto flex items-center gap-2">
                <div className="flex rounded-lg border bg-gray-50 p-1">
                  <button
                    onClick={() => setFarmerView('card')}
                    title="Card view"
                    className={`p-1.5 rounded-md ${farmerView === 'card' ? 'bg-white shadow text-green-700' : 'text-gray-400'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFarmerView('table')}
                    title="Table view"
                    className={`p-1.5 rounded-md ${farmerView === 'table' ? 'bg-white shadow text-green-700' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {exportMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setExportMenuOpen(false)} />
                      <div className="absolute right-0 top-11 z-40 w-40 bg-white border rounded-xl shadow-lg overflow-hidden text-left">
                        <button
                          onClick={exportFarmersCSV}
                          className="w-full flex items-center px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                          As Excel (.csv)
                        </button>
                        <button
                          onClick={exportFarmersPDF}
                          className="w-full flex items-center px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                          As PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowNewFarmer(true)}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> New
                </button>
              </div>
            )}
          </div>

          {tab === 'farmers' && (
            <div className="px-4 lg:px-8 pb-3 flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search farmer, village"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border bg-white outline-none text-sm"
                />
              </div>
              <span className="text-xs font-bold text-gray-500 shrink-0">{filteredFarmers.length} farmers</span>
              <div className="ml-auto">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
            </div>
          )}
        </div>

        <div className="w-full px-4 py-4">
        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Running in local demo mode &mdash; entries are saved on this device only. Connect Supabase
            (see README.md) to enable real cloud sync between devices.
          </div>
        )}

        {tab === 'dash' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Total Farmer', val: farmers.length, iconBg: 'bg-green-50 text-green-600', icon: Activity },
                {
                  label: 'Total Land',
                  val: farmers.reduce((sum, f) => sum + (parseInt(f.total_farms, 10) || 0), 0),
                  iconBg: 'bg-amber-50 text-amber-600',
                  icon: MapPin
                },
                { label: 'Captured Land', val: farms.length, iconBg: 'bg-yellow-50 text-yellow-600', icon: MapPin },
                { label: 'Total Crops', val: crops.length, iconBg: 'bg-teal-50 text-teal-600', icon: Wheat },
                { label: t.pendingSync, val: pending, iconBg: 'bg-orange-50 text-orange-600', icon: CloudUpload },
                {
                  label: 'Total Area',
                  val:
                    Object.entries(
                      farms.reduce((acc, f) => {
                        const v = parseFloat(f.area)
                        if (!v) return acc
                        const unit = f.area_unit || 'Acres'
                        acc[unit] = (acc[unit] || 0) + v
                        return acc
                      }, {})
                    )
                      .map(([unit, v]) => `${v} ${unit}`)
                      .join(', ') || '—',
                  iconBg: 'bg-lime-50 text-lime-600',
                  icon: Tractor
                },
                {
                  label: 'Last Sync',
                  val: lastSync ? lastSync.toLocaleTimeString() : '—',
                  iconBg: 'bg-slate-100 text-slate-600',
                  icon: Clock
                }
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 flex-none min-w-[130px] max-w-full sm:max-w-xs"
                >
                  <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 truncate">{s.label}</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight break-words">{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {(() => {
              const totalDeclared = farmers.reduce((sum, f) => sum + (parseInt(f.total_farms, 10) || 0), 0)
              const missingGps = farms.filter((f) => !f.geo_tag).length
              const missingDocs = farmers.filter((f) => !(f.documents && f.documents.length > 0)).length
              const progressPct = totalDeclared > 0 ? Math.min(100, Math.round((farms.length / totalDeclared) * 100)) : null

              if (progressPct === null && missingGps === 0 && missingDocs === 0) return null

              return (
                <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Your Data Quality
                  </h3>

                  {progressPct !== null && (
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-1.5">
                        <span>Land Capture Progress</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          {farms.length} / {totalDeclared} · {progressPct}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(missingGps > 0 || missingDocs > 0) && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {missingGps > 0 && (
                        <button
                          onClick={() => setTab('farms')}
                          className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3 text-left hover:bg-amber-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-amber-900">
                            <strong>{missingGps}</strong> land record{missingGps === 1 ? '' : 's'} missing GPS
                          </span>
                        </button>
                      )}
                      {missingDocs > 0 && (
                        <button
                          onClick={() => setTab('farmers')}
                          className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3 text-left hover:bg-amber-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-xs text-amber-900">
                            <strong>{missingDocs}</strong> farmer{missingDocs === 1 ? '' : 's'} missing documents
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
              <h3 className="font-bold mb-4">{t.quickActions}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowNewFarmer(true)}
                  className="p-5 rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white text-left hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-200 transition-all"
                >
                  <Users className="w-6 h-6 mb-3" />
                  <div className="font-bold">{t.newFarmer}</div>
                  <div className="text-xs opacity-80 mt-1">Name, mobile, photo, voice input</div>
                </button>
                <button
                  onClick={() => setShowCaptureFarm(true)}
                  className="p-5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white text-left hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200 transition-all"
                >
                  <Tractor className="w-6 h-6 mb-3" />
                  <div className="font-bold">{t.captureFarm}</div>
                  <div className="text-xs opacity-80 mt-1">Area, GPS, irrigation, equipment</div>
                </button>
                <button
                  onClick={runSync}
                  className="p-5 rounded-xl bg-white border-2 border-gray-900 text-gray-900 text-left hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-6 h-6 mb-3" />
                  <div className="font-bold">{t.sync} Now</div>
                  <div className="text-xs opacity-70 mt-1">{online ? 'Ready' : 'Offline — will retry'}</div>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{t.recent}</h3>
                <button onClick={() => setTab('farmers')} className="text-xs font-bold text-green-700 hover:underline">
                  View all
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {farmers.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-lg border border-gray-100 bg-cream flex gap-3 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{f.name}</div>
                      <div className="text-[11px] text-gray-600 truncate">
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
            {farmerView === 'card' ? (
              <div className="rounded-lg bg-white border shadow-sm">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-t-lg overflow-hidden">
                  {pagedFarmers.map((f) => (
                    <div key={f.id} className="p-4 rounded-lg bg-white border shadow-sm">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-lg bg-green-50 overflow-hidden flex items-center justify-center">
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
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <span
                            className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                              f.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {f.synced ? '✓ Synced' : '◍ Pending Sync'}
                          </span>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100">{displayId(f.id)}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setViewFarmer(f)}
                            title="View farmer"
                            className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditFarmer(f)}
                            title="Edit farmer"
                            className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredFarmers.length === 0 && (
                    <div className="text-sm text-gray-400 col-span-full">No farmers match your search.</div>
                  )}
                </div>
                <Pagination
                  page={farmerPage}
                  setPage={setFarmerPage}
                  pageSize={farmerPageSize}
                  onPageSizeChange={setFarmerPageSize}
                  totalItems={filteredFarmers.length}
                />
              </div>
            ) : (
              <div className="rounded-lg bg-white border shadow-sm">
                <div className="overflow-x-auto rounded-t-lg">
                  <table className="w-full min-w-[1100px] text-sm border-collapse whitespace-nowrap">
                    <thead className="text-[11px] uppercase text-gray-500 bg-gray-50">
                      <tr className="divide-x divide-gray-300">
                        <th className="text-left px-4 py-3 border-b border-gray-300">ID</th>
                        <th className="text-left px-4 border-b border-gray-300">Name</th>
                        <th className="text-left px-4 border-b border-gray-300">Mobile</th>
                        <th className="text-left px-4 border-b border-gray-300">Age</th>
                        <th className="text-left px-4 border-b border-gray-300">Gender</th>
                        <th className="text-left px-4 border-b border-gray-300">Village</th>
                        <th className="text-left px-4 border-b border-gray-300">District</th>
                        <th className="text-left px-4 border-b border-gray-300">State</th>
                        <th className="text-left px-4 border-b border-gray-300">Status</th>
                        <th className="text-left px-4 border-b border-gray-300">Added Date</th>
                        <th className="text-right px-4 border-b border-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedFarmers.map((f) => (
                        <tr key={f.id} className="divide-x divide-gray-200 hover:bg-gray-50/60">
                          <td className="py-3 px-4 font-mono text-xs text-gray-600 border-b border-gray-200">{displayId(f.id)}</td>
                          <td className="px-4 font-bold border-b border-gray-200">{f.name}</td>
                          <td className="px-4 text-gray-600 border-b border-gray-200">{f.mobile || '—'}</td>
                          <td className="px-4 text-gray-600 border-b border-gray-200">{f.age || '—'}</td>
                          <td className="px-4 text-gray-600 border-b border-gray-200">{f.gender || '—'}</td>
                          <td className="px-4 text-gray-600 border-b border-gray-200">{f.village || '—'}</td>
                          <td className="px-4 text-gray-600 border-b border-gray-200">{f.district || '—'}</td>
                          <td className="px-4 text-gray-600 border-b border-gray-200">{f.state || '—'}</td>
                          <td className="px-4 border-b border-gray-200">
                            <span
                              className={`text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                                f.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {f.synced ? '✓ Synced' : '◍ Pending'}
                            </span>
                          </td>
                          <td className="px-4 text-gray-600 border-b border-gray-200 whitespace-nowrap">
                            {formatDate(f.created_at)}
                          </td>
                          <td className="px-4 border-b border-gray-200">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setViewFarmer(f)}
                                title="View farmer"
                                className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditFarmer(f)}
                                title="Edit farmer"
                                className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredFarmers.length === 0 && (
                    <p className="text-xs text-gray-400 py-4 px-4">No farmers match your search.</p>
                  )}
                </div>
                <Pagination
                  page={farmerPage}
                  setPage={setFarmerPage}
                  pageSize={farmerPageSize}
                  onPageSizeChange={setFarmerPageSize}
                  totalItems={filteredFarmers.length}
                />
              </div>
            )}
          </div>
        )}

        {tab === 'farms' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Land ({farms.length})</h2>
              <button
                onClick={() => setShowCaptureFarm(true)}
                className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Capture Land
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
                          {displayId(farm.id)}
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
              {farms.length === 0 && <div className="text-sm text-gray-400">No land captured yet.</div>}
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
        <CaptureFarmModal farmers={farmers} farms={farms} crops={crops} onClose={() => setShowCaptureFarm(false)} onSaved={refreshAll} />
      )}
      {addCropFor && (
        <AddCropModal farmId={addCropFor} onClose={() => setAddCropFor(null)} onSaved={refreshAll} />
      )}
      {viewFarmer && (
        <FarmerDetailModal
          farmer={viewFarmer}
          farms={farms}
          crops={crops}
          onClose={() => setViewFarmer(null)}
          onEdit={(f) => {
            setEditFarmer(f)
          }}
          onFarmSaved={refreshAll}
        />
      )}
      {editFarmer && (
        <NewFarmerModal
          lang={lang}
          farmer={editFarmer}
          onClose={() => setEditFarmer(null)}
          onSaved={(row) => {
            refreshAll()
            if (viewFarmer) setViewFarmer(row)
          }}
        />
      )}
      {showProfile && (
        <ProfileModal
          session={session}
          role={role}
          isSupabaseConfigured={isSupabaseConfigured}
          onClose={() => setShowProfile(false)}
          onSignOut={signOut}
        />
      )}
    </div>
  )
}
