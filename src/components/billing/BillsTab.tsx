import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

interface BillRow {
  id: string
  bill_number: string | null
  total_amount: number
  amount_paid: number
  status: string
  student_id: string
  created_at: string
}

interface StudentLookup {
  id: string
  first_name: string
  last_name: string
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

export default function BillsTab() {
  const [bills, setBills] = useState<BillRow[]>([])
  const [students, setStudents] = useState<StudentLookup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [billsRes, studentsRes] = await Promise.all([
        supabase
          .from('bills')
          .select('id, bill_number, total_amount, amount_paid, status, student_id, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('students').select('id, first_name, last_name'),
      ])

      if (billsRes.data) setBills(billsRes.data)
      if (studentsRes.data) setStudents(studentsRes.data)
      setLoading(false)
    }
    load()
  }, [])

  function studentName(id: string) {
    const s = students.find((st) => st.id === id)
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown student'
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        All bills generated for your students.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!loading && bills.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              No bills yet. Generate one from a student's profile.
            </CardContent>
          </Card>
        )}

        {bills.map((bill) => (
          <Link key={bill.id} to={`/bills/${bill.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{studentName(bill.student_id)}</p>
                  <p className="text-xs text-muted-foreground">{bill.bill_number}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[bill.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {bill.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold">GH¢{Number(bill.total_amount).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}