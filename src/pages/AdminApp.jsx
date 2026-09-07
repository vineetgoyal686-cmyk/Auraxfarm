import React, { useEffect, useState } from 'react'
import {
  Sprout,
  LayoutDashboard,
  ChartColumn,
  Database,
  Users,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff
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

const NAV = [
  { k: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { k: 'reports', label: 'Reports', icon: ChartColumn },
  { k: 'master', label: 'Master Data', icon: Database },
  { k: 'users', label: 'User Mgmt', icon: Users }
]

const COLORS = ['#16a34a', '#f59e0b', '#059669', '#d97706', '#10b981']

export default function AdminApp() {
  const { signOut } = useAuth()
  const { online } = useOnlineSync()
  const [section, setSection] = useState('dash')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [farmers, setFarmers] = useState(() => listRows('farmers'))
  const [farms, setFarms] = useState(() => listRows('farms'))
  const [crops, setCrops] = useState(() => listRows('crops'))
  const [master, setMaster] = useState(MASTER_DATA)

  useEffect(() => {
    const id = setInterval(() => {
      setFarmers(listRows('farmers'))
      setFarms(listRows('farms'))
      setCrops(listRows('crops'))
    }, 3000)
    return () => clearInterval(id)
  }, [])

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

  return (
    <div className="min-h-screen bg-cream text-gray-900 flex">
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[280px] bg-white border-r shadow-sm flex flex-col transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold">KisanSetu</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Admin Console</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.k}
              onClick={() => {
                setSection(item.k)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-left ${
                section === item.k ? 'bg-green-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-2">
              {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {online ? 'Online' : 'Offline'}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">{farmers.length} farmers on record</div>
          </div>
        </div>
        <div className="p-3 border-t">
          <button onClick={signOut} className="w-full py-3 rounded-xl border font-bold flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-gray-100 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold">KisanSetu • Admin</div>
          <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        <div className="p-4 lg:p-8 max-w-[1400px]">
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
                        <tr key={f.id} className="border-t">
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
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-xl font-bold">User Management</h2>
              <div className="p-5 rounded-[20px] bg-white border shadow-sm text-sm text-gray-600 space-y-3">
                <p>
                  Field users sign up from the login screen and get a <code>profiles</code> row with
                  <code> role = 'field'</code>. Promote someone to admin directly in Supabase:
                </p>
                <pre className="bg-gray-900 text-green-300 text-xs p-3 rounded-xl overflow-x-auto">
{`update profiles set role = 'admin' where email = 'someone@example.com';`}
                </pre>
                <p>A full user-invite UI can be added later using Supabase&apos;s admin API from an edge function.</p>
              </div>
            </div>
          )}
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
