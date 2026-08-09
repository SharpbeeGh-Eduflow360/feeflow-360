import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

interface Department { id: string; name: string }
interface Grade { id: string; name: string; department_id: string }
interface Section { id: string; name: string; grade_id: string }
interface StudentRow {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  admission_number: string | null
}

type Step = 'source' | 'review' | 'destination' | 'done'

export default function PromoteStudents() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { school } = useSchool()

  const [step, setStep] = useState<Step>('source')
  const [departments, setDepartments] = useState<Department[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [sections, setSections] = useState<Section[]>([])

  const [sourceDept, setSourceDept] = useState('')
  const [sourceGrade, setSourceGrade] = useState('')
  const [sourceSection, setSourceSection] = useState('')

  const [students, setStudents] = useState<StudentRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)

  const [destinationType, setDestinationType] = useState<'class' | 'graduate'>('class')
  const [destDept, setDestDept] = useState('')
  const [destGrade, setDestGrade] = useState('')
  const [destSection, setDestSection] = useState('')

  const [promoting, setPromoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotedCount, setPromotedCount] = useState(0)

  useEffect(() => {
    async function loadStructure() {
      const [deptRes, gradeRes, sectionRes] = await Promise.all([
        supabase.from('departments').select('id, name').order('position'),
        supabase.from('grades').select('id, name, department_id').order('position'),
        supabase.from('sections').select('id, name, grade_id'),
      ])
      if (deptRes.data) setDepartments(deptRes.data)
      if (gradeRes.data) setGrades(gradeRes.data)
      if (sectionRes.data) setSections(sectionRes.data)
    }
    loadStructure()
  }, [])

  const sourceGrades = grades.filter((g) => g.department_id === sourceDept)
  const sourceSections = sections.filter((s) => s.grade_id === sourceGrade)
  const destGrades = grades.filter((g) => g.department_id === destDept)
  const destSections = sections.filter((s) => s.grade_id === destGrade)

  async function loadStudentsForSource() {
    setLoadingStudents(true)
    let query = supabase
      .from('students')
      .select('id, first_name, last_name, photo_url, admission_number')
      .eq('status', 'active')

    if (sourceDept) query = query.eq('department_id', sourceDept)
    if (sourceGrade) query = query.eq('grade_id', sourceGrade)
    if (sourceSection) query = query.eq('section_id', sourceSection)

    const { data } = await query
    if (data) {
      setStudents(data)
      setSelectedIds(new Set(data.map((s) => s.id)))
    }
    setLoadingStudents(false)
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handlePromote() {
    if (!school || !user || selectedIds.size === 0) return
    setPromoting(true)
    setError(null)

    const selectedStudents = students.filter((s) => selectedIds.has(s.id))

    const updates = {
      department_id: destinationType === 'graduate' ? null : destDept || null,
      grade_id: destinationType === 'graduate' ? null : destGrade || null,
      section_id: destinationType === 'graduate' ? null : destSection || null,
      status: destinationType === 'graduate' ? 'graduated' : 'active',
    }

    let successCount = 0

    for (const student of selectedStudents) {
      const { error: updateError } = await supabase
        .from('students')
        .update(updates)
        .eq('id', student.id)

      if (updateError) continue

      await supabase.from('promotions').insert({
        school_id: school.id,
        student_id: student.id,
        from_department_id: sourceDept || null,
        from_grade_id: sourceGrade || null,
        from_section_id: sourceSection || null,
        to_department_id: destinationType === 'graduate' ? null : destDept || null,
        to_grade_id: destinationType === 'graduate' ? null : destGrade || null,
        to_section_id: destinationType === 'graduate' ? null : destSection || null,
        to_status: destinationType === 'graduate' ? 'graduated' : null,
        academic_year_id: school.current_academic_year_id ?? null,
        promoted_by: user.id,
      })

      successCount++
    }

    setPromoting(false)
    setPromotedCount(successCount)
    setStep('done')
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </button>

        <h1 className="mt-4 text-2xl font-bold">Promote students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Move a class of students forward, or graduate them out.
        </p>

        {step === 'source' && (
          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold">Step 1: Select the class to promote</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Department</label>
                <Select value={sourceDept} onValueChange={(v) => { setSourceDept(v); setSourceGrade(''); setSourceSection('') }}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Grade</label>
                <Select value={sourceGrade} onValueChange={(v) => { setSourceGrade(v); setSourceSection('') }} disabled={!sourceDept}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {sourceGrades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Section (optional — leave blank for all sections)</label>
                <Select value={sourceSection} onValueChange={setSourceSection} disabled={!sourceGrade}>
                  <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                  <SelectContent>
                    {sourceSections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={async () => { await loadStudentsForSource(); setStep('review') }}
                disabled={!sourceGrade}
                className="mt-2 w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Step 2: Review students</h2>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} of {students.length} selected
                </span>
              </div>

              {loadingStudents && <p className="mt-3 text-sm text-muted-foreground">Loading...</p>}

              {!loadingStudents && students.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">No active students found in this class.</p>
              )}

              <div className="mt-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
                {students.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleStudent(s.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={s.photo_url ?? undefined} />
                      <AvatarFallback className="bg-brand-navy text-white text-xs">
                        {s.first_name[0]}{s.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.admission_number}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep('source')}>Back</Button>
                <Button
                  onClick={() => setStep('destination')}
                  disabled={selectedIds.size === 0}
                  className="bg-brand-navy text-white hover:bg-brand-navy-light"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'destination' && (
          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold">Step 3: Where are they going?</h2>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={destinationType === 'class' ? 'default' : 'outline'}
                  onClick={() => setDestinationType('class')}
                  className={destinationType === 'class' ? 'bg-brand-navy text-white hover:bg-brand-navy-light' : ''}
                >
                  Move to a class
                </Button>
                <Button
                  type="button"
                  variant={destinationType === 'graduate' ? 'default' : 'outline'}
                  onClick={() => setDestinationType('graduate')}
                  className={destinationType === 'graduate' ? 'bg-brand-navy text-white hover:bg-brand-navy-light' : ''}
                >
                  Graduate them
                </Button>
              </div>

              {destinationType === 'class' && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Department</label>
                    <Select value={destDept} onValueChange={(v) => { setDestDept(v); setDestGrade(''); setDestSection('') }}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Grade</label>
                    <Select value={destGrade} onValueChange={(v) => { setDestGrade(v); setDestSection('') }} disabled={!destDept}>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>
                        {destGrades.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Section</label>
                    <Select value={destSection} onValueChange={setDestSection} disabled={!destGrade}>
                      <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                      <SelectContent>
                        {destSections.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {destinationType === 'graduate' && (
                <p className="text-sm text-muted-foreground">
                  Selected students will be marked as "Graduated" and removed from active class placement. Their financial history is fully preserved.
                </p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('review')}>Back</Button>
                <Button
                  onClick={handlePromote}
                  disabled={promoting || (destinationType === 'class' && !destGrade)}
                  className="bg-brand-navy text-white hover:bg-brand-navy-light"
                >
                  {promoting ? 'Promoting...' : `Promote ${selectedIds.size} students`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-brand-gold" />
              <div>
                <h2 className="font-semibold">Promotion complete</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {promotedCount} students were promoted successfully.
                </p>
              </div>
              <Button onClick={() => navigate('/students')} className="bg-brand-navy text-white hover:bg-brand-navy-light">
                View students
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}