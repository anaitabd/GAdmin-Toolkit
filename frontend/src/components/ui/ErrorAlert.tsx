import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface ErrorAlertProps {
  message: string
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
      <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
