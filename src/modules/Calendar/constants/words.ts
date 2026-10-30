import { mergeLabels } from '@/calendar'
import { CALENDAR_LABELS, MODAL_LABELS } from './labels'

/*
  Every word this portal's calendar modals use: the calendar's own (toolbar,
  day jump…) with this portal's over them, and the modals' own words.
*/
const WORDS = { ...mergeLabels(CALENDAR_LABELS), ...MODAL_LABELS }

export const useLabels = () => WORDS
