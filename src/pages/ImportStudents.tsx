import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ParsedRow {
  first_name: string
  last_name: string
  gender?: string
  date_of_birth?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  opening_balance?: string
  valid: boolean
  error?: string
}

const REQUIRED_COLUMNS = ['first_name', 'last_name']

export default function ImportStudents() {
  const navigate = useNavigate()
  const { school } = useSchool()
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setParseError(null)
    setResult(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? []
        const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))

        if (missing.length > 0) {
          setParseError(
            `Missing required column(s): ${missing.join(', ')}. Your CSV must include: ${REQUIRED_COLUMNS.join(', ')}`
          )
          setRows([])
          return
        }

        const parsed: ParsedRow[] = results.data.map((row) => {
          const first_name = row.first_name?.trim() ?? ''
          const last_name = row.last_name?.trim() ?? ''
          const valid = first_name.length > 0 && last_name.length > 0

          return {
            first_name,
            last_name,
            gender: row.gender?.trim(),
            date_of_birth: row.date_of_birth?.trim(),
            guardian_name: row.guardian_name?.trim(),
            guardian_phone: row.guardian_phone?.trim(),
            guardian_email: row.guardian_email?.trim(),
            opening_balance: row.opening_balance?.trim(),
            valid,
            error: valid ? undefined : 'Missing first or last name',
          }
        })

        setRows(parsed)
      },
      error: (err) => {
        setParseError(err.message)
      },
    })
  }

  async function handleImport() {
    if (!school) return
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) return

    setImporting(true)
    let successCount = 0
    let failedCount = 0

    const batchSize = 50
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batchRows = validRows.slice(i, i + batchSize)
      const batch = batchRows.map((r) => ({
        school_id: school.id,
        first_name: r.first_name,
        last_name: r.last_name,
        gender: r.gender || null,
        date_of_birth: r.date_of_birth || null,
        guardian_name: r.guardian_name || null,
        guardian_phone: r.guardian_phone || null,
        guardian_email: r.guardian_email || null,
      }))

      const { error, data } = await supabase.from('students').insert(batch).select('id')

      if (error || !data) {
        failedCount += batch.length
        continue
      }

      successCount += data.length

      // Insert opening balances for rows that specified one, matched by insert order
      const openingBalanceInserts = data
        .map((studentRow, idx) => {
          const amountStr = batchRows[idx]?.opening_balance
          const amount = amountStr ? parseFloat(amountStr) : NaN
          if (isNaN(amount) || amount === 0) return null
          return {
            school_id: school.id,
            student_id: studentRow.id,
            amount,
            note: 'Initial balance recorded during bulk import',
          }
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)

      if (openingBalanceInserts.length > 0) {
        await supabase.from('opening_balances').insert(openingBalanceInserts)
      }
    }

    setImporting(false)
    setResult({ success: successCount, failed: failedCount })
  }

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.length - validCount

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </button>

        <h1 className="mt-4 text-2xl font-bold">Import students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV file with your students. Class placement and photos can
          be added individually afterward.
        </p>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold">Required columns</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">first_name</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">last_name</code>
            </p>
            <h2 className="mt-4 text-sm font-semibold">Optional columns</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">gender</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">date_of_birth</code> (YYYY-MM-DD),{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">guardian_name</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">guardian_phone</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">guardian_email</code>,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">opening_balance</code>
            </p>

            <div className="mt-6">
              <label htmlFor="csvFile" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:border-brand-gold">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {fileName ?? 'Click to select a CSV file'}
                  </p>
                </div>
              </label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {parseError && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </p>
            )}
          </CardContent>
        </Card>

        {rows.length > 0 && !result && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Preview ({rows.length} rows)
                </h2>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600">{validCount} valid</span>
                  {invalidCount > 0 && <span className="text-red-600">{invalidCount} invalid</span>}
                </div>
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/50">
                    <tr>
                      <th className="p-2 text-left font-medium">Name</th>
                      <th className="p-2 text-left font-medium">Guardian</th>
                      <th className="p-2 text-left font-medium">Opening balance</th>
                      <th className="p-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="p-2 text-muted-foreground">{row.guardian_name || '—'}</td>
                        <td className="p-2 text-muted-foreground">{row.opening_balance || '—'}</td>
                        <td className="p-2">
                          {row.valid ? (
                            <span className="text-green-600">Valid</span>
                          ) : (
                            <span className="text-red-600">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="mt-4 w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
              >
                {importing ? 'Importing...' : `Import ${validCount} students`}
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-3 pt-6 pb-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-brand-gold" />
              <div>
                <h2 className="font-semibold">Import complete</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.success} students imported successfully
                  {result.failed > 0 && `, ${result.failed} failed`}
                </p>
              </div>
              <Button onClick={() => navigate('/students')} className="bg-brand-navy text-white hover:bg-brand-navy-light">
                View students
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}