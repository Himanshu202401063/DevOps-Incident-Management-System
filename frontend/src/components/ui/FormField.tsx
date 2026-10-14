import { createContext, useContext } from 'react'
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'
import { cn } from './cn'

export interface FormFieldProps {
  id: string
  label: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
  children: ReactNode
}

interface FieldState {
  id: string
  describedBy?: string
  invalid: boolean
  required: boolean
}

// FormField hands its id, error state, and message id to the control inside it, so a page sets them once.
const FieldContext = createContext<FieldState | null>(null)

export function FormField({
  id,
  label,
  error,
  helperText,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const helperId = `${id}-helper`
  const describedBy = error ? errorId : helperText ? helperId : undefined

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('space-y-1.5', className)}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
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
    </FieldContext.Provider>
  )
}

interface ControlProps {
  id?: string
  name?: string
  hasError?: boolean
  className?: string
}

// aria-required rather than required: the browser's own popup would block our field-level messages.
function useControlProps({ id, name, hasError = false, className }: ControlProps) {
  const field = useContext(FieldContext)
  const controlId = id ?? field?.id
  const invalid = hasError || Boolean(field?.invalid)

  return {
    id: controlId,
    name: name ?? controlId,
    'aria-invalid': invalid,
    'aria-describedby': field?.describedBy,
    'aria-required': field?.required || undefined,
    className: cn(
      'block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
      invalid
        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
      className,
    ),
  }
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string
  hasError?: boolean
}

export function Input({ id, name, hasError, className, ...props }: InputProps) {
  return <input {...useControlProps({ id, name, hasError, className })} {...props} />
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id?: string
  hasError?: boolean
}

export function Select({ id, name, hasError, className, children, ...props }: SelectProps) {
  return (
    <select {...useControlProps({ id, name, hasError, className })} {...props}>
      {children}
    </select>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string
  hasError?: boolean
}

export function Textarea({ id, name, hasError, className, ...props }: TextareaProps) {
  return <textarea {...useControlProps({ id, name, hasError, className })} {...props} />
}
