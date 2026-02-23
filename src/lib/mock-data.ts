// Mock Data for AOT Manager - No Database Required

export interface MockUser {
  id: string
  email: string
  name: string
  avatar: string | null
  role: "ADMIN" | "MEMBER"
}

export interface MockProject {
  id: string
  name: string
  description: string | null
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED"
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: MockUser
  members: MockProjectMember[]
  links: MockProjectLink[]
  taskCount: number
}

export interface MockProjectMember {
  id: string
  userId: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  user: MockUser
}

export interface MockProjectLink {
  id: string
  title: string
  url: string
  category: string
}

export interface MockTask {
  id: string
  projectId: string
  title: string
  description: string | null
  assigneeId: string | null
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate: string | null
  order: number
  assignee: MockUser | null
  tags: MockTag[]
}

export interface MockTag {
  id: string
  name: string
  color: string
}

// Mock Users
export const mockUsers: MockUser[] = [
  {
    id: "u1",
    email: "oak@artoftech.co",
    name: "Oak",
    avatar: null,
    role: "ADMIN"
  },
  {
    id: "u2",
    email: "jarvis@artoftech.co",
    name: "Jarvis",
    avatar: null,
    role: "MEMBER"
  },
  {
    id: "u3",
    email: "max@artoftech.co",
    name: "Max",
    avatar: null,
    role: "MEMBER"
  },
  {
    id: "u4",
    email: "fai@artoftech.co",
    name: "Fai",
    avatar: null,
    role: "MEMBER"
  }
]

// Mock Tags
export const mockTags: MockTag[] = [
  { id: "t1", name: "UI/UX", color: "#8B5CF6" },
  { id: "t2", name: "Frontend", color: "#3B82F6" },
  { id: "t3", name: "Backend", color: "#10B981" },
  { id: "t4", name: "Bug", color: "#EF4444" },
  { id: "t5", name: "Design", color: "#F59E0B" }
]

// Mock Projects
export const mockProjects: MockProject[] = [
  {
    id: "p1",
    name: "AOT Manager",
    description: "ระบบจัดการงานและโปรเจกต์สำหรับ Art of Tech - ลดงาน ลดคน ลดเวลา",
    status: "ACTIVE",
    ownerId: "u1",
    createdAt: "2026-02-20T00:00:00Z",
    updatedAt: "2026-02-24T00:00:00Z",
    owner: mockUsers[0],
    members: [
      { id: "pm1", userId: "u1", role: "OWNER", user: mockUsers[0] },
      { id: "pm2", userId: "u2", role: "MEMBER", user: mockUsers[1] },
      { id: "pm3", userId: "u3", role: "MEMBER", user: mockUsers[2] }
    ],
    links: [
      { id: "l1", title: "Figma Design", url: "https://figma.com/file/aot-manager", category: "Design" },
      { id: "l2", title: "GitHub Repo", url: "https://github.com/artoftech/aot-manager", category: "Dev" },
      { id: "l3", title: "Staging", url: "https://aot-manager-staging.vercel.app", category: "Deploy" }
    ],
    taskCount: 12
  },
  {
    id: "p2",
    name: "Website Redesign",
    description: "ออกแบบและพัฒนาเว็บไซต์บริษัทใหม่ ให้ทันสมัยและรองรับ SEO",
    status: "ACTIVE",
    ownerId: "u2",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-23T00:00:00Z",
    owner: mockUsers[1],
    members: [
      { id: "pm4", userId: "u2", role: "OWNER", user: mockUsers[1] },
      { id: "pm5", userId: "u3", role: "MEMBER", user: mockUsers[2] }
    ],
    links: [
      { id: "l4", title: "Figma", url: "https://figma.com/file/website", category: "Design" },
      { id: "l5", title: "Analytics", url: "https://analytics.google.com", category: "Data" }
    ],
    taskCount: 8
  },
  {
    id: "p3",
    name: "Marketing Campaign Q1",
    description: "แคมเปญการตลาดไตรมาส 1 ปี 2026 สำหรับลูกค้าใหม่",
    status: "ON_HOLD",
    ownerId: "u1",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-20T00:00:00Z",
    owner: mockUsers[0],
    members: [
      { id: "pm6", userId: "u1", role: "OWNER", user: mockUsers[0] },
      { id: "pm7", userId: "u4", role: "MEMBER", user: mockUsers[3] }
    ],
    links: [
      { id: "l6", title: "Campaign Brief", url: "https://docs.google.com/campaign", category: "Docs" }
    ],
    taskCount: 5
  },
  {
    id: "p4",
    name: "Internal Tools",
    description: "เครื่องมือภายในบริษัทสำหรับอัตโนมัติงานซ้ำๆ",
    status: "COMPLETED",
    ownerId: "u2",
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
    owner: mockUsers[1],
    members: [
      { id: "pm8", userId: "u2", role: "OWNER", user: mockUsers[1] }
    ],
    links: [],
    taskCount: 0
  }
]

