"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { UserFormDialog } from "./UserFormDialog"
import { Plus, Search, Trash2, Edit2, Crown, Shield, Users, User } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: "SUPER_ADMIN" | "ADMIN" | "OFFICER" | "MEMBER"
  createdAt: Date
  _count: {
    ownedProjects: number
    assignedTasks: number
  }
}

interface UsersTableProps {
  initialUsers: User[]
  currentUserRole: string
}

const roleConfig = {
  SUPER_ADMIN: { 
    label: "ซูเปอร์แอดมิน", 
    icon: Crown,
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" 
  },
  ADMIN: { 
    label: "แอดมิน", 
    icon: Shield,
    className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" 
  },
  OFFICER: { 
    label: "เจ้าหน้าที่", 
    icon: Users,
    className: "bg-purple-500/10 text-purple-400 border-purple-500/30" 
  },
  MEMBER: { 
    label: "สมาชิก", 
    icon: User,
    className: "bg-slate-500/10 text-slate-400 border-slate-500/30" 
  },
}

export function UsersTable({ initialUsers, currentUserRole }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Permission check
  const canManageUser = (targetRole: string) => {
    if (currentUserRole === "SUPER_ADMIN") return true
    if (currentUserRole === "ADMIN") return targetRole !== "SUPER_ADMIN"
    return false
  }

  const handleCreateUser = async (data: { name: string; email: string; role: string; password?: string }) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      const newUser = await response.json()
      setUsers([newUser, ...users])
      toast.success("สร้างผู้ใช้สำเร็จ")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, data: { name: string; email: string; role: string; password?: string }) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      const updatedUser = await response.json()
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...updatedUser } : u)))
      toast.success("อัปเดตผู้ใช้สำเร็จ")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      setUsers(users.filter((u) => u.id !== userId))
      toast.success("ลบผู้ใช้สำเร็จ")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Stats
  const stats = {
    total: users.length,
    superAdmin: users.filter(u => u.role === "SUPER_ADMIN").length,
    admin: users.filter(u => u.role === "ADMIN").length,
    officer: users.filter(u => u.role === "OFFICER").length,
    member: users.filter(u => u.role === "MEMBER").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="ค้นหาผู้ใช้..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#13131a] border-[#27273a] text-slate-100 placeholder:text-slate-600"
          />
        </div>

        {(currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN") && (
          <UserFormDialog
            onSubmit={handleCreateUser}
            trigger={
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มผู้ใช้
              </Button>
            }
            currentUserRole={currentUserRole}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
          <div className="text-sm text-slate-500">ทั้งหมด</div>
        </div>
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats.superAdmin}</div>
          <div className="text-sm text-slate-500">ซูเปอร์แอดมิน</div>
        </div>
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-400">{stats.admin}</div>
          <div className="text-sm text-slate-500">แอดมิน</div>
        </div>
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">{stats.officer}</div>
          <div className="text-sm text-slate-500">เจ้าหน้าที่</div>
        </div>
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-400">{stats.member}</div>
          <div className="text-sm text-slate-500">สมาชิก</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#13131a] border border-[#27273a] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#27273a] hover:bg-transparent">
              <TableHead className="text-slate-400">ผู้ใช้</TableHead>
              <TableHead className="text-slate-400">บทบาท</TableHead>
              <TableHead className="text-slate-400">โปรเจกต์</TableHead>
              <TableHead className="text-slate-400">งาน</TableHead>
              <TableHead className="text-slate-400">เข้าร่วม</TableHead>
              <TableHead className="text-slate-400 text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const role = roleConfig[user.role]
              const RoleIcon = role.icon
              const canEdit = canManageUser(user.role)
              
              return (
                <TableRow key={user.id} className="border-[#27273a] hover:bg-[#1a1a23]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-100">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${role.className} flex items-center gap-1`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {role.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{user._count.ownedProjects}</TableCell>
                  <TableCell className="text-slate-300">{user._count.assignedTasks}</TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit ? (
                      <div className="flex items-center justify-end gap-2">
                        <UserFormDialog
                          user={user}
                          onSubmit={(data) => handleUpdateUser(user.id, data)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          }
                          currentUserRole={currentUserRole}
                        />

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#13131a] border-[#27273a]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-slate-100">
                                ยืนยันการลบผู้ใช้
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                คุณแน่ใจหรือไม่ว่าต้องการลบ {user.name}? การกระทำนี้ไม่สามารถย้อนกลับได้
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-[#27273a] bg-transparent text-slate-300 hover:bg-[#27273a]">
                                ยกเลิก
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                ลบผู้ใช้
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-sm">ไม่มีสิทธิ์</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">ไม่พบผู้ใช้</p>
          </div>
        )}
      </div>
    </div>
  )
}
