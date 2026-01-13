'use client';

import { useState } from 'react';
import { CommitmentWithMetric, CommitmentStatus, Executive } from '@/types';
import { formatRelativeTime, formatDate } from '@/lib/utils/formatting';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Plus,
  Send,
  Calendar,
} from 'lucide-react';

interface CommitmentListProps {
  commitments: CommitmentWithMetric[];
  executives: Executive[];
  currentExecutive?: Executive;
  onAddUpdate?: (commitmentId: string, content: string) => void;
  onStatusChange?: (commitmentId: string, status: CommitmentStatus) => void;
}

export function CommitmentList({
  commitments,
  executives,
  currentExecutive,
  onAddUpdate,
  onStatusChange,
}: CommitmentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newUpdate, setNewUpdate] = useState('');

  const getStatusIcon = (status: CommitmentStatus) => {
    switch (status) {
      case 'pending':
        return <AlertCircle size={16} className="text-[var(--gray-500)]" />;
      case 'in_progress':
        return <Clock size={16} className="text-[var(--primary)]" />;
      case 'completed':
        return <CheckCircle2 size={16} className="text-[var(--success)]" />;
      case 'cancelled':
        return <XCircle size={16} className="text-[var(--danger)]" />;
    }
  };

  const getStatusColor = (status: CommitmentStatus) => {
    switch (status) {
      case 'pending':
        return { bg: '#F2F4F7', border: '#D0D5DD', text: '#667085' };
      case 'in_progress':
        return { bg: '#EEF4FF', border: '#6941C6', text: '#6941C6' };
      case 'completed':
        return { bg: '#ECFDF3', border: '#12B76A', text: '#12B76A' };
      case 'cancelled':
        return { bg: '#FEF3F2', border: '#F04438', text: '#F04438' };
    }
  };

  const handleSubmitUpdate = (commitmentId: string) => {
    if (newUpdate.trim() && onAddUpdate) {
      onAddUpdate(commitmentId, newUpdate.trim());
      setNewUpdate('');
    }
  };

  if (commitments.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--gray-500)]">
        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
        <p>No commitments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commitments.map((commitment) => {
        const isExpanded = expandedId === commitment.id;
        const colors = getStatusColor(commitment.status);
        const owner = executives.find((e) => e.id === commitment.executiveId);

        return (
          <div
            key={commitment.id}
            className="bg-white rounded-xl border overflow-hidden transition-all"
            style={{ borderColor: colors.border }}
          >
            {/* Header */}
            <div
              className="p-4 cursor-pointer"
              style={{ backgroundColor: colors.bg }}
              onClick={() => setExpandedId(isExpanded ? null : commitment.id)}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(commitment.status)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[var(--gray-800)]">
                    {commitment.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[var(--gray-500)]">
                    <span>{owner?.name}</span>
                    <span>-</span>
                    <span>{commitment.metric.name}</span>
                  </div>
                </div>
                {commitment.targetDate && (
                  <div className="flex items-center gap-1 text-sm text-[var(--gray-500)]">
                    <Calendar size={14} />
                    <span>{formatDate(commitment.targetDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-[var(--gray-100)]">
                {/* Description */}
                {commitment.description && (
                  <div className="p-4 border-b border-[var(--gray-100)]">
                    <p className="text-sm text-[var(--gray-600)]">
                      {commitment.description}
                    </p>
                  </div>
                )}

                {/* Status Actions */}
                {onStatusChange && commitment.status !== 'completed' && (
                  <div className="p-4 border-b border-[var(--gray-100)] bg-[var(--gray-50)]">
                    <p className="text-xs font-medium text-[var(--gray-500)] mb-2">
                      Update Status
                    </p>
                    <div className="flex gap-2">
                      {commitment.status !== 'in_progress' && (
                        <button
                          onClick={() => onStatusChange(commitment.id, 'in_progress')}
                          className="px-3 py-1.5 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/10 rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
                        >
                          Start Working
                        </button>
                      )}
                      <button
                        onClick={() => onStatusChange(commitment.id, 'completed')}
                        className="px-3 py-1.5 text-sm font-medium text-[var(--success)] bg-[var(--success)]/10 rounded-lg hover:bg-[var(--success)]/20 transition-colors"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => onStatusChange(commitment.id, 'cancelled')}
                        className="px-3 py-1.5 text-sm font-medium text-[var(--gray-500)] bg-[var(--gray-100)] rounded-lg hover:bg-[var(--gray-200)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Updates/Dialog */}
                <div className="p-4">
                  <h5 className="text-sm font-medium text-[var(--gray-700)] mb-3 flex items-center gap-2">
                    <MessageSquare size={14} />
                    Updates ({commitment.updates.length})
                  </h5>

                  {commitment.updates.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {commitment.updates.map((update) => (
                        <div
                          key={update.id}
                          className="flex gap-3 p-3 bg-[var(--gray-50)] rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-[var(--gray-700)]">
                                {update.executive?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-[var(--gray-400)]">
                                {formatRelativeTime(update.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--gray-600)]">
                              {update.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Update Form */}
                  {onAddUpdate && currentExecutive && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        placeholder="Add an update..."
                        className="flex-1 px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSubmitUpdate(commitment.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSubmitUpdate(commitment.id)}
                        disabled={!newUpdate.trim()}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
