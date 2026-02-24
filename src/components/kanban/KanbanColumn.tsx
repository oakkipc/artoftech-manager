"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { TaskCard } from "./TaskCard"
import { Plus } from "lucide-react"

interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  assigneeId: string | null
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: Date | null
  order: number
  assignee: {
    id: string
    name: string
    avatar: string | null
  } | null
  tags: {
    id: string
    name: string
    color: string
  }[]
}

interface KanbanColumnProps {
  column: {
    id: Task["status"]
    title: string
    color: string
  }
  tasks: Task[]
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-72 rounded-lg ${column.color} 
        ${isOver ? "ring-2 ring-blue-400 ring-offset-2" : ""}
      `}
    >
      <div className="p-3 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="p-2 space-y-2 min-h-[150px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      <button className="w-full p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-b-lg flex items-center justify-center gap-1 transition-colors">
        <Plus className="w-4 h-4" />
        เพิ่มงาน
      </button>
    </div>
  )
}
