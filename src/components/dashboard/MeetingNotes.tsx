'use client';

import { MeetingNotes as MeetingNotesType } from '@/types';
import { format, parseISO } from 'date-fns';
import { FileText, Clock } from 'lucide-react';

interface MeetingNotesProps {
  notes: MeetingNotesType;
}

export function MeetingNotes({ notes }: MeetingNotesProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--primary)]/10 rounded-lg">
            <FileText size={24} className="text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--gray-900)]">Meeting Notes</h2>
            <p className="text-[var(--gray-500)] mt-0.5">
              Week of {format(parseISO(notes.weekOf), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--gray-500)]">
          <Clock size={16} />
          <span>Generated {format(parseISO(notes.generatedAt), "MMM d 'at' h:mm a")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[var(--gray-200)] shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="prose prose-sm sm:prose max-w-none text-[var(--gray-700)]">
            {notes.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
