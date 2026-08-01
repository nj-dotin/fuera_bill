import { getQuotationFormData } from "@/app/actions/quotations"
import { QuotationForm } from "@/components/quotation-form"

export const revalidate = 0 // force dynamic render

export default async function NewQuotationPage() {
  const { customers, products, nextNumber } = await getQuotationFormData()

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto dark">
      <QuotationForm
        customers={customers}
        products={products}
        nextNumber={nextNumber}
      />
    </div>
  )
}
