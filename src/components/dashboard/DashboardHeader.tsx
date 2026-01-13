'use client';

import { RefreshCw, Settings, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { WeekSelector } from '@/components/ui/WeekSelector';
import { formatRelativeTime } from '@/lib/utils/formatting';

interface DashboardHeaderProps {
  selectedWeek: string;
  onWeekChange: (weekOf: string) => void;
  lastRefreshed?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({
  selectedWeek,
  onWeekChange,
  lastRefreshed,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
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
            <h1 className="hidden sm:block text-lg font-semibold text-[var(--gray-800)]">
              Executive Dashboard
            </h1>
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
              <button
                className="p-2 rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                aria-label="User menu"
              >
                <User size={18} className="text-[var(--gray-500)]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
