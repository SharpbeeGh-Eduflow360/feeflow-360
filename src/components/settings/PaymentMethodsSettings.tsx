import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const allMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'pos', label: 'POS' },
  { value: 'card', label: 'Card' },
]

export function PaymentMethodsSettings() {
  const { school, refetch } = useSchool()
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMethods() {
      if (!school) return
      const { data } = await supabase
        .from('schools')
        .select('payment_methods')
        .eq('id', school.id)
        .single()

      if (data?.payment_methods) setSelected(data.payment_methods)
    }
    loadMethods()
  }, [school])

  function toggleMethod(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    )
  }

  async function handleSave() {
    if (!school) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('schools')
      .update({ payment_methods: selected })
      .eq('id', school.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    refetch()
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold">Payment Methods</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which payment methods your school accepts.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {allMethods.map((method) => (
            <div key={method.value} className="flex items-center gap-2">
              <Checkbox
                id={method.value}
                checked={selected.includes(method.value)}
                onCheckedChange={() => toggleMethod(method.value)}
              />
              <Label htmlFor={method.value} className="cursor-pointer font-normal">
                {method.label}
              </Label>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">Saved</p>}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-brand-navy text-white hover:bg-brand-navy-light"
        >
          {saving ? 'Saving...' : 'Save payment methods'}
        </Button>
      </CardContent>
    </Card>
  )
}