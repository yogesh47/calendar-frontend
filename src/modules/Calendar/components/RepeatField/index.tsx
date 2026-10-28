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

  // "Every month", "Every 2 months" — one control instead of a number and a loose word.
  const intervalOptions = [1, 2, 3, 4].map((step) => ({
    value: String(step),
    label: step === 1 ? `Every ${unit}` : `Every ${step} ${unit}s`,
  }))

  // Laid out like the date/time row above it: three equal columns when it
  // repeats, the picker alone across the row when it does not.
  return (
    <div className="space-y-1.5">
      <div className={value ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3' : 'grid grid-cols-1'}>
        <div className={value ? 'col-span-2 space-y-1.5 sm:col-span-1' : 'space-y-1.5'}>
          <Label>Repeat</Label>
          <Combobox
            searchable={false}
            value={value?.freq ?? 'none'}
            options={REPEAT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={pick}
          />
        </div>

        {value && (
          <>
            <div className="space-y-1.5">
              <Label>Every</Label>
              <Combobox
                searchable={false}
                value={String(value.interval)}
                options={intervalOptions}
                onChange={(step) => onChange({ ...value, interval: Number(step) })}
              />
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
          </>
        )}
      </div>

      {error && <p className="text-xs [color:var(--ds-color-danger-text)]">{error}</p>}
    </div>
  )
}

export default RepeatField
