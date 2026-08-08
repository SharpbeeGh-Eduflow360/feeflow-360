import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload } from 'lucide-react'

interface SchoolProfile {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  motto: string | null
}

export function SchoolProfileForm() {
  const { user } = useAuth()
  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('schools')
        .select('id, name, logo_url, address, phone, email, website, motto')
        .single()

      if (data) setSchool(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !school) return

    setUploading(true)
    setError(null)

    const filePath = `${school.id}/logo-${Date.now()}.${file.name.split('.').pop()}`

    const { error: uploadError } = await supabase.storage
      .from('school-logos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('school-logos')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('schools')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', school.id)

    setUploading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSchool({ ...school, logo_url: urlData.publicUrl })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!school) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('schools')
      .update({
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        website: school.website,
        motto: school.motto,
      })
      .eq('id', school.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  if (loading || !school) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={school.logo_url ?? undefined} />
            <AvatarFallback className="bg-brand-navy text-white">
              {school.name?.[0]?.toUpperCase() ?? 'S'}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="logo" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-gold hover:underline">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload logo'}
              </div>
            </Label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              PNG or JPG, used on bills and receipts
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">School name</Label>
            <Input
              id="name"
              value={school.name}
              onChange={(e) => setSchool({ ...school, name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="motto">Motto (optional)</Label>
            <Input
              id="motto"
              value={school.motto ?? ''}
              onChange={(e) => setSchool({ ...school, motto: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={school.address ?? ''}
              onChange={(e) => setSchool({ ...school, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={school.phone ?? ''}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={school.email ?? ''}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              value={school.website ?? ''}
              onChange={(e) => setSchool({ ...school, website: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved successfully</p>}

          <Button
            type="submit"
            disabled={saving}
            className="mt-2 w-fit bg-brand-navy text-white hover:bg-brand-navy-light"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}