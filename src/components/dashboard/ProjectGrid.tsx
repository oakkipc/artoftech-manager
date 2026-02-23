import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  owner: {
    id: string
    name: string
    avatar: string | null
  }
  _count: {
    tasks: number
  }
}

interface ProjectGridProps {
  projects: Project[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { 
    label: "🟢 กำลังทำ", 
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
  },
  ON_HOLD: { 
    label: "🟡 รอดำเนินการ", 
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20" 
  },
  COMPLETED: { 
    label: "🔵 เสร็จสิ้น", 
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20" 
  },
  ARCHIVED: { 
    label: "⚪ เก็บถาวร", 
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20" 
  },
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16 bg-[#13131a] rounded-2xl border border-dashed border-[#27273a]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1e1e2e] flex items-center justify-center">
          <span className="text-3xl">📁</span>
        </div>
        <p className="text-slate-400 text-lg">ยังไม่มีโปรเจกต์</p>
        <p className="text-sm text-slate-500 mt-1">สร้างโปรเจกต์แรกของคุณเลย!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((project) => {
        const status = statusConfig[project.status] || statusConfig.ARCHIVED
        return (
          <a key={project.id} href={`/projects/${project.id}`}>
            <Card className="group bg-[#13131a] border-[#27273a] hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 h-full cursor-pointer overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge 
                    variant="outline"
                    className={`${status.className} border`}
                  >
                    {status.label}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {project._count.tasks} งาน
                  </span>
                </div>

                <h3 className="font-semibold text-xl text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                  {project.description || "ไม่มีคำอธิบาย"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[#27273a]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
                      {project.owner.name.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-400">{project.owner.name}</span>
                  </div>
                  
                  <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </CardContent>
            </Card>
          </a>
        )
      })}

      {/* Add New Project Card */}
      <button 
        onClick={() => alert("สร้างโปรเจกต์ใหม่ - กำลังพัฒนา")}
        className="group"
      >
        <Card className="bg-[#13131a] border-[#27273a] border-dashed hover:border-indigo-500/30 hover:bg-[#1a1a23] transition-all duration-300 h-full cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
            <div className="w-14 h-14 rounded-2xl bg-[#1e1e2e] group-hover:bg-indigo-500/10 flex items-center justify-center mb-4 transition-colors">
              <span className="text-3xl text-slate-500 group-hover:text-indigo-400 transition-colors">+</span>
            </div>
            <span className="text-slate-500 font-medium group-hover:text-slate-300 transition-colors">สร้างโปรเจกต์ใหม่</span>
          </CardContent>
        </Card>
      </button>
    </div>
  )
}
