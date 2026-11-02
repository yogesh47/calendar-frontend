import { useEffect, useMemo, useState } from 'react'
import { BellRing, CalendarSync, Clock4, Globe, MoonStar, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { messageOf, showError, showSuccess } from '@/lib/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { allZones, zoneLabel } from '@/lib/timeZone'
import TimeSelect from '@/modules/Calendar/components/TimeSelect'
import { fetchSettings, saveSettings } from '../../services/api'
import { DEFAULT_SETTINGS } from './SettingsPage.constants'
import { NUMBER_FIELDS } from './SettingsPage.constants'
import { SETTINGS_COPY } from './SettingsPage.constants'
import type { CalendarSettings, NumberField } from '../../types'

/** One settings card: an icon, a title, a line on what it controls, then its fields. */
const Section = ({
  icon: Icon,
  title,
  caption,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  caption: string
  children: React.ReactNode
}) => (
  <section className="flex flex-col gap-5 rounded-xl border p-5 [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-default)]">
    <header className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs [color:var(--ds-color-text-secondary)]">{caption}</p>
      </div>
    </header>
    {children}
  </section>
)

/** An on / off setting: what it does on the left, a switch on the right. */
const Toggle = ({
  label,
  caption,
  checked,
  onChange,
}: {
  label: string
  caption: string
  checked: boolean
  onChange: (value: boolean) => void
}) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 [border-color:var(--ds-color-border-default)]">
    <div className="min-w-0">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs [color:var(--ds-color-text-secondary)]">{caption}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [--tw-ring-color:var(--ds-color-brand)]',
        checked ? '[background-color:var(--ds-color-brand)]' : '[background-color:var(--ds-color-border-strong)]',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  </div>
)

