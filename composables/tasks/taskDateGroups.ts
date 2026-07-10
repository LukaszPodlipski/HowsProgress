import type { Task } from '@/types'

export const daysDiff = (displayDate: string, now: Date): number => {
  const date = new Date(displayDate + 'T00:00:00')
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export const getMondayOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export const getGroupKey = (displayDate: string, now: Date): string => {
  const diff = daysDiff(displayDate, now)
  if (diff >= 0 && diff <= 2) return displayDate
  const date = new Date(displayDate + 'T00:00:00')
  const monday = getMondayOfWeek(date)
  return `week-${monday.toISOString().slice(0, 10)}`
}

export const getGroupSortKey = (displayDate: string, now: Date): string => {
  const diff = daysDiff(displayDate, now)
  if (diff >= 0 && diff <= 2) return displayDate
  const date = new Date(displayDate + 'T00:00:00')
  const monday = getMondayOfWeek(date)
  return monday.toISOString().slice(0, 10)
}

export const sortTasksByDisplayDate = (items: Task[], now: Date): Task[] => {
  return [...items].sort((a, b) => {
    const keyA = getGroupSortKey(a.displayDate, now)
    const keyB = getGroupSortKey(b.displayDate, now)
    if (keyA !== keyB) return keyA.localeCompare(keyB)
    return a.order - b.order
  })
}

/** Group key of the most recent period before today (yesterday, day before yesterday, or week). */
export const getLastPeriodGroupKey = (items: Task[], now: Date): string | null => {
  let latestDate = ''
  for (const task of items) {
    if (daysDiff(task.displayDate, now) > 0 && task.displayDate > latestDate) {
      latestDate = task.displayDate
    }
  }
  if (!latestDate) return null
  return getGroupKey(latestDate, now)
}

export const taskMatchesGroupKey = (displayDate: string, groupKey: string, now: Date): boolean =>
  getGroupKey(displayDate, now) === groupKey

export const formatDateGroupLabel = (
  displayDate: string,
  now: Date,
  labels: { today: string; yesterday: string; dayBeforeYesterday: string }
): string => {
  const diff = daysDiff(displayDate, now)

  if (diff === 0) return labels.today
  if (diff === 1) return labels.yesterday
  if (diff === 2) return labels.dayBeforeYesterday

  const date = new Date(displayDate + 'T00:00:00')
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  if (monday.getMonth() === sunday.getMonth()) {
    const month = sunday.toLocaleDateString('pl-PL', { month: 'long' })
    return `${monday.getDate()}-${sunday.getDate()} ${month}`
  }

  const monMonth = monday.toLocaleDateString('pl-PL', { month: 'long' })
  const sunMonth = sunday.toLocaleDateString('pl-PL', { month: 'long' })
  return `${monday.getDate()} ${monMonth} - ${sunday.getDate()} ${sunMonth}`
}
