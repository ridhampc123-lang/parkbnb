'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  Calendar,
  LifeBuoy,
  User,
  LogOut,
  Search,
  LayoutDashboard,
  Menu,
  X,
  CreditCard,
  Bell,
  ShieldCheck
} from 'lucide-react';
import { logoutAction } from '@/server/actions/auth-actions';

interface UserNavbarProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export function UserNavbar({ user }: UserNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/account', label: 'Overview', icon: LayoutDashboard },
    { href: '/account/bookings', label: 'Bookings', icon: Calendar },
    { href: '/account/vehicles', label: 'Vehicles', icon: Car },
    { href: '/account/payments', label: 'Payments', icon: CreditCard },
    { href: '/account/notifications', label: 'Alerts', icon: Bell },
    { href: '/account/support', label: 'Support', icon: LifeBuoy },
    { href: '/account/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href="/account" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="bg-primary text-white p-1.5 rounded-control flex items-center justify-center shadow-xs">
                <Car className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-foreground">
                Park<span className="text-accent">BnB</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Customer Portal
            </span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-control text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-soft text-primary shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* Find Parking Search CTA */}
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-control bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Parking</span>
            </Link>

            {/* Switch to Host if provider */}
            {user.role === 'provider' && (
              <Link
                href="/host"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-control border border-border text-foreground hover:bg-surface-muted transition-colors"
                title="Switch to Host Portal"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
                <span className="hidden lg:inline">Host Portal</span>
              </Link>
            )}

            {/* User Profile Pill */}
            <Link href="/account/profile" className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                {user.fullName?.charAt(0) || 'U'}
              </div>
              <div className="text-left text-xs leading-tight hidden lg:block">
                <div className="font-bold text-foreground truncate max-w-[110px]">{user.fullName}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[110px]">Verified Driver</div>
              </div>
            </Link>

            {/* Logout Action */}
            <form action={logoutAction} className="inline-flex items-center">
              <button
                type="submit"
                title="Sign out of your account"
                className="p-1.5 rounded-control text-muted-foreground hover:text-danger hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/search"
              className="p-1.5 rounded-control bg-primary text-white text-xs"
              title="Find Parking"
            >
              <Search className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-control text-muted-foreground hover:text-foreground hover:bg-surface-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary font-bold text-sm flex items-center justify-center">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{user.fullName}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-control text-xs font-semibold ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-surface-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            {user.role === 'provider' && (
              <Link
                href="/host"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-accent flex items-center gap-1"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to Host Portal</span>
              </Link>
            )}

            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-semibold text-danger hover:underline flex items-center gap-1 py-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
