import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MockProject } from "@/lib/mock-data"

interface ProjectGridProps {
  projects: MockProject[]
}

const statusConfig = {
  ACTIVE: { label: "🟢 กำลังทำ", className: "bg-green-100 text-green-800" },
  ON_HOLD: { label: "🟡 รอดำเนินการ", className: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "🔵 เสร็จสิ้น", className: "bg-blue-100 text-blue-800" },
  ARCHIVED: { label: "⚪ เก็บถาวร", className: "bg-gray-100 text-gray-800" },
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed">
        <p className="text-gray-500">ยังไม่มีโปรเจกต์</p>
        <p className="text-sm text-gray-400 mt-1">สร้างโปรเจกต์แรกของคุณเลย!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const status = statusConfig[project.status]
        return (
          <a key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={status.className}>
                    {status.label}
                  </Badge>
                </div>

                <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                  {project.description || "ไม่มีคำอธิบาย"}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{project.taskCount} งาน</span>
                  <div className="flex items-center gap-2">
                    <span>โดย {project.owner.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        )
      })}

      {/* Add New Project Card */}
      <button onClick={() => alert("สร้างโปรเจกต์ใหม่ - ต้องต่อ database ก่อน")}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-dashed">
          <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[160px]">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <span className="text-2xl text-gray-400">+</span>
            </div>
            <span className="text-gray-500 font-medium">สร้างโปรเจกต์ใหม่</span>
          </CardContent>
        </Card>
      </button>
    </div>
  )
}
