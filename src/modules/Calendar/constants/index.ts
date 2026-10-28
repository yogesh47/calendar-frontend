import { CAMPUS_JOBS, EXTERNAL_JOBS } from '@/modules/Jobs/services/jobs'

// The companies the TPO works with — every company that has a job, campus or external.
export const COMPANY_OPTIONS = [...new Set([...CAMPUS_JOBS, ...EXTERNAL_JOBS].map((job) => job.company))]
