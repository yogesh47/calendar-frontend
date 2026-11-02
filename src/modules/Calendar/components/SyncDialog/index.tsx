import { useEffect, useRef, useState } from 'react'
import { addDays, format } from 'date-fns'
import { CalendarPlus, Check, Clock, Copy, ExternalLink, Link2, RefreshCw, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { DatePicker } from '@/components/custom/DatePicker'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalBody, ModalCard, ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import { Row } from '@/modules/Calendar/components/parts'
import { useLabels } from '../../constants/words'
import type { CalendarSyncSettings } from '@/calendar'

/** What the Sync modal tells the page, for its toast. */
export type SyncNotice = { type: 'feed-link-copied' } | { type: 'feed-link-copy-failed' }

interface SyncDialogProps {
  open: boolean
  /** The app fetches the user's subscription link from its own API. */
  getFeedLink: () => Promise<string>
  getSyncSettings?: () => Promise<CalendarSyncSettings>
  onSyncSettingsChange?: (settings: CalendarSyncSettings) => Promise<unknown>
  onNotice: (notice: SyncNotice) => void
  /** What the subscribed calendar is called in the other app. */
  calendarName: string
  onClose: () => void
}


/*
  Google Calendar and Outlook subscribe to the same .ics URL and re-read it
  on their own (Google takes a few hours, the others about an hour). It is
  one-way on purpose: events are made here and flow out, so nothing edited in
  another app can quietly change what people were sent.
*/
/*
  The range is a toggle: "All events", or "Custom" with a From and a To date.
  A range still counted from today (the college default) shows as the dates it
  covers today, and stays counted from today until a date is changed.
*/
const dayOffset = (days: number): string => format(addDays(new Date(), days), 'yyyy-MM-dd')
const dayLabel = (value: string): string => (value ? format(new Date(`${value}T00:00:00`), 'd MMM yyyy') : '')

const providers = (url: string, calendarName: string) => {
  const webcal = url.replace(/^https?:\/\//, 'webcal://')

  return [
    { label: 'Google Calendar', href: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}` },
    {
      label: 'Microsoft Outlook Calendar',
      href: `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(url)}&name=${encodeURIComponent(calendarName)}`,
    },
  ]
}

const SyncDialog = ({ open, getFeedLink, getSyncSettings, onSyncSettingsChange, onNotice, calendarName, onClose }: SyncDialogProps) => {
  const labels = useLabels()
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!open || url) return
    getFeedLink()
      .then(setUrl)
      .catch(() => undefined) // the app's getFeedLink reports its own failure
  }, [open, url, getFeedLink])

  const [copied, setCopied] = useState(false)
  const [choices, setChoices] = useState<CalendarSyncSettings | null>(null)
  const [savedChoices, setSavedChoices] = useState<CalendarSyncSettings | null>(null)
  const [provider, setProvider] = useState(0)
  const [busy, setBusy] = useState(false)
  const canChoose = Boolean(getSyncSettings && onSyncSettingsChange)

  // The app may pass a new function on every render; only opening the dialog should fetch.
  const readSettings = useRef(getSyncSettings)
  readSettings.current = getSyncSettings

  // Fresh from the app each time it opens: a change not applied with a button is dropped on close.
  useEffect(() => {
    if (!open) {
      setChoices(null)
      return
    }
    let current = true
    readSettings
      .current?.()
      .then((settings) => {
        if (!current) return
        setChoices(settings)
        setSavedChoices(settings)
      })
      .catch(() => undefined)
    return () => {
      current = false
    }
  }, [open])

  const choose = (next: CalendarSyncSettings) => setChoices(next)
  // "All events" is both ends set to all; anything else is a custom range.
  const isAll = choices?.pastMode === 'all' && choices?.futureMode === 'all'
  // The dates the custom range shows: the picked ones, or what a count of days covers today.
  const pastFrom = choices?.pastMode === 'date' ? choices.pastFrom : dayOffset(-(choices?.pastDays ?? 30))
  const futureTo = choices?.futureMode === 'date' ? choices.futureTo : dayOffset(choices?.futureDays ?? 365)

  // Nothing is saved until a button is pressed; then only if something changed.
  const applyChoices = async () => {
    if (!choices || !onSyncSettingsChange || JSON.stringify(choices) === JSON.stringify(savedChoices)) return
    await onSyncSettingsChange(choices)
    setSavedChoices(choices)
  }

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await applyChoices()
    } catch {
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      onNotice({ type: 'feed-link-copied' })
    } catch {
      onNotice({ type: 'feed-link-copy-failed' })
    }
  }

  const target = providers(url, calendarName)[provider]

  // The tab opens on the click itself (browsers block one opened after a wait), then follows once the choices are saved.
  const addToCalendar = async () => {
    if (!url) return
    const tab = window.open('', '_blank')
    setBusy(true)
    try {
      await applyChoices()
      if (tab) {
        // The opened app must not be able to reach back into this page.
        tab.opener = null
        tab.location.href = target.href
      } else {
        window.open(target.href, '_blank', 'noopener,noreferrer')
      }
    } catch {
      tab?.close()
    } finally {
      setBusy(false)
    }
  }

  const link = url ? (
    <div className="flex h-10 items-center overflow-hidden rounded-md border [border-color:var(--ds-color-border-strong)] focus-within:[border-color:var(--ds-color-border-focus)] hover:[&:not(:focus-within)]:[border-color:var(--ds-color-border-focus)]">
      <input
        aria-label={labels.syncDialog.copyLink}
        value={url}
        readOnly
        onFocus={(event) => event.target.select()}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none [color:var(--ds-color-text-secondary)]"
      />
      <button
        type="button"
        aria-label="Copy link"
        onClick={copy}
        className="flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-l px-3 text-sm font-medium transition-colors [border-color:var(--ds-color-border-default)] [color:var(--ds-color-text-primary)] hover:[background-color:var(--ds-color-bg-subtle)]"
      >
        {copied ? <Check className="size-4 [color:var(--ds-color-success)]" /> : <Copy className="size-4" />}
        {copied ? labels.syncDialog.copied : labels.syncDialog.copy}
      </button>
    </div>
  ) : (
    <div className="h-10 animate-pulse rounded-md [background-color:var(--ds-color-bg-muted)]" />
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()} className={modalContentClass('md')}>
        <ModalHeader icon={<RefreshCw />} title={labels.syncDialog.title} />

        <ModalBody>
          {/* The rows draw their own icon gutter, so the card keeps no padding of its own. */}
          <ModalCard className="space-y-0 p-0 py-2">
            <Row icon={CalendarPlus} label={labels.syncDialog.addTo}>
              <RadioGroup
                value={String(provider)}
                onValueChange={(value) => setProvider(Number(value))}
                className="gap-0 overflow-hidden rounded-md border [border-color:var(--ds-color-border-strong)] [&>*+*]:border-t [&>*+*]:[border-color:var(--ds-color-border-default)]"
              >
                {providers(url, calendarName).map((option, index) => (
                  <label
                    key={option.label}
                    className="flex h-10 cursor-pointer items-center gap-2.5 px-3 text-sm font-medium transition-colors [color:var(--ds-color-text-primary)] hover:[background-color:var(--ds-color-bg-subtle)]"
                  >
                    <RadioGroupItem value={String(index)} />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
            </Row>

            {canChoose && choices && (
              <Row icon={Tag} label={labels.syncDialog.what}>
                <div className="flex flex-wrap gap-2 py-1">
                  {(
                    [
                      ['events', labels.syncDialog.events],
                      ['deadlines', labels.syncDialog.deadlines],
                      ['reminders', labels.syncDialog.reminders],
                      ['cancelled', labels.syncDialog.cancelled],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      role="checkbox"
                      aria-checked={choices[key]}
                      onClick={() => choose({ ...choices, [key]: !choices[key] })}
                      className={
                        choices[key]
                          ? 'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium [background-color:var(--ds-color-brand-subtle)] [border-color:var(--ds-color-brand)] [color:var(--ds-color-brand)]'
                          : 'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm [border-color:var(--ds-color-border-strong)] [color:var(--ds-color-text-secondary)] hover:[border-color:var(--ds-color-border-focus)]'
                      }
                    >
                      {choices[key] && <Check className="size-3.5" />}
                      {label}
                    </button>
                  ))}
                </div>
              </Row>
            )}

            {canChoose && choices && (
              <Row icon={Clock} label={labels.syncDialog.range}>
                {/* Two equal halves, so the highlight can slide from one to the other. */}
                <RadioGroup
                  className="relative grid h-10 w-fit grid-cols-2 items-stretch rounded-lg border p-1"
                  value={isAll ? 'all' : 'custom'}
                  onValueChange={(value) =>
                    choose(
                      value === 'all'
                        ? { ...choices, pastMode: 'all', futureMode: 'all' }
                        : { ...choices, pastMode: 'days', futureMode: 'days' },
                    )
                  }
                >
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md transition-transform duration-200 ease-out motion-reduce:transition-none [background-color:var(--ds-color-brand-subtle)]',
                      isAll ? 'translate-x-0' : 'translate-x-full',
                    )}
                  />
                  {[
                    ['all', labels.syncDialog.allEvents],
                    ['custom', labels.syncDialog.customRange],
                  ].map(([value, label]) => (
                    <Label
                      key={value}
                      htmlFor={`sync-range-${value}`}
                      className={cn(
                        'relative z-10 flex cursor-pointer items-center justify-center rounded-md px-3 text-sm font-normal transition-colors duration-200 motion-reduce:transition-none focus-within:ring-2 focus-within:[--tw-ring-color:var(--ds-color-brand)]',
                        (value === 'all') === isAll ? '[color:var(--ds-color-brand)]' : '[color:var(--ds-color-text-secondary)]',
                      )}
                    >
                      <RadioGroupItem value={value} id={`sync-range-${value}`} className="sr-only" />
                      {label}
                    </Label>
                  ))}
                </RadioGroup>

                {/*
                  Both parts stay in the page and open or close by their height
                  (grid rows 0fr ↔ 1fr), so the switch slides instead of jumping.
                */}
                <div
                  aria-hidden={!isAll}
                  className={cn(
                    'grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none',
                    isAll ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0',
                  )}
                >
                  <p className="min-h-0 overflow-hidden text-xs [color:var(--ds-color-text-secondary)]">{labels.syncDialog.allEventsNote}</p>
                </div>
                <div
                  aria-hidden={isAll}
                  className={cn(
                    // \`invisible\` once closed keeps the hidden date boxes out of the Tab order.
                    'grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none',
                    isAll ? 'invisible grid-rows-[0fr] opacity-0' : 'visible grid-rows-[1fr] opacity-100',
                  )}
                >
                <div className="min-h-0 overflow-hidden">
                <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-2 gap-y-2 text-sm [color:var(--ds-color-text-secondary)]">
                  <span>{labels.syncDialog.from}</span>
                  <DatePicker
                    aria-label={labels.syncDialog.from}
                    className="w-full"
                    max={dayOffset(0)}
                    value={pastFrom}
                    onChange={(value) => choose({ ...choices, pastMode: 'date', pastFrom: value })}
                  />
                  <span>{labels.syncDialog.to}</span>
                  <DatePicker
                    aria-label={labels.syncDialog.to}
                    className="w-full"
                    min={dayOffset(0)}
                    value={futureTo}
                    onChange={(value) => choose({ ...choices, futureMode: 'date', futureTo: value })}
                  />
                  {/* A fixed last day stops new events from flowing in after it; one plain line says so. */}
                  {choices.futureMode === 'date' && (
                    <p className="col-start-2 text-xs [color:var(--ds-color-text-tertiary)]">
                      {labels.syncDialog.fixedEndNote(dayLabel(futureTo))}
                    </p>
                  )}
                </div>
                </div>
                </div>
              </Row>
            )}

            <Row icon={Link2} label={labels.syncDialog.copyLink}>
              {link}
            </Row>
          </ModalCard>
        </ModalBody>

        <ModalFooter>
          <Button onClick={addToCalendar} disabled={!url || busy}>
            {`${labels.syncDialog.addButton} ${target.label}`}
            <ExternalLink className="size-3.5" />
          </Button>
        </ModalFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SyncDialog
