import { BATCH_OPTIONS, FINAL_YEAR_BATCH, PRE_FINAL_BATCH } from '../constants/tpo'
import type { Audience, AudienceDiff, OpportunityType } from '../types/tpo'

const groupSize = (course: string, batch: number, department: string): number => {
  const seed = [...`${course}${batch}${department}`].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  return 12 + (seed % 48)
}

export const batchesFor = (opportunityType: OpportunityType): number[] => {
  if (opportunityType === 'job') return [FINAL_YEAR_BATCH]
  if (opportunityType === 'internship') return [PRE_FINAL_BATCH, FINAL_YEAR_BATCH]
  return BATCH_OPTIONS.map((option) => option.year)
}

export const groupsIn = (audience: Audience): string[] => {
  const groups: string[] = []
  audience.courses.forEach((course) => {
    audience.batches.forEach((batch) => {
      audience.departments.forEach((department) => {
        groups.push(`${course}|${batch}|${department}`)
      })
    })
  })
  return groups
}

export const studentsIn = (groups: string[]): number =>
  groups.reduce((total, group) => {
    const [course, batch, department] = group.split('|')
    return total + groupSize(course, Number(batch), department)
  }, 0)

export const countAudience = (audience: Audience): number => studentsIn(groupsIn(audience))

export const groupLabel = (group: string): string => {
  const [course, , department] = group.split('|')
  return `${course} → ${department}`
}

export const diffAudience = (before: Audience, after: Audience): AudienceDiff => {
  const old = groupsIn(before)
  const next = groupsIn(after)
  const keptGroups = next.filter((group) => old.includes(group))
  const addedGroups = next.filter((group) => !old.includes(group))
  const removedGroups = old.filter((group) => !next.includes(group))

  return {
    kept: studentsIn(keptGroups),
    added: studentsIn(addedGroups),
    removed: studentsIn(removedGroups),
    keptGroups,
    addedGroups,
    removedGroups,
  }
}
