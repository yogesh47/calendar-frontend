import { addDays, differenceInCalendarDays, format } from 'date-fns'
import { Combobox } from '@/components/ui/MultiSelect'

const STEP = 30

export const TIME_OPTIONS = Array.from({ length: (24 * 60) / STEP }, (_, index) => {
  const minutes = index * STEP
  const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

  return { value, label: format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), 'h:mm a') }
})

export const plusHour = (value: string): string => {
  const [hour, minute] = value.split(':').map(Number)
  const minutes = (hour * 60 + minute + 60) % (24 * 60)

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export const addDaysTo = (date: string, days: number): string =>
  date ? format(addDays(new Date(`${date}T00:00:00`), days), 'yyyy-MM-dd') : date

export const dayShift = (from: string, to: string): number =>
  from && to ? Math.max(differenceInCalendarDays(new Date(`${to}T00:00:00`), new Date(`${from}T00:00:00`)), 0) : 0

interface TimeSelectProps {
  value: string
  onChange: (value: string) => void
  /**
   * Isse pehle ka koi waqt nahi dikhega. End time ke liye start time yahan
   * diya jaata hai, taaki aisa waqt chuna hi na ja sake jo shuruaat se pehle
   * ho — rokne se behtar hai ki wo option saamne aaye hi na.
   */
  after?: string
}

const TimeSelect = ({ value, onChange, after }: TimeSelectProps) => {
  const [hour, minute] = value ? value.split(':').map(Number) : []
  const options = after ? TIME_OPTIONS.filter((option) => option.value > after) : TIME_OPTIONS

  return (
    <Combobox
      clearable
      className="w-full"
      placeholder="Select time"
      options={options}
      value={value}
      valueLabel={value ? format(new Date(2000, 0, 1, hour, minute), 'h:mm a') : undefined}
      onChange={onChange}
    />
  )
}

export default TimeSelect

export const minusHour = (value: string): string => {
  const [hour, minute] = value.split(':').map(Number)
  const minutes = (hour * 60 + minute - 60 + 24 * 60) % (24 * 60)

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
