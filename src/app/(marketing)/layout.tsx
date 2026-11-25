import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { CustomerBottomNav } from '@/components/layout/customer-bottom-nav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <CustomerBottomNav />
    </div>
  );
}
