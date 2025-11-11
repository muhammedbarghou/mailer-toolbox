import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return 
  <main>
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  </main>
}

