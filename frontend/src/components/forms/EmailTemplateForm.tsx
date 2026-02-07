import { useState, type FormEvent } from 'react'
import type { EmailTemplate } from '../../api/types'

interface EmailTemplateFormProps {
  initialData?: EmailTemplate | null
  onSubmit: (data: Omit<EmailTemplate, 'id' | 'created_at'>) => void
  onCancel: () => void
}

export default function EmailTemplateForm({ initialData, onSubmit, onCancel }: EmailTemplateFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [htmlContent, setHtmlContent] = useState(initialData?.html_content ?? '')
  const [active, setActive] = useState(initialData?.active ?? true)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, html_content: htmlContent, active })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content *</label>
        <textarea required value={htmlContent} onChange={e => setHtmlContent(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      {htmlContent && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
          <iframe
            srcDoc={htmlContent}
            sandbox=""
            className="w-full h-48 rounded-lg border border-gray-300 bg-white"
            title="Template Preview"
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="template-active" checked={active} onChange={e => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <label htmlFor="template-active" className="text-sm font-medium text-gray-700">Active</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
          Cancel
        </button>
        <button type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
