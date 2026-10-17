import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RegionChecks, ServiceMap } from './Monitoring'

describe('RegionChecks', () => {
  it('stays up while one region fails and goes down once two agree', () => {
    render(<RegionChecks />)
    expect(screen.getByText('Up')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mumbai failing' }))
    expect(screen.getByText('Down')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Frankfurt failing' }))
    expect(screen.getByText('Up')).toBeInTheDocument()
  })
})

describe('ServiceMap', () => {
  it('breaks every service that calls the failed one, directly or not', () => {
    render(<ServiceMap />)
    fireEvent.click(screen.getByRole('button', { name: 'Postgres' }))
    expect(screen.getByText('If Postgres fails, Storefront, Checkout, and Search break. Payments and Gateway keep working.')).toBeInTheDocument()
  })

  it('says nothing else breaks when nothing calls the failed service', () => {
    render(<ServiceMap />)
    fireEvent.click(screen.getByRole('button', { name: 'Storefront, affected' }))
    expect(screen.getByText('Nothing calls Storefront, so nothing else breaks.')).toBeInTheDocument()
  })
})
