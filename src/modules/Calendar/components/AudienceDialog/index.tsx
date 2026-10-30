import { useEffect, useState } from 'react'
import { Info, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalBody, ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import { messageOf, showError, showSuccess } from '@/lib/toast'
import { Section } from '../parts'
import AudienceFields, { audienceIsComplete } from '../AudienceFields'
import { setEventAudience } from '@/modules/Calendar/services/api'
import { countAudience } from '../../services/audience'
import { EMPTY_AUDIENCE, FINAL_YEAR_BATCH } from '@/modules/Calendar/constants/tpo'
import type { Audience, TpoEvent } from '@/modules/Calendar/types/tpo'

interface AudienceDialogProps {
  /** The published event; the dialog is open while this is set. */
  event: TpoEvent | null
  onClose: () => void
  onSaved: (event: TpoEvent) => void
}

/**
 * "Who should see this?" for an event that is already published — opened from
 * its detail panel, when the audience was left empty on publish or needs to
 * change. Saving here is what notifies the students, which is why the button
 * says so and the count sits beside it.
 */
const AudienceDialog = ({ event, onClose, onSaved }: AudienceDialogProps) => {
  const [audience, setAudience] = useState<Audience>(EMPTY_AUDIENCE)
  const [isSaving, setIsSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    if (!event) return
    setAudience(event.draft.audience.courses.length ? event.draft.audience : { ...EMPTY_AUDIENCE, opportunityType: 'job' })
    setShowErrors(false)
  }, [event])

  const count = countAudience(audience)
  const isChange = Boolean(event?.draft.audience.courses.length)

  const fillDummy = () =>
    setAudience({
      opportunityType: 'job',
      courses: ['BTech'],
      batches: [FINAL_YEAR_BATCH],
      departments: ['Computer Science', 'Information Technology'],
    })

  const save = async () => {
    setShowErrors(true)
    if (!event) return
    if (!audienceIsComplete(audience)) return
    if (count === 0) {
      showError('0 students match this audience.')
      return
    }

    setIsSaving(true)
    try {
      const saved = await setEventAudience(event.id, audience)
      showSuccess(`Audience saved. ${saved.notifiedCount} students notified.`)
      onSaved(saved)
    } catch (error) {
      showError(messageOf(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {event && <div className="fixed inset-0 z-40 bg-black/50" aria-hidden />}
      <Dialog open={Boolean(event)} modal={false} onOpenChange={(next) => !next && !isSaving && onClose()}>
        <DialogContent
          className={modalContentClass('md')}
          onInteractOutside={(entry) => entry.preventDefault()}
        >
          <ModalHeader
            icon={<Users />}
            title="Who should see this?"
            description={event?.draft.title}
            actions={
              <Button type="button" variant="outline" size="sm" className="px-2 sm:px-3" onClick={fillDummy}>
                Fill Data
              </Button>
            }
          />

          <ModalBody>
            {event?.seriesId && (
              <p className="flex gap-2 rounded-lg border px-3 py-2 text-sm [color:var(--ds-color-text-secondary)]">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                This is a repeating event. The audience applies to this date and every later one.
              </p>
            )}

            <Section title="Target Audience">
              <AudienceFields value={audience} showErrors={showErrors} onChange={setAudience} />
            </Section>
          </ModalBody>

          <ModalFooter
            start={
            <span
              className={cn(
                'flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold sm:text-sm',
                count > 0 || !showErrors
                  ? '[color:var(--ds-color-brand)]'
                  : '[color:var(--ds-color-danger-text)]',
              )}
            >
              {count > 0
                ? `${count} students will be notified`
                : showErrors
                  ? '0 students match this audience'
                  : ''}
            </span>
            }
          >
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                {isChange ? 'Cancel' : 'Later'}
              </Button>
              <Button type="button" onClick={save} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save and notify'}
              </Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AudienceDialog
