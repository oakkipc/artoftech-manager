import { mockProjects, getTasksByProjectId, mockUsers } from "@/lib/mock-data"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"

interface Props {
  params: Promise<{ id: string }>
}

// Required for static export
export function generateStaticParams() {
  return mockProjects.map((project) => ({
    id: project.id,
  }))
}

export default async function BoardPage({ params }: Props) {
  const { id } = await params
  const project = mockProjects.find(p => p.id === id)
  const tasks = getTasksByProjectId(id)
  const sessionUser = mockUsers[0]

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={sessionUser} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">ไม่พบโปรเจกต์</h1>
            <p className="text-gray-500">โปรเจกต์ที่คุณค้นหาไม่มีอยู่ในระบบ</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={sessionUser} />
      <main className="container mx-auto px-4 py-6">
        <KanbanBoard project={project} initialTasks={tasks} />
      </main>
    </div>
  )
}
