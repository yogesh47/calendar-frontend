import { ListFilter } from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { CALENDAR_ITEM_STYLE, CANCELLED_STYLE } from '../../constants'
import type { CalendarItemKind } from '../../types'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import {
  BATCH_OPTIONS,
  COMPANY_OPTIONS,
  COURSE_OPTIONS,
  DEPARTMENT_OPTIONS,
  EMPTY_FILTERS,
  EVENT_TYPE_OPTIONS,
  OPPORTUNITY_OPTIONS,
} from '../../constants/tpo'
import type { CalendarFilters } from '../../types/tpo'

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
  filters.opportunityTypes.length +
  (filters.createdByMe ? 1 : 0)

const FilterBar = ({ filters, onChange }: FilterBarProps) => {
  const active = activeFilterCount(filters)

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {node}
    </div>
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={active ? 'secondary' : 'outline'} size="sm">
          <ListFilter className="size-3.5" />
          {active ? `Filter · ${active}` : 'Filter'}
        </Button>
      </PopoverTrigger>

      <PopoverContent hideWhenDetached collisionPadding={8} align="end" className="w-[min(22rem,calc(100vw-1.5rem))] space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Filters</p>
          <Button variant="link" className="text-sm" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}>
            Clear
          </Button>
        </div>

        {field(
          'Opportunity Type',
          <MultiSelect
            placeholder="Any opportunity"
            options={OPPORTUNITY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            value={filters.opportunityTypes}
            onChange={(opportunityTypes: string[]) => onChange({ ...filters, opportunityTypes })}
          />,
        )}

        {field(
          'Type',
          <MultiSelect
            placeholder="Any type"
            options={EVENT_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            value={filters.types}
            onChange={(types: string[]) => onChange({ ...filters, types })}
          />,
        )}

        {field(
          'Item',
          <MultiSelect
            placeholder="Any item"
            options={[
              ...(Object.keys(CALENDAR_ITEM_STYLE) as CalendarItemKind[]).map((kind) => ({
                value: kind as string,
                label: CALENDAR_ITEM_STYLE[kind].label,
              })),
              { value: 'cancelled', label: CANCELLED_STYLE.label },
            ]}
            value={filters.kinds}
            onChange={(kinds: string[]) => onChange({ ...filters, kinds })}
          />,
        )}

        {field(
          'Company',
          <MultiSelect
            placeholder="Any company"
            options={COMPANY_OPTIONS.map((company) => ({ value: company, label: company }))}
            value={filters.companies}
            onChange={(companies: string[]) => onChange({ ...filters, companies })}
          />,
        )}

        {field(
          'Course',
          <MultiSelect
            placeholder="Any course"
            options={COURSE_OPTIONS.map((course) => ({ value: course, label: course }))}
            value={filters.courses}
            onChange={(courses: string[]) => onChange({ ...filters, courses })}
          />,
        )}

        {field(
          'Batch',
          <MultiSelect
            placeholder="Any batch"
            options={BATCH_OPTIONS.map((option) => ({ value: String(option.year), label: option.label }))}
            value={filters.batches.map(String)}
            onChange={(batches: string[]) => onChange({ ...filters, batches: batches.map(Number) })}
          />,
        )}

        {field(
          'Department',
          <MultiSelect
            searchable
            placeholder="Any department"
            options={DEPARTMENT_OPTIONS.map((department) => ({ value: department, label: department }))}
            value={filters.departments}
            onChange={(departments: string[]) => onChange({ ...filters, departments })}
          />,
        )}

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="created-by-me"
            checked={filters.createdByMe}
            onCheckedChange={(checked) => onChange({ ...filters, createdByMe: checked === true })}
          />
          <Label htmlFor="created-by-me" className="cursor-pointer text-sm font-normal">
            Created by me
          </Label>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default FilterBar
