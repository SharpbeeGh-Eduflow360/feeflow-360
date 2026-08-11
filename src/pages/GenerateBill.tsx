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
import { Checkbox } from '@/components/ui/checkbox'
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
  quantity: number
  unit_price: number
  amount: number
  category_name: string
}

interface OutstandingSource {
  type: 'opening_balance' | 'bill'
  id: string
  amount: number
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

  const [outstandingSources, setOutstandingSources] = useState<OutstandingSource[]>([])
  const [includeArrears, setIncludeArrears] = useState(true)

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

      const [balancesRes, billsRes] = await Promise.all([
        supabase.from('opening_balances').select('id, amount').eq('student_id', id).eq('carried_forward', false),
        supabase.from('bills').select('id, total_amount, amount_paid, status').eq('student_id', id).eq('carried_forward', false).neq('status', 'cancelled').neq('status', 'voided'),
      ])

      const sources: OutstandingSource[] = []

      if (balancesRes.data) {
        for (const b of balancesRes.data) {
          if (Number(b.amount) > 0) {
            sources.push({ type: 'opening_balance', id: b.id, amount: Number(b.amount) })
          }
        }
      }

      if (billsRes.data) {
        for (const b of billsRes.data) {
          const outstanding = Number(b.total_amount) - Number(b.amount_paid)
          if (outstanding > 0) {
            sources.push({ type: 'bill', id: b.id, amount: outstanding })
          }
        }
      }

      setOutstandingSources(sources)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStructureSelect(structureId: string) {
    setSelectedStructureId(structureId)
    setExistingBillWarning(null)

    const { data: itemsData } = await supabase
      .from('fee_structure_items')
      .select('fee_category_id, quantity, unit_price, amount, fee_categories(name)')
      .eq('fee_structure_id', structureId)

    if (itemsData) {
      setStructureItems(
        itemsData.map((item: any) => ({
          fee_category_id: item.fee_category_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          amount: Number(item.amount),
          category_name: item.fee_categories?.name ?? 'Unknown',
        }))
      )
    }

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

  const arrearsTotal = outstandingSources.reduce((sum, s) => sum + s.amount, 0)
  const subtotal = structureItems.reduce((sum, item) => sum + item.amount, 0)
  const previousBalance = includeArrears ? arrearsTotal : 0
  const grandTotal = subtotal + previousBalance

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
        subtotal,
        previous_balance: previousBalance,
        discount_amount: 0,
        scholarship_amount: 0,
        total_amount: grandTotal,
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
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    }))

    const { error: itemsError } = await supabase.from('bill_items').insert(itemRows)

    if (itemsError) {
      setError(itemsError.message)
      setSaving(false)
      return
    }

    if (includeArrears && arrearsTotal > 0) {
      const balanceIds = outstandingSources.filter((s) => s.type === 'opening_balance').map((s) => s.id)
      const billIds = outstandingSources.filter((s) => s.type === 'bill').map((s) => s.id)

      if (balanceIds.length > 0) {
        await supabase.from('opening_balances').update({ carried_forward: true }).in('id', balanceIds)
      }
      if (billIds.length > 0) {
        await supabase.from('bills').update({ carried_forward: true }).in('id', billIds)
      }
    }

    setSaving(false)
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

            {arrearsTotal > 0 && (
              <div className="rounded-lg border border-brand-gold/40 bg-brand-gold/5 p-3">
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={includeArrears}
                    onCheckedChange={(v) => setIncludeArrears(!!v)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      This student has GH¢{arrearsTotal.toFixed(2)} outstanding
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Include as Previous Balance on this bill. Original records remain in history, marked as carried forward.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {structureItems.length > 0 && (
              <div className="rounded-lg border p-3">
                <div className="flex flex-col divide-y">
                  {structureItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <span>{item.category_name}</span>
                        {item.quantity !== 1 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({item.quantity} × GH¢{item.unit_price.toFixed(2)})
                          </span>
                        )}
                      </div>
                      <span className="font-medium">GH¢{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-col gap-1 border-t pt-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current charges</span>
                    <span className="font-medium">GH¢{subtotal.toFixed(2)}</span>
                  </div>
                  {previousBalance > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Previous balance</span>
                      <span className="font-medium">GH¢{previousBalance.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-1">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-semibold text-brand-gold">GH¢{grandTotal.toFixed(2)}</span>
                  </div>
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