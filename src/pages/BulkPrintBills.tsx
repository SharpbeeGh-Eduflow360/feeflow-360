import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Printer } from 'lucide-react'

interface Lookup {
  id: string
  name: string
}

interface BillWithDetails {
  id: string
  bill_number: string | null
  bill_date: string
  due_date: string | null
  total_amount: number
  student_name: string
  admission_number: string | null
  academic_year_name: string | null
  term_name: string | null
  is_current_term: boolean
  items: { description: string; amount: number }[]
}

interface SchoolInfo {
  name: string
  logo_url: string | null
  address: string | null
  phone: string | null
  current_term_id: string | null
}

export default function BulkPrintBills() {
  const navigate = useNavigate()
  const { school } = useSchool()

  const [grades, setGrades] = useState<Lookup[]>([])
  const [selectedGradeId, setSelectedGradeId] = useState('')
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [bills, setBills] = useState<BillWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const [gradesRes, schoolRes] = await Promise.all([
        supabase.from('grades').select('id, name').order('position'),
        school
          ? supabase.from('schools').select('name, logo_url, address, phone, current_term_id').eq('id', school.id).single()
          : Promise.resolve({ data: null }),
      ])
      if (gradesRes.data) setGrades(gradesRes.data)
      if (schoolRes.data) setSchoolInfo(schoolRes.data)
    }
    load()
  }, [school])

  async function loadBillsForGrade() {
    if (!selectedGradeId) return
    setLoading(true)
    setLoaded(false)

    const { data: studentsInGrade } = await supabase
      .from('students')
      .select('id, first_name, last_name, admission_number')
      .eq('grade_id', selectedGradeId)

    if (!studentsInGrade || studentsInGrade.length === 0) {
      setBills([])
      setLoading(false)
      setLoaded(true)
      return
    }

    const studentIds = studentsInGrade.map((s) => s.id)
    const studentMap = new Map(studentsInGrade.map((s) => [s.id, s]))

    const { data: billsData } = await supabase
      .from('bills')
      .select('id, bill_number, bill_date, due_date, total_amount, student_id, academic_year_id, term_id')
      .in('student_id', studentIds)
      .neq('status', 'cancelled')
      .neq('status', 'voided')
      .order('created_at', { ascending: false })

    if (!billsData || billsData.length === 0) {
      setBills([])
      setLoading(false)
      setLoaded(true)
      return
    }

    const billIds = billsData.map((b) => b.id)
    const yearIds = [...new Set(billsData.map((b) => b.academic_year_id).filter(Boolean))]
    const termIds = [...new Set(billsData.map((b) => b.term_id).filter(Boolean))]

    const [itemsRes, yearsRes, termsRes] = await Promise.all([
      supabase.from('bill_items').select('bill_id, description, amount').in('bill_id', billIds),
      yearIds.length > 0
        ? supabase.from('academic_years').select('id, name').in('id', yearIds)
        : Promise.resolve({ data: [] }),
      termIds.length > 0
        ? supabase.from('terms').select('id, name').in('id', termIds)
        : Promise.resolve({ data: [] }),
    ])

    const itemsByBill: Record<string, { description: string; amount: number }[]> = {}
    for (const item of itemsRes.data ?? []) {
      if (!itemsByBill[item.bill_id]) itemsByBill[item.bill_id] = []
      itemsByBill[item.bill_id].push({ description: item.description, amount: Number(item.amount) })
    }

    const yearMap = new Map((yearsRes.data ?? []).map((y) => [y.id, y.name]))
    const termMap = new Map((termsRes.data ?? []).map((t) => [t.id, t.name]))

    const combined: BillWithDetails[] = billsData.map((b) => {
      const student = studentMap.get(b.student_id)
      return {
        id: b.id,
        bill_number: b.bill_number,
        bill_date: b.bill_date,
        due_date: b.due_date,
        total_amount: Number(b.total_amount),
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
        admission_number: student?.admission_number ?? null,
        academic_year_name: b.academic_year_id ? yearMap.get(b.academic_year_id) ?? null : null,
        term_name: b.term_id ? termMap.get(b.term_id) ?? null : null,
        is_current_term: b.term_id === schoolInfo?.current_term_id,
        items: itemsByBill[b.id] ?? [],
      }
    })

    setBills(combined)
    setLoading(false)
    setLoaded(true)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl print:hidden">
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </button>

        <h1 className="mt-4 text-2xl font-bold">Print bills by grade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a grade to print all of its students' bills at once.
        </p>

        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col gap-2">
              <Label>Grade</Label>
              <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                <SelectTrigger><SelectValue placeholder="Select a grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={loadBillsForGrade}
              disabled={!selectedGradeId || loading}
              className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
            >
              {loading ? 'Loading...' : 'Load bills'}
            </Button>

            {loaded && bills.length === 0 && (
              <p className="text-sm text-muted-foreground">No bills found for students in this grade.</p>
            )}

            {loaded && bills.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm">{bills.length} bills ready to print</p>
                <Button onClick={() => window.print()} size="sm" className="bg-brand-navy text-white hover:bg-brand-navy-light">
                  <Printer className="mr-2 h-4 w-4" />
                  Print all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Printable area — hidden on screen, only shown when printing */}
      {bills.length > 0 && (
        <div className="hidden print:block">
          {bills.map((bill, index) => (
            <div
              key={bill.id}
              className={`min-h-0 ${index < bills.length - 1 ? 'break-after-page' : ''}`}
              style={{ padding: '24px' }}
            >
              <div className="flex items-center gap-3 border-b pb-4">
                {schoolInfo?.logo_url && (
                  <img src={schoolInfo.logo_url} alt="" className="h-12 w-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-bold">{schoolInfo?.name}</p>
                  {schoolInfo?.address && <p className="text-xs text-muted-foreground">{schoolInfo.address}</p>}
                  {schoolInfo?.phone && <p className="text-xs text-muted-foreground">{schoolInfo.phone}</p>}
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-brand-navy">
                {bill.is_current_term ? 'Bill for this term' : 'Next term bill'}
              </p>
              {(bill.academic_year_name || bill.term_name) && (
                <p className="text-xs text-muted-foreground">
                  {[bill.academic_year_name, bill.term_name].filter(Boolean).join(' · ')}
                </p>
              )}

              <div className="mt-3">
                <p className="text-lg font-bold">{bill.bill_number}</p>
                <p className="text-sm text-muted-foreground">
                  {bill.student_name} ({bill.admission_number})
                </p>
              </div>

              <div className="mt-2 flex gap-6 text-xs text-muted-foreground">
                <span>Bill date: {bill.bill_date}</span>
                {bill.due_date && <span>Due: {bill.due_date}</span>}
              </div>

              <div className="mt-4 flex flex-col divide-y border-t">
                {bill.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span>{item.description}</span>
                    <span className="font-medium">GH¢{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-semibold">GH¢{bill.total_amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}