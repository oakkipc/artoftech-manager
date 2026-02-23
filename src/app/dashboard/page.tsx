import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { UsageLimits } from "@/components/dashboard/UsageLimits"
import { ProjectGrid } from "@/components/dashboard/ProjectGrid"

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      owner: {
        select: { id: true, name: true, avatar: true }
      },
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  })
  return projects
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const projects = await getProjects()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Usage Limits Section */}
        <UsageLimits />

        {/* Projects Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">โปรเจกต์ของฉัน</h2>
            <a
              href="/projects/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + สร้างโปรเจกต์ใหม่
            </a>
          </div>

          <ProjectGrid projects={projects} />
        </div>
      </main>
    </div>
  )
}
