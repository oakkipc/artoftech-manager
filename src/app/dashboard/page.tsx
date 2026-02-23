"use client"

import { mockProjects, mockUsers } from "@/lib/mock-data"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { UsageLimits } from "@/components/dashboard/UsageLimits"
import { ProjectGrid } from "@/components/dashboard/ProjectGrid"

// Mock session user
const mockSessionUser = mockUsers[0] // Oak as logged in user

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={mockSessionUser} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Usage Limits Section */}
        <UsageLimits />

        {/* Projects Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">โปรเจกต์ของฉัน</h2>
            <button
              onClick={() => alert("สร้างโปรเจกต์ใหม่ - ต้องต่อ database ก่อน")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + สร้างโปรเจกต์ใหม่
            </button>
          </div>

          <ProjectGrid projects={mockProjects} />
        </div>
      </main>
    </div>
  )
}
