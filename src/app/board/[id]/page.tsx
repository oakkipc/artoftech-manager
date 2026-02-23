import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"

interface Props {
  params: Promise<{ id: string }>
}

async function getProjectAndTasks(id: string) {
  const [project, tasks] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } }
      }
    }),
    prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { order: "asc" }
    })
  ])
  
  return { project, tasks }
}

export default async function BoardPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  const { project, tasks } = await getProjectAndTasks(id)

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session.user} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">ไม่พบโปรเจกต์</h1>
            <p className="text-gray-500">โปรเจกต์ที่คุณค้นหาไม่มีอยู่ในระบบ</p>
          </div>
        </main>
      </div>
    )
  }

  // Transform tasks to match mock data format
  const formattedTasks = tasks.map(task => ({
    ...task,
    tags: task.tags.map(t => t.tag)
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto px-4 py-6">
        <KanbanBoard project={project} initialTasks={formattedTasks} />
      </main>
    </div>
  )
}
