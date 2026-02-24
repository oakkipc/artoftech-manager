import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const canManageUsers = (role: string) => ["SUPER_ADMIN", "ADMIN"].includes(role)

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (session.user.role === "ADMIN" && role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์สร้างซูเปอร์แอดมิน" },
        { status: 403 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "MEMBER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
