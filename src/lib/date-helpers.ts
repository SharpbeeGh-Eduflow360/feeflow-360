export function rangesOverlap(
  startA: string | null,
  endA: string | null,
  startB: string | null,
  endB: string | null
): boolean {
  // If either range is missing a date, we can't safely detect overlap
  if (!startA || !endA || !startB || !endB) return false

  return startA <= endB && startB <= endA
}

export type PeriodStatus = 'upcoming' | 'current' | 'passed' | 'unknown'

export function getPeriodStatus(
  startDate: string | null,
  endDate: string | null
): PeriodStatus {
  if (!startDate || !endDate) return 'unknown'

  const today = new Date().toISOString().split('T')[0]

  if (today < startDate) return 'upcoming'
  if (today > endDate) return 'passed'
  return 'current'
}

export function isWithinRange(
  innerStart: string | null,
  innerEnd: string | null,
  outerStart: string | null,
  outerEnd: string | null
): { valid: boolean; reason?: string } {
  if (!outerStart || !outerEnd) return { valid: true }
  if (!innerStart || !innerEnd) return { valid: true }

  if (innerStart < outerStart || innerStart > outerEnd) {
    return { valid: false, reason: 'The term start date must fall within the academic year\'s dates.' }
  }

  if (innerEnd < outerStart || innerEnd > outerEnd) {
    return { valid: false, reason: 'The term end date must fall within the academic year\'s dates.' }
  }

  return { valid: true }
}

export function isPastEndDate(endDate: string | null): boolean {
  if (!endDate) return false
  const today = new Date().toISOString().split('T')[0]
  return today > endDate
}