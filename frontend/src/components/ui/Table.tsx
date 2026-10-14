import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
  ReactNode,
} from 'react'
import { cn } from './cn'

export function Table({ className, children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className={cn('w-full text-left text-sm text-gray-700', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-600', className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-gray-200 bg-white', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-gray-50/80', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-4 py-3.5 font-semibold text-gray-900', className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 align-middle text-gray-700', className)} {...props}>
      {children}
    </td>
  )
}

export function TableEmpty({
  colSpan,
  message = 'No data found',
  description,
  className,
}: {
  colSpan: number
  message?: string
  description?: string
  className?: string
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn('py-12 text-center text-gray-500', className)}>
        <p className="text-base font-medium text-gray-900">{message}</p>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </td>
    </tr>
  )
}

/**
 * Action cell helper that cleanly organizes action buttons and can conditionally
 * disable or hide actions based on user permissions (e.g., Viewer vs Engineer vs Admin).
 */
export function TableActionCell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-4 py-3 align-middle text-right text-sm font-medium', className)}>
      <div className="flex items-center justify-end space-x-2">
        {children}
      </div>
    </td>
  )
}
