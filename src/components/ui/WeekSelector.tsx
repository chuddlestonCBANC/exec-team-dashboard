'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { WeekInfo } from '@/types';
import { getWeeksRange, isCurrentWeek } from '@/lib/utils/formatting';

interface WeekSelectorProps {
  selectedWeek: string;
  onWeekChange: (weekOf: string) => void;
}

export function WeekSelector({ selectedWeek, onWeekChange }: WeekSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const weeks = getWeeksRange(12);

  const selectedWeekInfo = weeks.find((w) => w.weekOf === selectedWeek) || weeks[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevWeek = () => {
    const currentIndex = weeks.findIndex((w) => w.weekOf === selectedWeek);
    if (currentIndex < weeks.length - 1) {
      onWeekChange(weeks[currentIndex + 1].weekOf);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = weeks.findIndex((w) => w.weekOf === selectedWeek);
    if (currentIndex > 0) {
      onWeekChange(weeks[currentIndex - 1].weekOf);
    }
  };

  const canGoPrev = weeks.findIndex((w) => w.weekOf === selectedWeek) < weeks.length - 1;
  const canGoNext = weeks.findIndex((w) => w.weekOf === selectedWeek) > 0;

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      <button
        onClick={handlePrevWeek}
        disabled={!canGoPrev}
        className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft size={20} className="text-[var(--gray-600)]" />
      </button>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[var(--gray-200)] hover:border-[var(--primary)] transition-colors min-w-[200px]"
        >
          <Calendar size={16} className="text-[var(--primary)]" />
          <span className="text-sm font-medium text-[var(--gray-700)] flex-1 text-left">
            {selectedWeekInfo.label}
          </span>
          {selectedWeekInfo.isCurrentWeek && (
            <span className="text-xs bg-[var(--primary)] text-white px-1.5 py-0.5 rounded">
              Current
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-[var(--gray-400)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg border border-[var(--gray-200)] shadow-lg z-50 max-h-[300px] overflow-y-auto">
            {weeks.map((week) => (
              <button
                key={week.weekOf}
                onClick={() => {
                  onWeekChange(week.weekOf);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--gray-50)] flex items-center justify-between ${
                  week.weekOf === selectedWeek ? 'bg-[var(--primary)]/5 text-[var(--primary)]' : 'text-[var(--gray-700)]'
                }`}
              >
                <span>{week.label}</span>
                {week.isCurrentWeek && (
                  <span className="text-xs bg-[var(--primary)] text-white px-1.5 py-0.5 rounded">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleNextWeek}
        disabled={!canGoNext}
        className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next week"
      >
        <ChevronRight size={20} className="text-[var(--gray-600)]" />
      </button>
    </div>
  );
}
