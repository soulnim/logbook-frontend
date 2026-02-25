import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, parseISO,
  subMonths, addMonths,
} from 'date-fns'

export { format, isToday, isSameMonth, parseISO, subMonths, addMonths }

/** Returns all days to display in a calendar grid (including padding days) */
export function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export function formatDay(date: Date): string {
  return format(date, 'd')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']