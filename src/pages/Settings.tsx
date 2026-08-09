import { AppLayout } from '@/components/layout/AppLayout'
import { SchoolProfileForm } from '@/components/settings/SchoolProfileForm'
import { LevelsClasses } from '@/components/settings/LevelsClasses'
import { CurrencySettings } from '@/components/settings/CurrencySettings'
import { PaymentMethodsSettings } from '@/components/settings/PaymentMethodsSettings'
import { AcademicYearsView } from '@/components/settings/AcademicYearsView'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

export default function Settings() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your school's profile and preferences
        </p>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="academic">Academic Years</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <SchoolProfileForm />
          </TabsContent>

          <TabsContent value="structure" className="mt-4">
            <LevelsClasses />
          </TabsContent>

          <TabsContent value="academic" className="mt-4">
            <AcademicYearsView />
          </TabsContent>

          <TabsContent value="currency" className="mt-4">
            <CurrencySettings />
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <PaymentMethodsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}