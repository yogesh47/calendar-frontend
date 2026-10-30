import type { Audience } from '@/modules/Calendar/types/tpo'

const groupSize = (course: string, batch: number, department: string): number => {
  const seed = [...`${course}${batch}${department}`].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  return 12 + (seed % 48)
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
