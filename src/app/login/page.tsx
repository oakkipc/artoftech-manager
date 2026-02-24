"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "oak@artoftech.co",
    password: "password"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Mock login - just redirect to dashboard
    setTimeout(() => {
      router.push("/dashboard")
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <Card className="w-full max-w-md bg-[#13131a]/80 backdrop-blur-xl border-[#27273a] shadow-2xl shadow-black/50 relative z-10">
        <CardHeader className="text-center space-y-6">
          {/* Logo */}
          <div className="mx-auto">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AOT Manager
              </span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              เข้าสู่ระบบเพื่อจัดการโปรเจกต์
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-[#1e1e2e] border-[#27273a] text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">รหัสผ่าน</Label>
                <a href="#" className="text-xs text-indigo-400 hover:text-cyan-400 transition-colors">
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-[#1e1e2e] border-[#27273a] text-slate-100 placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#27273a]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#13131a] text-slate-500">หรือ</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 border-[#27273a] bg-[#1e1e2e]/50 text-slate-300 hover:bg-[#27273a] hover:text-slate-100"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            เข้าสู่ระบบด้วย Google
          </Button>
          
          <p className="text-center text-xs text-slate-500">
            ยังไม่มีบัญชี?{" "}
            <a href="#" className="text-indigo-400 hover:text-cyan-400 transition-colors">
              สมัครสมาชิก
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-600 text-sm">
        © 2026 Art of Tech
      </div>
    </div>
  )
}
