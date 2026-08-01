/**
 * Future AI Ready Integration Adapter for FUERA ERP.
 * Exposes standard adapter methods to plug in Gemini API.
 */

export interface AIServiceResponse {
  success: boolean
  content: string
  error?: string
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt: string, fallback: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    // Return a beautiful mock placeholder that works immediately
    return `[Mock AI Response - API Key Not Found]\n\n${fallback}`
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    return content || `[Empty Response from Gemini]\n\n${fallback}`
  } catch (error: any) {
    console.error("AI Service Error:", error)
    return `[AI Error: ${error.message}]\n\n${fallback}`
  }
}

export const aiAdapter = {
  /**
   * AI Proposal Writer
   */
  async generateProposal(customerName: string, notes: string): Promise<AIServiceResponse> {
    const prompt = `Write a professional business project proposal for customer "${customerName}" based on notes: "${notes}". Format it with clean headers.`
    const fallback = `PROPOSAL FOR ${customerName.toUpperCase()}\n\nScope of Work:\n- Tailored setup based on instructions: ${notes}\n\nTerms:\n- Validity: 30 days\n- Price: To be verified in quote.`
    
    const content = await callGemini(prompt, fallback)
    return { success: true, content }
  },

  /**
   * AI Email Writer for Quotation, Invoice, or Payment Reminder
   */
  async generateEmail(type: "invoice" | "quotation" | "reminder", reference: string, customerPerson: string, companyName: string, amount: string): Promise<AIServiceResponse> {
    const prompts = {
      invoice: `Write a short, professional email to ${customerPerson} from ${companyName} attached with invoice ${reference} for ${amount}.`,
      quotation: `Write a warm, professional email to ${customerPerson} from ${companyName} attached with proposal quote ${reference}.`,
      reminder: `Write a polite, firm payment reminder email to ${customerPerson} from ${companyName} for outstanding invoice ${reference} amounting to ${amount}.`
    }

    const prompt = prompts[type]
    const fallbacks = {
      invoice: `Dear ${customerPerson},\n\nPlease find attached invoice ${reference} of amount ${amount} for your recent purchases from FUERA.\n\nBest regards,\nFUERA ERP`,
      quotation: `Dear ${customerPerson},\n\nWe are pleased to send our quotation ${reference} for your review. Let us know if you have questions.\n\nBest regards,\nFUERA ERP`,
      reminder: `Dear ${customerPerson},\n\nThis is a gentle reminder that invoice ${reference} of ${amount} is currently outstanding. We appreciate your prompt payment.\n\nBest regards,\nFUERA ERP`
    }

    const content = await callGemini(prompt, fallbacks[type])
    return { success: true, content }
  },

  /**
   * AI Business Analytics
   */
  async analyzeBusinessMetrics(totalRevenue: number, totalExpenses: number, outstandingBalance: number): Promise<AIServiceResponse> {
    const prompt = `Analyze business performance metrics: Total Revenue: ${totalRevenue}, Expenses: ${totalExpenses}, Net Profit: ${totalRevenue - totalExpenses}, Outstanding Payments: ${outstandingBalance}. Give 3 quick actionable items to improve cash flow.`
    const fallback = `Business insights:\n1. Outstanding payments stand at ${outstandingBalance}. Follow up on overdue bills first to improve cash ratio.\n2. Expense ratio is ${((totalExpenses / (totalRevenue || 1)) * 100).toFixed(1)}%. Inspect travel or administrative costs for optimization.\n3. Net margin is positive. Consider reinvesting into inventory.`
    
    const content = await callGemini(prompt, fallback)
    return { success: true, content }
  },

  /**
   * AI Customer Insights
   */
  async getCustomerInsights(companyName: string, historySummary: string): Promise<AIServiceResponse> {
    const prompt = `Give a concise customer relationship summary for "${companyName}" based on purchase history: "${historySummary}". Identify their lifetime value pattern.`
    const fallback = `Insights for ${companyName}:\n- Regular purchaser of service lines. High retention risk if response times drop.\n- Opportunity to cross-sell support agreements.\n- LTV trajectory is stable.`
    
    const content = await callGemini(prompt, fallback)
    return { success: true, content }
  }
}
