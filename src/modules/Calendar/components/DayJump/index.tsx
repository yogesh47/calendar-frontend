import { useEffect, useState } from 'react'
import { format, setMonth, setYear } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { cn } from '@/lib/utils'
import MiniCalendar from '../MiniCalendar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface DayJumpProps {
  date: string
  onDateChange: (date: string) => void
}

const DayJump = ({ date, onDateChange }: DayJumpProps) => {
  const day = new Date(`${date}T00:00:00`)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(day)

  useEffect(() => {
    if (open) setView(day)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date])

  const pick = (picked: Date) => {
    onDateChange(format(picked, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-sm font-semibold hover:[background-color:var(--ds-color-bg-muted)]"
        >
          {format(day, 'EEE, MMM d, yyyy')}
          <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>

      <PopoverContent hideWhenDetached collisionPadding={8}
        align="end"
        className="w-[32rem] p-3 [background-color:var(--ds-color-bg-surface)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid grid-cols-2 gap-4">
          <MiniCalendar
            className="border-0 p-0"
            month={view}
            selected={day}
            onMonthChange={setView}
            onPick={pick}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{format(view, 'yyyy')}</p>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Previous year"
                  onClick={() => setView(setYear(view, view.getFullYear() - 1))}
                  className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next year"
                  onClick={() => setView(setYear(view, view.getFullYear() + 1))}
                  className="grid size-6 cursor-pointer place-items-center rounded [color:var(--ds-color-text-secondary)] hover:[background-color:var(--ds-color-bg-muted)]"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => setView(setMonth(view, index))}
                  className={cn(
                    'cursor-pointer rounded px-2 py-1.5 text-sm',
                    view.getMonth() === index
                      ? '[background-color:var(--ds-color-brand)] font-semibold [color:var(--ds-color-brand-fg)]'
                      : 'hover:[background-color:var(--ds-color-bg-muted)]',
                  )}
                >
                  {month}
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-end">
              <Button variant="link" className="text-sm" onClick={() => pick(new Date())}>
                Today
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DayJump
