import { Navbar } from '@/components/ui/navbar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-muted/40">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
