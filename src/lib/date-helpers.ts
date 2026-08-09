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
  // If the outer range (academic year) has no dates set, we can't validate against it
  if (!outerStart || !outerEnd) return { valid: true }

  // If the inner range (term) has no dates, nothing to validate yet
  if (!innerStart || !innerEnd) return { valid: true }

  if (innerStart < outerStart || innerStart > outerEnd) {
    return { valid: false, reason: 'The term start date must fall within the academic year\'s dates.' }
  }

  if (innerEnd < outerStart || innerEnd > outerEnd) {
    return { valid: false, reason: 'The term end date must fall within the academic year\'s dates.' }
  }

  return { valid: true }
}