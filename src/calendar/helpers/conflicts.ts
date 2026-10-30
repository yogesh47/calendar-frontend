import type { CalendarItem } from '../types'

export const minutesOfClock = (value: string): number => {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + (minute || 0)
}

/** Do two `HH:mm` ranges clash? A range with no end counts as half an hour. */
export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  const start = minutesOfClock(aStart)
  const end = aEnd ? minutesOfClock(aEnd) : start + 30
  const otherStart = minutesOfClock(bStart)
  const otherEnd = bEnd ? minutesOfClock(bEnd) : otherStart + 30

  return start < otherEnd && otherStart < end
}

const minutesOfItem = (value: string): number => {
  const moment = new Date(value)
  return moment.getHours() * 60 + moment.getMinutes()
}

export const lanesFor = (items: CalendarItem[]): Map<string, { lane: number; lanes: number }> => {
  const sorted = [...items].sort((a, b) => minutesOfItem(a.startsAt) - minutesOfItem(b.startsAt))
  const placed = new Map<string, { lane: number; lanes: number }>()
  let cluster: CalendarItem[] = []

  const flush = () => {
    const lanes: CalendarItem[][] = []
    cluster.forEach((item) => {
      const free = lanes.findIndex(
        (lane) =>
          minutesOfItem(lane[lane.length - 1].endsAt ?? lane[lane.length - 1].startsAt) <=
          minutesOfItem(item.startsAt),
      )
      if (free === -1) lanes.push([item])
      else lanes[free].push(item)
    })
    lanes.forEach((lane, index) => lane.forEach((item) => placed.set(item.id, { lane: index, lanes: lanes.length })))
    cluster = []
  }

  let clusterEnd = -1
  sorted.forEach((item) => {
    const start = minutesOfItem(item.startsAt)
    if (cluster.length && start >= clusterEnd) flush()
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, minutesOfItem(item.endsAt ?? item.startsAt))
  })
  if (cluster.length) flush()

  return placed
}
