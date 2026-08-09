import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSchool } from '@/hooks/useSchool'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Pencil, Check } from 'lucide-react'

interface FeeCategory {
  id: string
  name: string
  description: string | null
}

export default function FeeCategories() {
  const { school } = useSchool()
  const [categories, setCategories] = useState<FeeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('fee_categories')
      .select('id, name, description')
      .order('name')
    if (data) setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [school])

  async function handleAdd() {
    if (!school || !newName.trim()) return
    setError(null)

    const { error: insertError } = await supabase.from('fee_categories').insert({
      school_id: school.id,
      name: newName.trim(),
      description: newDescription.trim() || null,
    })

    if (insertError) return setError(insertError.message)
    setNewName('')
    setNewDescription('')
    setShowForm(false)
    loadCategories()
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    setError(null)

    const { error: updateError } = await supabase
      .from('fee_categories')
      .update({ name: editName.trim(), description: editDescription.trim() || null })
      .eq('id', id)

    if (updateError) return setError(updateError.message)
    setEditingId(null)
    loadCategories()
  }

  async function handleDelete(id: string) {
    setError(null)
    const { error: deleteError } = await supabase.from('fee_categories').delete().eq('id', id)

    if (deleteError) {
      setError('This category is used in a fee structure and cannot be deleted.')
      return
    }
    loadCategories()
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fee Categories</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reusable fee types like Tuition, Feeding, or PTA.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" />
            Add category
          </Button>
        </div>

        {showForm && (
          <Card className="mt-4">
            <CardContent className="flex flex-col gap-3 pt-6">
              <div>
                <Label className="text-xs">Category name</Label>
                <Input
                  placeholder="e.g. Tuition"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Description (optional)</Label>
                <Input
                  placeholder="e.g. Core academic tuition fee"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button size="sm" onClick={handleAdd} className="w-fit bg-brand-navy text-white hover:bg-brand-navy-light">
                Add
              </Button>
            </CardContent>
          </Card>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

          {!loading && categories.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                No fee categories yet. Add your first one, e.g. "Tuition."
              </CardContent>
            </Card>
          )}

          {categories.map((cat) => {
            const isEditing = editingId === cat.id
            return (
              <Card key={cat.id}>
                <CardContent className="py-3">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                      <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-8" placeholder="Description" />
                      <Button size="sm" onClick={() => handleUpdate(cat.id)} className="w-fit">
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingId(cat.id)
                            setEditName(cat.name)
                            setEditDescription(cat.description ?? '')
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}