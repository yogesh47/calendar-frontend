import { Trash2 } from '../../../../icons'
import { Button } from '../../../../shared/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../shared/ui/Dialog'
import { useLabels } from '../../../../labels'

interface ConfirmDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  onBack: () => void
  onConfirm: () => void
  /** A second way to confirm — e.g. "This and later" for something that repeats. */
  alternateLabel?: string
  onAlternate?: () => void
}

const ConfirmDialog = ({ open, title, confirmLabel, onBack, onConfirm, alternateLabel, onAlternate }: ConfirmDialogProps) => {
  const labels = useLabels()

  return (
  <Dialog open={open} onOpenChange={(next) => !next && onBack()}>
    <DialogContent className="sm:max-w-[24rem] [background-color:var(--ds-color-bg-surface)]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          {labels.confirmDialog.goBack}
        </Button>
        {alternateLabel && onAlternate && (
          <Button variant="outline" onClick={onAlternate}>
            {alternateLabel}
          </Button>
        )}
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel.toLowerCase().includes('delete') && <Trash2 className="size-4" />}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}

export default ConfirmDialog
