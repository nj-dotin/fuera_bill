import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { getQuotationFormData } from "@/app/actions/quotations"
import { QuotationForm } from "@/components/quotation-form"

export const revalidate = 0 // force dynamic render

interface EditQuotationPageProps {
  params: Promise<{ id: string }>
}

export default async function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { id } = await params

  const [quotation, formData] = await Promise.all([
    db.quotation.findUnique({
      where: { id },
      include: { items: true }
    }),
    getQuotationFormData()
  ])

  if (!quotation) {
    notFound()
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto dark">
      <QuotationForm
        customers={formData.customers}
        products={formData.products}
        nextNumber={formData.nextNumber}
        initialData={quotation}
      />
    </div>
  )
}
