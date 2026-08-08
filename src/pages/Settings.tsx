import { AppLayout } from '@/components/layout/AppLayout'
import { SchoolProfileForm } from '@/components/settings/SchoolProfileForm'

export default function Settings() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your school's profile and preferences
        </p>

        <div className="mt-6">
          <SchoolProfileForm />
        </div>
      </div>
    </AppLayout>
  )
}