import { AuthLayout } from "@/components/layout/AuthLayout"


export default async function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication redirects are handled by middleware.ts
  // No need for client-side auth checks here
  return (
    <AuthLayout>
      {children}
    </AuthLayout>
  )
}