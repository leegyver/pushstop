"use client"
import { SessionProvider } from "next-auth/react"
import { VerificationModal } from "../auth/VerificationModal"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <VerificationModal />
    </SessionProvider>
  )
}
