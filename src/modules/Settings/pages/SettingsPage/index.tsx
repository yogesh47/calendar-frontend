import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { messageOf, showError, showSuccess } from '@/lib/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { allZones, zoneLabel } from '@/lib/timeZone'
import { TimeSelect } from '@/calendar'
import { fetchSettings, saveSettings } from '../../services/api'
import { DEFAULT_SETTINGS } from './SettingsPage.constants'
import { NUMBER_FIELDS } from './SettingsPage.constants'
import { SETTINGS_COPY } from './SettingsPage.constants'
import type { CalendarSettings, NumberField } from '../../types'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4 rounded-xl border p-5 [background-color:var(--ds-color-bg-surface)]">
    <h2 className="text-sm font-semibold">{title}</h2>
    {children}
  </section>
)

const SettingsPage = () => {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS)
  const [errors, setErrors] = useState<Partial<Record<NumberField, string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // The saved zone stays pickable even if this browser doesn't list it.
  const zones = useMemo(() => [...new Set([settings.timeZone, ...allZones()])].sort(), [settings.timeZone])

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
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
      setSettings(await saveSettings(settings))
      showSuccess(SETTINGS_COPY.saved)
    } catch (error) {
      showError(messageOf(error))
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center p-3 sm:p-[1.5rem]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-[1rem] p-3 sm:p-[1.5rem]">
      <header className="flex items-center gap-2">
        <SlidersHorizontal className="size-5 [color:var(--ds-color-brand)]" />
        <div>
          <h1 className="text-xl font-semibold">{SETTINGS_COPY.title}</h1>
          <p className="text-sm [color:var(--ds-color-text-secondary)]">{SETTINGS_COPY.subtitle}</p>
        </div>
      </header>

      <div className="flex max-w-[44rem] flex-col gap-4">
        <Section title={SETTINGS_COPY.nudgeSection}>
          <div className="grid gap-4 sm:grid-cols-2">
            {NUMBER_FIELDS.slice(0, 3).map((field) => (
              <Input
                key={field.key}
                type="number"
                min={field.min}
                max={field.max}
                step={1}
                label={field.label}
                hint={field.hint}
                value={Number.isNaN(settings[field.key]) ? '' : String(settings[field.key])}
                error={errors[field.key]}
                onChange={(event) => setNumber(field.key)(event.target.value)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Deadline Reminder: same day</p>
              <p className="text-xs [color:var(--ds-color-text-secondary)]">
                Also nudge students on the morning the application closes.
              </p>
            </div>
            <Button
              type="button"
              variant={settings.deadlineReminderSameDay ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSettings({ ...settings, deadlineReminderSameDay: !settings.deadlineReminderSameDay })}
            >
              {settings.deadlineReminderSameDay ? 'On' : 'Off'}
            </Button>
          </div>
        </Section>

        <Section title={SETTINGS_COPY.zoneSection}>
          <div className="space-y-1.5">
            <Label>Time zone</Label>
            <Select value={settings.timeZone} onValueChange={(timeZone) => setSettings({ ...settings, timeZone })}>
              <SelectTrigger className="sm:max-w-[22rem]">
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
            <p className="text-xs [color:var(--ds-color-text-secondary)]">{SETTINGS_COPY.zoneHint}</p>
          </div>
        </Section>

        <Section title={SETTINGS_COPY.syncSection}>
          <p className="text-xs [color:var(--ds-color-text-secondary)]">{SETTINGS_COPY.syncHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {NUMBER_FIELDS.slice(4).map((field) => (
              <Input
                key={field.key}
                type="number"
                min={field.min}
                max={field.max}
                step={1}
                label={field.label}
                hint={field.hint}
                value={Number.isNaN(settings[field.key]) ? '' : String(settings[field.key])}
                error={errors[field.key]}
                onChange={(event) => setNumber(field.key)(event.target.value)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Include cancelled events</p>
              <p className="text-xs [color:var(--ds-color-text-secondary)]">
                Shown as "Cancelled: …" so people see the change. Off: they disappear from synced calendars.
              </p>
            </div>
            <Button
              type="button"
              variant={settings.feedShowCancelled ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSettings({ ...settings, feedShowCancelled: !settings.feedShowCancelled })}
            >
              {settings.feedShowCancelled ? 'On' : 'Off'}
            </Button>
          </div>
        </Section>

        <Section title={SETTINGS_COPY.limitSection}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              min={NUMBER_FIELDS[3].min}
              max={NUMBER_FIELDS[3].max}
              step={1}
              label={NUMBER_FIELDS[3].label}
              hint={NUMBER_FIELDS[3].hint}
              value={Number.isNaN(settings.dailyNudgeLimit) ? '' : String(settings.dailyNudgeLimit)}
              error={errors.dailyNudgeLimit}
              onChange={(event) => setNumber('dailyNudgeLimit')(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Quiet hours start</Label>
              <TimeSelect
                value={settings.quietHoursStart}
                onChange={(value) => setSettings({ ...settings, quietHoursStart: value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Quiet hours end</Label>
              <TimeSelect
                value={settings.quietHoursEnd}
                onChange={(value) => setSettings({ ...settings, quietHoursEnd: value })}
              />
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs [color:var(--ds-color-text-secondary)]">{SETTINGS_COPY.pending}</p>
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? SETTINGS_COPY.saving : SETTINGS_COPY.save}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
