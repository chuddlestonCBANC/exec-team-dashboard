'use client';

import Image from 'next/image';
import { ExecutiveWithDetails, CommitmentStatus, ExecutiveReport } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getMetricStatus } from '@/lib/utils/scoring';
import { formatRelativeTime } from '@/lib/utils/formatting';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface ExecutiveCardProps {
  executive: ExecutiveWithDetails;
  isExpanded?: boolean;
  onSaveReport?: (executiveId: string, content: string) => Promise<void>;
}

export function ExecutiveCard({ executive, isExpanded: initialExpanded = false, onSaveReport }: ExecutiveCardProps) {
  const { approvedUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editReportContent, setEditReportContent] = useState(executive.report?.content || '');
  const [isSavingReport, setIsSavingReport] = useState(false);

  // Check if current user can edit this executive's report
  const canEditReport = approvedUser?.executiveId === executive.id || approvedUser?.role === 'admin';

  const handleStartEditReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditReportContent(executive.report?.content || '');
    setIsEditingReport(true);
    setIsExpanded(true);
  };

  const handleCancelEditReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingReport(false);
    setEditReportContent(executive.report?.content || '');
  };

  const handleSaveReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSaveReport) return;

    setIsSavingReport(true);
    try {
      await onSaveReport(executive.id, editReportContent);
      setIsEditingReport(false);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setIsSavingReport(false);
    }
  };

  const activeCommitments = executive.commitments.filter(
    (c) => c.status === 'in_progress' || c.status === 'pending'
  );

  const metricsNeedingAttention = executive.ownedMetrics.filter((m) => {
    const status = getMetricStatus(m.currentValue, m.targetValue);
    return status === 'red' || status === 'yellow';
  });

  const statusCounts = {
    pending: activeCommitments.filter((c) => c.status === 'pending').length,
    in_progress: activeCommitments.filter((c) => c.status === 'in_progress').length,
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden">
      {/* Header */}
      <div
        className="p-5 cursor-pointer hover:bg-[var(--gray-50)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Headshot */}
          <div className="relative flex-shrink-0">
            <Image
              src={executive.headshotUrl}
              alt={executive.name}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
            {metricsNeedingAttention.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--warning)] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {metricsNeedingAttention.length}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)]">
                  {executive.name}
                </h3>
                <p className="text-sm text-[var(--gray-500)]">{executive.title}</p>
              </div>
              <button className="p-1">
                {isExpanded ? (
                  <ChevronUp size={20} className="text-[var(--gray-400)]" />
                ) : (
                  <ChevronDown size={20} className="text-[var(--gray-400)]" />
                )}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {statusCounts.in_progress > 0 && (
                <div className="flex items-center gap-1.5 text-[var(--primary)]">
                  <Clock size={14} />
                  <span>{statusCounts.in_progress} in progress</span>
                </div>
              )}
              {statusCounts.pending > 0 && (
                <div className="flex items-center gap-1.5 text-[var(--gray-500)]">
                  <AlertCircle size={14} />
                  <span>{statusCounts.pending} pending</span>
                </div>
              )}
              {executive.improvedMetrics.length > 0 && (
                <div className="flex items-center gap-1.5 text-[var(--success)]">
                  <TrendingUp size={14} />
                  <span>{executive.improvedMetrics.length} improved</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Report Preview */}
        {executive.report && !isExpanded && (
          <div className="mt-4 pl-20">
            <p className="text-sm text-[var(--gray-600)] line-clamp-3 leading-relaxed">
              {executive.report.content.split('\n\n')[0]}
            </p>
            {executive.report.content.split('\n\n').length > 1 && (
              <p className="text-xs text-[var(--primary)] mt-2 font-medium">
                Click to read full report →
              </p>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--gray-100)]">
          {/* Weekly Report */}
          <div className="p-5 bg-gradient-to-b from-[var(--gray-50)] to-white">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-[var(--gray-800)] flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Weekly Report
              </h4>
              {canEditReport && onSaveReport && !isEditingReport && (
                <button
                  onClick={handleStartEditReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                >
                  <Edit3 size={14} />
                  {executive.report ? 'Edit' : 'Write Report'}
                </button>
              )}
              {isEditingReport && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEditReport}
                    disabled={isSavingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReport}
                    disabled={isSavingReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSavingReport ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            {isEditingReport ? (
              <textarea
                value={editReportContent}
                onChange={(e) => setEditReportContent(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-48 p-3 text-sm text-[var(--gray-700)] leading-relaxed border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
                placeholder="Write your weekly report here...

Share updates on your team's progress, key accomplishments, challenges, and priorities for the coming week."
              />
            ) : executive.report ? (
              <div className="prose prose-sm max-w-none">
                {executive.report.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-sm text-[var(--gray-600)] leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--gray-400)] italic">
                No report submitted for this week yet.
              </p>
            )}
          </div>

          {/* Active Commitments */}
          {activeCommitments.length > 0 && (
            <div className="p-5 border-t border-[var(--gray-100)]">
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">
                Active Commitments
              </h4>
              <div className="space-y-3">
                {activeCommitments.map((commitment) => (
                  <div
                    key={commitment.id}
                    className="bg-white rounded-lg border border-[var(--gray-200)] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--gray-800)]">
                            {commitment.title}
                          </span>
                          <CommitmentStatusBadge status={commitment.status} />
                        </div>
                        <p className="text-xs text-[var(--gray-500)] mt-1">
                          Related to: {commitment.metric.name}
                        </p>
                      </div>
                    </div>
                    {commitment.description && (
                      <p className="text-sm text-[var(--gray-600)] mt-2">
                        {commitment.description}
                      </p>
                    )}

                    {/* Latest Update */}
                    {commitment.updates.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--gray-100)]">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-[var(--gray-400)] mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-[var(--gray-600)]">
                              {commitment.updates[0].content}
                            </p>
                            <p className="text-xs text-[var(--gray-400)] mt-1">
                              {commitment.updates[0].executive?.name || 'Unknown'} -{' '}
                              {formatRelativeTime(commitment.updates[0].createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improved Metrics */}
          {executive.improvedMetrics.length > 0 && (
            <div className="p-5 border-t border-[var(--gray-100)] bg-[var(--success-bg)]">
              <h4 className="text-sm font-semibold text-[var(--success)] mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Recently Improved Metrics
              </h4>
              <div className="flex flex-wrap gap-2">
                {executive.improvedMetrics.map((metric) => (
                  <span
                    key={metric.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm text-[var(--gray-700)] border border-[var(--success)]"
                  >
                    <CheckCircle2 size={14} className="text-[var(--success)]" />
                    {metric.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Needing Attention */}
          {metricsNeedingAttention.length > 0 && (
            <div className="p-5 border-t border-[var(--gray-100)]">
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-[var(--warning)]" />
                Metrics Needing Attention
              </h4>
              <div className="space-y-2">
                {metricsNeedingAttention.map((metric) => {
                  const status = getMetricStatus(metric.currentValue, metric.targetValue);
                  return (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 bg-[var(--gray-50)] rounded-lg"
                    >
                      <span className="text-sm text-[var(--gray-700)]">{metric.name}</span>
                      <StatusBadge status={status} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommitmentStatusBadge({ status }: { status: CommitmentStatus }) {
  const config = {
    pending: { bg: '#F2F4F7', color: '#667085', label: 'Pending' },
    in_progress: { bg: '#EEF4FF', color: '#6941C6', label: 'In Progress' },
    completed: { bg: '#ECFDF3', color: '#12B76A', label: 'Completed' },
    cancelled: { bg: '#FEF3F2', color: '#F04438', label: 'Cancelled' },
  };

  const { bg, color, label } = config[status];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}
