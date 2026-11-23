'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/ui/footer';

export function AppLayoutWrapper({
  children,
  navbar,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  // Completely omit public marketplace navbar and footer for admin routes
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {navbar}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
