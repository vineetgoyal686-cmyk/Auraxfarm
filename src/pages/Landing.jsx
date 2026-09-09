import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sprout,
  Navigation as NavIcon,
  Mic,
  CloudUpload,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Smartphone
} from 'lucide-react'

const FEATURES = [
  { icon: CloudUpload, label: 'Offline First', sub: 'Local storage + automatic sync queue' },
  { icon: NavIcon, label: 'GPS Auto Capture', sub: 'One-tap mobile geolocation tagging' },
  { icon: Mic, label: 'Voice Input', sub: 'Hindi / Punjabi / English data entry' },
  { icon: Sprout, label: 'Supabase Backend', sub: 'Real cloud database, no lock-in' }
]

const STEPS = [
  { icon: Smartphone, title: 'Capture in the field', text: 'Field executives log farmers, farms and crops straight from their phone — even with zero signal.' },
  { icon: MapPin, title: 'Tag with GPS & photos', text: 'Every farm gets a location tag, area, irrigation details and crop history attached.' },
  { icon: ShieldCheck, title: 'Sync & review centrally', text: 'Once online, records sync to Supabase automatically and admins get live dashboards & reports.' }
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cream text-gray-900">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center text-white">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="font-bold text-lg">AuraxFarm</div>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 rounded-full bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-700 flex items-center gap-1.5"
        >
          Login <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-green-700 via-green-600 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16 lg:py-24 relative z-10">
          <div className="text-xs opacity-80 mb-4">किसानसेतु • ਕਿਸਾਨਸੇਤੂ</div>
          <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] max-w-2xl">
            Digitizing <br /> Bharat&apos;s <span className="text-amber-200">Fields</span>
          </h1>
          <p className="mt-5 text-green-100 max-w-lg text-base lg:text-lg">
            Mobile-first data collection for field teams. Offline-first, GPS tagged, voice
            enabled, and synced to Supabase the moment you&apos;re back online.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 rounded-xl bg-white text-green-700 font-bold shadow-lg flex items-center gap-2 hover:bg-green-50"
            >
              Login to AuraxFarm <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {FEATURES.map((f) => (
              <div key={f.label} className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                <f.icon className="w-5 h-5 mb-2" />
                <div className="font-bold text-sm">{f.label}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-16">
        <h2 className="text-2xl lg:text-3xl font-bold text-center">How it works</h2>
        <p className="text-gray-500 text-center mt-2 max-w-xl mx-auto">
          Built for field executives collecting data on the ground, and admins who need clean,
          synced data back in the office.
        </p>
        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="p-6 rounded-[24px] bg-white border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-amber-600 mb-1">STEP {i + 1}</div>
              <div className="font-bold mb-2">{s.title}</div>
              <div className="text-sm text-gray-500">{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-20">
        <div className="rounded-[28px] bg-gray-900 text-white p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xl font-bold">Ready to digitize your field data?</div>
            <div className="text-sm text-gray-400 mt-1">Login as a Field User or Administrator to get started.</div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3.5 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
          >
            Login <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border-t px-4 sm:px-8 py-6 text-center text-xs text-gray-400 space-y-1">
        <div>&copy; {new Date().getFullYear()} AuraxFarm. Built for field teams across Bharat.</div>
        <div>Developed By Micky &copy;2026</div>
      </div>
    </div>
  )
}
