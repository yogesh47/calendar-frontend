import { CAMPUS_JOBS } from '@/modules/Calendar/services/jobs'

const JobListPage = () => (
  <div className="flex w-full flex-col gap-4 p-6">
    <div>
      <h1 className="text-xl font-semibold">Job Listings</h1>
      <p className="text-sm [color:var(--ds-color-text-secondary)]">Campus jobs posted for your college</p>
    </div>

    <div className="overflow-hidden rounded-xl border [background-color:var(--ds-color-bg-surface)]">
      <table className="w-full text-sm">
        <thead className="[background-color:var(--ds-color-bg-subtle)]">
          <tr>
            <th className="px-4 py-2.5 text-left font-semibold">Job</th>
            <th className="px-4 py-2.5 text-left font-semibold">Company</th>
            <th className="px-4 py-2.5 text-left font-semibold">Type</th>
            <th className="px-4 py-2.5 text-left font-semibold">Applications close</th>
          </tr>
        </thead>
        <tbody>
          {CAMPUS_JOBS.map((job) => (
            <tr key={job.jobId} className="border-t">
              <td className="px-4 py-2.5 font-medium">{job.title}</td>
              <td className="px-4 py-2.5">{job.company}</td>
              <td className="px-4 py-2.5">{job.jobType}</td>
              <td className="px-4 py-2.5">{job.applicationEndDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default JobListPage
