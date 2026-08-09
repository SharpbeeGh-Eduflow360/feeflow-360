import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Upload, Trash2 } from 'lucide-react'

interface StudentData {
  id: string
  admission_number: string | null
  first_name: string
  last_name: string
  photo_url: string | null
  gender: string | null
  date_of_birth: string | null
  department_id: string | null
  grade_id: string | null
  section_id: string | null
  student_type: string
  guardian_name: string | null
  guardian_phone: string | null
  guardian_email: string | null
  status: string
  admission_date: string | null
}

interface Department { id: string; name: string }
interface Grade { id: string; name: string; department_id: string }
interface Section { id: string; name: string; grade_id: string }

const statusOptions = ['active', 'promoted', 'graduated', 'transferred', 'withdrawn', 'suspended', 'alumni']

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState<StudentData | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const [studentRes, deptRes, gradeRes, sectionRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', id).single(),
        supabase.from('departments').select('id, name').order('position'),
        supabase.from('grades').select('id, name, department_id').order('position'),
        supabase.from('sections').select('id, name, grade_id'),
      ])

      if (studentRes.data) setStudent(studentRes.data)
      if (deptRes.data) setDepartments(deptRes.data)
      if (gradeRes.data) setGrades(gradeRes.data)
      if (sectionRes.data) setSections(sectionRes.data)
      setLoading(false)
    }
    load()
  }, [id])

  const gradesInDept = grades.filter((g) => g.department_id === student?.department_id)
  const sectionsInGrade = sections.filter((s) => s.grade_id === student?.grade_id)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !student) return

    setUploading(true)
    setError(null)

    const filePath = `${student.id}/photo-${Date.now()}.${file.name.split('.').pop()}`
    // Note: uses school_id folder via a join, but for simplicity we get it from student's own school
    const { data: studentRow } = await supabase.from('students').select('school_id').eq('id', student.id).single()

    const fullPath = `${studentRow?.school_id}/${filePath}`

    const { error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(fullPath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(fullPath)

    await supabase.from('students').update({ photo_url: urlData.publicUrl }).eq('id', student.id)

    setStudent({ ...student, photo_url: urlData.publicUrl })
    setUploading(false)
  }

  async function handleSave() {
    if (!student) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('students')
      .update({
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        department_id: student.department_id,
        grade_id: student.grade_id,
        section_id: student.section_id,
        student_type: student.student_type,
        guardian_name: student.guardian_name,
        guardian_phone: student.guardian_phone,
        guardian_email: student.guardian_email,
        status: student.status,
        admission_date: student.admission_date,
      })
      .eq('id', student.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  async function handleDelete() {
    if (!student) return
    if (!confirm(`Delete ${student.first_name} ${student.last_name}? This cannot be undone.`)) return

    const { error: deleteError } = await supabase.from('students').delete().eq('id', student.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    navigate('/students')
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppLayout>
    )
  }

  if (!student) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Student not found.</p>
      </AppLayout>
    )
  }

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

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{student.first_name} {student.last_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{student.admission_number}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={student.photo_url ?? undefined} />
                <AvatarFallback className="bg-brand-navy text-white">
                  {student.first_name[0]}{student.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-gold hover:underline">
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Change photo'}
                  </div>
                </Label>
                <input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Student details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>First name</Label>
                  <Input value={student.first_name} onChange={(e) => setStudent({ ...student, first_name: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Last name</Label>
                  <Input value={student.last_name} onChange={(e) => setStudent({ ...student, last_name: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Gender</Label>
                  <Select value={student.gender ?? ''} onValueChange={(v) => setStudent({ ...student, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Date of birth</Label>
                  <Input type="date" value={student.date_of_birth ?? ''} onChange={(e) => setStudent({ ...student, date_of_birth: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Student type</Label>
                  <Select value={student.student_type} onValueChange={(v) => setStudent({ ...student, student_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="boarding">Boarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Select value={student.status} onValueChange={(v) => setStudent({ ...student, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Admission date</Label>
                <Input type="date" value={student.admission_date ?? ''} onChange={(e) => setStudent({ ...student, admission_date: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Class placement</h2>

              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Select
                  value={student.department_id ?? ''}
                  onValueChange={(v) => setStudent({ ...student, department_id: v, grade_id: null, section_id: null })}
                >
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Grade</Label>
                <Select
                  value={student.grade_id ?? ''}
                  onValueChange={(v) => setStudent({ ...student, grade_id: v, section_id: null })}
                  disabled={!student.department_id}
                >
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {gradesInDept.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Section</Label>
                <Select
                  value={student.section_id ?? ''}
                  onValueChange={(v) => setStudent({ ...student, section_id: v })}
                  disabled={!student.grade_id}
                >
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {sectionsInGrade.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Parent / Guardian</h2>

              <div className="flex flex-col gap-2">
                <Label>Guardian name</Label>
                <Input value={student.guardian_name ?? ''} onChange={(e) => setStudent({ ...student, guardian_name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Phone</Label>
                  <Input value={student.guardian_phone ?? ''} onChange={(e) => setStudent({ ...student, guardian_phone: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={student.guardian_email ?? ''} onChange={(e) => setStudent({ ...student, guardian_email: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved successfully</p>}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}