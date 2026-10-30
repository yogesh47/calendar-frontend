import { format } from 'date-fns'
import { Combobox } from '@/components/ui/MultiSelect'
import DatePicker from '@/components/custom/DatePicker'
import { addDaysTo } from '../TimeSelect'
import type { Recurrence, RepeatFrequency } from '@/calendar'

export interface RepeatFieldProps {
  eventDate: string
  value: Recurrence | null
  error?: string
  onChange: (value: Recurrence | null) => void
}

// The first "until" offered: a month of weekly sessions is the common case.
const DEFAULT_SPAN_DAYS = 28

/*
  How often, as one choice. "Weekly" beside "Every week" said the same thing
  twice; the presets cover what is usually scheduled, and the backend
  still takes any interval.
*/
const PRESETS: { value: string; label: string; freq: RepeatFrequency | null; interval: number }[] = [
  { value: 'none', label: 'Does not repeat', freq: null, interval: 1 },
  { value: 'daily', label: 'Every day', freq: 'daily', interval: 1 },
  { value: 'weekly', label: 'Every week', freq: 'weekly', interval: 1 },
  { value: 'biweekly', label: 'Every 2 weeks', freq: 'weekly', interval: 2 },
  { value: 'monthly', label: 'Every month', freq: 'monthly', interval: 1 },
]

const presetOf = (value: Recurrence | null): string =>
  PRESETS.find((preset) => preset.freq === (value?.freq ?? null) && preset.interval === (value?.interval ?? 1))
    ?.value ?? 'none'

/**
 * "Does not repeat", or how often and until when — one line beside the row's
 * icon. Every occurrence becomes its own event on publish, so each one can
 * still be moved or cancelled alone.
 */
const RepeatField = ({ eventDate, value, error, onChange }: RepeatFieldProps) => {
  const lastAllowed = eventDate
    ? format(new Date(new Date(`${eventDate}T00:00:00`).setFullYear(Number(eventDate.slice(0, 4)) + 1)), 'yyyy-MM-dd')
    : undefined

  const pick = (key: string) => {
    const preset = PRESETS.find((entry) => entry.value === key)
    onChange(
      preset?.freq
        ? {
            freq: preset.freq,
            interval: preset.interval,
            until: value?.until || addDaysTo(eventDate, DEFAULT_SPAN_DAYS),
          }
        : null,
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-44">
          <Combobox
            searchable={false}
            value={presetOf(value)}
            options={PRESETS.map((preset) => ({ value: preset.value, label: preset.label }))}
            onChange={pick}
          />
        </div>

        {value && (
          <>
            <span className="text-sm [color:var(--ds-color-text-secondary)]">until</span>
            <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <DatePicker
                className="w-full"
                value={value.until}
                min={eventDate}
                max={lastAllowed}
                hasError={Boolean(error)}
                onChange={(until) => onChange({ ...value, until })}
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="!mt-1 text-xs leading-4 [color:var(--ds-color-danger-text)]">{error}</p>}
    </div>
  )
}

export default RepeatField
