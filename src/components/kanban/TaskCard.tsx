"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MockTask } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, GripVertical } from "lucide-react"

interface TaskCardProps {
  task: MockTask
  isDragging?: boolean
}

const priorityConfig = {
  LOW: { label: "🟢", color: "bg-green-100 text-green-800" },
  MEDIUM: { label: "🟡", color: "bg-yellow-100 text-yellow-800" },
  HIGH: { label: "🔴", color: "bg-red-100 text-red-800" },
  URGENT: { label: "🔥", color: "bg-red-200 text-red-900" },
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  const priority = priorityConfig[task.priority]

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow
        ${isDragging || isSortableDragging ? "shadow-lg rotate-2" : ""}
      `}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        {/* Priority & Tags */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <Badge variant="secondary" className={`text-xs ${priority.color}`}>
            {priority.label} {task.priority}
          </Badge>
          
          {task.tags.map((tag) => (
            <Badge
              key={tag.id}
              className="text-xs"
              style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color }}
              variant="outline"
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {task.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-dashed border-gray-400" />
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString("th-TH", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
