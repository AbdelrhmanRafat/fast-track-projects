import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Toaster } from "@/components/ui/sonner";
import { BadgeProvider } from "@/components/providers/BadgeProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { FCMProvider } from "@/components/providers/FCMProvider";


export default async function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <FCMProvider autoInitialize={true}>
        <BadgeProvider pollingInterval={30000}>
          <DashboardLayout>
            <Toaster />
            {children}
          </DashboardLayout>
        </BadgeProvider>
      </FCMProvider>
    </AuthGuard>
  )
}