import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { Label } from '@/components/ui/Label'
import { EVENT_TYPE_OPTIONS, BATCH_OPTIONS, COMPANY_OPTIONS, COURSE_OPTIONS, DEPARTMENT_OPTIONS, EMPTY_FILTERS } from '../../constants/tpo'
import { CALENDAR_ITEM_STYLE } from '../../constants'
import type { CalendarFilters } from '../../types/tpo'
import type { CalendarItemKind } from '../../types'

interface FilterBarProps {
  filters: CalendarFilters
  onChange: (filters: CalendarFilters) => void
}

export const activeFilterCount = (filters: CalendarFilters): number =>
  filters.types.length +
  filters.courses.length +
  filters.batches.length +
  filters.departments.length +
  filters.kinds.length +
  filters.companies.length +
  (filters.createdByMe ? 1 : 0)

const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  const active = activeFilterCount(filters)

  return (
    <section className="flex flex-col gap-2.5 rounded-xl border p-3.5 [background-color:var(--ds-color-bg-surface)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Filters</p>
        <div className="flex items-center gap-[0.75rem]">
          <span className="text-sm [color:var(--ds-color-text-secondary)]">{active} active</span>
          <Button variant="ghost" size="sm" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <MultiSelect
          placeholder="Type"
          options={EVENT_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          value={filters.types}
          onChange={(types: string[]) => onChange({ ...filters, types })}
        />
        <MultiSelect
          placeholder="Course"
          options={COURSE_OPTIONS.map((course) => ({ value: course, label: course }))}
          value={filters.courses}
          onChange={(courses: string[]) => onChange({ ...filters, courses })}
        />
        <MultiSelect
          placeholder="Batch"
          options={BATCH_OPTIONS.map((option) => ({ value: String(option.year), label: option.label }))}
          value={filters.batches.map(String)}
          onChange={(batches: string[]) => onChange({ ...filters, batches: batches.map(Number) })}
        />
        <MultiSelect
          placeholder="Dept"
          options={DEPARTMENT_OPTIONS.map((department) => ({ value: department, label: department }))}
          value={filters.departments}
          onChange={(departments: string[]) => onChange({ ...filters, departments })}
        />
        <MultiSelect
          placeholder="Event"
          options={(Object.keys(CALENDAR_ITEM_STYLE) as CalendarItemKind[]).map((kind) => ({
            value: kind,
            label: CALENDAR_ITEM_STYLE[kind].label,
          }))}
          value={filters.kinds}
          onChange={(kinds: string[]) => onChange({ ...filters, kinds })}
        />
        <MultiSelect
          placeholder="Company"
          options={COMPANY_OPTIONS.map((company) => ({ value: company, label: company }))}
          value={filters.companies}
          onChange={(companies: string[]) => onChange({ ...filters, companies })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="created-by-me"
          checked={filters.createdByMe}
          onCheckedChange={(checked) => onChange({ ...filters, createdByMe: checked === true })}
        />
        <Label htmlFor="created-by-me" className="cursor-pointer text-sm font-normal">
          Created by me
        </Label>
      </div>
    </section>
  )
}

export default FilterBar
