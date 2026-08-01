import { getInvoiceFormData } from "@/app/actions/invoices"
import { InvoiceForm } from "@/components/invoice-form"

export const revalidate = 0 // force dynamic render

export default async function NewInvoicePage() {
  const { customers, products, nextNumber } = await getInvoiceFormData()

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto dark">
      <InvoiceForm
        customers={customers}
        products={products}
        nextNumber={nextNumber}
      />
    </div>
  )
}
