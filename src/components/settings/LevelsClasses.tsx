import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'

interface Department {
  id: string
  name: string
  position: number
}

interface Grade {
  id: string
  name: string
  department_id: string
  position: number
}

interface Section {
  id: string
  name: string
  grade_id: string
}

export function LevelsClasses() {
  const { school } = useSchool()
  const [departments, setDepartments] = useState<Department[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newDeptName, setNewDeptName] = useState('')
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [newGradeName, setNewGradeName] = useState('')
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')

  async function loadData() {
    if (!school) return
    setLoading(true)

    const [deptRes, gradeRes, sectionRes] = await Promise.all([
      supabase.from('departments').select('id, name, position').order('position'),
      supabase.from('grades').select('id, name, department_id, position').order('position'),
      supabase.from('sections').select('id, name, grade_id'),
    ])

    if (deptRes.data) setDepartments(deptRes.data)
    if (gradeRes.data) setGrades(gradeRes.data)
    if (sectionRes.data) setSections(sectionRes.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [school])

  async function addDepartment() {
    if (!school || !newDeptName.trim()) return
    setError(null)
    const { error: insertError } = await supabase.from('departments').insert({
      school_id: school.id,
      name: newDeptName.trim(),
      position: departments.length + 1,
    })
    if (insertError) return setError(insertError.message)
    setNewDeptName('')
    loadData()
  }

  async function deleteDepartment(id: string) {
    setError(null)
    const { error: deleteError } = await supabase.from('departments').delete().eq('id', id)
    if (deleteError) return setError(deleteError.message)
    loadData()
  }

  async function addGrade(departmentId: string) {
    if (!school || !newGradeName.trim()) return
    setError(null)
    const gradeCount = grades.filter((g) => g.department_id === departmentId).length
    const { error: insertError } = await supabase.from('grades').insert({
      school_id: school.id,
      department_id: departmentId,
      name: newGradeName.trim(),
      position: gradeCount + 1,
    })
    if (insertError) return setError(insertError.message)
    setNewGradeName('')
    loadData()
  }

  async function deleteGrade(id: string) {
    setError(null)
    const { error: deleteError } = await supabase.from('grades').delete().eq('id', id)
    if (deleteError) return setError(deleteError.message)
    loadData()
  }

  async function addSection(gradeId: string) {
    if (!school || !newSectionName.trim()) return
    setError(null)
    const { error: insertError } = await supabase.from('sections').insert({
      school_id: school.id,
      grade_id: gradeId,
      name: newSectionName.trim(),
    })
    if (insertError) return setError(insertError.message)
    setNewSectionName('')
    loadData()
  }

  async function deleteSection(id: string) {
    setError(null)
    const { error: deleteError } = await supabase.from('sections').delete().eq('id', id)
    if (deleteError) return setError(deleteError.message)
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
        <h2 className="text-lg font-semibold">Departments, Grades & Sections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          e.g. Primary → Basic 1 → A, giving classes like "Basic 1A"
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {departments.map((dept) => {
            const deptGrades = grades.filter((g) => g.department_id === dept.id)
            const isDeptExpanded = expandedDept === dept.id

            return (
              <div key={dept.id} className="rounded-lg border">
                <div className="flex items-center justify-between p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedDept(isDeptExpanded ? null : dept.id)}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    {isDeptExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {dept.name}
                    <span className="text-xs text-muted-foreground">
                      ({deptGrades.length} {deptGrades.length === 1 ? 'grade' : 'grades'})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDepartment(dept.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete department"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {isDeptExpanded && (
                  <div className="border-t p-3">
                    <div className="flex flex-col gap-2">
                      {deptGrades.map((grade) => {
                        const gradeSections = sections.filter((s) => s.grade_id === grade.id)
                        const isGradeExpanded = expandedGrade === grade.id

                        return (
                          <div key={grade.id} className="rounded-md border bg-muted/30">
                            <div className="flex items-center justify-between p-2.5">
                              <button
                                type="button"
                                onClick={() => setExpandedGrade(isGradeExpanded ? null : grade.id)}
                                className="flex items-center gap-2 text-sm"
                              >
                                {isGradeExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                {grade.name}
                                <span className="text-xs text-muted-foreground">
                                  ({gradeSections.length} {gradeSections.length === 1 ? 'section' : 'sections'})
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteGrade(grade.id)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Delete grade"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {isGradeExpanded && (
                              <div className="border-t p-2.5">
                                <div className="flex flex-wrap gap-2">
                                  {gradeSections.map((section) => (
                                    <div
                                      key={section.id}
                                      className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 text-xs font-medium"
                                    >
                                      {grade.name}{section.name}
                                      <button
                                        type="button"
                                        onClick={() => deleteSection(section.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                        aria-label="Delete section"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-2.5 flex gap-2">
                                  <Input
                                    placeholder="e.g. A"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addSection(grade.id)}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="e.g. Basic 1"
                        value={newGradeName}
                        onChange={(e) => setNewGradeName(e.target.value)}
                        className="h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addGrade(dept.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="e.g. Primary"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={addDepartment} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add department
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  )
}