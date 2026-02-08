import { useState, useRef, type ChangeEvent } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'

interface BulkUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  /** Column names expected in the CSV */
  columns: string[]
  /** Called with parsed rows */
  onUpload: (rows: Record<string, string>[]) => void
  isLoading?: boolean
  result?: { inserted?: number; skipped?: number } | null
  /** External error from mutation */
  error?: string | null
  /** Optional extra fields rendered above the upload area */
  renderExtra?: () => React.ReactNode
}

function parseCsv(text: string): Record<string, string>[] {
  // Strip BOM (Byte Order Mark) that Excel/Windows CSV files prepend
  const cleaned = text.replace(/^\uFEFF/, '')
  const lines = cleaned.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  }).filter(row => Object.values(row).some(v => v))
}

export default function BulkUploadDialog({
  isOpen,
  onClose,
  title,
  description,
  columns,
  onUpload,
  isLoading,
  result,
  error: externalError,
  renderExtra,
}: BulkUploadDialogProps) {
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [error, setError] = useState('')
  const [textMode, setTextMode] = useState(false)
  const [textValue, setTextValue] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const prevIsOpen = useRef(isOpen)

  const reset = () => { setRows([]); setError(''); setTextValue(''); if (fileRef.current) fileRef.current.value = '' }

  // Reset internal state when dialog is closed (regardless of how it was closed)
  if (prevIsOpen.current && !isOpen) { reset() }
  prevIsOpen.current = isOpen

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      // Single column: treat each line as a value (no header expected)
      if (columns.length === 1) {
        const items = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(v => v.trim()).filter(Boolean)
        if (!items.length) { setError('No valid rows found'); return }
        setRows(items.map(v => ({ [columns[0]]: v })))
        setError('')
        return
      }
      const parsed = parseCsv(text)
      if (!parsed.length) { setError('No valid rows found in CSV'); return }
      setRows(parsed)
      setError('')
    }
    reader.readAsText(file)
  }

  const handleTextParse = () => {
    if (!textValue.trim()) return
    // If single column, treat each line as a value
    if (columns.length === 1) {
      const items = textValue.trim().split(/[\n,;]+/).map(v => v.trim()).filter(Boolean)
      setRows(items.map(v => ({ [columns[0]]: v })))
      setError('')
    } else {
      const parsed = parseCsv(textValue)
      if (!parsed.length) { setError('No valid rows found'); return }
      setRows(parsed)
      setError('')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose() }}
      title={title}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-400">
          Expected columns: <code className="bg-gray-100 px-1 rounded">{columns.join(', ')}</code>
        </p>

        {renderExtra && renderExtra()}

        <div className="flex gap-2">
          <button
            onClick={() => setTextMode(false)}
            className={`text-xs px-3 py-1 rounded-full ${!textMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Upload CSV
          </button>
          <button
            onClick={() => setTextMode(true)}
            className={`text-xs px-3 py-1 rounded-full ${textMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Paste Text
          </button>
        </div>

        {!textMode ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 cursor-pointer hover:border-indigo-400 transition-colors"
          >
            <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Click to upload CSV file</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={6}
              placeholder={columns.length === 1
                ? `One ${columns[0]} per line...`
                : `${columns.join(',')}\nvalue1,value2,...`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button onClick={handleTextParse} className="text-xs text-indigo-600 font-medium mt-1">
              Parse ({textValue.trim().split('\n').length} lines)
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {rows.length > 0 && (
          <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">{rows.length} rows ready to import</p>
            <p className="text-xs text-gray-500 mt-1">
              Preview: {JSON.stringify(rows[0]).slice(0, 100)}...
            </p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700">
              Imported: {result.inserted ?? 0} {result.skipped ? `(${result.skipped} skipped)` : ''}
            </p>
          </div>
        )}

        {externalError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{externalError}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={() => { reset(); onClose() }} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => onUpload(rows)}
            disabled={!rows.length || isLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Importing...' : `Import ${rows.length} rows`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
