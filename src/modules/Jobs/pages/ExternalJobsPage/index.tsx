import { ExternalLink } from 'lucide-react'
import { EXTERNAL_JOBS } from '@/modules/Calendar/services/jobs'

const ExternalJobsPage = () => (
  <div className="flex w-full flex-col gap-4 p-6">
    <div>
      <h1 className="text-xl font-semibold">External Jobs</h1>
      <p className="text-sm [color:var(--ds-color-text-secondary)]">Off-campus openings students can apply to</p>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {EXTERNAL_JOBS.map((job) => (
        <article key={job.jobId} className="rounded-xl border p-4 [background-color:var(--ds-color-bg-surface)]">
          <p className="text-sm font-semibold">{job.title}</p>
          <p className="text-sm [color:var(--ds-color-text-secondary)]">
            {job.company} · {job.jobType}
          </p>
          <a
            href={job.applyLink}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline [color:var(--ds-color-text-link)]"
          >
            Apply on the company site
            <ExternalLink className="size-3.5" />
          </a>
        </article>
      ))}
    </div>
  </div>
)

export default ExternalJobsPage
