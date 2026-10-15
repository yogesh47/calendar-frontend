import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { groupLabel } from '../../services/audience'
import type { AudienceDiff } from '../../types/tpo'

interface ReviewChangesDialogProps {
  open: boolean
  changed: string
  diff: AudienceDiff
  notifyCount: number
  onBack: () => void
  onSave: (reason: string) => void
}

const Row = ({ label, groups, students }: { label: string; groups: string[]; students: number }) => {
  if (!groups.length) return null

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="w-20 shrink-0 font-semibold">{label}</span>
      <span className="flex-1 [color:var(--ds-color-text-secondary)]">
        {[...new Set(groups.map(groupLabel))].join(', ')}
      </span>
      <span className="font-semibold">{students}</span>
    </div>
  )
}

const ReviewChangesDialog = ({ open, changed, diff, notifyCount, onBack, onSave }: ReviewChangesDialogProps) => {
  const [reason, setReason] = useState('')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onBack()}>
      <DialogContent className="sm:max-w-[30rem] [background-color:var(--ds-color-bg-surface)]">
        <DialogHeader>
          <DialogTitle>Review changes before saving</DialogTitle>
          <DialogDescription className="sr-only">Audience changes before saving</DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          {changed && (
            <p className="text-sm">
              <span className="font-semibold">Changed: </span>
              {changed}
            </p>
          )}

          <div className="space-y-2 rounded-md border p-3">
            <Row label="Updated" groups={diff.keptGroups} students={diff.kept} />
            <Row label="Added" groups={diff.addedGroups} students={diff.added} />
            <Row label="Removed" groups={diff.removedGroups} students={diff.removed} />
          </div>

          <Input
            label="Reason for change (optional, sent to students)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
          <Button onClick={() => onSave(reason)}>Save &amp; Notify {notifyCount}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReviewChangesDialog
