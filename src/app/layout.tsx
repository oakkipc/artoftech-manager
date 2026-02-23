import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: "AOT Manager",
  description: "ระบบจัดการงานและโปรเจกต์สำหรับ Art of Tech",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#0a0a0f] text-slate-100">
        <TooltipProvider>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: '#13131a',
                border: '1px solid #27273a',
                color: '#f8fafc',
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  )
}
