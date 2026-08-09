import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
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
import { Upload } from 'lucide-react'

interface Department {
  id: string
  name: string
}

interface Grade {
  id: string
  name: string
  department_id: string
}

interface Section {
  id: string
  name: string
  grade_id: string
}

export default function AddStudent() {
  const navigate = useNavigate()
  const { school } = useSchool()

  const [departments, setDepartments] = useState<Department[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [sections, setSections] = useState<Section[]>([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [studentType, setStudentType] = useState('day')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStructure() {
      const [deptRes, gradeRes, sectionRes] = await Promise.all([
        supabase.from('departments').select('id, name').order('position'),
        supabase.from('grades').select('id, name, department_id').order('position'),
        supabase.from('sections').select('id, name, grade_id'),
      ])
      if (deptRes.data) setDepartments(deptRes.data)
      if (gradeRes.data) setGrades(gradeRes.data)
      if (sectionRes.data) setSections(sectionRes.data)
    }
    loadStructure()
  }, [])

  const gradesInDept = grades.filter((g) => g.department_id === departmentId)
  const sectionsInGrade = sections.filter((s) => s.grade_id === gradeId)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!school || !firstName.trim() || !lastName.trim()) return

    setSaving(true)
    setError(null)

    let photoUrl: string | null = null

    if (photoFile) {
      const filePath = `${school.id}/student-${Date.now()}.${photoFile.name.split('.').pop()}`
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, photoFile)

      if (uploadError) {
        setError(uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(filePath)
      photoUrl = urlData.publicUrl
    }

    const { data, error: insertError } = await supabase
      .from('students')
      .insert({
        school_id: school.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender || null,
        date_of_birth: dob || null,
        department_id: departmentId || null,
        grade_id: gradeId || null,
        section_id: sectionId || null,
        student_type: studentType,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        guardian_email: guardianEmail || null,
        admission_date: admissionDate || null,
        photo_url: photoUrl,
      })
      .select()
      .single()

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    navigate(`/students/${data.id}`)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Add student</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admission number will be generated automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          {/* Photo */}
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photoPreview ?? undefined} />
                <AvatarFallback className="bg-brand-navy text-white">
                  {firstName[0] ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-gold hover:underline">
                    <Upload className="h-4 w-4" />
                    Upload photo
                  </div>
                </Label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic info */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Student details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Student type</Label>
                <Select value={studentType} onValueChange={setStudentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="admissionDate">Admission date</Label>
                <Input id="admissionDate" type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Academic placement */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Class placement</h2>

              <div className="flex flex-col gap-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setGradeId(''); setSectionId('') }}>
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
                <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setSectionId('') }} disabled={!departmentId}>
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
                <Select value={sectionId} onValueChange={setSectionId} disabled={!gradeId}>
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

          {/* Guardian info */}
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <h2 className="text-sm font-semibold text-muted-foreground">Parent / Guardian</h2>

              <div className="flex flex-col gap-2">
                <Label htmlFor="guardianName">Guardian name</Label>
                <Input id="guardianName" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guardianPhone">Phone</Label>
                  <Input id="guardianPhone" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="guardianEmail">Email</Label>
                  <Input id="guardianEmail" type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={saving}
            className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {saving ? 'Saving...' : 'Add student'}
          </Button>
        </form>
      </div>
    </AppLayout>
  )
}