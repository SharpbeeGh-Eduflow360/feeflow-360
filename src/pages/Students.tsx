import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Search, Upload } from 'lucide-react'

interface StudentRow {
  id: string
  admission_number: string | null
  first_name: string
  last_name: string
  photo_url: string | null
  status: string
  grade_id: string | null
  section_id: string | null
}

interface Grade {
  id: string
  name: string
}

interface Section {
  id: string
  name: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-brand-gold/10 text-brand-gold',
  promoted: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  graduated: 'bg-green-500/10 text-green-600 dark:text-green-400',
  transferred: 'bg-muted text-muted-foreground',
  withdrawn: 'bg-muted text-muted-foreground',
  suspended: 'bg-red-500/10 text-red-600',
  alumni: 'bg-muted text-muted-foreground',
}

const statusOptions = ['active', 'promoted', 'graduated', 'transferred', 'withdrawn', 'suspended', 'alumni']

export default function Students() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const [studentsRes, gradesRes, sectionsRes, balancesRes] = await Promise.all([
        supabase
          .from('students')
          .select('id, admission_number, first_name, last_name, photo_url, status, grade_id, section_id')
          .order('created_at', { ascending: false }),
        supabase.from('grades').select('id, name').order('position'),
        supabase.from('sections').select('id, name'),
        supabase.from('opening_balances').select('student_id, amount'),
      ])

      if (studentsRes.data) setStudents(studentsRes.data)
      if (gradesRes.data) setGrades(gradesRes.data)
      if (sectionsRes.data) setSections(sectionsRes.data)

      if (balancesRes.data) {
        const totals: Record<string, number> = {}
        for (const row of balancesRes.data) {
          totals[row.student_id] = (totals[row.student_id] ?? 0) + Number(row.amount)
        }
        setBalances(totals)
      }

      setLoading(false)
    }
    load()
  }, [])

  function gradeSectionLabel(gradeId: string | null, sectionId: string | null) {
    const grade = grades.find((g) => g.id === gradeId)
    const section = sections.find((s) => s.id === sectionId)
    if (!grade) return '—'
    return section ? `${grade.name}${section.name}` : grade.name
  }

  const filtered = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
    const query = search.toLowerCase()
    const matchesSearch =
      fullName.includes(query) || s.admission_number?.toLowerCase().includes(query)
    const matchesGrade = gradeFilter === 'all' || s.grade_id === gradeFilter
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesGrade && matchesStatus
  })

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Students</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${filtered.length} of ${students.length} students`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
  <Link to="/students/promote">
    Promote
  </Link>
</Button>
            <Button asChild variant="outline">
              <Link to="/students/import">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
            <Button asChild className="bg-brand-navy text-white hover:bg-brand-navy-light">
              <Link to="/students/new">
                <Plus className="mr-2 h-4 w-4" />
                Add student
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-muted-foreground">Loading students...</p>}

          {!loading && filtered.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {students.length === 0
                  ? 'No students yet. Add your first student to get started.'
                  : 'No students match your filters.'}
              </CardContent>
            </Card>
          )}

          {filtered.map((student) => {
            const balance = balances[student.id] ?? 0

            return (
              <Link key={student.id} to={`/students/${student.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.photo_url ?? undefined} />
                      <AvatarFallback className="bg-brand-navy text-white text-sm">
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.admission_number} · {gradeSectionLabel(student.grade_id, student.section_id)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          statusStyles[student.status] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {student.status}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          balance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {balance > 0
                          ? `GH¢${balance.toFixed(2)} owed`
                          : balance < 0
                          ? `GH¢${Math.abs(balance).toFixed(2)} credit`
                          : 'GH¢0.00'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}