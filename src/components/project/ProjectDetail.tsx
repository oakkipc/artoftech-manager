"use client"

import { MockProject } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Link2, Users, ArrowRight, ArrowLeft } from "lucide-react"

interface ProjectDetailProps {
  project: MockProject
}

const statusConfig = {
  ACTIVE: { label: "🟢 กำลังทำ", className: "bg-green-100 text-green-800" },
  ON_HOLD: { label: "🟡 รอดำเนินการ", className: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "🔵 เสร็จสิ้น", className: "bg-blue-100 text-blue-800" },
  ARCHIVED: { label: "⚪ เก็บถาวร", className: "bg-gray-100 text-gray-800" },
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const status = statusConfig[project.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a href="/dashboard" className="hover:text-gray-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> แดชบอร์ด
        </a>
        <span>/</span>
        <span className="text-gray-900">{project.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={status.className}>{status.label}</Badge>
            <span className="text-sm text-gray-500">
              สร้างเมื่อ {new Date(project.createdAt).toLocaleDateString("th-TH")}
            </span>
          </div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            {project.description || "ไม่มีคำอธิบาย"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">แก้ไข</Button>
          <Button variant="destructive">ลบ</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{project.taskCount}</div>
                  <div className="text-sm text-gray-500">จำนวนงาน</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{project.members.length}</div>
                  <div className="text-sm text-gray-500">สมาชิก</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{project.links.length}</div>
                  <div className="text-sm text-gray-500">ลิงก์</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Go to Board */}
          <a href={`/board/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-blue-900">ไปที่ Task Board 📝</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    จัดการงานด้วย Kanban board แบบ drag & drop
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-blue-600" />
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> ทีมงาน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.user.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.role === "OWNER" && "เจ้าของ"}
                      {member.role === "ADMIN" && "แอดมิน"}
                      {member.role === "MEMBER" && "สมาชิก"}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" size="sm">
                + เชิญสมาชิก
              </Button>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
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
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                        {link.category.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{link.title}</div>
                        <div className="text-xs text-gray-500">{link.category}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">ยังไม่มีลิงก์</p>
              )}
              <Button variant="outline" className="w-full mt-3" size="sm">
                + เพิ่มลิงก์
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
