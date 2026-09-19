import React, { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Sprout,
  LayoutDashboard,
  ChartColumn,
  Database,
  Layers,
  Users,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Trash2,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Camera,
  Search,
  Shield,
  ShieldOff,
  Download,
  ChevronDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useAuth } from '../context/AuthContext.jsx'
import { listRows } from '../lib/localStore.js'
import { useOnlineSync } from '../lib/useOnlineSync.js'
import { MASTER_DATA, saveMasterData } from '../lib/masterData.js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { uploadPhoto, fileToDataUrl } from '../lib/storage.js'
import FarmerDetailModal from '../components/FarmerDetailModal.jsx'
import StorageImage from '../components/StorageImage.jsx'

const NAV = [
  { k: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { k: 'reports', label: 'Reports', icon: ChartColumn },
  { k: 'data', label: 'All Data', icon: Layers },
  { k: 'master', label: 'Master Data', icon: Database },
  { k: 'users', label: 'User Mgmt', icon: Users },
  { k: 'profile', label: 'Profile', icon: UserCircle }
]

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

const COLORS = ['#16a34a', '#f59e0b', '#059669', '#d97706', '#10b981']

export default function AdminApp() {
  const { signOut, session, role } = useAuth()
  const { online } = useOnlineSync()
  const [section, setSection] = useState('dash')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [farmers, setFarmers] = useState(() => listRows('farmers'))
  const [farms, setFarms] = useState(() => listRows('farms'))
  const [crops, setCrops] = useState(() => listRows('crops'))
  const [master, setMaster] = useState(MASTER_DATA)
  const [selectedFarmer, setSelectedFarmer] = useState(null)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState(null)
  const [userGroup, setUserGroup] = useState('admin')
  const [groupPage, setGroupPage] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [userPageSize, setUserPageSize] = useState(20)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    const id = setInterval(() => {
      setFarmers(listRows('farmers'))
      setFarms(listRows('farms'))
      setCrops(listRows('crops'))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  function loadUsers() {
    setUsersLoading(true)
    setUsersError(null)
    return supabase
      .from('profiles')
      .select('id, email, name, role, active, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setUsersError(error.message)
        else {
          const numberFor = new Map()
          for (const role of ['admin', 'field']) {
            const group = (data || [])
              .filter((u) => (role === 'admin' ? u.role === 'admin' : u.role !== 'admin'))
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            group.forEach((u, i) => numberFor.set(u.id, i + 1))
          }
          setUsers(
            (data || []).map((u) => ({
              ...u,
              displayId: `${u.role === 'admin' ? 'ADM' : 'FLD'}-${String(numberFor.get(u.id)).padStart(3, '0')}`
            }))
          )
        }
        setUsersLoading(false)
      })
  }

  useEffect(() => {
    if (section !== 'users' || !isSupabaseConfigured) return
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  useEffect(() => {
    if (section !== 'profile' || !isSupabaseConfigured || !session) return
    supabase
      .from('profiles')
      .select('id, email, role, avatar_url, created_at')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, session])

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !session) return
    setProfileSaving(true)
    const url = (await uploadPhoto(file, 'profiles')) || (await fileToDataUrl(file))
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id)
    if (!error) setProfile((p) => ({ ...p, avatar_url: url }))
    setProfileSaving(false)
  }

  async function setUserActive(user, active) {
    const { error } = await supabase.from('profiles').update({ active }).eq('id', user.id)
    if (error) return alert('Could not update user: ' + error.message)
    loadUsers()
  }

  async function deleteUserProfile(user) {
    if (!confirm(`Remove ${user.email} from the app? Their login account isn't deleted (only an admin can do that from Supabase directly), but they'll lose access to farmer/farm/crop data.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) return alert('Could not delete user: ' + error.message)
    loadUsers()
  }

  function exportUsersCSV() {
    setExportMenuOpen(false)
    const label = userGroup === 'admin' ? 'Administrators' : 'Field Users'
    const header = ['S.No', 'ID', 'Name', 'Email', 'Role', 'Status', 'Joined']
    const lines = groupedUsers.map((u, i) =>
      [
        i + 1,
        u.displayId,
        u.name || '',
        u.email,
        u.role,
        u.active === false ? 'Disabled' : 'Active',
        u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${label}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportUsersPDF() {
    setExportMenuOpen(false)
    const label = userGroup === 'admin' ? 'Administrators' : 'Field Users'
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(label, 14, 16)
    autoTable(doc, {
      startY: 22,
      head: [['S.No', 'ID', 'Name', 'Email', 'Role', 'Status', 'Joined']],
      body: groupedUsers.map((u, i) => [
        i + 1,
        u.displayId,
        u.name || '',
        u.email,
        u.role,
        u.active === false ? 'Disabled' : 'Active',
        u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
      ]),
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 9 }
    })
    doc.save(`${label}.pdf`)
  }

  async function saveUserEdit(user, { name, role }) {
    const { error } = await supabase.from('profiles').update({ name, role }).eq('id', user.id)
    if (error) return alert('Could not update user: ' + error.message)
    setEditingUser(null)
    loadUsers()
  }

  const groupedUsers = (userGroup === 'admin' ? users.filter((u) => u.role === 'admin') : users.filter((u) => u.role !== 'admin')).filter(
    (u) => u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const districtStats = Object.values(
    farms.reduce((acc, farm) => {
      const owner = farmers.find((f) => f.id === farm.farmer_id)
      const district = owner?.district || 'Unknown'
      acc[district] = acc[district] || { name: district, farmers: 0, area: 0 }
      acc[district].farmers += 1
      acc[district].area += parseFloat(farm.area) || 0
      return acc
    }, {})
  )

  const cropMix = Object.values(
    crops.reduce((acc, c) => {
      acc[c.name] = acc[c.name] || { name: c.name, value: 0 }
      acc[c.name].value += 1
      return acc
    }, {})
  )

  function addMasterItem(key, value) {
    if (!value) return
    const next = { ...master, [key]: [...master[key], value] }
    setMaster(next)
    saveMasterData(next)
  }

  function removeMasterItem(key, value) {
    const next = { ...master, [key]: master[key].filter((v) => v !== value) }
    setMaster(next)
    saveMasterData(next)
  }

  const currentNav = NAV.find((item) => item.k === section)

  return (
    <div className="h-screen overflow-hidden bg-cream text-gray-900 flex">
      <div
        className={`fixed lg:sticky inset-y-0 lg:inset-y-auto lg:top-0 left-0 z-40 ${
          collapsed ? 'lg:w-[84px]' : 'lg:w-[240px]'
        } w-[240px] h-screen bg-white border-r shadow-sm flex flex-col shrink-0 transition-all ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-bold truncate">AuraxFarm</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 truncate">Admin Console</div>
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
          {NAV.map((item) => (
            <button
              key={item.k}
              title={item.label}
              onClick={() => {
                setSection(item.k)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              } ${section === item.k ? 'bg-green-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </button>
          ))}
          <div className={`mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="text-xs font-bold text-amber-800 flex items-center gap-2">
              {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {online ? 'Online' : 'Offline'}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">{farmers.length} farmers on record</div>
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
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b px-4 lg:px-8 py-3 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-gray-100 rounded-xl shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 font-bold text-gray-900 truncate">
              {currentNav && <currentNav.icon className="w-4 h-4 text-green-700 shrink-0" />}
              <span className="truncate">{currentNav?.label || 'AuraxFarm'}</span>
            </div>
            {section === 'users' && isSupabaseConfigured && !usersError && (
              <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
                <button
                  onClick={() => {
                    setUserGroup('admin')
                    setGroupPage(0)
                  }}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    userGroup === 'admin' ? 'bg-white shadow text-green-700' : 'text-gray-500'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setUserGroup('field')
                    setGroupPage(0)
                  }}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    userGroup === 'field' ? 'bg-white shadow text-green-700' : 'text-gray-500'
                  }`}
                >
                  Field User
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {section === 'users' && isSupabaseConfigured && !usersError && (
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setExportMenuOpen(false)} />
                    <div className="absolute right-0 top-10 z-40 w-40 bg-white border rounded-xl shadow-lg overflow-hidden text-left">
                      <button
                        onClick={exportUsersCSV}
                        className="w-full flex items-center px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        As Excel (.csv)
                      </button>
                      <button
                        onClick={exportUsersPDF}
                        className="w-full flex items-center px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        As PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-8 w-full flex-1">
          {section === 'dash' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Live view of everything captured in the field.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Farmers', val: farmers.length },
                  { label: 'Farms Captured', val: farms.length },
                  { label: 'Crops Logged', val: crops.length },
                  {
                    label: 'Cultivated Area',
                    val: `${farms.reduce((s, f) => s + (parseFloat(f.area) || 0), 0).toFixed(1)} Ac`
                  }
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-[20px] bg-white border shadow-sm">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</div>
                    <div className="text-2xl font-bold mt-1">{s.val}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-5 rounded-[20px] bg-white border shadow-sm">
                  <h3 className="font-bold mb-4">District Wise Farmers</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="farmers" fill="#16a34a" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="area" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {districtStats.length === 0 && <p className="text-xs text-gray-400 mt-2">No farm data yet.</p>}
                </div>
                <div className="p-5 rounded-[20px] bg-white border shadow-sm">
                  <h3 className="font-bold mb-4">Crop Mix</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={cropMix} dataKey="value" nameKey="name" outerRadius={70} innerRadius={40}>
                          {cropMix.map((entry, i) => (
                            <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {cropMix.length === 0 && <p className="text-xs text-gray-400">No crops logged yet.</p>}
                </div>
              </div>
            </div>
          )}

          {section === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Reports</h2>
              <div className="p-5 rounded-[20px] bg-white border shadow-sm">
                <h3 className="font-bold mb-4">Farmer List</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-gray-500">
                      <tr>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left">Village</th>
                        <th className="text-left">Mobile</th>
                        <th className="text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmers.map((f) => (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedFarmer(f)}
                          className="border-t cursor-pointer hover:bg-gray-50"
                        >
                          <td className="py-3 font-bold">{f.name}</td>
                          <td>
                            {f.village}, {f.district}
                          </td>
                          <td>{f.mobile}</td>
                          <td>
                            <span
                              className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                f.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {f.synced ? 'Synced' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {farmers.length === 0 && <p className="text-xs text-gray-400 py-4">No farmers captured yet.</p>}
                  <p className="text-[11px] text-gray-400 mt-3">Click a row to view full details.</p>
                </div>
              </div>
            </div>
          )}

          {section === 'data' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">All Data</h2>
              <p className="text-sm text-gray-500">Every farmer, farm and crop captured across the field team.</p>

              <div className="p-5 rounded-[20px] bg-white border shadow-sm">
                <h3 className="font-bold mb-4">Farmers ({farmers.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-gray-500">
                      <tr>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left">Mobile</th>
                        <th className="text-left">Village / District</th>
                        <th className="text-left">Family</th>
                        <th className="text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmers.map((f) => (
                        <tr key={f.id} onClick={() => setSelectedFarmer(f)} className="border-t cursor-pointer hover:bg-gray-50">
                          <td className="py-3 font-bold">{f.name}</td>
                          <td>{f.mobile}</td>
                          <td>{f.village}, {f.district}</td>
                          <td>{f.family_members || '—'} members</td>
                          <td>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${f.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {f.synced ? 'Synced' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {farmers.length === 0 && <p className="text-xs text-gray-400 py-4">No farmers captured yet.</p>}
                  <p className="text-[11px] text-gray-400 mt-3">Click a row to view full details.</p>
                </div>
              </div>

              <div className="p-5 rounded-[20px] bg-white border shadow-sm">
                <h3 className="font-bold mb-4">Farms ({farms.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-gray-500">
                      <tr>
                        <th className="text-left py-2">Farm</th>
                        <th className="text-left">Farmer</th>
                        <th className="text-left">Area</th>
                        <th className="text-left">Irrigation</th>
                        <th className="text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farms.map((farm) => {
                        const owner = farmers.find((f) => f.id === farm.farmer_id)
                        return (
                          <tr
                            key={farm.id}
                            onClick={() => owner && setSelectedFarmer(owner)}
                            className={`border-t ${owner ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                          >
                            <td className="py-3 font-bold">{farm.title || 'Farm'}</td>
                            <td>{owner?.name || 'Unknown'}</td>
                            <td>{farm.area || '—'} {farm.area_unit || ''}</td>
                            <td>{farm.irrigation || '—'}%</td>
                            <td>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${farm.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {farm.synced ? 'Synced' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {farms.length === 0 && <p className="text-xs text-gray-400 py-4">No farms captured yet.</p>}
                </div>
              </div>

              <div className="p-5 rounded-[20px] bg-white border shadow-sm">
                <h3 className="font-bold mb-4">Crops ({crops.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase text-gray-500">
                      <tr>
                        <th className="text-left py-2">Crop</th>
                        <th className="text-left">Season</th>
                        <th className="text-left">Sowing</th>
                        <th className="text-left">Harvest</th>
                        <th className="text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crops.map((crop) => (
                        <tr key={crop.id} className="border-t">
                          <td className="py-3 font-bold">{crop.name}</td>
                          <td>{crop.season || '—'}</td>
                          <td>{crop.sowing_date || '—'}</td>
                          <td>{crop.harvest_date || '—'}</td>
                          <td>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${crop.synced ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {crop.synced ? 'Synced' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {crops.length === 0 && <p className="text-xs text-gray-400 py-4">No crops logged yet.</p>}
                </div>
              </div>
            </div>
          )}

          {section === 'master' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Master Data Management</h2>
              <p className="text-sm text-gray-500">
                Edit the dropdown lists used across the field app (states, districts, crops, fertilizers...).
              </p>
              <div className="grid lg:grid-cols-2 gap-4">
                {Object.entries(master).map(([key, values]) => (
                  <MasterDataCard
                    key={key}
                    label={key}
                    values={values}
                    onAdd={(v) => addMasterItem(key, v)}
                    onRemove={(v) => removeMasterItem(key, v)}
                  />
                ))}
              </div>
            </div>
          )}

          {section === 'users' && (
            <div className="space-y-4">
              {!isSupabaseConfigured && (
                <p className="text-sm text-gray-500">Connect Supabase to see registered users here.</p>
              )}

              {isSupabaseConfigured && usersError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  Couldn&apos;t load users: {usersError}. Admins need a policy that lets them read every
                  row in <code>profiles</code> (by default each user can only read their own row) — see
                  the <code>profiles: admins read all</code> policy in <code>supabase/schema.sql</code>{' '}
                  and run it once in the Supabase SQL editor.
                </div>
              )}

              {isSupabaseConfigured && !usersError && (
                <>
                  <UserTable
                    title={userGroup === 'admin' ? 'Administrators' : 'Field Users'}
                    rows={groupedUsers}
                    search={userSearch}
                    onSearch={(v) => {
                      setUserSearch(v)
                      setGroupPage(0)
                    }}
                    page={groupPage}
                    setPage={setGroupPage}
                    pageSize={userPageSize}
                    onPageSizeChange={(n) => {
                      setUserPageSize(n)
                      setGroupPage(0)
                    }}
                    loading={usersLoading}
                    onToggleActive={setUserActive}
                    onEdit={setEditingUser}
                    onDelete={deleteUserProfile}
                  />
                </>
              )}

              {editingUser && (
                <EditUserModal
                  user={editingUser}
                  onCancel={() => setEditingUser(null)}
                  onSave={(data) => saveUserEdit(editingUser, data)}
                />
              )}
            </div>
          )}

          {section === 'profile' && (
            <div className="max-w-lg">
              <h2 className="text-xl font-bold mb-4">Profile</h2>
              {!isSupabaseConfigured ? (
                <p className="text-sm text-gray-500">Connect Supabase to manage your profile here.</p>
              ) : (
                <div className="p-5 rounded-[20px] bg-white border shadow-sm space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-green-50 border-2 border-dashed border-green-200 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <StorageImage
                            src={profile.avatar_url}
                            className="w-full h-full object-cover"
                            fallback={<UserCircle className="w-10 h-10 text-green-400" />}
                          />
                        ) : (
                          <UserCircle className="w-10 h-10 text-green-400" />
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center cursor-pointer shadow">
                        <Camera className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{profile?.email || session?.user?.email}</div>
                      <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-purple-100 text-purple-700 uppercase">
                        {profile?.role || role}
                      </span>
                    </div>
                  </div>
                  {profileSaving && <p className="text-xs text-gray-400">Uploading photo…</p>}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-gray-50 border">
                      <div className="text-[10px] font-bold uppercase text-gray-400">Email</div>
                      <div className="font-medium mt-0.5">{profile?.email || session?.user?.email}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border">
                      <div className="text-[10px] font-bold uppercase text-gray-400">Role</div>
                      <div className="font-medium mt-0.5 capitalize">{profile?.role || role}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border col-span-2">
                      <div className="text-[10px] font-bold uppercase text-gray-400">Member Since</div>
                      <div className="font-medium mt-0.5">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedFarmer && (
        <FarmerDetailModal
          farmer={selectedFarmer}
          farms={farms}
          crops={crops}
          onClose={() => setSelectedFarmer(null)}
        />
      )}
    </div>
  )
}

function pageNumbers(current, total) {
  const pages = []
  const add = (n) => pages.push(n)
  add(1)
  if (current > 3) add('…')
  for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n++) add(n)
  if (current < total - 2) add('…')
  if (total > 1) add(total)
  return pages
}

function UserTable({
  title,
  rows,
  search,
  onSearch,
  page,
  setPage,
  pageSize,
  onPageSizeChange,
  loading,
  onToggleActive,
  onEdit,
  onDelete
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pageRows = rows.slice(currentPage * pageSize, currentPage * pageSize + pageSize)
  const rangeStart = rows.length === 0 ? 0 : currentPage * pageSize + 1
  const rangeEnd = Math.min(rows.length, currentPage * pageSize + pageSize)

  return (
    <div className="rounded-lg bg-white border shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-gray-50 focus:bg-white outline-none text-sm"
          />
        </div>
        <span className="text-xs font-bold text-gray-500">{rows.length} {title}</span>
      </div>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[960px] text-sm border-collapse">
          <thead className="text-[11px] uppercase text-gray-500 bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 w-14 border-r border-b">S.NO</th>
              <th className="text-left px-4 border-r border-b">ID</th>
              <th className="text-left px-4 border-r border-b">Name</th>
              <th className="text-left px-4 border-r border-b">Email</th>
              <th className="text-left px-4 border-r border-b">Role</th>
              <th className="text-left px-4 border-r border-b">Status</th>
              <th className="text-left px-4 border-r border-b">Joined</th>
              <th className="text-right px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u, i) => (
              <tr key={u.id} className="hover:bg-gray-50/60">
                <td className="py-3 px-4 text-gray-400 border-r border-b">{currentPage * pageSize + i + 1}</td>
                <td className="px-4 font-mono text-xs text-gray-600 border-r border-b" title={u.id}>
                  {u.displayId || '—'}
                </td>
                <td className="px-4 font-bold truncate max-w-[160px] border-r border-b">{u.name || '—'}</td>
                <td className="px-4 font-bold truncate max-w-[220px] border-r border-b">{u.email}</td>
                <td className="px-4 border-r border-b">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold whitespace-nowrap ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 border-r border-b">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                    <span className={`w-2 h-2 rounded-full ${u.active === false ? 'bg-red-500' : 'bg-green-500'}`} />
                    {u.active === false ? 'Disabled' : 'Active'}
                  </span>
                </td>
                <td className="px-4 whitespace-nowrap text-gray-600 border-r border-b">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 border-b">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(u)}
                      title="Edit Role"
                      className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleActive(u, u.active === false)}
                      title={u.active === false ? 'Enable' : 'Disable'}
                      className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-100"
                    >
                      {u.active === false ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDelete(u)}
                      title="Delete"
                      className="w-8 h-8 rounded-full border flex items-center justify-center text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="text-xs text-gray-400 py-4 px-4">Loading users…</p>}
        {!loading && rows.length === 0 && <p className="text-xs text-gray-400 py-4 px-4">No users found.</p>}
      </div>

      {rows.length > 0 && (
        <div className="p-3 border-t flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-500">
            {rangeStart}-{rangeEnd} of {rows.length} items
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers(currentPage + 1, totalPages).map((n, idx) =>
                n === '…' ? (
                  <span key={`e${idx}`} className="px-1.5 text-xs text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n - 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold ${
                      n - 1 === currentPage ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border bg-white text-xs font-bold outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function EditUserModal({ user, onCancel, onSave }) {
  const [name, setName] = useState(user.name || '')
  const [role, setRole] = useState(user.role)
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-amber-50">
          <h3 className="font-bold text-lg">Edit User</h3>
          <button onClick={onCancel} className="p-2 bg-white rounded-full shadow">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Email</label>
            <div className="mt-1 px-3 py-3 rounded-xl bg-gray-50 border text-sm">{user.email}</div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">ID</label>
            <div className="mt-1 px-3 py-3 rounded-xl bg-gray-50 border text-sm font-mono" title={user.id}>
              {user.displayId}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-gray-50 focus:bg-white outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 px-3 py-3 rounded-xl border bg-gray-50 focus:bg-white outline-none text-sm"
            >
              <option value="field">Field User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border font-medium">
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, role })}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function MasterDataCard({ label, values, onAdd, onRemove }) {
  const [value, setValue] = useState('')
  return (
    <div className="p-5 rounded-[20px] bg-white border shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold capitalize">{label}</h3>
        <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 font-bold">{values.length} items</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((v) => (
          <span key={v} className="px-3 py-1 rounded-full bg-gray-50 border text-xs font-medium flex items-center gap-2">
            {v}
            <button onClick={() => onRemove(v)} className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Add ${label}`}
          className="flex-1 px-3 py-2 rounded-xl border bg-gray-50 text-sm outline-none"
        />
        <button
          onClick={() => {
            onAdd(value)
            setValue('')
          }}
          className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold"
        >
          Add
        </button>
      </div>
    </div>
  )
}
