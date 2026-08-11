import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
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
import { ArrowLeft, Ban, Tag } from 'lucide-react'

interface BillData {
  id: string
  bill_number: string | null
  student_id: string
  bill_date: string
  due_date: string | null
  subtotal: number
  previous_balance: number
  discount_amount: number
  scholarship_amount: number
  total_amount: number
  amount_paid: number
  status: string
}

interface StudentInfo {
  first_name: string
  last_name: string
  admission_number: string | null
}

interface BillItem {
  id: string
  description: string
  amount: number
  quantity: number
  unit_price: number
}

interface Discount {
  id: string
  type: string
  reason: string
  amount: number
}

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  partially_paid: 'bg-brand-gold/10 text-brand-gold',
  paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
  overdue: 'bg-red-500/10 text-red-600',
  cancelled: 'bg-muted text-muted-foreground',
  voided: 'bg-muted text-muted-foreground',
}

export default function BillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [bill, setBill] = useState<BillData | null>(null)
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [items, setItems] = useState<BillItem[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [discountType, setDiscountType] = useState('discount')
  const [discountReason, setDiscountReason] = useState('')
  const [discountAmount, setDiscountAmount] = useState('')
  const [savingDiscount, setSavingDiscount] = useState(false)

  async function loadAll() {
    const { data: billData } = await supabase.from('bills').select('*').eq('id', id).single()
    if (billData) {
      setBill(billData)

      const [studentRes, itemsRes, discountsRes] = await Promise.all([
        supabase.from('students').select('first_name, last_name, admission_number').eq('id', billData.student_id).single(),
        supabase.from('bill_items').select('id, description, amount, quantity, unit_price').eq('bill_id', id),
        supabase.from('discounts').select('id, type, reason, amount').eq('bill_id', id),
      ])

      if (studentRes.data) setStudent(studentRes.data)
      if (itemsRes.data) setItems(itemsRes.data)
      if (discountsRes.data) setDiscounts(discountsRes.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [id])

  const balance = bill ? Number(bill.total_amount) - Number(bill.amount_paid) : 0

  async function handleCancel() {
    if (!bill) return
    if (!confirm('Cancel this bill? It will remain in history but no longer be considered active.')) return

    setCancelling(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('bills')
      .update({ status: 'cancelled' })
      .eq('id', bill.id)

    setCancelling(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setBill({ ...bill, status: 'cancelled' })
  }

  async function handleAddDiscount() {
    if (!bill || !user || !discountReason.trim() || !discountAmount) return
    setSavingDiscount(true)
    setError(null)

    const amt = parseFloat(discountAmount)
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid discount amount.')
      setSavingDiscount(false)
      return
    }

    const { data: schoolData } = await supabase.from('bills').select('school_id').eq('id', bill.id).single()

    // Insert the discount record (detailed, auditable)
    const { error: insertError } = await supabase.from('discounts').insert({
      school_id: schoolData?.school_id,
      bill_id: bill.id,
      type: discountType,
      reason: discountReason.trim(),
      amount: amt,
      created_by: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setSavingDiscount(false)
      return
    }

    // Update the bill's summary columns and recalculate total_amount
    const newDiscountAmount = discountType === 'discount' ? Number(bill.discount_amount) + amt : Number(bill.discount_amount)
    const newScholarshipAmount = discountType === 'scholarship' ? Number(bill.scholarship_amount) + amt : Number(bill.scholarship_amount)
    const newTotal = Number(bill.subtotal) + Number(bill.previous_balance) - newDiscountAmount - newScholarshipAmount

    const { error: updateError } = await supabase
      .from('bills')
      .update({
        discount_amount: newDiscountAmount,
        scholarship_amount: newScholarshipAmount,
        total_amount: newTotal,
      })
      .eq('id', bill.id)

    setSavingDiscount(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDiscountReason('')
    setDiscountAmount('')
    setShowDiscountForm(false)
    loadAll()
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppLayout>
    )
  }

  if (!bill || !student) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Bill not found.</p>
      </AppLayout>
    )
  }

  const canCancel = bill.status !== 'cancelled' && bill.status !== 'voided' && Number(bill.amount_paid) === 0

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

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{bill.bill_number}</h1>
            <Link to={`/students/${bill.student_id}`} className="text-sm text-brand-gold hover:underline">
              {student.first_name} {student.last_name} ({student.admission_number})
            </Link>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[bill.status] ?? 'bg-muted text-muted-foreground'}`}>
            {bill.status.replace('_', ' ')}
          </span>
        </div>

        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <a href={`/view/bill/${bill.id}`} target="_blank" rel="noopener noreferrer">
              View / Print bill
            </a>
          </Button>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Bill date</p>
                <p className="font-medium">{bill.bill_date}</p>
              </div>
              {bill.due_date && (
                <div>
                  <p className="text-muted-foreground">Due date</p>
                  <p className="font-medium">{bill.due_date}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col divide-y border-t">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm">{item.description}</p>
                    {Number(item.quantity) !== 1 && (
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × GH¢{Number(item.unit_price).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium">GH¢{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {discounts.length > 0 && (
              <div className="mt-3 flex flex-col divide-y border-t">
                {discounts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm capitalize">{d.type}</p>
                      <p className="text-xs text-muted-foreground">{d.reason}</p>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      -GH¢{Number(d.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-1 border-t pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current charges</span>
                <span className="font-medium">GH¢{Number(bill.subtotal).toFixed(2)}</span>
              </div>
              {Number(bill.previous_balance) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Previous balance</span>
                  <span className="font-medium">GH¢{Number(bill.previous_balance).toFixed(2)}</span>
                </div>
              )}
              {Number(bill.discount_amount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600 dark:text-green-400">-GH¢{Number(bill.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(bill.scholarship_amount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scholarship</span>
                  <span className="font-medium text-green-600 dark:text-green-400">-GH¢{Number(bill.scholarship_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">GH¢{Number(bill.amount_paid).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-1">
                <span className="font-semibold">Balance</span>
                <span className={`text-lg font-semibold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  GH¢{balance.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {bill.status !== 'cancelled' && bill.status !== 'voided' && (
            <Button variant="outline" size="sm" onClick={() => setShowDiscountForm((s) => !s)}>
              <Tag className="mr-2 h-4 w-4" />
              Add discount / scholarship
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              {cancelling ? 'Cancelling...' : 'Cancel bill'}
            </Button>
          )}
        </div>

        {showDiscountForm && (
          <Card className="mt-4">
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Reason</Label>
                <Input
                  placeholder="e.g. Sibling discount, Merit scholarship"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Amount (GH¢)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddDiscount}
                disabled={savingDiscount}
                className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
              >
                {savingDiscount ? 'Saving...' : 'Apply'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}