// Mock Tasks for AOT Manager Project (p1)
export const mockTasks: MockTask[] = [
  // BACKLOG
  {
    id: "task1",
    projectId: "p1",
    title: "Research competitor analysis",
    description: "ศึกษาโปรเจกต์ management tools อื่นๆ เช่น Linear, Asana, Monday",
    assigneeId: "u2",
    status: "BACKLOG",
    priority: "MEDIUM",
    dueDate: "2026-03-01",
    order: 0,
    assignee: mockUsers[1],
    tags: [mockTags[4]]
  },
  {
    id: "task2",
    projectId: "p1",
    title: "Define user personas",
    description: "กำหนดกลุ่มเป้าหมายและ user personas สำหรับระบบ",
    assigneeId: "u1",
    status: "BACKLOG",
    priority: "LOW",
    dueDate: null,
    order: 1,
    assignee: mockUsers[0],
    tags: []
  },
  {
    id: "task3",
    projectId: "p1",
    title: "API documentation",
    description: "เขียนเอกสาร API สำหรับทีมพัฒนา",
    assigneeId: null,
    status: "BACKLOG",
    priority: "LOW",
    dueDate: null,
    order: 2,
    assignee: null,
    tags: [mockTags[2]]
  },
  // TODO
  {
    id: "task4",
    projectId: "p1",
    title: "Setup project repository",
    description: "สร้าง GitHub repo และ config CI/CD pipeline",
    assigneeId: "u3",
    status: "TODO",
    priority: "HIGH",
    dueDate: "2026-02-25",
    order: 0,
    assignee: mockUsers[2],
    tags: [mockTags[2]]
  },
  {
    id: "task5",
    projectId: "p1",
    title: "Draft content for landing page",
    description: "เขียน content สำหรับหน้าแรกของแอพ",
    assigneeId: "u4",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "2026-02-28",
    order: 1,
    assignee: mockUsers[3],
    tags: []
  },
  // IN PROGRESS
  {
    id: "task6",
    projectId: "p1",
    title: "Design system components",
    description: "สร้าง design system และ UI components ใน Figma",
    assigneeId: "u2",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: "2026-02-24",
    order: 0,
    assignee: mockUsers[1],
    tags: [mockTags[0], mockTags[4]]
  },
  {
    id: "task7",
    projectId: "p1",
    title: "Implement authentication",
    description: "ทำระบบ login/logout ด้วย NextAuth",
    assigneeId: "u3",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: "2026-02-26",
    order: 1,
    assignee: mockUsers[2],
    tags: [mockTags[2]]
  },
  // REVIEW
  {
    id: "task8",
    projectId: "p1",
    title: "Review database schema",
    description: "ตรวจสอบ Prisma schema และ relationships",
    assigneeId: "u1",
    status: "REVIEW",
    priority: "MEDIUM",
    dueDate: "2026-02-23",
    order: 0,
    assignee: mockUsers[0],
    tags: [mockTags[2]]
  },
  // DONE
  {
    id: "task9",
    projectId: "p1",
    title: "Project kickoff meeting",
    description: "ประชุมเริ่มโปรเจกต์กับทีม",
    assigneeId: "u1",
    status: "DONE",
    priority: "HIGH",
    dueDate: "2026-02-20",
    order: 0,
    assignee: mockUsers[0],
    tags: []
  },
  {
    id: "task10",
    projectId: "p1",
    title: "Logo design",
    description: "ออกแบบ logo สำหรับ AOT Manager",
    assigneeId: "u2",
    status: "DONE",
    priority: "LOW",
    dueDate: "2026-02-22",
    order: 1,
    assignee: mockUsers[1],
    tags: [mockTags[4]]
  },
  {
    id: "task11",
    projectId: "p1",
    title: "Color palette selection",
    description: "เลือกสีหลักสำหรับแอพ",
    assigneeId: "u2",
    status: "DONE",
    priority: "LOW",
    dueDate: "2026-02-21",
    order: 2,
    assignee: mockUsers[1],
    tags: [mockTags[0]]
  }
]

// Helper functions
export function getProjectById(id: string): MockProject | undefined {
  return mockProjects.find(p => p.id === id)
}

export function getTasksByProjectId(projectId: string): MockTask[] {
  return mockTasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order)
}

export function getTasksByStatus(projectId: string, status: MockTask["status"]): MockTask[] {
  return mockTasks.filter(t => t.projectId === projectId && t.status === status).sort((a, b) => a.order - b.order)
}

export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find(u => u.id === id)
}
