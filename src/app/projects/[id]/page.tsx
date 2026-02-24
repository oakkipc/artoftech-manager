import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { ProjectDetail } from "@/components/project/ProjectDetail"

interface Props {
  params: Promise<{ id: string }>
}

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        }
      },
      links: true,
      _count: { select: { tasks: true } }
    }
  })
  return project
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const project = await getProject(id)
  
  if (!project) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto px-4 py-8">
        <ProjectDetail project={project} />
      </main>
    </div>
  )
}
