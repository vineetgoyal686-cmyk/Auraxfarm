import React, { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X } from 'lucide-react'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'past2Week', label: 'Past 2 Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'lastYear', label: 'Last Year' },
  { key: 'all', label: 'All' }
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function addMonths(d, n) {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}
function startOfWeek(d) {
  const x = startOfDay(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  return addDays(x, -day)
}
function endOfWeek(d) {
  return addDays(startOfWeek(d), 6)
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function isSameDay(a, b) {
  return !!a && !!b && a.toDateString() === b.toDateString()
}
function getMonthGrid(monthDate) {
  const gridStart = startOfWeek(startOfMonth(monthDate))
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

function computePreset(key) {
  const today = startOfDay(new Date())
  switch (key) {
    case 'today':
      return [today, today]
    case 'yesterday': {
      const y = addDays(today, -1)
      return [y, y]
    }
    case 'thisWeek':
      return [startOfWeek(today), endOfWeek(today)]
    case 'lastWeek': {
      const s = addDays(startOfWeek(today), -7)
      return [s, addDays(s, 6)]
    }
    case 'past2Week':
      return [addDays(today, -13), today]
    case 'thisMonth':
      return [startOfMonth(today), endOfMonth(today)]
    case 'lastMonth': {
      const m = addMonths(startOfMonth(today), -1)
      return [m, endOfMonth(m)]
    }
    case 'thisYear':
      return [new Date(today.getFullYear(), 0, 1), new Date(today.getFullYear(), 11, 31)]
    case 'lastYear':
      return [new Date(today.getFullYear() - 1, 0, 1), new Date(today.getFullYear() - 1, 11, 31)]
    default:
      return [null, null]
  }
}

function formatLabel(range) {
  const [s, e] = range
  if (!s || !e) return 'Pick a date range'
  const opts = { day: 'numeric', month: 'short' }
  const sameYear = s.getFullYear() === e.getFullYear()
  const left = s.toLocaleDateString('en-GB', opts)
  const right = e.toLocaleDateString('en-GB', sameYear ? opts : { ...opts, year: 'numeric' })
  return `${left} - ${right}, ${e.getFullYear()}`
}

// A vendor-dashboard-style date range picker: quick presets on the left,
// a two-month calendar on the right, Clear/Apply to commit the choice.
export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value || [null, null])
  const [activePreset, setActivePreset] = useState(value?.[0] || value?.[1] ? null : 'all')
  const [viewMonth, setViewMonth] = useState(startOfMonth(value?.[0] || new Date()))
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) setDraft(value || [null, null])
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function pickPreset(key) {
    setActivePreset(key)
    if (key === 'all') {
      setDraft([null, null])
      return
    }
    const range = computePreset(key)
    setDraft(range)
    if (range[0]) setViewMonth(startOfMonth(range[0]))
  }

  function pickDay(day) {
    setActivePreset(null)
    setDraft(([s, e]) => {
      if (!s || (s && e)) return [day, null]
      return day < s ? [day, s] : [s, day]
    })
  }

  function apply() {
    const [s, e] = draft
    onChange(s && !e ? [s, s] : draft)
    setOpen(false)
  }

  function clear() {
    setDraft([null, null])
    setActivePreset('all')
    onChange([null, null])
    setOpen(false)
  }

  const leftMonth = viewMonth
  const rightMonth = addMonths(viewMonth, 1)
  const leftGrid = getMonthGrid(leftMonth)
  const rightGrid = getMonthGrid(rightMonth)
  const today = startOfDay(new Date())

  function renderGrid(grid, monthDate) {
    const [s, e] = draft
    return (
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          const inMonth = day.getMonth() === monthDate.getMonth()
          const isStart = isSameDay(day, s)
          const isEnd = isSameDay(day, e)
          const inRange = s && e && day > s && day < e
          const isToday = isSameDay(day, today)
          return (
            <button
              key={i}
              type="button"
              onClick={() => pickDay(day)}
              className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-sm transition
                ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isStart || isEnd ? 'bg-green-600 text-white font-bold' : inRange ? 'bg-green-50 text-green-800' : 'hover:bg-gray-100'}
                ${isToday && !isStart && !isEnd ? 'border border-green-400' : ''}`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm text-gray-700 whitespace-nowrap"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        {formatLabel(value || [null, null])}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <>
        <div className="fixed inset-0 z-20 bg-black/10" onClick={() => setOpen(false)} />
        <div className="absolute z-30 mt-2 right-0 bg-white border rounded-xl shadow-xl flex overflow-hidden">
          <div className="w-36 border-r py-2 shrink-0">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => pickPreset(p.key)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  activePreset === p.key ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            <div className="flex gap-8">
              <div>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => addMonths(m, -1))}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm whitespace-nowrap">
                    {MONTH_NAMES[leftMonth.getMonth()]} {leftMonth.getFullYear()}
                  </span>
                  <span className="w-6" />
                </div>
                <div className="grid grid-cols-7 text-[11px] font-bold text-gray-400 mb-1">
                  {DOW.map((d) => (
                    <div key={d} className="text-center">
                      {d}
                    </div>
                  ))}
                </div>
                {renderGrid(leftGrid, leftMonth)}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <span className="w-6" />
                  <span className="font-bold text-sm whitespace-nowrap">
                    {MONTH_NAMES[rightMonth.getMonth()]} {rightMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => addMonths(m, 1))}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 text-[11px] font-bold text-gray-400 mb-1">
                  {DOW.map((d) => (
                    <div key={d} className="text-center">
                      {d}
                    </div>
                  ))}
                </div>
                {renderGrid(rightGrid, rightMonth)}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <button
                type="button"
                onClick={clear}
                className="px-4 py-2 rounded-lg border text-sm font-bold text-gray-600 flex items-center gap-1 hover:bg-gray-50"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
              <button
                type="button"
                onClick={apply}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold flex items-center gap-1 hover:bg-green-700"
              >
                <Calendar className="w-3.5 h-3.5" /> Apply
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}
