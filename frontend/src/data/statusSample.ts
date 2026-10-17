// Sample content for the public status page until it reads from the API (Sprint 4).

export type Health = 'Operational' | 'Degraded' | 'Major outage'
export type DayState = 'ok' | 'degraded' | 'down'

export interface StatusComponent {
  name: string
  health: Health
  uptime: string
  /** Index 0 is 89 days ago, index 89 is today. Days not listed had no incidents. */
  events: Record<number, Exclude<DayState, 'ok'>>
}

export const STATUS_SUMMARY = {
  title: 'Partial outage',
  text: 'UPI payments and Checkout are affected. Card payments are working.',
}

export const ACTIVE_INCIDENT = {
  title: 'UPI payments failing at checkout',
  started: 'Started 15 Oct, 13:52 IST · affects UPI payments, Checkout',
  updates: [
    {
      label: 'Identified',
      status: 'identified',
      time: '15:10 IST',
      text: 'We found the cause: a configuration change shortened how long we wait for the UPI provider. We are rolling it back now. Card payments are unaffected.',
    },
    {
      label: 'Investigating',
      status: 'investigating',
      time: '15:02 IST',
      text: 'UPI payments are failing for some customers. Card payments work. Next update at 15:30.',
    },
    { label: 'Investigating', status: 'investigating', time: '14:10 IST', text: 'We are looking into failed UPI payments at checkout.' },
  ],
} as const

export const COMPONENTS: StatusComponent[] = [
  { name: 'UPI payments', health: 'Major outage', uptime: '99.21%', events: { 89: 'down', 61: 'degraded' } },
  { name: 'Card payments', health: 'Operational', uptime: '99.86%', events: { 82: 'down' } },
  { name: 'Checkout', health: 'Degraded', uptime: '99.48%', events: { 89: 'degraded', 77: 'down', 52: 'degraded' } },
  { name: 'Login', health: 'Operational', uptime: '99.95%', events: { 86: 'degraded' } },
  { name: 'Search', health: 'Operational', uptime: '99.70%', events: { 89: 'degraded', 60: 'degraded' } },
]

export const PAST_INCIDENTS = [
  { date: '12 Oct', title: 'Login codes delayed for some mobile carriers', text: 'Resolved in 54 minutes. We now switch SMS providers automatically.' },
  { date: '8 Oct', title: 'Card payments declined during bank maintenance', text: 'Resolved in 2h 31m.' },
  { date: '28 Sep', title: 'Checkout unavailable', text: 'Resolved in 48 minutes.' },
]

/** The date shown for day `index` (0 = 89 days before `today`). */
export function dayLabel(today: Date, index: number) {
  const day = new Date(today.getTime() - (89 - index) * 86_400_000)
  return day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}
