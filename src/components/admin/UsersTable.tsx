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
import { Plus, Search, Trash2, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
  _count: {
    ownedProjects: number
    assignedTasks: number
  }
}

interface UsersTableProps {
  initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

        <UserFormDialog
          onSubmit={handleCreateUser}
          trigger={
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ใช้
            </Button>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-slate-100">{users.length}</div>
          <div className="text-sm text-slate-500">ผู้ใช้ทั้งหมด</div>
        </div>
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-400">{users.filter(u => u.role === "ADMIN").length}</div>
          <div className="text-sm text-slate-500">แอดมิน</div>
        </div>
        <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === "MEMBER").length}</div>
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
            {filteredUsers.map((user) => (
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
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className={
                      user.role === "ADMIN"
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                        : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    }
                  >
                    {user.role === "ADMIN" ? "แอดมิน" : "สมาชิก"}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300">{user._count.ownedProjects}</TableCell>
                <TableCell className="text-slate-300">{user._count.assignedTasks}</TableCell>
                <TableCell className="text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString("th-TH")}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
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
