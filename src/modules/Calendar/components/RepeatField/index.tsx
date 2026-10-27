import { format } from 'date-fns'
import { Label } from '@/components/ui/Label'
import { Combobox } from '@/components/ui/MultiSelect'
import DatePicker from '@/components/custom/DatePicker'
import { addDaysTo } from '../TimeSelect'
import { REPEAT_OPTIONS } from '../../constants/tpo'
import type { Recurrence, RepeatFrequency } from '../../types/tpo'

interface RepeatFieldProps {
  eventDate: string
  value: Recurrence | null
  error?: string
  onChange: (value: Recurrence | null) => void
}

const INTERVAL_OPTIONS = [1, 2, 3, 4].map((step) => ({ value: String(step), label: String(step) }))

// The first "until" offered: a month of weekly sessions is the common case.
const DEFAULT_SPAN_DAYS = 28

/**
 * "Does not repeat", or how often and until when. Every occurrence becomes its
 * own event on publish, so each one can still be moved or cancelled alone.
 */
const RepeatField = ({ eventDate, value, error, onChange }: RepeatFieldProps) => {
  const unit = REPEAT_OPTIONS.find((option) => option.value === value?.freq)?.unit ?? ''
  const lastAllowed = eventDate
    ? format(new Date(new Date(`${eventDate}T00:00:00`).setFullYear(Number(eventDate.slice(0, 4)) + 1)), 'yyyy-MM-dd')
    : undefined

  const pick = (freq: string) =>
    onChange(
      freq === 'none'
        ? null
        : {
            freq: freq as RepeatFrequency,
            interval: value?.interval ?? 1,
            until: value?.until || addDaysTo(eventDate, DEFAULT_SPAN_DAYS),
          },
    )

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>Repeat</Label>
        <Combobox
          searchable={false}
          value={value?.freq ?? 'none'}
          options={REPEAT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          onChange={pick}
        />
      </div>

      {value && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Every</Label>
            <div className="flex items-center gap-2">
              <div className="w-20">
                <Combobox
                  searchable={false}
                  value={String(value.interval)}
                  options={INTERVAL_OPTIONS}
                  onChange={(step) => onChange({ ...value, interval: Number(step) })}
                />
              </div>
              <span className="text-sm [color:var(--ds-color-text-secondary)]">
                {unit}
                {value.interval > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Until</Label>
            <DatePicker
              className="w-full"
              value={value.until}
              min={eventDate}
              max={lastAllowed}
              hasError={Boolean(error)}
              onChange={(until) => onChange({ ...value, until })}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs [color:var(--ds-color-danger-text)]">{error}</p>}
    </div>
  )
}

export default RepeatField
