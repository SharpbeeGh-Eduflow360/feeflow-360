import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface FeeStructureRow {
  id: string
  name: string
  academic_year_id: string | null
  term_id: string | null
  grade_id: string | null
}

interface Lookup {
  id: string
  name: string
}

export default function FeeStructures() {
  const [structures, setStructures] = useState<FeeStructureRow[]>([])
  const [years, setYears] = useState<Lookup[]>([])
  const [terms, setTerms] = useState<Lookup[]>([])
  const [grades, setGrades] = useState<Lookup[]>([])
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [structRes, yearsRes, termsRes, gradesRes, itemsRes] = await Promise.all([
        supabase.from('fee_structures').select('id, name, academic_year_id, term_id, grade_id').order('created_at', { ascending: false }),
        supabase.from('academic_years').select('id, name'),
        supabase.from('terms').select('id, name'),
        supabase.from('grades').select('id, name'),
        supabase.from('fee_structure_items').select('fee_structure_id, amount'),
      ])

      if (structRes.data) setStructures(structRes.data)
      if (yearsRes.data) setYears(yearsRes.data)
      if (termsRes.data) setTerms(termsRes.data)
      if (gradesRes.data) setGrades(gradesRes.data)

      if (itemsRes.data) {
        const sums: Record<string, number> = {}
        for (const item of itemsRes.data) {
          sums[item.fee_structure_id] = (sums[item.fee_structure_id] ?? 0) + Number(item.amount)
        }
        setTotals(sums)
      }

      setLoading(false)
    }
    load()
  }, [])

  function lookup(list: Lookup[], id: string | null) {
    return list.find((l) => l.id === id)?.name ?? null
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fee Structures</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Fee bundles used to generate bills.
            </p>
          </div>
          <Button asChild className="bg-brand-navy text-white hover:bg-brand-navy-light">
            <Link to="/fee-structures/new">
              <Plus className="mr-2 h-4 w-4" />
              New structure
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {!loading && structures.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                No fee structures yet. Create one to start billing students.
              </CardContent>
            </Card>
          )}

          {structures.map((s) => (
            <Link key={s.id} to={`/fee-structures/${s.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[lookup(years, s.academic_year_id), lookup(terms, s.term_id), lookup(grades, s.grade_id)]
                        .filter(Boolean)
                        .join(' · ') || 'No filters set'}
                    </p>
                  </div>
                  <span className="font-semibold text-brand-gold">
                    GH¢{(totals[s.id] ?? 0).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}