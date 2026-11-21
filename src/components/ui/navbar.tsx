import Link from 'next/link';
import { getServerSession } from '@/lib/auth/session';
import { logoutAction } from '@/server/actions/auth-actions';
import { Car, MapPin, User, LayoutDashboard, LogOut, PlusCircle, ShieldCheck } from 'lucide-react';

export async function Navbar() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-primary tracking-tight">
            <div className="bg-primary text-white p-2 rounded-control flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <span>Park<span className="text-accent">BnB</span></span>
            <span className="text-[11px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">Ahmedabad</span>
          </Link>

          {/* Center Public Navigation - strictly consumer-facing */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-foreground">
            <Link href="/search" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              Find Parking
            </Link>
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/list-your-space" className="hover:text-primary transition-colors flex items-center gap-1.5 text-primary font-semibold">
              <PlusCircle className="w-4 h-4" />
              List Your Space
            </Link>
            <Link href="/safety-and-trust" className="hover:text-primary transition-colors">
              Safety & Trust
            </Link>
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center space-x-3">
            {session.isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Provider portal shortcut if provider */}
                {session.role === 'provider' && (
                  <Link
                    href="/host"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-control bg-primary-soft text-primary hover:bg-emerald-100 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Host Portal
                  </Link>
                )}

                {/* Admin console shortcut ONLY for authenticated admins */}
                {session.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-control bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span>Admin Console</span>
                  </Link>
                )}

                <Link
                  href="/account"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-control border border-border hover:bg-surface-muted transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{session.profile?.full_name?.split(' ')[0] || 'My Account'}</span>
                </Link>

                <form action={logoutAction}>
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
                  className="text-sm font-medium text-foreground hover:text-primary px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-control text-white bg-primary hover:bg-primary-hover shadow-sm transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
