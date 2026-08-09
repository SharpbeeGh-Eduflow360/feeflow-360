import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, X } from 'lucide-react'

interface Lookup {
  id: string
  name: string
}

interface Grade extends Lookup {
  department_id: string
}

interface LineItem {
  fee_category_id: string
  amount: string
}

export default function AddFeeStructure() {
  const navigate = useNavigate()
  const { school } = useSchool()

  const [years, setYears] = useState<Lookup[]>([])
  const [terms, setTerms] = useState<Lookup[]>([])
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [categories, setCategories] = useState<Lookup[]>([])

  const [name, setName] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [termId, setTermId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [studentType, setStudentType] = useState('')

  const [items, setItems] = useState<LineItem[]>([{ fee_category_id: '', amount: '' }])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [yearsRes, termsRes, deptRes, gradeRes, catRes] = await Promise.all([
        supabase.from('academic_years').select('id, name').order('created_at', { ascending: false }),
        supabase.from('terms').select('id, name').order('position'),
        supabase.from('departments').select('id, name').order('position'),
        supabase.from('grades').select('id, name, department_id').order('position'),
        supabase.from('fee_categories').select('id, name').order('name'),
      ])
      if (yearsRes.data) setYears(yearsRes.data)
      if (termsRes.data) setTerms(termsRes.data)
      if (deptRes.data) setDepartments(deptRes.data)
      if (gradeRes.data) setGrades(gradeRes.data)
      if (catRes.data) setCategories(catRes.data)
    }
    load()
  }, [])

  const gradesInDept = grades.filter((g) => g.department_id === departmentId)

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { fee_category_id: '', amount: '' }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => {
    const amt = parseFloat(item.amount)
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)

  async function handleSubmit() {
    if (!school || !name.trim()) return
    setError(null)

    const validItems = items.filter((i) => i.fee_category_id && parseFloat(i.amount) > 0)

    if (validItems.length === 0) {
      setError('Add at least one fee item with a category and amount.')
      return
    }

    // Check for duplicate categories within this structure
    const categoryIds = validItems.map((i) => i.fee_category_id)
    if (new Set(categoryIds).size !== categoryIds.length) {
      setError('Each fee category can only be used once per structure.')
      return
    }

    setSaving(true)

    const { data: structure, error: structError } = await supabase
      .from('fee_structures')
      .insert({
        school_id: school.id,
        name: name.trim(),
        academic_year_id: academicYearId || null,
        term_id: termId || null,
        department_id: departmentId || null,
        grade_id: gradeId || null,
        student_type: studentType || null,
      })
      .select()
      .single()

    if (structError || !structure) {
      setError(structError?.message ?? 'Failed to create fee structure.')
      setSaving(false)
      return
    }

    const itemRows = validItems.map((i) => ({
      school_id: school.id,
      fee_structure_id: structure.id,
      fee_category_id: i.fee_category_id,
      amount: parseFloat(i.amount),
    }))

    const { error: itemsError } = await supabase.from('fee_structure_items').insert(itemRows)

    setSaving(false)

    if (itemsError) {
      setError(itemsError.message)
      return
    }

    navigate(`/fee-structures/${structure.id}`)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/fee-structures')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fee structures
        </button>

        <h1 className="mt-4 text-2xl font-bold">New fee structure</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bundle fee categories into a reusable structure for billing.
        </p>

        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Details</h2>

              <div className="flex flex-col gap-2">
                <Label>Structure name</Label>
                <Input
                  placeholder="e.g. Basic 4 First Term Fees"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Academic year</Label>
                  <Select value={academicYearId} onValueChange={setAcademicYearId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Term</Label>
                  <Select value={termId} onValueChange={setTermId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setGradeId('') }}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Grade</Label>
                  <Select value={gradeId} onValueChange={setGradeId} disabled={!departmentId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {gradesInDept.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Student type</Label>
                <Select value={studentType} onValueChange={setStudentType}>
                  <SelectTrigger><SelectValue placeholder="Optional — applies to both if left blank" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">Fee items</h2>
                <span className="text-sm font-semibold text-brand-gold">
                  Total: GH¢{total.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={item.fee_category_id}
                      onValueChange={(v) => updateItem(index, 'fee_category_id', v)}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) => updateItem(index, 'amount', e.target.value)}
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
                <Plus className="mr-1 h-4 w-4" />
                Add fee item
              </Button>

              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  You don't have any fee categories yet. Create some first.
                </p>
              )}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {saving ? 'Saving...' : 'Create fee structure'}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}