'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings, User, Download, LogOut, ChevronDown, LayoutDashboard, ListChecks } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { WeekSelector } from '@/components/ui/WeekSelector';
import { formatRelativeTime } from '@/lib/utils/formatting';
import { useAuth } from '@/components/providers/AuthProvider';

interface DashboardHeaderProps {
  selectedWeek: string;
  onWeekChange: (weekOf: string) => void;
  lastRefreshed?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExportPDF?: () => void;
  isExporting?: boolean;
}

export function DashboardHeader({
  selectedWeek,
  onWeekChange,
  lastRefreshed,
  onRefresh,
  isRefreshing,
  onExportPDF,
  isExporting,
}: DashboardHeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/660c77ae32595e1c83b78094_Hapax_logo_colordark.svg"
                alt="Hapax"
                width={100}
                height={28}
                className="h-7 w-auto"
              />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-[var(--gray-200)]" />

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') && !isActive('/action-plans')
                    ? 'bg-[var(--gray-100)] text-[var(--gray-900)]'
                    : 'text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-50)]'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/action-plans"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/action-plans')
                    ? 'bg-[var(--gray-100)] text-[var(--gray-900)]'
                    : 'text-[var(--gray-600)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-50)]'
                }`}
              >
                <ListChecks size={16} />
                <span>Action Plans</span>
              </Link>
            </nav>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-4">
            <WeekSelector selectedWeek={selectedWeek} onWeekChange={onWeekChange} />

            {/* Refresh and Settings */}
            <div className="flex items-center gap-2">
              {lastRefreshed && (
                <span className="hidden md:block text-xs text-[var(--gray-500)]">
                  Updated {formatRelativeTime(lastRefreshed)}
                </span>
              )}
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  disabled={isExporting}
                  className="p-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
                  aria-label="Export PDF"
                  title="Export PDF Report"
                >
                  <Download
                    size={18}
                    className={`text-[var(--gray-500)] ${isExporting ? 'animate-pulse' : ''}`}
                  />
                </button>
              )}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw
                  size={18}
                  className={`text-[var(--gray-500)] ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
              <Link
                href="/admin"
                className="p-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                aria-label="Settings"
              >
                <Settings size={18} className="text-[var(--gray-500)]" />
              </Link>
              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                  aria-label="User menu"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name || 'User'}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[var(--gray-200)] flex items-center justify-center">
                      <User size={14} className="text-[var(--gray-500)]" />
                    </div>
                  )}
                  <ChevronDown size={14} className="text-[var(--gray-400)]" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-[var(--gray-200)] shadow-lg py-2 z-50">
                    {user && (
                      <div className="px-4 py-3 border-b border-[var(--gray-100)]">
                        <p className="text-sm font-medium text-[var(--gray-800)]">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-[var(--gray-500)] truncate">
                          {user.email}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)] transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
