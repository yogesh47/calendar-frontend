import { BATCH_OPTIONS, FINAL_YEAR_BATCH, PRE_FINAL_BATCH } from '@/modules/Calendar/constants/tpo'
import type { OpportunityType } from '@/modules/Calendar/types/tpo'

// Which batches an opportunity is open to: a job to the final year, an internship to the last two.
export const batchesFor = (opportunityType: OpportunityType): number[] => {
  if (opportunityType === 'job') return [FINAL_YEAR_BATCH]
  if (opportunityType === 'internship') return [PRE_FINAL_BATCH, FINAL_YEAR_BATCH]
  return BATCH_OPTIONS.map((option) => option.year)
}
