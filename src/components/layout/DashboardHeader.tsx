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

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
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
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all"
            >
              แดชบอร์ด
            </a>
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
                <span className="hidden sm:inline text-sm text-slate-300">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="w-56 bg-[#13131a] border-[#27273a]"
            >
              <DropdownMenuLabel className="text-slate-400">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
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
