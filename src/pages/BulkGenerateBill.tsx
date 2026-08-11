import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

interface FeeStructure {
  id: string
  name: string
  academic_year_id: string | null
  term_id: string | null
}

interface StructureItem {
  fee_category_id: string
  quantity: number
  unit_price: number
  amount: number
  category_name: string
}

interface AssignedGrade {
  id: string
  name: string
}

interface StudentRow {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  admission_number: string | null
  alreadyBilled: boolean
  arrears: number
}

type Step = 'select' | 'grade' | 'review' | 'done'

export default function BulkGenerateBill() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { school } = useSchool()

  const [step, setStep] = useState<Step>('select')
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [selectedStructureId, setSelectedStructureId] = useState('')
  const [structureItems, setStructureItems] = useState<StructureItem[]>([])
  const [dueDate, setDueDate] = useState('')

  const [assignedGrades, setAssignedGrades] = useState<AssignedGrade[]>([])
  const [selectedGradeIds, setSelectedGradeIds] = useState<Set<string>>(new Set())

  const [students, setStudents] = useState<StudentRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [includeArrears, setIncludeArrears] = useState(true)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedCount, setGeneratedCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('fee_structures')
        .select('id, name, academic_year_id, term_id')
        .order('created_at', { ascending: false })
      if (data) setStructures(data)
    }
    load()
  }, [])

  const subtotal = structureItems.reduce((sum, item) => sum + item.amount, 0)

  async function handleStructureSelect(structureId: string) {
    setSelectedStructureId(structureId)

    const [itemsRes, gradesRes] = await Promise.all([
      supabase
        .from('fee_structure_items')
        .select('fee_category_id, quantity, unit_price, amount, fee_categories(name)')
        .eq('fee_structure_id', structureId),
      supabase
        .from('fee_structure_grades')
        .select('grade_id, grades(id, name)')
        .eq('fee_structure_id', structureId),
    ])

    if (itemsRes.data) {
      setStructureItems(
        itemsRes.data.map((item: any) => ({
          fee_category_id: item.fee_category_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          amount: Number(item.amount),
          category_name: item.fee_categories?.name ?? 'Unknown',
        }))
      )
    }

    if (gradesRes.data) {
      const grades = gradesRes.data
        .map((row: any) => row.grades)
        .filter(Boolean)
      setAssignedGrades(grades)
      // If only one grade is assigned, pre-select it automatically
      if (grades.length === 1) {
        setSelectedGradeIds(new Set([grades[0].id]))
      } else {
        setSelectedGradeIds(new Set())
      }
    }
  }

  function toggleGrade(gradeId: string) {
    setSelectedGradeIds((prev) => {
      const next = new Set(prev)
      if (next.has(gradeId)) next.delete(gradeId)
      else next.add(gradeId)
      return next
    })
  }

  async function loadStudentsForGrades() {
    setLoadingStudents(true)

    const gradeIds = Array.from(selectedGradeIds)

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, photo_url, admission_number')
      .in('grade_id', gradeIds)
      .eq('status', 'active')

    if (!studentsData || studentsData.length === 0) {
      setStudents([])
      setLoadingStudents(false)
      return
    }

    const studentIds = studentsData.map((s) => s.id)

    const [existingBillsRes, balancesRes, priorBillsRes] = await Promise.all([
      supabase
        .from('bills')
        .select('student_id')
        .eq('fee_structure_id', selectedStructureId)
        .neq('status', 'cancelled')
        .in('student_id', studentIds),
      supabase
        .from('opening_balances')
        .select('student_id, amount')
        .eq('carried_forward', false)
        .in('student_id', studentIds),
      supabase
        .from('bills')
        .select('student_id, total_amount, amount_paid')
        .eq('carried_forward', false)
        .neq('status', 'cancelled')
        .neq('status', 'voided')
        .in('student_id', studentIds),
    ])

    const alreadyBilledIds = new Set((existingBillsRes.data ?? []).map((b) => b.student_id))

    const arrearsByStudent: Record<string, number> = {}
    for (const b of balancesRes.data ?? []) {
      arrearsByStudent[b.student_id] = (arrearsByStudent[b.student_id] ?? 0) + Number(b.amount)
    }
    for (const b of priorBillsRes.data ?? []) {
      const outstanding = Number(b.total_amount) - Number(b.amount_paid)
      if (outstanding > 0) {
        arrearsByStudent[b.student_id] = (arrearsByStudent[b.student_id] ?? 0) + outstanding
      }
    }

    const rows: StudentRow[] = studentsData.map((s) => ({
      ...s,
      alreadyBilled: alreadyBilledIds.has(s.id),
      arrears: arrearsByStudent[s.id] ?? 0,
    }))

    setStudents(rows)
    setSelectedIds(new Set(rows.filter((r) => !r.alreadyBilled).map((r) => r.id)))
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

  const selectedStudents = students.filter((s) => selectedIds.has(s.id))
  const expectedTotal = selectedStudents.reduce(
    (sum, s) => sum + subtotal + (includeArrears ? s.arrears : 0),
    0
  )

  async function handleGenerate() {
    if (!school || !user || selectedStudents.length === 0) return
    setGenerating(true)
    setError(null)

    const { data: structure } = await supabase
      .from('fee_structures')
      .select('academic_year_id, term_id')
      .eq('id', selectedStructureId)
      .single()

    let successCount = 0

    for (const student of selectedStudents) {
      const previousBalance = includeArrears ? student.arrears : 0
      const total = subtotal + previousBalance

      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          school_id: school.id,
          student_id: student.id,
          fee_structure_id: selectedStructureId,
          academic_year_id: structure?.academic_year_id ?? null,
          term_id: structure?.term_id ?? null,
          due_date: dueDate || null,
          subtotal,
          previous_balance: previousBalance,
          discount_amount: 0,
          scholarship_amount: 0,
          total_amount: total,
          status: 'published',
          created_by: user.id,
        })
        .select()
        .single()

      if (billError || !bill) continue

      const itemRows = structureItems.map((item) => ({
        school_id: school.id,
        bill_id: bill.id,
        fee_category_id: item.fee_category_id,
        description: item.category_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }))

      await supabase.from('bill_items').insert(itemRows)

      if (previousBalance > 0) {
        const [balancesRes, priorBillsRes] = await Promise.all([
          supabase.from('opening_balances').select('id').eq('student_id', student.id).eq('carried_forward', false),
          supabase.from('bills').select('id, total_amount, amount_paid, status').eq('student_id', student.id).eq('carried_forward', false).neq('status', 'cancelled').neq('status', 'voided').neq('id', bill.id),
        ])

        const balanceIds = (balancesRes.data ?? []).map((b) => b.id)
        const billIds = (priorBillsRes.data ?? [])
          .filter((b) => Number(b.total_amount) - Number(b.amount_paid) > 0)
          .map((b) => b.id)

        if (balanceIds.length > 0) {
          await supabase.from('opening_balances').update({ carried_forward: true }).in('id', balanceIds)
        }
        if (billIds.length > 0) {
          await supabase.from('bills').update({ carried_forward: true }).in('id', billIds)
        }
      }

      successCount++
    }

    setGenerating(false)
    setGeneratedCount(successCount)
    setStep('done')
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

        <h1 className="mt-4 text-2xl font-bold">Bulk bill generation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate bills for every student in a selected grade.
        </p>

        {step === 'select' && (
          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold">Step 1: Select a fee structure</h2>

              <div className="flex flex-col gap-2">
                <Label>Fee structure</Label>
                <Select value={selectedStructureId} onValueChange={handleStructureSelect}>
                  <SelectTrigger><SelectValue placeholder="Select a fee structure" /></SelectTrigger>
                  <SelectContent>
                    {structures.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Due date (optional)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              {structureItems.length > 0 && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Current charges per student</p>
                  <p className="mt-1 text-lg font-semibold text-brand-gold">GH¢{subtotal.toFixed(2)}</p>
                </div>
              )}

              {selectedStructureId && assignedGrades.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  This fee structure has no grades assigned. Assign grades to it in Fee Structures first.
                </p>
              )}

              <Button
                onClick={() => setStep('grade')}
                disabled={!selectedStructureId || structureItems.length === 0 || assignedGrades.length === 0}
                className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'grade' && (
          <Card className="mt-6">
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold">Step 2: Select target grade(s)</h2>
              <p className="text-xs text-muted-foreground">
                This fee structure is assigned to {assignedGrades.length} grade{assignedGrades.length !== 1 ? 's' : ''}.
                {assignedGrades.length > 1 ? ' Choose which to bill now.' : ''}
              </p>

              <div className="flex flex-col gap-2">
                {assignedGrades.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                    <Checkbox
                      checked={selectedGradeIds.has(g.id)}
                      onCheckedChange={() => toggleGrade(g.id)}
                    />
                    {g.name}
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
                <Button
                  onClick={async () => { await loadStudentsForGrades(); setStep('review') }}
                  disabled={selectedGradeIds.size === 0}
                  className="bg-brand-navy text-white hover:bg-brand-navy-light"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Step 3: Review students</h2>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size} of {students.length} selected
                </span>
              </div>

              {loadingStudents && <p className="mt-3 text-sm text-muted-foreground">Loading...</p>}

              {!loadingStudents && students.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No active students found in the selected grade(s).
                </p>
              )}

              <div className="mt-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
                {students.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-muted/50 ${
                      s.alreadyBilled ? 'opacity-60' : ''
                    }`}
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
                    {s.alreadyBilled && (
                      <span className="flex items-center gap-1 text-xs text-brand-gold">
                        <AlertCircle className="h-3 w-3" />
                        Already billed
                      </span>
                    )}
                    {s.arrears > 0 && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        +GH¢{s.arrears.toFixed(2)} owed
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {students.some((s) => s.arrears > 0) && (
                <label className="mt-3 flex items-center gap-2 rounded-lg border border-brand-gold/40 bg-brand-gold/5 p-3 text-sm">
                  <Checkbox checked={includeArrears} onCheckedChange={(v) => setIncludeArrears(!!v)} />
                  Include each student's outstanding balance as Previous Balance on their bill
                </label>
              )}

              <div className="mt-4 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Students to bill</span>
                  <span className="font-medium">{selectedStudents.length}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Expected total billing</span>
                  <span className="text-lg font-semibold text-brand-gold">GH¢{expectedTotal.toFixed(2)}</span>
                </div>
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => setStep('grade')}>Back</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || selectedStudents.length === 0}
                  className="bg-brand-navy text-white hover:bg-brand-navy-light"
                >
                  {generating ? 'Generating...' : `Generate ${selectedStudents.length} bills`}
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
                <h2 className="font-semibold">Bulk billing complete</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {generatedCount} bills were generated successfully.
                </p>
              </div>
              <Button onClick={() => navigate('/billing')} className="bg-brand-navy text-white hover:bg-brand-navy-light">
                View billing
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}