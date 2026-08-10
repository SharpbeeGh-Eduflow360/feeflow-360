import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
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
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface StudentInfo {
  id: string
  first_name: string
  last_name: string
  admission_number: string | null
}

interface FeeStructure {
  id: string
  name: string
}

interface StructureItem {
  fee_category_id: string
  amount: number
  category_name: string
}

export default function GenerateBill() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { school } = useSchool()

  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [selectedStructureId, setSelectedStructureId] = useState('')
  const [structureItems, setStructureItems] = useState<StructureItem[]>([])
  const [dueDate, setDueDate] = useState('')
  const [existingBillWarning, setExistingBillWarning] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [studentRes, structRes] = await Promise.all([
        supabase.from('students').select('id, first_name, last_name, admission_number').eq('id', id).single(),
        supabase.from('fee_structures').select('id, name').order('created_at', { ascending: false }),
      ])

      if (studentRes.data) setStudent(studentRes.data)
      if (structRes.data) setStructures(structRes.data)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStructureSelect(structureId: string) {
    setSelectedStructureId(structureId)
    setExistingBillWarning(null)

    const { data: itemsData } = await supabase
      .from('fee_structure_items')
      .select('fee_category_id, amount, fee_categories(name)')
      .eq('fee_structure_id', structureId)

    if (itemsData) {
      setStructureItems(
        itemsData.map((item: any) => ({
          fee_category_id: item.fee_category_id,
          amount: Number(item.amount),
          category_name: item.fee_categories?.name ?? 'Unknown',
        }))
      )
    }

    // Check for an existing bill from this same structure for this student
    const { data: existing } = await supabase
      .from('bills')
      .select('id, bill_number')
      .eq('student_id', id)
      .eq('fee_structure_id', structureId)
      .neq('status', 'cancelled')

    if (existing && existing.length > 0) {
      setExistingBillWarning(
        `This student already has a bill (${existing[0].bill_number}) from this fee structure.`
      )
    }
  }

  const total = structureItems.reduce((sum, item) => sum + item.amount, 0)

  async function handleGenerate() {
    if (!school || !user || !student || !selectedStructureId || structureItems.length === 0) return
    setSaving(true)
    setError(null)

    const { data: structure } = await supabase
      .from('fee_structures')
      .select('academic_year_id, term_id')
      .eq('id', selectedStructureId)
      .single()

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        school_id: school.id,
        student_id: student.id,
        fee_structure_id: selectedStructureId,
        academic_year_id: structure?.academic_year_id ?? null,
        term_id: structure?.term_id ?? null,
        due_date: dueDate || null,
        total_amount: total,
        status: 'published',
        created_by: user.id,
      })
      .select()
      .single()

    if (billError || !bill) {
      setError(billError?.message ?? 'Failed to create bill.')
      setSaving(false)
      return
    }

    const itemRows = structureItems.map((item) => ({
      school_id: school.id,
      bill_id: bill.id,
      fee_category_id: item.fee_category_id,
      description: item.category_name,
      amount: item.amount,
    }))

    const { error: itemsError } = await supabase.from('bill_items').insert(itemRows)

    setSaving(false)

    if (itemsError) {
      setError(itemsError.message)
      return
    }

    navigate(`/bills/${bill.id}`)
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppLayout>
    )
  }

  if (!student) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Student not found.</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate(`/students/${student.id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to student
        </button>

        <h1 className="mt-4 text-2xl font-bold">Generate bill</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For {student.first_name} {student.last_name} ({student.admission_number})
        </p>

        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 pt-6">
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

            {existingBillWarning && (
              <p className="flex items-center gap-2 text-sm text-brand-gold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {existingBillWarning}
              </p>
            )}

            {structureItems.length > 0 && (
              <div className="rounded-lg border p-3">
                <div className="flex flex-col divide-y">
                  {structureItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <span>{item.category_name}</span>
                      <span className="font-medium">GH¢{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-semibold text-brand-gold">GH¢{total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              onClick={handleGenerate}
              disabled={saving || !selectedStructureId || structureItems.length === 0}
              className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
            >
              {saving ? 'Generating...' : 'Generate bill'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}