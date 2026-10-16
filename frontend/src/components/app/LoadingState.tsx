import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingState({ message = 'Loading', className }: { message?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground', className)}>
      <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
