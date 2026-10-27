import { Label } from '@/components/ui/Label'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Required } from '../parts'
import { batchesFor } from '../../services/audience'
import { BATCH_OPTIONS, COURSE_OPTIONS, DEPARTMENT_OPTIONS, OPPORTUNITY_OPTIONS } from '../../constants/tpo'
import type { Audience, OpportunityType } from '../../types/tpo'

type AudienceList = 'courses' | 'batches' | 'departments'

interface AudienceFieldsProps {
  value: Audience
  showErrors: boolean
  onChange: (value: Audience) => void
  /** Keeps radio ids unique when two forms are on screen. */
  idPrefix?: string
}

export const audienceIsComplete = (audience: Audience): boolean =>
  Boolean(audience.courses.length && audience.batches.length && audience.departments.length)

export const audienceIsEmpty = (audience: Audience): boolean =>
  !audience.courses.length && !audience.batches.length && !audience.departments.length

/** Opportunity type, course, batch and department — the "who sees this" form. */
const AudienceFields = ({ value, showErrors, onChange, idPrefix = 'audience' }: AudienceFieldsProps) => {
  const batchOptions = BATCH_OPTIONS.filter((option) => batchesFor(value.opportunityType).includes(option.year))

  const pickOpportunity = (opportunityType: OpportunityType) => {
    const allowed = batchesFor(opportunityType)
    onChange({ ...value, opportunityType, batches: value.batches.filter((batch) => allowed.includes(batch)) })
  }

  const errorFor = (field: AudienceList): string | undefined =>
    showErrors && !value[field].length ? `Select at least one ${field.slice(0, -1)}.` : undefined

  const error = (field: AudienceList) =>
    errorFor(field) && <p className="text-xs [color:var(--ds-color-danger-text)]">{errorFor(field)}</p>

  return (
    <>
      <div className="space-y-1.5">
        <Label>
          Opportunity Type <Required />
        </Label>
        <RadioGroup
          className="flex flex-row flex-wrap gap-4 sm:gap-5"
          value={value.opportunityType}
          onValueChange={(next) => pickOpportunity(next as OpportunityType)}
        >
          {OPPORTUNITY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`${idPrefix}-opportunity-${option.value}`} />
              <Label htmlFor={`${idPrefix}-opportunity-${option.value}`} className="cursor-pointer font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-1.5">
        <Label>
          Course <Required />
        </Label>
        <MultiSelect
          placeholder="Select courses"
          options={COURSE_OPTIONS.map((course) => ({ value: course, label: course }))}
          value={value.courses}
          onChange={(courses) => onChange({ ...value, courses })}
        />
        {error('courses')}
      </div>

      <div className="space-y-1.5">
        <Label>
          Batch <Required />
        </Label>
        <MultiSelect
          placeholder="Select batches"
          options={batchOptions.map((option) => ({ value: String(option.year), label: option.label }))}
          value={value.batches.map(String)}
          onChange={(batches) => onChange({ ...value, batches: batches.map(Number) })}
        />
        {error('batches')}
      </div>

      <div className="space-y-1.5">
        <Label>
          Department <Required />
        </Label>
        <MultiSelect
          searchable
          placeholder="Select departments"
          options={DEPARTMENT_OPTIONS.map((department) => ({ value: department, label: department }))}
          value={value.departments}
          onChange={(departments) => onChange({ ...value, departments })}
        />
        {error('departments')}
      </div>
    </>
  )
}

export default AudienceFields
