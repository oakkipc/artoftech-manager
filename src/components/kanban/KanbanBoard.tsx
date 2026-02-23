"use client"

import { useState } from "react"
import { MockProject, MockTask, mockUsers, mockTags } from "@/lib/mock-data"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core"
import { arrayMove, SortableContext } from "@dnd-kit/sortable"
import { KanbanColumn } from "./KanbanColumn"
import { TaskCard } from "./TaskCard"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"

interface KanbanBoardProps {
  project: MockProject
  initialTasks: MockTask[]
}

const COLUMNS: { id: MockTask["status"]; title: string; color: string }[] = [
  { id: "BACKLOG", title: "📋 Backlog", color: "bg-gray-100" },
  { id: "TODO", title: "📝 To Do", color: "bg-blue-50" },
  { id: "IN_PROGRESS", title: "🔄 In Progress", color: "bg-yellow-50" },
  { id: "REVIEW", title: "👀 Review", color: "bg-purple-50" },
  { id: "DONE", title: "✅ Done", color: "bg-green-50" },
]

export function KanbanBoard({ project, initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<MockTask[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<MockTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the task being dragged
    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if dropped on a column
    const columnIds = COLUMNS.map((c) => c.id)
    if (columnIds.includes(overId as MockTask["status"])) {
      // Dropped on a column - update status
      if (activeTask.status !== overId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId ? { ...t, status: overId as MockTask["status"] } : t
          )
        )
      }
    } else {
      // Dropped on another task - reorder
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask && activeTask.status === overTask.status) {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)
        setTasks((prev) => arrayMove(prev, activeIndex, overIndex))
      }
    }
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  }

  const getTasksByColumn = (columnId: MockTask["status"]) => {
    return tasks
      .filter((task) => task.status === columnId)
      .sort((a, b) => a.order - b.order)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a
            href={`/projects/${project.id}`}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← กลับไปที่โปรเจกต์
          </a>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-semibold">{project.name} - Task Board</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" /> Filter
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> งานใหม่
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByColumn(column.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
