'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  FileCheck,
  Calendar,
  DollarSign,
  LifeBuoy,
  Users,
  Building2,
  Sliders,
  History,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Database
} from 'lucide-react';
import { logoutAction } from '@/server/actions/auth-actions';

interface AdminSidebarProps {
  operator: {
    fullName: string;
    email: string;
    role: string;
  };
  metrics: {
    pendingVerifications: number;
    openDisputes: number;
  };
  isDbConfigured: boolean;
  maintenanceMode: boolean;
}

export function AdminSidebar({
  operator,
  metrics,
  isDbConfigured,
  maintenanceMode
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNav = [
    { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
    {
      href: '/admin/verifications',
      label: 'Verification Queue',
      icon: FileCheck,
      badge: metrics.pendingVerifications,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    { href: '/admin/listings', label: 'All Parking Spaces', icon: Car },
    { href: '/admin/bookings', label: 'Driver Manifest', icon: Calendar },
  ];

  const directoryNav = [
    { href: '/admin/users', label: 'Drivers & Customers', icon: Users },
    { href: '/admin/hosts', label: 'Parking Owners & Hosts', icon: Building2 },
  ];

  const operationsNav = [
    { href: '/admin/payments', label: 'Financial Ledger & Escrow', icon: DollarSign },
    {
      href: '/admin/disputes',
      label: 'Disputes & Incidents',
      icon: LifeBuoy,
      badge: metrics.openDisputes,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    { href: '/admin/settings', label: 'Platform Settings', icon: Sliders },
    { href: '/admin/audit-logs', label: 'Security Audit Trail', icon: History },
  ];

  const renderNavLinks = (links: typeof mainNav) => {
    return links.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center justify-between px-3 py-2 rounded-control text-xs font-semibold transition-all ${
            isActive
              ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 font-bold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </div>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor}`}>
              {item.badge}
            </span>
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* Mobile Top Header Bar (Shown on < md screens) */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-control text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/admin" className="flex items-center gap-1.5 font-bold text-base text-white">
            <div className="bg-primary text-white p-1 rounded-control flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
            <span>Park<span className="text-accent">BnB</span></span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full uppercase ml-1">
              OPS
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono text-slate-300">AHMEDABAD</span>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 rounded-control text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-4 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-500 px-3 py-1">
              Main Operations
            </div>
            {renderNavLinks(mainNav)}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-900">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-500 px-3 py-1">
              Directory Management
            </div>
            {renderNavLinks(directoryNav)}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-900">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-500 px-3 py-1">
              Finance & Governance
            </div>
            {renderNavLinks(operationsNav)}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="text-xs text-slate-400 px-3">
              <div className="font-semibold text-slate-200">{operator.fullName}</div>
              <div className="font-mono text-[11px] text-slate-500">{operator.email}</div>
            </div>
            <div className="flex items-center justify-between px-3">
              <Link
                href="/"
                target="_blank"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Marketplace View</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Session</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar (Shown on >= md screens) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight">
            <div className="bg-primary text-white p-2 rounded-control flex items-center justify-center shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <span>Park<span className="text-accent">BnB</span></span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono px-2 py-0.5 rounded-full uppercase ml-1">
              OPS
            </span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Main Controls */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
              Operations Control
            </div>
            {renderNavLinks(mainNav)}
          </div>

          {/* Directory Management */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="px-3 text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
              Directory Management
            </div>
            {renderNavLinks(directoryNav)}
          </div>

          {/* Finance & Settings */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="px-3 text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
              Finance & Governance
            </div>
            {renderNavLinks(operationsNav)}
          </div>
        </nav>

        {/* Sidebar Footer: Role & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/50 shrink-0">
          <div className="text-[11px] text-slate-400">
            <div className="font-semibold text-slate-200 truncate">{operator.fullName}</div>
            <div className="font-mono text-slate-500 truncate">{operator.email}</div>
            <div className="mt-1 flex items-center gap-1.5 text-purple-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role: Administrator</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <Link
              href="/"
              target="_blank"
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Marketplace</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title="End Admin Session"
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
