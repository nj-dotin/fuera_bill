import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string | number): string {
  if (!date) return ""
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function numberToWords(amount: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function convertLessThanOneThousand(num: number): string {
    if (num === 0) return ""
    
    let str = ""
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred "
      num %= 100
    }
    
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " "
      num %= 10
    }
    
    if (num > 0) {
      str += ones[num] + " "
    }
    
    return str.trim()
  }

  if (amount === 0) return "Zero Rupees Only"

  const integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  let words = ""

  let num = integerPart
  
  if (num >= 10000000) {
    words += convertLessThanOneThousand(Math.floor(num / 10000000)) + " Crore "
    num %= 10000000
  }
  
  if (num >= 100000) {
    words += convertLessThanOneThousand(Math.floor(num / 100000)) + " Lakh "
    num %= 100000
  }
  
  if (num >= 1000) {
    words += convertLessThanOneThousand(Math.floor(num / 1000)) + " Thousand "
    num %= 1000
  }
  
  words += convertLessThanOneThousand(num)

  words = words.trim() + " Rupees"

  if (decimalPart > 0) {
    words += " and " + convertLessThanOneThousand(decimalPart) + " Paise"
  }

  return words + " Only"
}

