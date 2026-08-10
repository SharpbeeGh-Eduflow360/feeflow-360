import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Ban } from 'lucide-react'

interface BillData {
  id: string
  bill_number: string | null
  student_id: string
  bill_date: string
  due_date: string | null
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

  const [bill, setBill] = useState<BillData | null>(null)
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [items, setItems] = useState<BillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: billData } = await supabase.from('bills').select('*').eq('id', id).single()
      if (billData) {
        setBill(billData)

        const [studentRes, itemsRes] = await Promise.all([
          supabase.from('students').select('first_name, last_name, admission_number').eq('id', billData.student_id).single(),
          supabase.from('bill_items').select('id, description, amount').eq('bill_id', id),
        ])

        if (studentRes.data) setStudent(studentRes.data)
        if (itemsRes.data) setItems(itemsRes.data)
      }
      setLoading(false)
    }
    load()
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
                  <span className="text-sm">{item.description}</span>
                  <span className="text-sm font-medium">GH¢{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-1 border-t pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">GH¢{Number(bill.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">GH¢{Number(bill.amount_paid).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Balance</span>
                <span className={`text-lg font-semibold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  GH¢{balance.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {canCancel && (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-4 text-destructive hover:text-destructive"
          >
            <Ban className="mr-2 h-4 w-4" />
            {cancelling ? 'Cancelling...' : 'Cancel bill'}
          </Button>
        )}
      </div>
    </AppLayout>
  )
}