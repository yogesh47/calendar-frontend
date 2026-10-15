import { EMPTY_DRAFT } from '../constants/tpo'
import type { EventDraft } from '../types/tpo'

export const newDraftOn = (eventDate: string): EventDraft => ({ ...EMPTY_DRAFT, eventDate, endDate: eventDate })
