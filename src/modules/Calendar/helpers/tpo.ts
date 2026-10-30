import { browserZone, instantIn, zoneLabel } from '@/lib/timeZone'
import { EVENT_TYPE_OPTIONS, MINOR_FIELDS, IMPORTANT_FIELD_LABEL } from '../constants/tpo'
import type { TpoDraft, TpoEventType } from '../types/tpo'

export const rulesFor = (eventType: TpoEventType) =>
  EVENT_TYPE_OPTIONS.find((option) => option.value === eventType) ?? EVENT_TYPE_OPTIONS[0]

export const labelFor = (eventType: TpoEventType): string => rulesFor(eventType).label

// Rich text is compared by what it says: the editor hands back "<p></p>" for an
// empty box and may re-wrap the same words, which is not a change.
const RICH_TEXT_FIELDS: (keyof TpoDraft)[] = ['description', 'note']
const plainText = (html: unknown): string =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const changedFields = (before: TpoDraft, after: TpoDraft): (keyof TpoDraft)[] =>
  (Object.keys(after) as (keyof TpoDraft)[]).filter((field) =>
    RICH_TEXT_FIELDS.includes(field)
      ? plainText(before[field]) !== plainText(after[field])
      : JSON.stringify(before[field]) !== JSON.stringify(after[field]),
  )

// Two fields can share a label (the type and an "Other" type's name), so each label is said once.
export const changedSummary = (before: TpoDraft, after: TpoDraft): string =>
  [...new Set(changedFields(before, after).map((field) => IMPORTANT_FIELD_LABEL[field] ?? field))].join(', ')

export const onlyMinorChanged = (before: TpoDraft, after: TpoDraft): boolean => {
  const changed = changedFields(before, after)
  return changed.length > 0 && changed.every((field) => MINOR_FIELDS.includes(field))
}

export const audienceLine = (draft: TpoDraft): string => {
  const { opportunityType, courses, batches, departments } = draft.audience
  const opportunity = opportunityType.charAt(0).toUpperCase() + opportunityType.slice(1)
  return [opportunity, batches.join(', '), courses.join(', '), departments.join(', ')]
    .filter(Boolean)
    .join(' · ')
}

/**
 * "10:00 AM AEDT" — when the item's times were set in another zone than the
 * viewer's, the time as it reads there. Nothing when the zones agree.
 */
export const timeThere = (draft: TpoDraft): string | null => {
  if (!draft.timeZone || !draft.startTime || draft.timeZone === browserZone()) return null

  const moment = instantIn(draft.eventDate, draft.startTime, browserZone())
  if (zoneLabel(moment, draft.timeZone) === zoneLabel(moment, browserZone())) return null

  const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: draft.timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(moment)

  const place = draft.timeZone.split('/').pop()?.replace(/_/g, ' ')

  return `${clock} · ${place} time (${zoneLabel(moment, draft.timeZone)})`
}
