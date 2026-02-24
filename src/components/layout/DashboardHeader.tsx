"use client"

import { User } from "next-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import { Users, LayoutDashboard, Shield, Crown } from "lucide-react"

interface DashboardHeaderProps {
  user: User
}

// Permission helpers
const canManageUsers = (role: string) => ["SUPER_ADMIN", "ADMIN"].includes(role)
const canAccessAdmin = (role: string) => ["SUPER_ADMIN", "ADMIN", "OFFICER"].includes(role)

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "ซูเปอร์แอดมิน",
    ADMIN: "แอดมิน",
    OFFICER: "เจ้าหน้าที่",
    MEMBER: "สมาชิก"
  }

  const roleIcon: Record<string, React.ReactNode> = {
    SUPER_ADMIN: <Crown className="w-4 h-4 text-yellow-400" />,
    ADMIN: <Shield className="w-4 h-4 text-indigo-400" />,
    OFFICER: <Shield className="w-4 h-4 text-purple-400" />,
    MEMBER: null
  }

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">
              <span className="gradient-text">AOT</span> Manager
            </span>
          </a>
          
          <nav className="hidden md:flex items-center gap-1">
            <a 
              href="/dashboard" 
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              แดชบอร์ด
            </a>
            
            {canManageUsers(user.role) && (
              <a 
                href="/admin/users" 
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                จัดการผู้ใช้
              </a>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-3 hover:bg-white/5"
              >
                <Avatar className="w-8 h-8 ring-2 ring-indigo-500/30">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm text-slate-300">{user.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    {roleIcon[user.role]}
                    {roleLabel[user.role]}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="w-56 bg-[#13131a] border-[#27273a]"
            >
              <DropdownMenuLabel className="text-slate-400">
                <div>{user.email}</div>
                <div className="text-xs flex items-center gap-1 mt-1">
                  {roleIcon[user.role]}
                  <span className={
                    user.role === "SUPER_ADMIN" ? "text-yellow-400" :
                    user.role === "ADMIN" ? "text-indigo-400" :
                    user.role === "OFFICER" ? "text-purple-400" : "text-slate-500"
                  }>
                    {roleLabel[user.role]}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              
              {canManageUsers(user.role) && (
                <>
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/admin/users"}
                    className="text-slate-300 focus:text-slate-100 focus:bg-white/5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    จัดการผู้ใช้
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                </>
              )}
              
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
