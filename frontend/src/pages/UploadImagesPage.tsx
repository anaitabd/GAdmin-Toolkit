import { useState, useRef } from 'react'
import type { UploadedImage } from '../api/types'
import { PhotoIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ErrorAlert from '../components/ui/ErrorAlert'
import Pagination from '../components/ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as imagesApi from '../api/images'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function UploadImagesPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const limit = 24

  const { data, isLoading, error } = useQuery({
    queryKey: ['images', { limit, page }],
    queryFn: () => imagesApi.getAll({ limit, page })
  })

  const uploadMutation = useMutation({
    mutationFn: imagesApi.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['images'] })
  })

  const deleteMutation = useMutation({
    mutationFn: imagesApi.deleteById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['images'] })
  })

  const [deleteItem, setDeleteItem] = useState<UploadedImage | null>(null)
  const [mutationError, setMutationError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMutationError('')
    setSuccessMessage('')
    setUploadProgress(true)
    
    uploadMutation.mutate(file, {
      onSuccess: () => {
        setSuccessMessage('Image uploaded successfully!')
        setUploadProgress(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setTimeout(() => setSuccessMessage(''), 3000)
      },
      onError: (err) => {
        setMutationError(err instanceof Error ? err.message : 'Upload failed')
        setUploadProgress(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  const handleDelete = () => {
    if (!deleteItem) return
    setMutationError('')
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        setDeleteItem(null)
        setSuccessMessage('Image deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      },
      onError: (err) => {
        setDeleteItem(null)
        setMutationError(err instanceof Error ? err.message : 'Delete failed')
      },
    })
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setSuccessMessage('URL copied to clipboard!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (err) {
      setMutationError('Failed to copy URL')
    }
  }

  if (error) return <ErrorAlert message={error.message} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Upload Images</h1>
          {data?.count != null && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {data.count}
            </span>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
          >
            <PhotoIcon className="h-5 w-5" />
            Upload Image
          </label>
        </div>
      </div>

      {mutationError && <ErrorAlert message={mutationError} onClose={() => setMutationError('')} />}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}
      {uploadProgress && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">Uploading image...</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading an image.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.data.map((image) => (
              <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative h-48">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                    {image.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(image.filesize)}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                      title="Copy URL"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Copy URL
                    </button>
                    <button
                      onClick={() => setDeleteItem(image)}
                      className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data && data.count > limit && (
            <div className="mt-6">
              <Pagination
                offset={(page - 1) * limit}
                limit={limit}
                total={data.count}
                onPageChange={(newOffset: number) => setPage(Math.floor(newOffset / limit) + 1)}
              />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteItem}
        title="Delete Image"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
