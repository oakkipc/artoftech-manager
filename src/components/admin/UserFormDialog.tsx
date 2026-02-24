"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Crown, Shield, User, Users } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface UserFormDialogProps {
  user?: User
  onSubmit: (data: { name: string; email: string; role: string; password?: string }) => void
  trigger: React.ReactNode
  currentUserRole?: string
}

const roleOptions = [
  { value: "SUPER_ADMIN", label: "ซูเปอร์แอดมิน", icon: Crown, color: "text-yellow-400" },
  { value: "ADMIN", label: "แอดมิน", icon: Shield, color: "text-indigo-400" },
  { value: "OFFICER", label: "เจ้าหน้าที่", icon: Users, color: "text-purple-400" },
  { value: "MEMBER", label: "สมาชิก", icon: User, color: "text-slate-400" },
]

export function UserFormDialog({ user, onSubmit, trigger, currentUserRole }: UserFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "MEMBER",
    password: ""
  })

  // Filter available roles based on current user's role
  const availableRoles = (() => {
    if (currentUserRole === "SUPER_ADMIN") return roleOptions
    if (currentUserRole === "ADMIN") return roleOptions.filter(r => r.value !== "SUPER_ADMIN")
    return roleOptions.filter(r => r.value === "MEMBER")
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const submitData: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role
    }
    
    if (formData.password) {
      submitData.password = formData.password
    }
    
    await onSubmit(submitData)
    setIsLoading(false)
    setOpen(false)
    
    if (!user) {
      setFormData({ name: "", email: "", role: "MEMBER", password: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#13131a] border-[#27273a] text-slate-100">
        <DialogHeader>
          <DialogTitle>{user ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {user ? "แก้ไขข้อมูลผู้ใช้" : "สร้างบัญชีผู้ใช้ใหม่ในระบบ"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">ชื่อ</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-[#1e1e2e] border-[#27273a] text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">อีเมล</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-[#1e1e2e] border-[#27273a] text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-300">บทบาท</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="bg-[#1e1e2e] border-[#27273a] text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e2e] border-[#27273a]">
                {availableRoles.map((role) => {
                  const Icon = role.icon
                  return (
                    <SelectItem 
                      key={role.value} 
                      value={role.value} 
                      className="text-slate-100"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${role.color}`} />
                        {role.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              {user ? "รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              minLength={6}
              className="bg-[#1e1e2e] border-[#27273a] text-slate-100"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#27273a] bg-transparent text-slate-300 hover:bg-[#27273a]"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isLoading ? "กำลังบันทึก..." : user ? "บันทึก" : "สร้างบัญชี"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
