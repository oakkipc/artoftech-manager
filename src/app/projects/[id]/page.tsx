import { notFound } from "next/navigation"
import { getProjectById, mockProjects, mockUsers } from "@/lib/mock-data"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { ProjectDetail } from "@/components/project/ProjectDetail"

interface Props {
  params: Promise<{ id: string }>
}

// Required for static export
export function generateStaticParams() {
  return mockProjects.map((project) => ({
    id: project.id,
  }))
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const project = getProjectById(id)
  
  if (!project) {
    notFound()
  }

  // Mock session - Oak is logged in
  const sessionUser = mockUsers[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={sessionUser} />
      <main className="container mx-auto px-4 py-8">
        <ProjectDetail project={project} />
      </main>
    </div>
  )
}
