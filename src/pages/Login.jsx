import React, { useState } from 'react'
import { Sprout, Navigation as NavIcon, Mic, CloudUpload, ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { translations } from '../lib/i18n.js'

export default function Login() {
  const navigate = useNavigate()
  const { isSupabaseConfigured, signIn, signUp, signInDemo } = useAuth()
  const [lang, setLang] = useState('en')
  const [role, setRole] = useState('field')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const t = translations[lang]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured) {
      // Demo mode: no backend configured yet, just pick a role and go.
      signInDemo(role)
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, role)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 bg-gradient-to-br from-green-700 via-green-600 to-amber-600 p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                <Sprout className="w-7 h-7 text-green-700" />
              </div>
              <div>
                <div className="font-bold text-xl">AuraxFarm</div>
                <div className="text-xs opacity-80 -mt-1">किसानसेतु • ਕਿਸਾਨਸੇਤੂ</div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.1]">
              Digitizing <br /> Bharat&apos;s <span className="text-amber-200">Fields</span>
            </h1>
            <p className="mt-4 text-green-100 max-w-md">
              Mobile-first data collection for field teams. Offline-first, GPS tagged, voice
              enabled, and synced to Supabase the moment you&apos;re back online.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
              {[
                { icon: CloudUpload, label: 'Offline First', sub: 'Local storage + sync queue' },
                { icon: NavIcon, label: 'GPS Auto Capture', sub: 'Mobile geolocation' },
                { icon: Mic, label: 'Voice Input', sub: 'Hindi / Punjabi / English' },
                { icon: Sprout, label: 'Supabase Backend', sub: 'Real cloud database' }
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                  <f.icon className="w-5 h-5 mb-2" />
                  <div className="font-bold text-sm">{f.label}</div>
                  <div className="text-[11px] opacity-70">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-12 flex items-center justify-center bg-white">
          <div className="w-full max-w-sm">
            <button
              onClick={() => navigate('/')}
              className="mb-6 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.login}</h2>
              <div className="flex rounded-full border p-1 bg-gray-50">
                {['en', 'hi', 'pa'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      lang === code ? 'bg-green-600 text-white' : 'text-gray-600'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {!isSupabaseConfigured && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Supabase isn&apos;t connected yet, so this is running in local demo mode. Data
                stays on this device until you add your Supabase keys (see README.md).
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                {[
                  { k: 'field', label: t.fieldUser },
                  { k: 'admin', label: t.admin }
                ].map((r) => (
                  <button
                    type="button"
                    key={r.k}
                    onClick={() => setRole(r.k)}
                    className={`py-3 rounded-xl font-bold text-xs transition ${
                      role === r.k
                        ? 'bg-white shadow text-green-700 border border-green-200'
                        : 'text-gray-500'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {isSupabaseConfigured && (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">{t.email}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-200 outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">{t.password}</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy ? 'Please wait…' : isSupabaseConfigured ? (mode === 'signin' ? 'Continue' : 'Create account') : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>

              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="w-full text-xs text-green-700 font-bold underline"
                >
                  {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
