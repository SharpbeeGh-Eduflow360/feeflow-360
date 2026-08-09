import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { rangesOverlap, getPeriodStatus, isWithinRange } from '@/lib/date-helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Pencil, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface AcademicYear {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: string
}

interface Term {
  id: string
  name: string
  academic_year_id: string
  position: number
  start_date: string | null
  end_date: string | null
}

const statusStyles: Record<string, string> = {
  current: 'bg-brand-gold/10 text-brand-gold',
  upcoming: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  passed: 'bg-muted text-muted-foreground',
  unknown: 'bg-muted text-muted-foreground',
}

const statusLabels: Record<string, string> = {
  current: 'In progress',
  upcoming: 'Upcoming',
  passed: 'Passed',
  unknown: 'No dates set',
}

function StatusBadge({ start, end }: { start: string | null; end: string | null }) {
  const status = getPeriodStatus(start, end)
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

export function AcademicYearsView() {
  const { school, refetch: refetchSchool } = useSchool()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [currentYearId, setCurrentYearId] = useState<string | null>(null)
  const [currentTermId, setCurrentTermId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showYearForm, setShowYearForm] = useState(false)
  const [newYearName, setNewYearName] = useState('')
  const [newYearStart, setNewYearStart] = useState('')
  const [newYearEnd, setNewYearEnd] = useState('')

  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [newTermName, setNewTermName] = useState('')
  const [newTermStart, setNewTermStart] = useState('')
  const [newTermEnd, setNewTermEnd] = useState('')

  const [editingYearId, setEditingYearId] = useState<string | null>(null)
  const [editYearName, setEditYearName] = useState('')
  const [editYearStart, setEditYearStart] = useState('')
  const [editYearEnd, setEditYearEnd] = useState('')

  const [editingTermId, setEditingTermId] = useState<string | null>(null)
  const [editTermName, setEditTermName] = useState('')
  const [editTermStart, setEditTermStart] = useState('')
  const [editTermEnd, setEditTermEnd] = useState('')

  async function loadData() {
    if (!school) return
    setLoading(true)

    const [yearsRes, termsRes, schoolRes] = await Promise.all([
      supabase.from('academic_years').select('id, name, start_date, end_date, status').order('start_date', { ascending: false, nullsFirst: false }),
      supabase.from('terms').select('id, name, academic_year_id, position, start_date, end_date').order('position'),
      supabase.from('schools').select('current_academic_year_id, current_term_id').eq('id', school.id).single(),
    ])

    if (yearsRes.data) setYears(yearsRes.data)
    if (termsRes.data) setTerms(termsRes.data)
    if (schoolRes.data) {
      setCurrentYearId(schoolRes.data.current_academic_year_id)
      setCurrentTermId(schoolRes.data.current_term_id)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [school])

  async function handleAddYear() {
    if (!school || !newYearName.trim()) return
    setError(null)

    if (newYearStart && newYearEnd) {
      const overlap = years.some((y) =>
        rangesOverlap(newYearStart, newYearEnd, y.start_date, y.end_date)
      )
      if (overlap) {
        setError('This date range overlaps with an existing academic year.')
        return
      }
    }

    const { error: insertError } = await supabase.from('academic_years').insert({
      school_id: school.id,
      name: newYearName.trim(),
      start_date: newYearStart || null,
      end_date: newYearEnd || null,
      status: 'active',
    })

    if (insertError) return setError(insertError.message)
    setNewYearName('')
    setNewYearStart('')
    setNewYearEnd('')
    setShowYearForm(false)
    loadData()
  }

  async function handleUpdateYear(id: string) {
    if (!editYearName.trim()) return
    setError(null)

    if (editYearStart && editYearEnd) {
      const overlap = years.some(
        (y) => y.id !== id && rangesOverlap(editYearStart, editYearEnd, y.start_date, y.end_date)
      )
      if (overlap) {
        setError('This date range overlaps with an existing academic year.')
        return
      }
    }

    const { error: updateError } = await supabase
      .from('academic_years')
      .update({
        name: editYearName.trim(),
        start_date: editYearStart || null,
        end_date: editYearEnd || null,
      })
      .eq('id', id)

    if (updateError) return setError(updateError.message)
    setEditingYearId(null)
    loadData()
  }

  async function handleDeleteYear(id: string) {
    setError(null)
    const { error: deleteError } = await supabase.from('academic_years').delete().eq('id', id)
    if (deleteError) return setError(deleteError.message)
    loadData()
  }

  async function handleSetCurrentYear(id: string) {
    if (!school) return
    setError(null)

    const { error: updateError } = await supabase
      .from('schools')
      .update({ current_academic_year_id: id, current_term_id: null })
      .eq('id', school.id)

    if (updateError) return setError(updateError.message)
    refetchSchool()
    loadData()
  }

  async function handleAddTerm(academicYearId: string) {
    if (!school || !newTermName.trim()) return
    setError(null)

    const parentYear = years.find((y) => y.id === academicYearId)

    if (newTermStart && newTermEnd) {
      const withinRange = isWithinRange(
        newTermStart,
        newTermEnd,
        parentYear?.start_date ?? null,
        parentYear?.end_date ?? null
      )
      if (!withinRange.valid) {
        setError(withinRange.reason ?? 'Term dates must fall within the academic year.')
        return
      }

      const siblingTerms = terms.filter((t) => t.academic_year_id === academicYearId)
      const overlap = siblingTerms.some((t) =>
        rangesOverlap(newTermStart, newTermEnd, t.start_date, t.end_date)
      )
      if (overlap) {
        setError('This date range overlaps with an existing term in this academic year.')
        return
      }
    }

    const count = terms.filter((t) => t.academic_year_id === academicYearId).length

    const { error: insertError } = await supabase.from('terms').insert({
      school_id: school.id,
      academic_year_id: academicYearId,
      name: newTermName.trim(),
      start_date: newTermStart || null,
      end_date: newTermEnd || null,
      position: count + 1,
    })

    if (insertError) return setError(insertError.message)
    setNewTermName('')
    setNewTermStart('')
    setNewTermEnd('')
    loadData()
  }

  async function handleUpdateTerm(id: string, academicYearId: string) {
    if (!editTermName.trim()) return
    setError(null)

    const parentYear = years.find((y) => y.id === academicYearId)

    if (editTermStart && editTermEnd) {
      const withinRange = isWithinRange(
        editTermStart,
        editTermEnd,
        parentYear?.start_date ?? null,
        parentYear?.end_date ?? null
      )
      if (!withinRange.valid) {
        setError(withinRange.reason ?? 'Term dates must fall within the academic year.')
        return
      }

      const siblingTerms = terms.filter((t) => t.academic_year_id === academicYearId && t.id !== id)
      const overlap = siblingTerms.some((t) =>
        rangesOverlap(editTermStart, editTermEnd, t.start_date, t.end_date)
      )
      if (overlap) {
        setError('This date range overlaps with an existing term in this academic year.')
        return
      }
    }

    const { error: updateError } = await supabase
      .from('terms')
      .update({
        name: editTermName.trim(),
        start_date: editTermStart || null,
        end_date: editTermEnd || null,
      })
      .eq('id', id)

    if (updateError) return setError(updateError.message)
    setEditingTermId(null)
    loadData()
  }

  async function handleDeleteTerm(id: string) {
    setError(null)
    const { error: deleteError } = await supabase.from('terms').delete().eq('id', id)
    if (deleteError) return setError(deleteError.message)
    loadData()
  }

  async function handleSetCurrentTerm(id: string) {
    if (!school) return
    setError(null)

    const { error: updateError } = await supabase
      .from('schools')
      .update({ current_term_id: id })
      .eq('id', school.id)

    if (updateError) return setError(updateError.message)
    refetchSchool()
    loadData()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Academic Years</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage academic years, terms, and which are currently active.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowYearForm((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" />
            Add year
          </Button>
        </div>

        {showYearForm && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border p-3">
            <div>
              <Label className="text-xs">Academic year name</Label>
              <Input
                placeholder="e.g. 2027/2028"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start date</Label>
                <Input
                  type="date"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End date</Label>
                <Input
                  type="date"
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="button" size="sm" onClick={handleAddYear} className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light">
              Add year
            </Button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-col gap-3">
          {years.map((year) => {
            const yearTerms = terms.filter((t) => t.academic_year_id === year.id)
            const isExpanded = expandedYear === year.id
            const isCurrentYear = currentYearId === year.id
            const isEditing = editingYearId === year.id

            return (
              <div key={year.id} className={`rounded-lg border ${isCurrentYear ? 'border-brand-gold' : ''}`}>
                <div className="flex items-center justify-between p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedYear(isExpanded ? null : year.id)}
                    className="flex flex-1 items-center gap-2 text-sm font-medium"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {year.name}
                    {isCurrentYear && (
                      <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs font-medium text-brand-gold">
                        Current
                      </span>
                    )}
                    <StatusBadge start={year.start_date} end={year.end_date} />
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingYearId(year.id)
                        setEditYearName(year.name)
                        setEditYearStart(year.start_date ?? '')
                        setEditYearEnd(year.end_date ?? '')
                        setExpandedYear(year.id)
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteYear(year.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-3">
                    {isEditing && (
                      <div className="mb-4 flex flex-col gap-3 rounded-lg bg-muted/30 p-3">
                        <Input
                          value={editYearName}
                          onChange={(e) => setEditYearName(e.target.value)}
                          placeholder="Year name"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={editYearStart}
                            onChange={(e) => setEditYearStart(e.target.value)}
                          />
                          <Input
                            type="date"
                            value={editYearEnd}
                            onChange={(e) => setEditYearEnd(e.target.value)}
                          />
                        </div>
                        <Button size="sm" onClick={() => handleUpdateYear(year.id)} className="w-fit">
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Save changes
                        </Button>
                      </div>
                    )}

                    {!isCurrentYear && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetCurrentYear(year.id)}
                        className="mb-3"
                      >
                        Set as current year
                      </Button>
                    )}

                    <div className="flex flex-col gap-2">
                      {yearTerms.map((term) => {
                        const isCurrentTerm = currentTermId === term.id
                        const isEditingTerm = editingTermId === term.id

                        return (
                          <div
                            key={term.id}
                            className={`rounded-md px-3 py-2 text-sm ${
                              isCurrentTerm ? 'bg-brand-gold/10' : 'bg-muted/50'
                            }`}
                          >
                            {isEditingTerm ? (
                              <div className="flex flex-col gap-2">
                                <Input
                                  value={editTermName}
                                  onChange={(e) => setEditTermName(e.target.value)}
                                  className="h-8"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="date"
                                    value={editTermStart}
                                    onChange={(e) => setEditTermStart(e.target.value)}
                                    className="h-8"
                                  />
                                  <Input
                                    type="date"
                                    value={editTermEnd}
                                    onChange={(e) => setEditTermEnd(e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <Button size="sm" onClick={() => handleUpdateTerm(term.id, year.id)} className="w-fit">
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{term.name}</span>
                                  {isCurrentTerm && (
                                    <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-xs font-medium text-brand-gold">
                                      Current
                                    </span>
                                  )}
                                  <StatusBadge start={term.start_date} end={term.end_date} />
                                </div>
                                <div className="flex items-center gap-3">
                                  {isCurrentYear && !isCurrentTerm && (
                                    <button
                                      onClick={() => handleSetCurrentTerm(term.id)}
                                      className="text-xs font-medium text-brand-gold hover:underline"
                                    >
                                      Set current
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingTermId(term.id)
                                      setEditTermName(term.name)
                                      setEditTermStart(term.start_date ?? '')
                                      setEditTermEnd(term.end_date ?? '')
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => handleDeleteTerm(term.id)} className="text-muted-foreground hover:text-destructive">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 rounded-lg border p-3">
                      <Input
                        placeholder="e.g. First Term"
                        value={newTermName}
                        onChange={(e) => setNewTermName(e.target.value)}
                        className="h-9"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={newTermStart}
                          onChange={(e) => setNewTermStart(e.target.value)}
                          className="h-9"
                        />
                        <Input
                          type="date"
                          value={newTermEnd}
                          onChange={(e) => setNewTermEnd(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleAddTerm(year.id)} className="w-fit">
                        <Plus className="mr-1 h-4 w-4" />
                        Add term
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}