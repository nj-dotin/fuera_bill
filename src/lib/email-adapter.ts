/**
 * Future Email Ready Integration Adapter for FUERA ERP.
 * Stub definitions to plug in SMTP, Resend, or SendGrid clients.
 */

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export const emailAdapter = {
  /**
   * Send Invoice Email
   */
  async sendInvoiceEmail(
    to: string,
    invoiceNumber: string,
    amount: string,
    pdfBase64?: string
  ): Promise<EmailSendResult> {
    console.log(`[Email Dispatcher] Sending Invoice ${invoiceNumber} to ${to} for amount ${amount}. Attachment size: ${pdfBase64 ? `${(pdfBase64.length / 1024).toFixed(1)} KB` : "None"}`)
    
    // Simulate SMTP network call
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substring(2, 11)}`
    }
  },

  /**
   * Send Quotation Email
   */
  async sendQuotationEmail(
    to: string,
    quotationNumber: string,
    pdfBase64?: string
  ): Promise<EmailSendResult> {
    console.log(`[Email Dispatcher] Sending Quotation ${quotationNumber} to ${to}. Attachment: ${pdfBase64 ? "Yes" : "No"}`)
    
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substring(2, 11)}`
    }
  },

  /**
   * Send Payment Reminder
   */
  async sendPaymentReminderEmail(
    to: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string
  ): Promise<EmailSendResult> {
    console.log(`[Email Dispatcher] Sending Overdue Payment Reminder for ${invoiceNumber} to ${to}. Due: ${dueDate}`)
    
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    return {
      success: true,
      messageId: `msg_${Math.random().toString(36).substring(2, 11)}`
    }
  }
}
