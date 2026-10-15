import { EMPTY_DRAFT } from '../constants/tpo'
import type { EventDraft, TpoEvent } from '../types/tpo'

const at = (dayOffset: number): string => {
  const day = new Date()
  day.setDate(day.getDate() + dayOffset)
  return day.toISOString().slice(0, 10)
}

export const MOCK_TPO_EVENTS: TpoEvent[] = [
  {
    id: 't1',
    createdBy: 'me',
    createdByName: 'you',
    createdAt: new Date().toISOString(),
    notifiedCount: 142,
    draft: {
      ...EMPTY_DRAFT,
      eventType: 'ppt',
      title: 'Deloitte Pre-Placement Talk',
      company: 'Deloitte',
      eventDate: at(2),
      startTime: '10:00',
      endTime: '11:30',
      mode: 'offline',
      venue: 'Auditorium, Block A',
      description: 'Bring your resume and ID card.',
      audience: { opportunityType: 'job', courses: ['BTech'], batches: [2027], departments: ['Computer Science', 'Information Technology'] },
    },
  },
  {
    id: 't2',
    createdBy: 'ravi',
    createdByName: 'Ravi Sharma',
    createdAt: new Date().toISOString(),
    notifiedCount: 96,
    draft: {
      ...EMPTY_DRAFT,
      eventType: 'online_assessment',
      title: 'TCS NQT Online Assessment',
      company: 'TCS',
      eventDate: at(4),
      startTime: '10:00',
      endTime: '18:00',
      audience: { opportunityType: 'job', courses: ['BTech', 'MCA'], batches: [2027], departments: ['Computer Science'] },
    },
  },
  {
    id: 't3',
    createdBy: 'me',
    createdByName: 'you',
    createdAt: new Date().toISOString(),
    notifiedCount: 0,
    draft: {
      ...EMPTY_DRAFT,
      eventType: 'my_reminder',
      title: 'Call TCS HR for results',
      eventDate: at(1),
      startTime: '15:00',
      note: 'Ask about the shortlist date',
    },
  },
]

export const newDraftOn = (eventDate: string): EventDraft => ({ ...EMPTY_DRAFT, eventDate })
