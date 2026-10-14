export interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = false,
  className = '',
}: LoadingStateProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs'
    : 'flex flex-col items-center justify-center py-12'

  return (
    <div role="status" aria-live="polite" className={`${containerClass} ${className}`}>
      <svg
        className="h-8 w-8 animate-spin text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && <p className="mt-3 text-sm font-medium text-gray-600">{message}</p>}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  )
}
