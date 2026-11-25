'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  LayoutDashboard,
  PlusCircle,
  Calendar,
  DollarSign,
  Car,
  LogOut,
  Search,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Sparkles,
  Settings,
  LifeBuoy
} from 'lucide-react';
import { logoutAction } from '@/server/actions/auth-actions';

interface HostNavbarProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    verificationStatus?: string;
  };
}

export function HostNavbar({ user }: HostNavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/host', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/host/spaces', label: 'Spaces', icon: Building },
    { href: '/host/calendar', label: 'Calendar', icon: Calendar },
    { href: '/host/bookings', label: 'Manifest', icon: Car },
    { href: '/host/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/host/reviews', label: 'Reviews', icon: Sparkles },
    { href: '/host/settings', label: 'Settings', icon: Settings },
    { href: '/host/support', label: 'Support', icon: LifeBuoy },
  ];

  const isVerified = user.verificationStatus === 'approved';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Host Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href="/host" className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <div className="bg-primary text-white p-1.5 rounded-control flex items-center justify-center shadow-xs">
                <Building className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-foreground">
                Park<span className="text-accent">BnB</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 text-accent" />
              Host Operations
            </span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1">
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
            {/* Primary Action Button: List Space */}
            <Link
              href="/host/spaces/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-control bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>List Space</span>
            </Link>

            {/* Switch to Driver View CTA */}
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-control border border-border text-foreground hover:bg-surface-muted transition-colors"
              title="Search and view the marketplace as a driver"
            >
              <Car className="w-3.5 h-3.5 text-primary" />
              <span className="hidden xl:inline">Driver Search</span>
            </Link>

            {/* Verification Status Badge */}
            <div className="hidden xl:flex items-center">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Host
                </span>
              ) : (
                <Link
                  href="/host/onboarding"
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                >
                  <Clock className="w-3 h-3" />
                  {user.verificationStatus ? user.verificationStatus.replace(/_/g, ' ') : 'Complete KYC'}
                </Link>
              )}
            </div>

            {/* Host Profile Info */}
            <Link href="/host/settings" className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold text-xs flex items-center justify-center border border-accent/20">
                {user.fullName?.charAt(0) || 'H'}
              </div>
              <div className="text-left text-xs leading-tight hidden xl:block">
                <div className="font-bold text-foreground truncate max-w-[100px]">{user.fullName}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">Host Operations</div>
              </div>
            </Link>

            {/* Logout Action */}
            <form action={logoutAction} className="inline-flex items-center">
              <button
                type="submit"
                title="Sign out of Host account"
                className="p-1.5 rounded-control text-muted-foreground hover:text-danger hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/host/spaces/new"
              className="p-1.5 rounded-control bg-primary text-white text-xs"
              title="Add Space"
            >
              <PlusCircle className="w-4 h-4" />
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
        <div className="lg:hidden border-t border-border bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent font-bold text-sm flex items-center justify-center">
                {user.fullName?.charAt(0) || 'H'}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{user.fullName}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isVerified ? 'Verified' : 'Under Review'}
            </span>
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
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Switch to Driver Search</span>
            </Link>

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
