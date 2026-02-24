import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { UsersTable } from "@/components/admin/UsersTable"

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          ownedProjects: true,
          assignedTasks: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })
  return users
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard")
  }

  const users = await getUsers()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">จัดการผู้ใช้</h1>
          <p className="text-slate-400">เพิ่ม แก้ไข หรือลบผู้ใช้ในระบบ</p>
        </div>

        <UsersTable initialUsers={users} currentUserRole={session.user.role} />
      </main>
    </div>
  )
}
