import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import type { IncidentStatus } from '@/components/app/badges'

const IST = 330 * 60_000
/** A wall-clock time in IST on 14/15 October 2026, as epoch milliseconds. */
const ist = (day: number, h: number, m: number, s = 0) => Date.UTC(2026, 9, day, h, m, s) - IST
const pad = (n: number) => String(n).padStart(2, '0')

const T0 = ist(14, 9, 12, 4) // incident opened
const RESOLVED_AT = ist(14, 12, 22, 4)
const WAIT_AT = 1.6 // replay seconds: the page arrives and waits for an acknowledgement
const AUTO_ACK = 5.5 // seconds of waiting before Neha acknowledges on her own
const DURATION = 8
const RESPONSE_TARGET = 3_600_000
const RESOLUTION_TARGET = 8 * 3_600_000

export const formatDuration = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return h ? `${h}h ${pad(m)}m` : `${m}m ${pad(total % 60)}s`
}
const hms = (ms: number) => {
  const d = new Date(ms + IST)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

/** Linear interpolation through [replaySecond, epochMs] key points. */
function interpolate(points: [number, number][], t: number) {
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [a, va] = points[i - 1]
      const [b, vb] = points[i]
      return va + ((vb - va) * Math.max(0, t - a)) / (b - a)
    }
  }
  return points[points.length - 1][1]
}

interface Sim {
  t: number
  waitElapsed: number
  ack: number | null
  byYou: boolean
}

const FINISHED: Sim = { t: DURATION, waitElapsed: 0, ack: T0 + 396_000, byYou: false }

/** Drives the landing-page incident replay: three hours of an incident in about eight seconds. */
export function useIncidentReplay() {
  const reduceMotion = useReducedMotion()
  const [sim, setSim] = useState<Sim>(reduceMotion ? FINISHED : { t: 0, waitElapsed: 0, ack: null, byYou: false })
  const simRef = useRef(sim)
  const frame = useRef(0)

  // Runs the animation loop from whatever simRef holds; state updates only happen in frames.
  const runLoop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    if (reduceMotion) return
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = simRef.current
      let next: Sim
      if (!s.ack && s.t >= WAIT_AT) {
        const waitElapsed = s.waitElapsed + dt
        next =
          waitElapsed >= AUTO_ACK
            ? { ...s, waitElapsed, ack: T0 + 60_000 + waitElapsed * 61_000, byYou: false }
            : { ...s, waitElapsed, t: WAIT_AT }
      } else {
        next = { ...s, t: Math.min(DURATION, s.t + dt) }
      }
      simRef.current = next
      setSim(next)
      if (next.t < DURATION) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }, [reduceMotion])

  useEffect(() => {
    runLoop()
    return () => cancelAnimationFrame(frame.current)
  }, [runLoop])

  const play = useCallback(() => {
    const start = reduceMotion ? FINISHED : { t: 0, waitElapsed: 0, ack: null, byYou: false }
    simRef.current = start
    setSim(start)
    runLoop()
  }, [reduceMotion, runLoop])

  const acknowledge = useCallback(() => {
    const s = simRef.current
    if (s.ack) return
    simRef.current = { ...s, ack: T0 + 60_000 + s.waitElapsed * 61_000, byYou: true }
    setSim(simRef.current)
  }, [])

  const { t, ack, byYou, waitElapsed } = sim
  const ackTime = ack ?? T0 + 60_000 + waitElapsed * 61_000

  let now: number
  if (!ack) {
    now = t < WAIT_AT ? interpolate([[0, T0], [1, T0 + 1000], [WAIT_AT, T0 + 60_000]], t) : ackTime
  } else {
    now = interpolate(
      [
        [WAIT_AT, ackTime],
        [2.0, ackTime],
        [2.8, ackTime + 139_000],
        [3.6, ist(14, 10, 5)],
        [4.4, ist(14, 11, 40)],
        [5.3, RESOLVED_AT],
        [6.4, ist(15, 10, 0)],
        [DURATION, ist(15, 10, 0)],
      ],
      t,
    )
  }

  const entries: { at: number; title: string; text: string; status: IncidentStatus; when: number | null }[] = [
    { at: 0.15, title: 'Alert received', text: 'Datadog prod: checkout-api 5xx rate 6.2%', status: 'OPEN', when: T0 },
    { at: 1.0, title: 'Paged Neha Iyer', text: 'On call for Checkout API. Both clocks started.', status: 'OPEN', when: T0 + 1000 },
    {
      at: 2.0,
      title: byYou ? 'You acknowledged' : 'Acknowledged',
      text: `Response clock stopped at ${formatDuration(ackTime - T0)} of 60m.`,
      status: 'ACKNOWLEDGED',
      when: ackTime,
    },
    { at: 2.8, title: 'Investigating', text: 'Errors begin right after the 09:05 deploy.', status: 'INVESTIGATING', when: ackTime + 139_000 },
    { at: 3.6, title: 'Identified', text: 'Connection pool pinned at 50 of 50.', status: 'IDENTIFIED', when: ist(14, 10, 5) },
    { at: 4.4, title: 'Monitoring', text: 'Pool raised to 200. Errors under 1%.', status: 'MONITORING', when: ist(14, 11, 40) },
    { at: 5.3, title: 'Resolved', text: 'Resolution clock stopped at 3h 10m of 8h.', status: 'RESOLVED', when: RESOLVED_AT },
    { at: 6.4, title: 'Postmortem drafted', text: 'AI draft from the timeline, waiting for Neha to edit.', status: 'RESOLVED', when: null },
  ]

  const visible = entries.filter((e) => (e.at < 2 || ack) && t >= e.at)
  const status: IncidentStatus = visible.at(-1)?.status ?? 'OPEN'

  const responseStopped = !!ack && t >= 2.0
  const resolutionStopped = !!ack && t >= 5.3
  const ring = (used: number, target: number, stopped: boolean, circumference: number, targetLabel: string) => ({
    dash: `${(Math.min(used / target, 1) * circumference).toFixed(1)} ${circumference}`,
    stopped,
    big: stopped ? formatDuration(used) : formatDuration(target - used),
    label: stopped ? 'Met, clock stopped' : `Running · left of ${targetLabel}`,
  })
  const response = ring((responseStopped ? ackTime : now) - T0, RESPONSE_TARGET, responseStopped, 747.7, '60m')
  const resolution = ring((resolutionStopped ? RESOLVED_AT : now) - T0, RESOLUTION_TARGET, resolutionStopped, 615.8, '8h')

  const pageIn = t >= 1.0 ? ease((t - 1.0) / 0.4) : 0
  const nowDate = new Date(now + IST)

  return {
    play,
    acknowledge,
    status,
    progress: t / DURATION,
    simTime: hms(now),
    simDate: `${nowDate.getUTCDate()} Oct 2026`,
    handDeg: (((now - T0) / 1000) % 60) * 6,
    response,
    resolution,
    entries: entries.map((e) => {
      const p = e.at >= 2 && !ack ? 0 : ease((t - e.at) / 0.5)
      return { ...e, progress: p, time: e.when ? hms(e.when) : '15 Oct' }
    }),
    page: {
      progress: pageIn,
      waiting: !ack && t >= WAIT_AT,
      done: !!ack,
      doneText: byYou ? `You stopped the clock at ${formatDuration(ackTime - T0)}` : `Neha acknowledged at ${formatDuration(ackTime - T0)}`,
      running: formatDuration(now - T0),
    },
  }
}
