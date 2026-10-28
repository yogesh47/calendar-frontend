import type { ItemStatus } from '../../../../types'

export const STATUS_BADGE: Partial<Record<ItemStatus, string>> = {
  updated: 'Updated',
  cancelled: 'Cancelled',
  not_applicable: 'No longer applicable',
  past: 'Past',
}
