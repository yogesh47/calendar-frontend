import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { ModalFooter, ModalHeader, modalContentClass } from '@/modules/Calendar/components/Modal'
import { useLabels } from '../../constants/words'

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
    {/* A question and its answers only — the frame's header and footer, no body. */}
    <DialogContent className={modalContentClass('sm')}>
      <ModalHeader icon={<Trash2 />} tone="danger" title={title} />

      <ModalFooter>
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
      </ModalFooter>
    </DialogContent>
  </Dialog>
  )
}

export default ConfirmDialog