const SettingsPage = () => {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS)
  // What the server has, so the save bar knows whether anything changed.
  const [saved, setSaved] = useState<CalendarSettings>(DEFAULT_SETTINGS)
  const [errors, setErrors] = useState<Partial<Record<NumberField, string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // The saved zone stays pickable even if this browser doesn't list it.
  const zones = useMemo(() => [...new Set([settings.timeZone, ...allZones()])].sort(), [settings.timeZone])
  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved)

  useEffect(() => {
    fetchSettings()
      .then((loaded) => {
        setSettings(loaded)
        setSaved(loaded)
      })
      .catch((error) => showError(messageOf(error)))
      .finally(() => setIsLoading(false))
  }, [])

  const validate = (next: CalendarSettings): Partial<Record<NumberField, string>> => {
    const found: Partial<Record<NumberField, string>> = {}

    NUMBER_FIELDS.forEach((field) => {
      const value = next[field.key]
      if (!Number.isInteger(value)) found[field.key] = SETTINGS_COPY.wholeNumber
      else if (value < field.min || value > field.max) found[field.key] = `Enter ${field.min}–${field.max}.`
    })

    return found
  }

  const setNumber = (key: NumberField) => (value: string) => {
    const next = { ...settings, [key]: value === '' ? Number.NaN : Number(value) }
    setSettings(next)
    setErrors(validate(next))
  }

  const save = async () => {
    const found = validate(settings)
    setErrors(found)
    if (Object.keys(found).length) return

    setIsSaving(true)
    try {
      const stored = await saveSettings(settings)
      setSettings(stored)
      setSaved(stored)
      showSuccess(SETTINGS_COPY.saved)
    } catch (error) {
      showError(messageOf(error))
    }
    setIsSaving(false)
  }

  const numberInput = (key: NumberField) => {
    const field = NUMBER_FIELDS.find((item) => item.key === key)!

    return (
      <Input
        type="number"
        min={field.min}
        max={field.max}
        step={1}
        label={field.label}
        hint={field.hint}
        suffix={field.unit}
        value={Number.isNaN(settings[key]) ? '' : String(settings[key])}
        error={errors[key]}
        onChange={(event) => setNumber(key)(event.target.value)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center p-3 sm:p-[1.5rem]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex min-h-full w-full flex-col">
      <div className="flex w-full flex-1 flex-col gap-5 p-3 sm:p-[1.5rem]">
        <header className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl [background-color:var(--ds-color-brand-subtle)] [color:var(--ds-color-brand)]">
            <SlidersHorizontal className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{SETTINGS_COPY.title}</h1>
            <p className="text-sm [color:var(--ds-color-text-secondary)]">{SETTINGS_COPY.subtitle}</p>
          </div>
        </header>

        {/* Two columns on a wide screen: nudges on the left, the calendar's own settings on the right. */}
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Section icon={BellRing} title={SETTINGS_COPY.nudgeSection} caption={SETTINGS_COPY.nudgeCaption}>
              <div className="grid gap-4 sm:grid-cols-2">
                {numberInput('eventReminderDaysBefore')}
                {numberInput('eventReminderHoursBefore')}
                {numberInput('deadlineReminderDaysBefore')}
              </div>

              <Toggle
                label={SETTINGS_COPY.sameDayLabel}
                caption={SETTINGS_COPY.sameDayCaption}
                checked={settings.deadlineReminderSameDay}
                onChange={(deadlineReminderSameDay) => setSettings({ ...settings, deadlineReminderSameDay })}
              />
            </Section>

            <Section icon={MoonStar} title={SETTINGS_COPY.limitSection} caption={SETTINGS_COPY.limitCaption}>
              <div className="grid gap-4 sm:grid-cols-2">{numberInput('dailyNudgeLimit')}</div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{SETTINGS_COPY.quietStart}</Label>
                  <TimeSelect
                    value={settings.quietHoursStart}
                    onChange={(value) => setSettings({ ...settings, quietHoursStart: value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{SETTINGS_COPY.quietEnd}</Label>
                  <TimeSelect
                    value={settings.quietHoursEnd}
                    onChange={(value) => setSettings({ ...settings, quietHoursEnd: value })}
                  />
                </div>
              </div>

              <p className="flex items-start gap-2 text-xs [color:var(--ds-color-text-secondary)]">
                <Clock4 className="mt-0.5 size-3.5 shrink-0" />
                {SETTINGS_COPY.quietHint}
              </p>
            </Section>
          </div>

          <div className="flex flex-col gap-5">
            <Section icon={Globe} title={SETTINGS_COPY.zoneSection} caption={SETTINGS_COPY.zoneHint}>
              <div className="space-y-1.5">
                <Label>{SETTINGS_COPY.zoneLabel}</Label>
                <Select value={settings.timeZone} onValueChange={(timeZone) => setSettings({ ...settings, timeZone })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[18rem]">
                    {zones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {`${zone.replace(/_/g, ' ')} (${zoneLabel(new Date(), zone)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section icon={CalendarSync} title={SETTINGS_COPY.syncSection} caption={SETTINGS_COPY.syncHint}>
              <div className="grid gap-4 sm:grid-cols-2">
                {numberInput('feedPastDays')}
                {numberInput('feedFutureDays')}
              </div>

              <Toggle
                label={SETTINGS_COPY.cancelledLabel}
                caption={SETTINGS_COPY.cancelledCaption}
                checked={settings.feedShowCancelled}
                onChange={(feedShowCancelled) => setSettings({ ...settings, feedShowCancelled })}
              />
            </Section>
          </div>
        </div>
      </div>

      {/* Always in view, so the button is never below the fold. */}
      <footer className="sticky bottom-0 z-10 border-t px-3 py-3 [background-color:var(--ds-color-bg-surface)] [border-color:var(--ds-color-border-default)] sm:px-[1.5rem]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-xs [color:var(--ds-color-text-secondary)]">
            {isDirty ? <span className="font-semibold [color:var(--ds-color-text-primary)]">{SETTINGS_COPY.unsaved} · </span> : null}
            {SETTINGS_COPY.pending}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {isDirty && (
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={() => {
                  setSettings(saved)
                  setErrors({})
                }}
              >
                {SETTINGS_COPY.discard}
              </Button>
            )}
            <Button onClick={save} disabled={isSaving || !isDirty}>
              {isSaving ? SETTINGS_COPY.saving : SETTINGS_COPY.save}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SettingsPage
