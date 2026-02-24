import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const canManageUsers = (role: string) => ["SUPER_ADMIN", "ADMIN"].includes(role)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, role, password } = body

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (session.user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์แก้ไขซูเปอร์แอดมิน" },
        { status: 403 }
      )
    }

    if (session.user.role === "ADMIN" && role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ตั้งเป็นซูเปอร์แอดมิน" },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (session.user.id === id) {
    return NextResponse.json(
      { error: "ไม่สามารถลบบัญชีตัวเองได้" },
      { status: 400 }
    )
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (session.user.role === "ADMIN" && targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ลบซูเปอร์แอดมิน" },
        { status: 403 }
      )
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
