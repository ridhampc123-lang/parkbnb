'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Car,
  MapPin,
  User,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { logoutAction } from '@/server/actions/auth-actions';

interface NavbarClientProps {
  session: {
    isAuthenticated: boolean;
    role?: string;
    profile?: {
      full_name?: string | null;
      email?: string | null;
    } | null;
  };
}

export function NavbarClient({ session }: NavbarClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-primary tracking-tight">
            <div className="bg-primary text-white p-2 rounded-control flex items-center justify-center shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-foreground">
              Park<span className="text-accent">BnB</span>
            </span>
            <span className="text-[10px] font-bold bg-primary-soft text-primary px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 border border-primary/20">
              Ahmedabad
            </span>
          </Link>

          {/* Center Public Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-foreground">
            <Link href="/search" className="hover:text-primary transition-colors flex items-center gap-1.5 font-semibold">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Find Parking</span>
            </Link>
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/list-your-space" className="hover:text-primary transition-colors flex items-center gap-1.5 text-primary font-semibold">
              <PlusCircle className="w-4 h-4" />
              <span>List Your Space</span>
            </Link>
            <Link href="/safety-and-trust" className="hover:text-primary transition-colors">
              Safety & Trust
            </Link>
          </nav>

          {/* Right Action Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {session.isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Admin Console Shortcut */}
                {session.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-control bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Console</span>
                  </Link>
                )}

                {/* Provider portal shortcut if provider */}
                {session.role === 'provider' && (
                  <Link
                    href="/host"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-control bg-accent-soft text-accent hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Host Portal</span>
                  </Link>
                )}

                {/* Account / User Portal Shortcut */}
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-control border border-border hover:bg-surface-muted text-foreground transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{session.profile?.full_name?.split(' ')[0] || 'My Account'}</span>
                </Link>

                <form action={logoutAction} className="inline-flex items-center">
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-1.5 text-muted-foreground hover:text-danger hover:bg-red-50 rounded-control transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-foreground hover:text-primary px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-control text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-control text-muted-foreground hover:text-foreground hover:bg-surface-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="space-y-1">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-muted rounded-control"
            >
              <MapPin className="w-4 h-4" />
              <span>Find Parking</span>
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted rounded-control"
            >
              How It Works
            </Link>
            <Link
              href="/list-your-space"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-muted rounded-control"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Space</span>
            </Link>
            <Link
              href="/safety-and-trust"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted rounded-control"
            >
              Safety & Trust
            </Link>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            {session.isAuthenticated ? (
              <>
                {session.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 rounded-control"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Operations Console</span>
                  </Link>
                )}
                {session.role === 'provider' && (
                  <Link
                    href="/host"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-accent bg-amber-50 rounded-control"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Host Operations Portal</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted rounded-control"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>My Account ({session.profile?.full_name})</span>
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-danger hover:bg-red-50 rounded-control"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center text-xs font-semibold border border-border rounded-control hover:bg-surface-muted"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center text-xs font-bold bg-primary text-white rounded-control shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

