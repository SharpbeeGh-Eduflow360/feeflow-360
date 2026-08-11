import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import FeeCategoriesTab from '@/components/billing/FeeCategoriesTab'
import FeeStructuresTab from '@/components/billing/FeeStructuresTab'
import BillsTab from '@/components/billing/BillsTab'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Billing() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold">Billing</h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Manage fee categories, fee structures, and bills.
    </p>
  </div>
  <Button asChild className="bg-brand-navy text-white hover:bg-brand-navy-light">
    <Link to="/billing/bulk">Bulk generate</Link>
  </Button>
  <Button asChild variant="outline">
  <Link to="/billing/print">Print by grade</Link>
</Button>
</div>
        <Tabs defaultValue="bills" className="mt-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="structures">Fee Structures</TabsTrigger>
            <TabsTrigger value="categories">Fee Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="bills" className="mt-4">
            <BillsTab />
          </TabsContent>

          <TabsContent value="structures" className="mt-4">
            <FeeStructuresTab />
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <FeeCategoriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}