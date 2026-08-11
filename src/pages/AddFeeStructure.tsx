import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  quantity: string
  unit_price: string
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
  const [selectedGradeIds, setSelectedGradeIds] = useState<Set<string>>(new Set())
  const [studentType, setStudentType] = useState('')

  const [items, setItems] = useState<LineItem[]>([{ fee_category_id: '', quantity: '1', unit_price: '' }])

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

  function toggleGrade(gradeId: string) {
    setSelectedGradeIds((prev) => {
      const next = new Set(prev)
      if (next.has(gradeId)) next.delete(gradeId)
      else next.add(gradeId)
      return next
    })
  }

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addItem() {
    setItems((prev) => [...prev, { fee_category_id: '', quantity: '1', unit_price: '' }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function lineTotal(item: LineItem) {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return qty * price
  }

  const total = items.reduce((sum, item) => sum + lineTotal(item), 0)

  async function handleSubmit() {
    if (!school || !name.trim()) return
    setError(null)

    const validItems = items.filter(
      (i) => i.fee_category_id && parseFloat(i.unit_price) > 0 && parseFloat(i.quantity) > 0
    )

    if (validItems.length === 0) {
      setError('Add at least one fee item with a category, quantity, and unit price.')
      return
    }

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
        student_type: studentType || null,
      })
      .select()
      .single()

    if (structError || !structure) {
      setError(structError?.message ?? 'Failed to create fee structure.')
      setSaving(false)
      return
    }

    const itemRows = validItems.map((i) => {
      const qty = parseFloat(i.quantity)
      const price = parseFloat(i.unit_price)
      return {
        school_id: school.id,
        fee_structure_id: structure.id,
        fee_category_id: i.fee_category_id,
        quantity: qty,
        unit_price: price,
        amount: qty * price,
      }
    })

    const { error: itemsError } = await supabase.from('fee_structure_items').insert(itemRows)

    if (itemsError) {
      setError(itemsError.message)
      setSaving(false)
      return
    }

    if (selectedGradeIds.size > 0) {
      const gradeRows = Array.from(selectedGradeIds).map((gradeId) => ({
        school_id: school.id,
        fee_structure_id: structure.id,
        grade_id: gradeId,
      }))

      const { error: gradesError } = await supabase.from('fee_structure_grades').insert(gradeRows)

      if (gradesError) {
        setError(gradesError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    navigate(`/fee-structures/${structure.id}`)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to billing
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
                  placeholder="e.g. First Term Fees"
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
              <h2 className="text-sm font-semibold text-muted-foreground">Applies to grades</h2>
              <p className="text-xs text-muted-foreground">
                Select which grades this fee structure applies to.
              </p>

              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger><SelectValue placeholder="Select a department to see its grades" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {departmentId && (
                <div className="flex flex-col gap-2">
                  {gradesInDept.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedGradeIds.has(g.id)}
                        onCheckedChange={() => toggleGrade(g.id)}
                      />
                      {g.name}
                    </label>
                  ))}
                  {gradesInDept.length === 0 && (
                    <p className="text-xs text-muted-foreground">No grades in this department yet.</p>
                  )}
                </div>
              )}

              {selectedGradeIds.size > 0 && (
                <p className="text-xs text-brand-gold">{selectedGradeIds.size} grade(s) selected</p>
              )}
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
                  <div key={index} className="flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center">
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-16"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit price"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="w-24"
                      />
                      <span className="w-20 shrink-0 text-right text-sm font-medium">
                        GH¢{lineTotal(item).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
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