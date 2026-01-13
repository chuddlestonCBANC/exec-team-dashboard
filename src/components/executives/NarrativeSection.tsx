'use client';

import { useState } from 'react';
import { Narrative, Executive } from '@/types';
import { formatRelativeTime } from '@/lib/utils/formatting';
import { FileText, Plus, Edit2, Save, X } from 'lucide-react';
import Image from 'next/image';

interface NarrativeSectionProps {
  narratives: Narrative[];
  executives: Executive[];
  currentExecutive?: Executive;
  metricId: string;
  onAddNarrative?: (content: string) => void;
  onUpdateNarrative?: (narrativeId: string, content: string) => void;
}

export function NarrativeSection({
  narratives,
  executives,
  currentExecutive,
  metricId,
  onAddNarrative,
  onUpdateNarrative,
}: NarrativeSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleAdd = () => {
    if (content.trim() && onAddNarrative) {
      onAddNarrative(content.trim());
      setContent('');
      setIsAdding(false);
    }
  };

  const handleUpdate = (narrativeId: string) => {
    if (editContent.trim() && onUpdateNarrative) {
      onUpdateNarrative(narrativeId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const startEditing = (narrative: Narrative) => {
    setEditingId(narrative.id);
    setEditContent(narrative.content);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--gray-800)] flex items-center gap-2">
          <FileText size={20} />
          Narrative & Action Plan
        </h3>
        {currentExecutive && onAddNarrative && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Narrative
          </button>
        )}
      </div>

      {/* Add New Narrative Form */}
      {isAdding && (
        <div className="bg-white rounded-xl border border-[var(--primary)] p-4">
          <div className="flex items-start gap-3 mb-3">
            <Image
              src={currentExecutive?.headshotUrl || ''}
              alt={currentExecutive?.name || ''}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--gray-800)]">
                {currentExecutive?.name}
              </p>
              <p className="text-xs text-[var(--gray-500)]">
                {currentExecutive?.title}
              </p>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the current situation, root causes, and your action plan..."
            className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] min-h-[120px] resize-none"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setContent('');
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Narrative
            </button>
          </div>
        </div>
      )}

      {/* Existing Narratives */}
      {narratives.length === 0 && !isAdding ? (
        <div className="text-center py-8 bg-[var(--gray-50)] rounded-xl border border-[var(--gray-200)] border-dashed">
          <FileText size={32} className="mx-auto mb-2 text-[var(--gray-400)]" />
          <p className="text-[var(--gray-500)]">No narratives added yet</p>
          <p className="text-sm text-[var(--gray-400)] mt-1">
            Add context about what&apos;s driving this metric&apos;s performance
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {narratives.map((narrative) => {
            const author = executives.find((e) => e.id === narrative.executiveId);
            const isEditing = editingId === narrative.id;
            const canEdit =
              currentExecutive?.id === narrative.executiveId && onUpdateNarrative;

            return (
              <div
                key={narrative.id}
                className="bg-white rounded-xl border border-[var(--gray-200)] p-4"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={author?.headshotUrl || ''}
                    alt={author?.name || ''}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--gray-800)]">
                          {author?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-[var(--gray-500)]">
                          {formatRelativeTime(narrative.updatedAt || narrative.createdAt)}
                        </p>
                      </div>
                      {canEdit && !isEditing && (
                        <button
                          onClick={() => startEditing(narrative)}
                          className="p-1.5 text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="p-1.5 text-[var(--gray-500)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdate(narrative.id)}
                            disabled={!editContent.trim()}
                            className="p-1.5 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Save size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--gray-600)] whitespace-pre-wrap">
                        {narrative.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
