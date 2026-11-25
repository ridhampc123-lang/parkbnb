'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Calendar, Bell, User } from 'lucide-react';

interface CustomerBottomNavProps {
  unreadAlertsCount?: number;
}

export function CustomerBottomNav({ unreadAlertsCount = 0 }: CustomerBottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/' || pathname === '/how-it-works',
    },
    {
      label: 'Search',
      href: '/search',
      icon: Search,
      isActive: pathname.startsWith('/search') || pathname.startsWith('/parking'),
    },
    {
      label: 'Passes',
      href: '/account/bookings',
      icon: Calendar,
      isActive: pathname.startsWith('/account/bookings'),
    },
    {
      label: 'Alerts',
      href: '/account/notifications',
      icon: Bell,
      isActive: pathname === '/account/notifications',
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    {
      label: 'Profile',
      href: '/account/profile',
      icon: User,
      isActive:
        pathname === '/account' ||
        pathname.startsWith('/account/profile') ||
        pathname.startsWith('/account/vehicles') ||
        pathname.startsWith('/account/payments') ||
        pathname.startsWith('/account/support'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
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
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-accent text-white font-mono text-[9px] font-black flex items-center justify-center leading-none ring-2 ring-white">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
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
