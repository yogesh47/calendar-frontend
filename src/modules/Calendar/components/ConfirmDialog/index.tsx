import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  onBack: () => void
  onConfirm: () => void
}

const ConfirmDialog = ({ open, title, confirmLabel, onBack, onConfirm }: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onBack()}>
    <DialogContent className="sm:max-w-[24rem] [background-color:var(--ds-color-bg-surface)]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          Go Back
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default ConfirmDialog
