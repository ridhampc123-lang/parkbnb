'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building, Car, Calendar, DollarSign, Settings } from 'lucide-react';

export function HostBottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Overview',
      href: '/host',
      icon: LayoutDashboard,
      isActive: pathname === '/host',
    },
    {
      label: 'Spaces',
      href: '/host/spaces',
      icon: Building,
      isActive: pathname.startsWith('/host/spaces'),
    },
    {
      label: 'Manifest',
      href: '/host/bookings',
      icon: Car,
      isActive: pathname.startsWith('/host/bookings'),
    },
    {
      label: 'Calendar',
      href: '/host/calendar',
      icon: Calendar,
      isActive: pathname.startsWith('/host/calendar'),
    },
    {
      label: 'Earnings',
      href: '/host/earnings',
      icon: DollarSign,
      isActive: pathname.startsWith('/host/earnings') || pathname.startsWith('/host/settings'),
    },
  ];

  return (
    <nav
      aria-label="Host Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full w-full relative transition-all touch-target ${
                active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'}`} />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${active ? 'font-black' : 'font-medium'}`}>
                {tab.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
