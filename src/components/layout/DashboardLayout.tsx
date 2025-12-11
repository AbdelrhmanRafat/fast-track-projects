'use client';

import { Sidebar } from '@/components/SharedCustomComponents/Sidebar';
import { Navbar } from '@/components/SharedCustomComponents/Navbar';
import { SharedBreadCrumb } from '@/components/SharedCustomComponents/SharedBreadCrumb';
import { CompactSidebar } from '@/components/SharedCustomComponents/CompactSidebar';
import { CompactTopBar } from '@/components/SharedCustomComponents/CompactTopBar';
import { NavigationProgress } from '@/components/SharedCustomComponents/NavigationProgress';
import { MobileBottomNav } from '@/components/SharedCustomComponents/MobileBottomNav';
import {
  SidebarProvider
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { TopBar } from '../ui/TopBar';
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  // Render Compact Layout
  return (
    <SidebarProvider>
      <NavigationProgress />
      <TopBar />
      <div className="flex h-screen w-full">
        {/* Mobile Sidebar - Hidden, replaced with bottom nav */}
        <div className="lg:hidden hidden">
          <Sidebar />
        </div>

        {/* Compact Sidebar - Desktop Only */}
        <CompactSidebar />

        {/* Right side: TopBar + Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Compact Top Bar - Desktop Only (Breadcrumb + Search + Settings) */}
          <CompactTopBar />

          {/* Main content area */}
          {/* Desktop: bg-sidebar with bg-background content */}
          <main className="flex-1 flex flex-col lg:py-0 overflow-hidden bg-background lg:bg-sidebar">
            {/* Mobile: Optimized layout with top navbar, scrollable content, bottom nav */}
            <div className="lg:hidden flex flex-col h-full">
              {/* Mobile Top Navbar - Fixed at top */}
              <Navbar />
              
              {/* Scrollable Content Area - Account for bottom nav height (64px + safe area) */}
              <div 
                className="flex-1 overflow-y-auto overscroll-y-contain bg-background"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))'
                }}
              >
                <div className="w-full mx-auto px-4 py-4 min-h-full flex flex-col">
                  {children}
                </div>
              </div>
            </div>

            {/* Desktop: Compact layout style with breadcrumbs */}
            <div className="hidden lg:flex flex-1 overflow-y-auto bg-background">
              <div className="w-full min-h-full flex flex-col bg-background">
                <div className="flex-1 bg-background">
                  <div className="w-full lg:max-w-7xl mx-auto bg-background py-6 px-4">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt delay={5000} />
    </SidebarProvider>
  );
}