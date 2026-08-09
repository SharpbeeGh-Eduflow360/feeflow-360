import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
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

const currencies = [
  { code: 'GHS', label: 'Ghana Cedi (GH₵)' },
  { code: 'NGN', label: 'Nigerian Naira (₦)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
]

export function CurrencySettings() {
  const { school, refetch } = useSchool()
  const [currency, setCurrency] = useState('GHS')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (school?.currency) setCurrency(school.currency)
  }, [school])

  async function handleSave() {
    if (!school) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('schools')
      .update({ currency })
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
        <h2 className="text-lg font-semibold">Currency</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used across bills, receipts, and financial reports.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">Saved</p>}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-brand-navy text-white hover:bg-brand-navy-light"
        >
          {saving ? 'Saving...' : 'Save currency'}
        </Button>
      </CardContent>
    </Card>
  )
}