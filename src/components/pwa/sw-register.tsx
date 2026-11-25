'use client';

import { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export function ServiceWorkerAndInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed / running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Register Service Worker safely
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration failed:', err);
          });
      });
    }

    // 3. Listen for PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has previously dismissed banner in current session
      const dismissed = sessionStorage.getItem('pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showInstallBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed top-2 inset-x-3 z-50 sm:hidden animate-in slide-in-from-top-4 duration-300">
      <div className="bg-primary text-white p-3.5 rounded-2xl shadow-xl border border-primary-hover/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight leading-tight">Install ParkBnB App</h4>
            <p className="text-[11px] text-white/80 leading-tight mt-0.5">Instant booking & 1-tap gate passes</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-foreground font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
