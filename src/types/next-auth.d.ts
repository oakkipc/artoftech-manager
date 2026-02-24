import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "SUPER_ADMIN" | "ADMIN" | "OFFICER" | "MEMBER"
      avatar?: string | undefined
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role: "SUPER_ADMIN" | "ADMIN" | "OFFICER" | "MEMBER"
    avatar?: string | undefined
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "SUPER_ADMIN" | "ADMIN" | "OFFICER" | "MEMBER"
    avatar?: string | undefined
  }
}
