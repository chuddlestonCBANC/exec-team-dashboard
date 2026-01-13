'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MetricReviewItem, MetricReviewStatus, Executive, MetricWithDetails } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import { formatRelativeTime } from '@/lib/utils/formatting';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  TrendingDown,
  ExternalLink,
} from 'lucide-react';

interface MetricsToReviewProps {
  items: MetricReviewItem[];
  executives: Executive[];
  onUpdateItem: (id: string, updates: Partial<MetricReviewItem>) => void;
  onAddCommitment: (metricId: string, commitment: {
    title: string;
    description: string;
    executiveId: string;
    targetDate?: string;
  }) => void;
}

export function MetricsToReview({
  items,
  executives,
  onUpdateItem,
  onAddCommitment,
}: MetricsToReviewProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [addingCommitmentFor, setAddingCommitmentFor] = useState<string | null>(null);

  const pendingItems = items.filter((item) => item.status === 'pending');
  const deferredItems = items.filter((item) => item.status === 'deferred');
  const reviewedItems = items.filter(
    (item) => item.status === 'reviewed' || item.status === 'commitment_added'
  );

  const redMetrics = pendingItems.filter((item) => item.metric.status === 'red');
  const yellowMetrics = pendingItems.filter((item) => item.metric.status === 'yellow');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--gray-900)]">Metrics To Review</h2>
        <p className="text-sm text-[var(--gray-500)] mt-1">
          At-risk metrics that need attention. Review, defer, or create commitments.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            <span className="font-semibold">Off Track</span>
          </div>
          <p className="text-3xl font-bold text-red-700 mt-2">{redMetrics.length}</p>
          <p className="text-sm text-red-600">Require immediate attention</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock size={18} />
            <span className="font-semibold">At Risk</span>
          </div>
          <p className="text-3xl font-bold text-amber-700 mt-2">{yellowMetrics.length}</p>
          <p className="text-sm text-amber-600">Need monitoring</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={18} />
            <span className="font-semibold">Deferred</span>
          </div>
          <p className="text-3xl font-bold text-gray-700 mt-2">{deferredItems.length}</p>
          <p className="text-sm text-gray-500">Scheduled for later review</p>
        </div>
      </div>

      {/* Off Track Metrics */}
      {redMetrics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={16} />
            Off Track - Requires Action ({redMetrics.length})
          </h3>
          <div className="space-y-3">
            {redMetrics.map((item) => (
              <MetricReviewCard
                key={item.id}
                item={item}
                executives={executives}
                isExpanded={expandedItem === item.id}
                isAddingCommitment={addingCommitmentFor === item.id}
                onToggleExpand={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                onDefer={(deferUntil, reason) =>
                  onUpdateItem(item.id, {
                    status: 'deferred',
                    deferredUntil: deferUntil,
                    deferReason: reason,
                  })
                }
                onMarkReviewed={(notes) =>
                  onUpdateItem(item.id, {
                    status: 'reviewed',
                    reviewedAt: new Date().toISOString(),
                    notes,
                  })
                }
                onStartAddCommitment={() => setAddingCommitmentFor(item.id)}
                onCancelAddCommitment={() => setAddingCommitmentFor(null)}
                onAddCommitment={(commitment) => {
                  onAddCommitment(item.metricId, commitment);
                  onUpdateItem(item.id, { status: 'commitment_added' });
                  setAddingCommitmentFor(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* At Risk Metrics */}
      {yellowMetrics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={16} />
            At Risk - Monitor Closely ({yellowMetrics.length})
          </h3>
          <div className="space-y-3">
            {yellowMetrics.map((item) => (
              <MetricReviewCard
                key={item.id}
                item={item}
                executives={executives}
                isExpanded={expandedItem === item.id}
                isAddingCommitment={addingCommitmentFor === item.id}
                onToggleExpand={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                onDefer={(deferUntil, reason) =>
                  onUpdateItem(item.id, {
                    status: 'deferred',
                    deferredUntil: deferUntil,
                    deferReason: reason,
                  })
                }
                onMarkReviewed={(notes) =>
                  onUpdateItem(item.id, {
                    status: 'reviewed',
                    reviewedAt: new Date().toISOString(),
                    notes,
                  })
                }
                onStartAddCommitment={() => setAddingCommitmentFor(item.id)}
                onCancelAddCommitment={() => setAddingCommitmentFor(null)}
                onAddCommitment={(commitment) => {
                  onAddCommitment(item.metricId, commitment);
                  onUpdateItem(item.id, { status: 'commitment_added' });
                  setAddingCommitmentFor(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Deferred Metrics */}
      {deferredItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--gray-700)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Calendar size={16} />
            Deferred ({deferredItems.length})
          </h3>
          <div className="space-y-3">
            {deferredItems.map((item) => (
              <DeferredMetricCard
                key={item.id}
                item={item}
                onReopen={() => onUpdateItem(item.id, { status: 'pending', deferredUntil: undefined })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviewed This Week */}
      {reviewedItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--gray-700)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--success)]" />
            Reviewed This Week ({reviewedItems.length})
          </h3>
          <div className="space-y-2 opacity-75">
            {reviewedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-[var(--gray-50)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.metric.status} size="sm" />
                  <span className="text-sm text-[var(--gray-700)]">{item.metric.name}</span>
                  {item.status === 'commitment_added' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Plus size={10} />
                      Commitment Added
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--gray-400)]">
                  {item.reviewedAt && formatRelativeTime(item.reviewedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingItems.length === 0 && deferredItems.length === 0 && (
        <div className="bg-emerald-50 rounded-xl p-8 text-center border border-emerald-100">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-emerald-800">All Caught Up!</h3>
          <p className="text-emerald-600 mt-1">
            No at-risk metrics to review right now. Great work!
          </p>
        </div>
      )}
    </div>
  );
}

interface MetricReviewCardProps {
  item: MetricReviewItem;
  executives: Executive[];
  isExpanded: boolean;
  isAddingCommitment: boolean;
  onToggleExpand: () => void;
  onDefer: (deferUntil: string, reason?: string) => void;
  onMarkReviewed: (notes?: string) => void;
  onStartAddCommitment: () => void;
  onCancelAddCommitment: () => void;
  onAddCommitment: (commitment: {
    title: string;
    description: string;
    executiveId: string;
    targetDate?: string;
  }) => void;
}

function MetricReviewCard({
  item,
  executives,
  isExpanded,
  isAddingCommitment,
  onToggleExpand,
  onDefer,
  onMarkReviewed,
  onStartAddCommitment,
  onCancelAddCommitment,
  onAddCommitment,
}: MetricReviewCardProps) {
  const [notes, setNotes] = useState('');
  const [deferWeeks, setDeferWeeks] = useState('1');
  const [deferReason, setDeferReason] = useState('');
  const [showDeferForm, setShowDeferForm] = useState(false);

  const { metric } = item;
  const percentDiff = metric.percentageOfTarget - 100;

  return (
    <div
      className={`bg-white rounded-xl border ${
        metric.status === 'red' ? 'border-red-200' : 'border-amber-200'
      } overflow-hidden`}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-[var(--gray-50)] transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <StatusBadge status={metric.status} />
              <div>
                <h4 className="font-medium text-[var(--gray-800)]">{metric.name}</h4>
                <p className="text-xs text-[var(--gray-500)]">{item.pillarName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[var(--gray-400)]" />
                <span className="text-sm text-[var(--gray-600)]">
                  {metric.currentValue} / {metric.targetValue}
                </span>
                <span
                  className={`text-sm font-medium ${
                    percentDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  ({percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(0)}%)
                </span>
              </div>
              <TrendIndicator direction={metric.trendDirection} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/metric/${metric.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
            </Link>
            {isExpanded ? (
              <ChevronUp size={18} className="text-[var(--gray-400)]" />
            ) : (
              <ChevronDown size={18} className="text-[var(--gray-400)]" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--gray-100)]">
          {/* Owners */}
          {metric.owners.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[var(--gray-500)] mb-1">Owned by</p>
              <div className="flex flex-wrap gap-2">
                {metric.owners.map((owner) => (
                  <span
                    key={owner.id}
                    className="px-2 py-1 bg-[var(--gray-100)] text-[var(--gray-700)] text-xs rounded-full"
                  >
                    {owner.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-4">
            <p className="text-sm text-[var(--gray-600)]">{metric.description}</p>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-[var(--gray-700)] mb-1.5">
              Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this metric..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
            />
          </div>

          {/* Defer Form */}
          {showDeferForm && (
            <div className="mt-4 p-4 bg-[var(--gray-50)] rounded-lg">
              <p className="text-sm font-medium text-[var(--gray-700)] mb-3">Defer Review</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--gray-500)] mb-1">
                    Defer for
                  </label>
                  <select
                    value={deferWeeks}
                    onChange={(e) => setDeferWeeks(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg"
                  >
                    <option value="1">1 week</option>
                    <option value="2">2 weeks</option>
                    <option value="4">1 month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--gray-500)] mb-1">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={deferReason}
                    onChange={(e) => setDeferReason(e.target.value)}
                    placeholder="Why defer?"
                    className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    const weeks = parseInt(deferWeeks);
                    const deferDate = new Date();
                    deferDate.setDate(deferDate.getDate() + weeks * 7);
                    onDefer(deferDate.toISOString(), deferReason || undefined);
                    setShowDeferForm(false);
                  }}
                  className="px-3 py-1.5 bg-[var(--gray-200)] text-[var(--gray-700)] rounded-lg text-sm font-medium hover:bg-[var(--gray-300)] transition-colors"
                >
                  Confirm Defer
                </button>
                <button
                  onClick={() => setShowDeferForm(false)}
                  className="px-3 py-1.5 text-[var(--gray-500)] text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Commitment Form */}
          {isAddingCommitment && (
            <AddCommitmentForm
              metric={metric}
              executives={executives}
              onSubmit={onAddCommitment}
              onCancel={onCancelAddCommitment}
            />
          )}

          {/* Actions */}
          {!showDeferForm && !isAddingCommitment && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--gray-100)]">
              <button
                onClick={onStartAddCommitment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors"
              >
                <Plus size={14} />
                Add Commitment
              </button>
              <button
                onClick={() => onMarkReviewed(notes || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
              >
                <CheckCircle2 size={14} />
                Mark Reviewed
              </button>
              <button
                onClick={() => setShowDeferForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gray-100)] text-[var(--gray-600)] rounded-lg text-sm font-medium hover:bg-[var(--gray-200)] transition-colors"
              >
                <Calendar size={14} />
                Defer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AddCommitmentFormProps {
  metric: MetricWithDetails;
  executives: Executive[];
  onSubmit: (commitment: {
    title: string;
    description: string;
    executiveId: string;
    targetDate?: string;
  }) => void;
  onCancel: () => void;
}

function AddCommitmentForm({ metric, executives, onSubmit, onCancel }: AddCommitmentFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [executiveId, setExecutiveId] = useState(metric.owners[0]?.id || executives[0]?.id || '');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      executiveId,
      targetDate: targetDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-[var(--primary)]/5 rounded-lg border border-[var(--primary)]/20">
      <p className="text-sm font-semibold text-[var(--primary)] mb-3">
        New Commitment for {metric.name}
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[var(--gray-600)] mb-1">
            What will you commit to? *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Implement new lead scoring model"
            className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--gray-600)] mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the commitment..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[var(--gray-600)] mb-1">Owner</label>
            <select
              value={executiveId}
              onChange={(e) => setExecutiveId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg"
            >
              {executives.map((exec) => (
                <option key={exec.id} value={exec.id}>
                  {exec.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--gray-600)] mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
        >
          Create Commitment
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[var(--gray-500)] text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface DeferredMetricCardProps {
  item: MetricReviewItem;
  onReopen: () => void;
}

function DeferredMetricCard({ item, onReopen }: DeferredMetricCardProps) {
  const { metric } = item;

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)]">
      <div className="flex items-center gap-3">
        <StatusBadge status={metric.status} size="sm" />
        <div>
          <h4 className="text-sm font-medium text-[var(--gray-700)]">{metric.name}</h4>
          <p className="text-xs text-[var(--gray-500)]">
            {item.deferReason && `${item.deferReason} • `}
            Review on {item.deferredUntil ? new Date(item.deferredUntil).toLocaleDateString() : 'TBD'}
          </p>
        </div>
      </div>
      <button
        onClick={onReopen}
        className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
      >
        Review Now
      </button>
    </div>
  );
}
