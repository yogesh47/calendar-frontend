import * as yup from 'yup'
import { CAMPUS_JOBS } from '@/modules/Jobs/services/jobs'
import type { CampusJob } from '@/modules/Jobs/services/jobs'

export const jobLabel = (job: CampusJob): string => `${job.company} — ${job.title}`

export const CAMPUS_JOB_OPTIONS = CAMPUS_JOBS.map(jobLabel)

export const linkedJobSchema = yup.object({
  kind: yup.string().oneOf(['campus', 'external']).required(),
  campusJob: yup.string().test('campus-needed', 'Pick a campus job', function (value) {
    return this.parent.kind !== 'campus' || Boolean(value)
  }),
  url: yup
    .string()
    .test('url-needed', 'Enter a valid link starting with https://', function (value) {
      if (this.parent.kind !== 'external') return true
      return Boolean(value) && String(value).startsWith("https://")
    }),
  title: yup.string().test('title-needed', 'Job title is required for a pasted link', function (value) {
    return this.parent.kind !== 'external' || Boolean(value?.trim())
  }),
})
