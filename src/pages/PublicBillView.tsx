import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

interface BillItem {
  description: string
  amount: number
}

interface PublicBillData {
  bill_number: string | null
  bill_date: string
  due_date: string | null
  total_amount: number
  status: string
  student_name: string
  admission_number: string | null
  school_name: string
  school_logo_url: string | null
  school_address: string | null
  school_phone: string | null
  academic_year_name: string | null
  term_name: string | null
  is_current_term: boolean
  items: BillItem[]
}

export default function PublicBillView() {
  const { id } = useParams()
  const [bill, setBill] = useState<PublicBillData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_public_bill', { p_bill_id: id })

      if (!error && data) {
        setBill(data as PublicBillData)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
  }

  if (!bill) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Bill not found.</div>
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 print:min-h-0 print:bg-white print:p-0 print:m-0">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white"
          >
            Print
          </button>
        </div>

        <Card className="print:border-0 print:shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 border-b pb-4">
              {bill.school_logo_url && (
                <img src={bill.school_logo_url} alt="" className="h-12 w-12 rounded object-cover" />
              )}
              <div>
                <p className="font-bold">{bill.school_name}</p>
                {bill.school_address && <p className="text-xs text-muted-foreground">{bill.school_address}</p>}
                {bill.school_phone && <p className="text-xs text-muted-foreground">{bill.school_phone}</p>}
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

            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{bill.bill_number}</p>
                <p className="text-sm text-muted-foreground">
                  {bill.student_name} ({bill.admission_number})
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize print:hidden">
                {bill.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
              <span>Bill date: {bill.bill_date}</span>
              {bill.due_date && <span>Due: {bill.due_date}</span>}
            </div>

            <div className="mt-4 flex flex-col divide-y border-t">
              {bill.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{item.description}</span>
                  <span className="font-medium">GH¢{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-semibold text-brand-navy">GH¢{Number(bill.total_amount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}