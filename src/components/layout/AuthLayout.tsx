'use client';


interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen max-7xl mx-auto bg-background flex flex-col gap-2">

      {/* Main content area */}
      <main>
        {children}
      </main>
    </div>
  );
}