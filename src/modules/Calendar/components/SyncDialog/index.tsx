import { useEffect, useState } from 'react'
import { Copy, ExternalLink, Lock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { messageOf, showError, showSuccess } from '@/lib/toast'
import { InfoNote } from '../parts'
import { fetchFeedLink } from '../../services/api'

interface SyncDialogProps {
  open: boolean
  onClose: () => void
}

const CALENDAR_NAME = 'Campus Calendar'

/*
  Google / Outlook / Apple Calendar subscribe to the same .ics URL and re-read it
  on their own (Google takes a few hours, the others about an hour). It is
  one-way on purpose: events are made here and flow out, so nothing edited in
  another app can quietly change what students were sent.
*/
const providers = (url: string) => {
  const webcal = url.replace(/^https?:\/\//, 'webcal://')

  return [
    { label: 'Google Calendar', href: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}` },
    {
      label: 'Outlook',
      href: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(url)}&name=${encodeURIComponent(CALENDAR_NAME)}`,
    },
    { label: 'Apple Calendar', href: webcal },
  ]
}

const SyncDialog = ({ open, onClose }: SyncDialogProps) => {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!open || url) return
    fetchFeedLink()
      .then(setUrl)
      .catch((error) => showError(messageOf(error)))
  }, [open, url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Calendar link copied.')
    } catch {
      showError('Could not copy. Select the link and copy it by hand.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[min(32rem,94vw)] max-w-none [background-color:var(--ds-color-bg-surface)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-4" />
            Sync with your calendar
          </DialogTitle>
          <DialogDescription>
            See campus events in Google, Outlook or Apple Calendar. Changes and cancellations follow automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {providers(url).map((provider) => (
              <Button key={provider.label} asChild={Boolean(url)} variant="outline" size="sm" disabled={!url}>
                {url ? (
                  <a href={provider.href} target="_blank" rel="noreferrer">
                    {provider.label}
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <span>{provider.label}</span>
                )}
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input label="Or paste this link into any calendar app" value={url} placeholder="Loading…" readOnly />
            </div>
            <Button type="button" variant="outline" iconOnly aria-label="Copy link" disabled={!url} onClick={copy}>
              <Copy className="size-4" />
            </Button>
          </div>

          <InfoNote icon={<Lock className="mt-0.5 size-3.5 shrink-0" />}>
            This link is personal — anyone with it can read your calendar. It is read-only: edits made in another app
            do not come back here.
          </InfoNote>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SyncDialog
