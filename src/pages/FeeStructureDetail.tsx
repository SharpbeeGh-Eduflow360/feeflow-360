import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'

interface StructureData {
  id: string
  name: string
  academic_year_id: string | null
  term_id: string | null
  student_type: string | null
}

interface Item {
  id: string
  amount: number
  quantity: number
  unit_price: number
  fee_category_id: string
}

interface Lookup {
  id: string
  name: string
}

export default function FeeStructureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [structure, setStructure] = useState<StructureData | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Lookup[]>([])
  const [years, setYears] = useState<Lookup[]>([])
  const [terms, setTerms] = useState<Lookup[]>([])
  const [assignedGradeNames, setAssignedGradeNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [structRes, itemsRes, catRes, yearsRes, termsRes, gradeLinksRes] = await Promise.all([
        supabase.from('fee_structures').select('*').eq('id', id).single(),
        supabase.from('fee_structure_items').select('id, amount, quantity, unit_price, fee_category_id').eq('fee_structure_id', id),
        supabase.from('fee_categories').select('id, name'),
        supabase.from('academic_years').select('id, name'),
        supabase.from('terms').select('id, name'),
        supabase.from('fee_structure_grades').select('grade_id, grades(name)').eq('fee_structure_id', id),
      ])

      if (structRes.data) setStructure(structRes.data)
      if (itemsRes.data) setItems(itemsRes.data)
      if (catRes.data) setCategories(catRes.data)
      if (yearsRes.data) setYears(yearsRes.data)
      if (termsRes.data) setTerms(termsRes.data)

      if (gradeLinksRes.data) {
        const names = gradeLinksRes.data
          .map((row: any) => row.grades?.name)
          .filter(Boolean)
        setAssignedGradeNames(names)
      }

      setLoading(false)
    }
    load()
  }, [id])

  function lookup(list: Lookup[], lookupId: string | null) {
    return list.find((l) => l.id === lookupId)?.name ?? null
  }

  const total = items.reduce((sum, item) => sum + Number(item.amount), 0)

  async function handleDelete() {
    if (!structure) return
    if (!confirm(`Delete "${structure.name}"? This cannot be undone.`)) return

    const { error } = await supabase.from('fee_structures').delete().eq('id', structure.id)

    if (!error) {
      navigate('/billing')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppLayout>
    )
  }

  if (!structure) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Fee structure not found.</p>
      </AppLayout>
    )
  }

  const tags = [
    lookup(years, structure.academic_year_id),
    lookup(terms, structure.term_id),
    structure.student_type,
    ...assignedGradeNames,
  ].filter(Boolean)

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
          <h1 className="text-2xl font-bold">{structure.name}</h1>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">Fee items</h2>

            <div className="mt-3 flex flex-col divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-sm">{lookup(categories, item.fee_category_id)}</span>
                    {Number(item.quantity) !== 1 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({item.quantity} × GH¢{Number(item.unit_price).toFixed(2)})
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">GH¢{Number(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-semibold text-brand-gold">GH¢{total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}