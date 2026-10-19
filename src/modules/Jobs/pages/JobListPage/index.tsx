import { CAMPUS_JOBS } from '@/modules/Calendar/services/jobs'

const JobListPage = () => (
  <div className="flex w-full flex-col gap-4 p-3 sm:p-6">
    <div>
      <h1 className="text-xl font-semibold">Job Listings</h1>
      <p className="text-sm [color:var(--ds-color-text-secondary)]">Campus jobs posted for your college</p>
    </div>

    <div className="overflow-x-auto rounded-xl border [background-color:var(--ds-color-bg-surface)]">
      <table className="w-full min-w-[38rem] text-sm">
        <thead className="[background-color:var(--ds-color-bg-subtle)]">
          <tr>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold sm:px-4">Job</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold sm:px-4">Company</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold sm:px-4">Type</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold sm:px-4">Applications close</th>
          </tr>
        </thead>
        <tbody>
          {CAMPUS_JOBS.map((job) => (
            <tr key={job.jobId} className="border-t">
              <td className="px-3 py-2.5 sm:px-4 font-medium">{job.title}</td>
              <td className="px-3 py-2.5 sm:px-4">{job.company}</td>
              <td className="px-3 py-2.5 sm:px-4">{job.jobType}</td>
              <td className="px-3 py-2.5 sm:px-4">{job.applicationEndDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default JobListPage
