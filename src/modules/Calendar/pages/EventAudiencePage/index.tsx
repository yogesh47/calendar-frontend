import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { messageOf, showError, showSuccess } from '@/lib/toast'
import { Required, Section } from '../../components/parts'
import { CalendarSkeleton } from '../../components/CalendarState'
import { fetchEvents, updateEvent } from '../../services/api'
import { batchesFor, countAudience } from '../../services/audience'
import {
  BATCH_OPTIONS,
  COURSE_OPTIONS,
  DEPARTMENT_OPTIONS,
  OPPORTUNITY_OPTIONS,
} from '../../constants/tpo'
import type { Audience, OpportunityType, TpoEvent } from '../../types/tpo'

interface EventAudiencePageProps {
  role?: 'tpo' | 'student'
}

/**
 * Who the event reaches, asked AFTER it is published.
 *
 * The event exists by the time anyone lands here; it simply has not been sent
 * to anybody yet. Saving on this page is what notifies them, which is why the
 * button says so and the count sits beside it.
 */
const EventAudiencePage = ({ role = 'tpo' }: EventAudiencePageProps) => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<TpoEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [audience, setAudience] = useState<Audience>({
    opportunityType: 'job',
    courses: [],
    batches: [],
    departments: [],
  })

  useEffect(() => {
    let isCurrent = true
    fetchEvents()
      .then((events) => {
        if (!isCurrent) return
        const found = events.find((entry) => entry.id === eventId) ?? null
        setEvent(found)
        if (found) setAudience(found.draft.audience)
      })
      .catch((error) => showError(messageOf(error)))
      .finally(() => isCurrent && setIsLoading(false))

    return () => {
      isCurrent = false
    }
  }, [eventId])
  const count = countAudience(audience)
  const batchOptions = BATCH_OPTIONS.filter((option) => batchesFor(audience.opportunityType).includes(option.year))

  const set = (field: string, value: unknown) => {
    const key = field.replace('audience.', '') as keyof Audience
    setAudience((current) => ({ ...current, [key]: value as never }))
  }

  const pickOpportunity = (opportunityType: OpportunityType) => {
    const allowed = batchesFor(opportunityType)
    setAudience((current) => ({
      ...current,
      opportunityType,
      batches: current.batches.filter((batch) => allowed.includes(batch)),
    }))
  }

  const audienceError = (field: 'courses' | 'batches' | 'departments'): string | undefined => {
    if (!showErrors) return undefined
    if (audience[field].length) return undefined

    return `Select at least one ${field.slice(0, -1)}.`
  }

  const back = () => navigate(`/${role}/calendar`)

  const save = async () => {
    setShowErrors(true)
    if (!event) return
    if (!audience.courses.length || !audience.batches.length || !audience.departments.length) return
    if (count === 0) {
      showError('0 students match this audience.')

      return
    }

    setIsSaving(true)
    try {
      const saved = await updateEvent(event.id, { ...event.draft, audience })
      showSuccess(`Audience saved. ${saved.notifiedCount} students notified.`)
      back()
    } catch (error) {
      showError(messageOf(error))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <CalendarSkeleton />

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        <h1 className="text-lg font-semibold">That event is not here</h1>
        <p className="text-sm [color:var(--ds-color-text-secondary)]">
          It may have been cancelled or deleted.
        </p>
        <Button type="button" variant="outline" onClick={back}>
          Back to the calendar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-3 sm:p-4">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Who should see this?</h1>
        <p className="text-sm [color:var(--ds-color-text-secondary)]">
          {event.draft.title} is published. Choose who it reaches, and saving will notify them.
        </p>
      </header>

          <Section title="Target Audience">

            <div className="space-y-1.5">
              <Label>
                Opportunity Type <Required />
              </Label>
              <RadioGroup
                className="flex flex-row flex-wrap gap-4 sm:gap-5"
                value={audience.opportunityType}
                onValueChange={(value) => pickOpportunity(value as OpportunityType)}
              >
                {OPPORTUNITY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem value={option.value} id={`opportunity-${option.value}`} />
                    <Label htmlFor={`opportunity-${option.value}`} className="cursor-pointer font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label>
                Course <Required />
              </Label>
              <MultiSelect
                placeholder="Select courses"
                options={COURSE_OPTIONS.map((course) => ({ value: course, label: course }))}
                value={audience.courses}
                onChange={(courses) => set('audience.courses', courses)}
              />
              {audienceError('courses') && (
                <p className="text-xs [color:var(--ds-color-danger-text)]">{audienceError('courses')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Batch <Required />
              </Label>
              <MultiSelect
                placeholder="Select batches"
                options={batchOptions.map((option) => ({ value: String(option.year), label: option.label }))}
                value={audience.batches.map(String)}
                onChange={(batches) => set('audience.batches', batches.map(Number))}
              />
              {audienceError('batches') && (
                <p className="text-xs [color:var(--ds-color-danger-text)]">{audienceError('batches')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Department <Required />
              </Label>
              <MultiSelect
                searchable
                placeholder="Select departments"
                options={DEPARTMENT_OPTIONS.map((department) => ({ value: department, label: department }))}
                value={audience.departments}
                onChange={(departments) => set('audience.departments', departments)}
              />
              {audienceError('departments') && (
                <p className="text-xs [color:var(--ds-color-danger-text)]">{audienceError('departments')}</p>
              )}
            </div>

            {count > 0 ? (
              <p className="flex items-center gap-2 text-sm font-semibold [color:var(--ds-color-brand)]">
                <Info className="size-3.5" />
                {count} students will be notified
              </p>
            ) : showErrors ? (
              <p className="flex items-center gap-2 text-sm font-semibold [color:var(--ds-color-danger-text)]">
                <Info className="size-3.5" />
                0 students match this audience.
              </p>
            ) : null}
          </Section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm [color:var(--ds-color-text-secondary)]">
          {count > 0 ? `${count} students will be notified` : 'No students match this audience yet'}
        </span>
        <span className="flex gap-2">
          <Button type="button" variant="outline" onClick={back} disabled={isSaving}>
            Later
          </Button>
          <Button type="button" onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save and notify'}
          </Button>
        </span>
      </div>
    </div>
  )
}

export default EventAudiencePage
