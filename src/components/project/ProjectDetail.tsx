"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowRight, ArrowLeft, Link2, Users } from "lucide-react"

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
  members: {
    id: string
    role: string
    user: {
      id: string
      name: string
      avatar: string | null
    }
  }[]
  links: {
    id: string
    title: string
    url: string
    category: string | null
  }[]
  _count: {
    tasks: number
  }
  createdAt: Date
}

interface ProjectDetailProps {
  project: Project
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "🟢 กำลังทำ", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  ON_HOLD: { label: "🟡 รอดำเนินการ", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  COMPLETED: { label: "🔵 เสร็จสิ้น", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ARCHIVED: { label: "⚪ เก็บถาวร", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const status = statusConfig[project.status] || statusConfig.ARCHIVED

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <a href="/dashboard" className="hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> แดชบอร์ด
        </a>
        <span>/</span>
        <span className="text-slate-100">{project.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${status.className} border`}>{status.label}</Badge>
            <span className="text-sm text-slate-500">
              สร้างเมื่อ {new Date(project.createdAt).toLocaleDateString("th-TH")}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">{project.name}</h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            {project.description || "ไม่มีคำอธิบาย"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#27273a] bg-transparent text-slate-300 hover:bg-[#27273a]">แก้ไข</Button>
          <Button variant="destructive">ลบ</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#13131a] border-[#27273a]">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{project._count.tasks}</div>
                  <div className="text-sm text-slate-500">จำนวนงาน</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{project.members.length}</div>
                  <div className="text-sm text-slate-500">สมาชิก</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{project.links.length}</div>
                  <div className="text-sm text-slate-500">ลิงก์</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <a href={`/board/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-500/20 bg-indigo-500/5">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-indigo-300">ไปที่ Task Board 📝</h3>
                  <p className="text-indigo-400/70 text-sm mt-1">
                    จัดการงานด้วย Kanban board แบบ drag & drop
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-indigo-400" />
              </CardContent>
            </Card>
          </a>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#13131a] border-[#27273a]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                <Users className="w-5 h-5" /> ทีมงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                      {member.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-200">{member.user.name}</div>
                    <div className="text-xs text-slate-500">
                      {member.role === "OWNER" && "เจ้าของ"}
                      {member.role === "ADMIN" && "แอดมิน"}
                      {member.role === "MEMBER" && "สมาชิก"}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2 border-[#27273a] bg-transparent text-slate-300 hover:bg-[#27273a]" size="sm">
                + เชิญสมาชิก
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#13131a] border-[#27273a]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                <Link2 className="w-5 h-5" /> ลิงก์ที่เกี่ยวข้อง
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.links.length > 0 ? (
                <div className="space-y-2">
                  {project.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 bg-[#27273a] rounded flex items-center justify-center text-xs font-medium text-slate-400">
                        {link.category?.charAt(0) || "L"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-200 truncate">{link.title}</div>
                        <div className="text-xs text-slate-500">{link.category}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">ยังไม่มีลิงก์</p>
              )}
              <Button variant="outline" className="w-full mt-3 border-[#27273a] bg-transparent text-slate-300 hover:bg-[#27273a]" size="sm">
                + เพิ่มลิงก์
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
