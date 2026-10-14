import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Button,
  FormField,
  Input,
  Select,
  Textarea,
  RoleBadge,
  SeverityBadge,
  StatusBadge,
  CriticalityBadge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  LoadingState,
  ErrorState,
} from './index'

describe('Button component', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('triggers onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Submit</Button>)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled and shows spinner when isLoading is true', () => {
    const handleClick = vi.fn()
    render(<Button isLoading onClick={handleClick}>Saving</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})

describe('FormField and Input/Select components', () => {
  it('renders label and connects to input via id', () => {
    render(
      <FormField id="service-name" label="Service Name" required>
        <Input id="service-name" placeholder="Enter name" />
      </FormField>
    )
    const label = screen.getByText(/service name/i)
    const input = screen.getByPlaceholderText('Enter name')
    expect(label).toBeInTheDocument()
    expect(input).toHaveAttribute('id', 'service-name')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('renders select dropdown with accessible label', () => {
    render(
      <FormField id="criticality" label="Criticality">
        <Select id="criticality">
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
        </Select>
      </FormField>
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('displays error message and sets aria-invalid when error is present', () => {
    render(
      <FormField id="username" label="Username" error="Username is required">
        <Input id="username" hasError />
      </FormField>
    )
    const errorMsg = screen.getByRole('alert')
    expect(errorMsg).toHaveTextContent('Username is required')
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('links the label, error, and required state to the control without extra props', () => {
    render(
      <FormField id="title" label="Title" error="Title is required" required>
        <Input />
      </FormField>
    )
    const input = screen.getByLabelText(/title/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAccessibleDescription('Title is required')
  })

  it('describes the control with the helper text when there is no error', () => {
    render(
      <FormField id="description" label="Description" helperText="Shown on the incident page">
        <Textarea />
      </FormField>
    )
    const textarea = screen.getByLabelText(/description/i)
    expect(textarea).toHaveAttribute('aria-invalid', 'false')
    expect(textarea).toHaveAccessibleDescription('Shown on the incident page')
  })
})

describe('Class overrides', () => {
  it('lets a className replace a default class instead of competing with it', () => {
    render(<Button className="px-2">Small</Button>)
    const button = screen.getByRole('button', { name: /small/i })
    expect(button).toHaveClass('px-2')
    expect(button).not.toHaveClass('px-3.5')
  })

  it('draws SEV1 bold, not with the base medium weight', () => {
    render(<SeverityBadge severity="SEV1" />)
    const badge = screen.getByText('SEV1')
    expect(badge).toHaveClass('font-bold')
    expect(badge).not.toHaveClass('font-medium')
  })
})

describe('Badge components', () => {
  it('renders the 3 required roles: ADMIN, ENGINEER, VIEWER', () => {
    const { rerender } = render(<RoleBadge role="ADMIN" />)
    expect(screen.getByText('Admin')).toBeInTheDocument()

    rerender(<RoleBadge role="ENGINEER" />)
    expect(screen.getByText('Engineer')).toBeInTheDocument()

    rerender(<RoleBadge role="VIEWER" />)
    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })

  it('renders severity badges: SEV1 to SEV4', () => {
    const { rerender } = render(<SeverityBadge severity="SEV1" />)
    expect(screen.getByText('SEV1')).toBeInTheDocument()

    rerender(<SeverityBadge severity="SEV2" />)
    expect(screen.getByText('SEV2')).toBeInTheDocument()

    rerender(<SeverityBadge severity="SEV3" />)
    expect(screen.getByText('SEV3')).toBeInTheDocument()

    rerender(<SeverityBadge severity="SEV4" />)
    expect(screen.getByText('SEV4')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    render(<StatusBadge status="OPEN" />)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders service criticality badge', () => {
    render(<CriticalityBadge criticality="CRITICAL" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})

describe('Table component', () => {
  it('renders table headers and data rows', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Criticality</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Payments</TableCell>
            <TableCell>Critical</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('renders TableEmpty when there are no items', () => {
    render(
      <Table>
        <TableBody>
          <TableEmpty colSpan={2} message="No services found" />
        </TableBody>
      </Table>
    )
    expect(screen.getByText('No services found')).toBeInTheDocument()
  })
})

describe('LoadingState and ErrorState components', () => {
  it('renders loading message', () => {
    render(<LoadingState message="Loading incidents..." />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Loading incidents...')).toBeInTheDocument()
  })

  it('renders error message and handles retry callback', () => {
    const handleRetry = vi.fn()
    render(
      <ErrorState
        title="Failed to fetch services"
        message="Network timeout"
        onRetry={handleRetry}
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch services')).toBeInTheDocument()
    expect(screen.getByText('Network timeout')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
