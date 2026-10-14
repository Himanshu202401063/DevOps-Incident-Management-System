import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'

export interface FormFieldProps {
  id: string
  label: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FormField({
  id,
  label,
  error,
  helperText,
  required = false,
  className = '',
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const helperId = `${id}-helper`

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
        {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>

      <div>{children}</div>

      {helperText && !error && (
        <p id={helperId} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  hasError?: boolean
}

export function Input({ id, hasError = false, className = '', ...props }: InputProps) {
  const borderStyles = hasError
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'

  return (
    <input
      id={id}
      name={props.name ?? id}
      aria-invalid={hasError}
      className={`block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${borderStyles} ${className}`}
      {...props}
    />
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  hasError?: boolean
}

export function Select({ id, hasError = false, className = '', children, ...props }: SelectProps) {
  const borderStyles = hasError
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'

  return (
    <select
      id={id}
      name={props.name ?? id}
      aria-invalid={hasError}
      className={`block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${borderStyles} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  hasError?: boolean
}

export function Textarea({ id, hasError = false, className = '', ...props }: TextareaProps) {
  const borderStyles = hasError
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'

  return (
    <textarea
      id={id}
      name={props.name ?? id}
      aria-invalid={hasError}
      className={`block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${borderStyles} ${className}`}
      {...props}
    />
  )
}
