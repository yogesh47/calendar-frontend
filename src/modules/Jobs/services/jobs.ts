import type { CalendarItem } from '@/calendar'

export type CampusJob = {
  jobId: string
  title: string
  company: string
  jobType: string
  applicationEndDate: string
  departments: string[]
}

export const CAMPUS_JOBS: CampusJob[] = [
  {
    jobId: 'abf9d566-a7a3-4929-bb0e-fc645ff41550',
    title: 'Do Not Apply to this Job 4',
    company: '47 billion',
    jobType: 'Full-Time',
    applicationEndDate: '2031-09-26',
    departments: ['Civil Engineering', 'Computer Science', 'Electrical Engineering', 'Management', 'Pharmacy'],
  },
  {
    jobId: 'abf9d566-a7a3-4929-bb0e-fc635ff41550',
    title: 'Do Not Apply to this Job 2',
    company: '47 billion',
    jobType: 'Full-Time',
    applicationEndDate: '2031-09-26',
    departments: ['Civil Engineering', 'Computer Science', 'Electrical Engineering', 'Management', 'Pharmacy'],
  },
  {
    jobId: '75d14200-55e9-41ff-af7c-f67412f11b56',
    title: 'Electrical Engineer',
    company: 'Quantum Dynamics Inc.',
    jobType: 'Internship',
    applicationEndDate: '2027-05-19',
    departments: ['Civil Engineering', 'Computer Science', 'Electrical Engineering', 'Management', 'Pharmacy'],
  },
]

export type ExternalJob = {
  jobId: string
  title: string
  company: string
  jobType: string
  applyLink: string
}

export const EXTERNAL_JOBS: ExternalJob[] = [
  {
    jobId: '844d099e-d668-461d-80d9-0cd9b3a6bfbd',
    title: 'Business Development (Sales)',
    company: 'Zecoho Technologies Private Limited',
    jobType: 'Internship',
    applyLink:
      'https://internshala.com/internship/detail/business-development-sales-internship-in-indore-at-zecoho-technologies-private-limited1784104728',
  },
  {
    jobId: '71420370-2c7e-45be-9692-dccb3bf26f8c',
    title: 'Inside Sales',
    company: 'Tripocio Carnival Pvt Ltd',
    jobType: 'Internship',
    applyLink:
      'https://internshala.com/internship/detail/inside-sales-internship-in-indore-at-tripocio-carnival-pvt-ltd1783940917',
  },
  {
    jobId: '91a638d5-851e-473f-ba3a-3a9e3561ebbb',
    title: 'HR Recruitment & Coordination',
    company: 'Hirednex',
    jobType: 'Internship',
    applyLink:
      'https://internshala.com/internship/detail/hr-recruitment-coordination-internship-in-indore-at-hirednex1784101862',
  },
]

export const deadlineItems = (): CalendarItem[] =>
  CAMPUS_JOBS.map((job) => ({
    id: `deadline-${job.jobId}`,
    kind: 'deadline',
    title: `${job.company} ${job.title} — Applications close`,
    startsAt: new Date(`${job.applicationEndDate}T00:00:00`).toISOString(),
    isAllDay: true,
    status: 'active',
  }))
