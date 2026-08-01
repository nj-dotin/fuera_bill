"use client"

import * as React from "react"
import { Building, Settings, Landmark, FileText, UserCheck, ShieldAlert, Check } from "lucide-react"
import { getSettings, updateSettings, updateAdminUser } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = React.useState(false)

  // Company Settings
  const [companyName, setCompanyName] = React.useState("FUERA")
  const [logoUrl, setLogoUrl] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [gstin, setGstin] = React.useState("")
  const [pan, setPan] = React.useState("")
  const [cin, setCin] = React.useState("")
  
  // Banking
  const [bankName, setBankName] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [ifscCode, setIfscCode] = React.useState("")
  const [upiQrCodeUrl, setUpiQrCodeUrl] = React.useState("")
  const [signatureUrl, setSignatureUrl] = React.useState("")
  
  // Prefixes & Defaults
  const [defaultTerms, setDefaultTerms] = React.useState("")
  const [invoicePrefix, setInvoicePrefix] = React.useState("INV-")
  const [quotationPrefix, setQuotationPrefix] = React.useState("QTN-")

  // Admin Profile Settings
  const [adminName, setAdminName] = React.useState("Admin User")
  const [adminEmail, setAdminEmail] = React.useState("admin@fuera.com")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")

  // Signature canvas refs
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = React.useState(false)

  // Load Settings
  React.useEffect(() => {
    fetchSettings()
    fetchAdminProfile()
  }, [])

  const fetchSettings = async () => {
    const data = await getSettings()
    if (data) {
      setCompanyName(data.companyName)
      setLogoUrl(data.logoUrl || "")
      setAddress(data.address)
      setGstin(data.gstin || "")
      setPan(data.pan || "")
      setCin(data.cin || "")
      setBankName(data.bankName || "")
      setAccountNumber(data.accountNumber || "")
      setIfscCode(data.ifscCode || "")
      setUpiQrCodeUrl(data.upiQrCodeUrl || "")
      setSignatureUrl(data.signatureUrl || "")
      setDefaultTerms(data.defaultTerms)
      setInvoicePrefix(data.invoicePrefix)
      setQuotationPrefix(data.quotationPrefix)
    }
  }

  const fetchAdminProfile = async () => {
    try {
      const res = await fetch("/api/settings/profile")
      if (res.ok) {
        const user = await res.json()
        setAdminName(user.name)
        setAdminEmail(user.email)
      }
    } catch (e) {}
  }

  // Signature Drawing Actions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    
    // Get mouse or touch coordinates
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    
    // Stop default scrolling on touches
    if ("touches" in e) {
      e.preventDefault()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.strokeStyle = "#e50914" // draw in FUERA Red
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const captureSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Check if canvas is blank
    const blank = document.createElement("canvas")
    blank.width = canvas.width
    blank.height = canvas.height
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast.warning("Signature canvas is empty. Draw signature first.")
      return
    }

    const dataUrl = canvas.toDataURL("image/png")
    setSignatureUrl(dataUrl)
    toast.success("Signature captured! Make sure to save the settings.")
  }

  // Handle Logo Upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoUrl(reader.result as string)
      toast.success("Logo file processed!")
    }
    reader.readAsDataURL(file)
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      companyName,
      logoUrl: logoUrl || undefined,
      address,
      gstin: gstin || undefined,
      pan: pan || undefined,
      cin: cin || undefined,
      bankName: bankName || undefined,
      accountNumber: accountNumber || undefined,
      ifscCode: ifscCode || undefined,
      upiQrCodeUrl: upiQrCodeUrl || undefined,
      signatureUrl: signatureUrl || undefined,
      defaultTerms,
      invoicePrefix,
      quotationPrefix
    }

    const res = await updateSettings(payload)
    if (res.success) {
      toast.success("FUERA company configuration saved successfully")
      fetchSettings()
    } else {
      toast.error(res.error || "Failed to update settings")
    }
    setIsLoading(false)
  }

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      name: adminName,
      email: adminEmail,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined
    }

    const res = await updateAdminUser(payload)
    if (res.success) {
      toast.success("Admin profile updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      fetchAdminProfile()
    } else {
      toast.error(res.error || "Failed to update profile")
    }
    setIsLoading(false)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto dark">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Settings Console
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure ERP configurations, banking parameters, and admin security locks.
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-secondary/20 border border-border/40 p-1 rounded-lg">
          <TabsTrigger value="company" className="text-xs flex items-center gap-1.5 py-1.5 px-3">
            <Building className="h-3.5 w-3.5" /> Company Profile
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs flex items-center gap-1.5 py-1.5 px-3">
            <Landmark className="h-3.5 w-3.5" /> Bank & UPI
          </TabsTrigger>
          <TabsTrigger value="defaults" className="text-xs flex items-center gap-1.5 py-1.5 px-3">
            <FileText className="h-3.5 w-3.5" /> Default Terms
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-xs flex items-center gap-1.5 py-1.5 px-3">
            <UserCheck className="h-3.5 w-3.5" /> Admin Security
          </TabsTrigger>
        </TabsList>

        {/* TAB: Company Details */}
        <TabsContent value="company">
          <form onSubmit={handleCompanySubmit}>
            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Setup registration metadata and branding assets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo & Upload */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="h-20 w-44 border border-border/40 rounded-xl bg-secondary/10 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Company Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">No Logo Cache</span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="logo_file" className="text-xs font-semibold">Upload Logo Image (PNG/JPG)</Label>
                    <Input id="logo_file" type="file" accept="image/*" onChange={handleLogoUpload} className="bg-secondary/15 border-border/60 max-w-sm h-9" />
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Will be serialized as base64 and stamped onto printable quotations, invoice receipts, and dashboard elements.
                    </p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <Label htmlFor="companyName">Company Registered Name *</Label>
                    <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <Label htmlFor="address">Registered Office Address *</Label>
                    <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[70px]" required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gstin">GSTIN Number (15-digit)</Label>
                    <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="E.g. 27AAAAA1111A1Z1" className="font-mono uppercase" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pan">Corporate PAN Number</Label>
                    <Input id="pan" value={pan} onChange={(e) => setPan(e.target.value)} placeholder="10-digit PAN ID" className="font-mono uppercase" />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <Label htmlFor="cin">CIN (Corporate Identification Number)</Label>
                    <Input id="cin" value={cin} onChange={(e) => setCin(e.target.value)} placeholder="21-digit CIN string" className="font-mono uppercase" />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/10">
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    Save Company Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB: Finance (Bank & UPI QR) */}
        <TabsContent value="finance">
          <form onSubmit={handleCompanySubmit}>
            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Banking & Payments Details</CardTitle>
                <CardDescription>Setup details to enable payment collections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Banking Info Form */}
                  <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                    <div className="space-y-1.5">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="E.g. HDFC Bank, ICICI Bank" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="E.g. 5010029381923" className="font-mono" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ifscCode">IFSC Code</Label>
                      <Input id="ifscCode" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="11-digit IFSC code" className="font-mono uppercase" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="upiQr">UPI Virtual Payment Address (VPA)</Label>
                      <Input id="upiQr" value={upiQrCodeUrl} onChange={(e) => setUpiQrCodeUrl(e.target.value)} placeholder="E.g. fuerabill@oksbi" className="font-mono" />
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-normal">
                        Used to auto-generate scannable UPI QR codes on invoice detail pages for direct payments.
                      </p>
                    </div>
                  </div>

                  {/* Digital Signature Drawing Canvas */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground block">Drawn Digital Signature</Label>
                    
                    <div className="border border-border/60 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 relative">
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[160px] cursor-crosshair bg-transparent"
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-between">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="xs" onClick={clearCanvas} className="border-border/60 text-xs">Clear Canvas</Button>
                        <Button type="button" size="xs" onClick={captureSignature} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold">Capture Signature</Button>
                      </div>

                      {signatureUrl && (
                        <div className="flex items-center text-[10px] text-emerald-400 gap-1 font-bold">
                          <Check className="h-3.5 w-3.5" /> Signature Cached
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-normal mt-2.5">
                      Draw inside the panel in signature format and click &ldquo;Capture Signature&rdquo;. Make sure to click the &ldquo;Save Banking Info&rdquo; button at the bottom of the page to write to the database.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/10">
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    Save Banking Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB: Defaults */}
        <TabsContent value="defaults">
          <form onSubmit={handleCompanySubmit}>
            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Default Form Parameters & Prefixes</CardTitle>
                <CardDescription>Setup prefixes for serial numbers and default invoice terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="space-y-1.5">
                    <Label htmlFor="invoicePrefix">Invoice Prefix Code</Label>
                    <Input id="invoicePrefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quotationPrefix">Quotation Prefix Code</Label>
                    <Input id="quotationPrefix" value={quotationPrefix} onChange={(e) => setQuotationPrefix(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <Label htmlFor="defaultTerms">Default Invoice Terms & Conditions</Label>
                    <Textarea id="defaultTerms" value={defaultTerms} onChange={(e) => setDefaultTerms(e.target.value)} className="min-h-[160px] leading-relaxed" />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/10">
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    Save Defaults Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB: Admin security */}
        <TabsContent value="admin">
          <form onSubmit={handleAdminSubmit}>
            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Admin Security Profile</CardTitle>
                <CardDescription>Edit administrative credentials and password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminName">Admin User Name *</Label>
                    <Input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adminEmail">Admin Secure Email *</Label>
                    <Input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  </div>

                  <div className="col-span-1 md:col-span-2 border-t border-border/10 pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5 text-yellow-500">
                      <ShieldAlert className="h-4 w-4" /> Change Secure Password
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-normal mb-4">
                      Leave password input fields blank if you do not wish to update your current access password.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currentPass">Current Password</Label>
                    <Input id="currentPass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPass">New Password</Label>
                    <Input id="newPass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Set new secure password" />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/10">
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    Update Profile Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
