import type { NextAuthOptions } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      avatar?: string
      role: string
    }
  }

  interface User {
    id: string
    role: string
    avatar?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    avatar?: string
  }
}
