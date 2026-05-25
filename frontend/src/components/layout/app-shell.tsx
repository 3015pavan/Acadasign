"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BookOpenText, ChevronDown, LayoutGrid, Settings, Sparkles, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/create', label: 'Create Assignment', icon: Sparkles },
  { href: '/analytics', label: 'Analytics', icon: BookOpenText },
  { href: '/profile', label: 'Profile', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children, title = 'Assignment', backHref = '/', showCreateButton = true }: { children: React.ReactNode; title?: string; backHref?: string; showCreateButton?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useUser();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const toast = useToast();

  React.useEffect(() => {
    // redirect to login for protected routes if no user
    const protectedPrefixes = ['/create', '/output', '/dashboard', '/app'];
    const needsAuth = protectedPrefixes.some((p) => pathname?.startsWith(p));
    if (needsAuth && !loading && !user) {
      router.push('/login');
    }
  }, [pathname, router, loading, user]);

  // close dropdown on outside click
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (open && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // close dropdown on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_transparent_30%),radial-gradient(circle_at_right,_rgba(226,232,240,0.45),_transparent_22%),linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-5 pb-28 sm:p-6 sm:pb-6 lg:p-7 lg:pb-7">
        <aside className="hidden w-[300px] shrink-0 flex-col rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:flex glass-gray bg-gradient-to-b from-[hsl(var(--blue-50)/0.16)] via-[hsl(var(--orange-5)/0.06)] to-[hsl(var(--brown-5)/0.06)]">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl accent-brown text-xl font-black shadow-lg">V</div>
            <div>
              <div className="text-[1.55rem] font-bold tracking-tight">VedaAI</div>
            </div>
          </div>

          {showCreateButton ? (
            <Link href="/create">
              <Button className="mb-10 h-14 rounded-[22px]" variant="default">
                <Sparkles className="h-4 w-4" /> Create Assignment
              </Button>
            </Link>
          ) : null}

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              // Use plain anchor for hash/placeholder links to avoid bundler issues with next/link
              if (item.href === '#') {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                      active ? 'bg-white/95 text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                    className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                    active ? 'bg-white/95 text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-7">
            <div className="rounded-2xl border border-slate-200/70 bg-white/82 px-4 py-4 text-sm text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 text-slate-700"><Settings className="h-4 w-4" /> Settings</div>
              <div className="rounded-[18px] bg-white p-3 shadow-sm">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-lg">👩‍🏫</div>
                    <div>
                      <div className="font-semibold text-slate-900">{user.name || user.email}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-900">Not signed in</div>
                    <div className="text-xs text-slate-500">Sign in to access assignments and generation features.</div>
                    <div className="mt-3 flex gap-2">
                      <Link href="/login" className="w-full rounded-md border border-white/80 bg-white/80 px-3 py-2 text-center text-sm text-slate-700 shadow-sm">Sign in</Link>
                      <Link href="/register" className="w-full rounded-md bg-slate-900 px-3 py-2 text-center text-sm text-white shadow-sm">Create account</Link>
                    </div>
                  </div>
                )}
                {user ? (
                  <div className="mt-3">
                    <button
                      onClick={async () => {
                        try { await logout(); toast.info('Signed out'); } catch (e) { console.error(e); toast.error('Logout failed'); }
                        router.push('/login');
                      }}
                      className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="rounded-[26px] border border-slate-200/70 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:px-5 glass-gray bg-gradient-to-r from-[hsl(var(--blue-50)/0.12)] via-[hsl(var(--orange-5)/0.06)] to-[hsl(var(--brown-5)/0.06)]">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/80 text-slate-600 hover:bg-white" onClick={() => router.push(backHref)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="hidden h-6 w-px bg-slate-200 sm:block" />
              <div className="flex min-w-0 items-center gap-2 text-slate-500">
                <LayoutGrid className="h-4 w-4" />
                <span className="truncate text-sm font-medium">{title}</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative rounded-full bg-white text-slate-600 shadow-sm hover:bg-white">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-slate-300" />
                </Button>
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setOpen((s) => !s)}
                      aria-label="Open user menu"
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                    >
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">U</div>
                      <div className="hidden sm:flex sm:flex-col sm:items-start">
                        <span className="text-sm font-semibold text-slate-900">{user.name || user.email}</span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {open ? (
                      <div className="absolute right-0 mt-2 w-44 rounded-md border border-white/80 bg-white/95 shadow-lg backdrop-blur-xl">
                        <a href="/profile" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile</a>
                        <a href="/settings" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Settings</a>
                        <button
                          onClick={async () => {
                            try { await logout(); toast.info('Signed out'); } catch (e) { console.error(e); toast.error('Logout failed'); }
                            router.push('/login');
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Logout
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 rounded-full bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-white/80">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">U</div>
                    <span className="hidden sm:inline">Sign in</span>
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-4 gap-1 rounded-[24px] border border-slate-200/70 bg-[rgba(255,255,255,0.92)] px-2 py-2 text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden bg-gradient-to-r from-[hsl(var(--blue-50)/0.14)] via-[hsl(var(--orange-5)/0.06)] to-[hsl(var(--brown-5)/0.06)]">
        <Link href="/" className={cn('flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] text-slate-500', pathname === '/' ? 'bg-white text-slate-900 shadow-sm' : '')}>
          <LayoutGrid className="h-4 w-4" />
          Home
        </Link>
        <Link href="/analytics" className={cn('flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] text-slate-500', pathname.startsWith('/analytics') ? 'bg-white text-slate-900 shadow-sm' : '')}>
          <FileText className="h-4 w-4" />
          Assignments
        </Link>
        <Link href="/create" className="flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] text-slate-500">
          <Sparkles className="h-4 w-4" />
          Create
        </Link>
        <Link href="/settings" className={cn('flex flex-col items-center gap-1 rounded-[18px] px-2 py-2 text-[11px] text-slate-500', pathname === '/settings' ? 'bg-white text-slate-900 shadow-sm' : '')}>
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>
    </div>
  );
}