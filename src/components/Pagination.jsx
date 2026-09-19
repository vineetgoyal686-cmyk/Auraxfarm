import React from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50]

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

export default function Pagination({ page, setPage, pageSize, onPageSizeChange, totalItems }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const rangeStart = totalItems === 0 ? 0 : currentPage * pageSize + 1
  const rangeEnd = Math.min(totalItems, currentPage * pageSize + pageSize)

  if (totalItems === 0) return null

  return (
    <div className="sticky bottom-0 z-10 p-3 border-t rounded-b-lg flex items-center justify-between gap-3 flex-wrap bg-white">
      <span className="text-xs font-bold text-gray-500">
        {rangeStart}-{rangeEnd} of {totalItems} items
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
  )
}
