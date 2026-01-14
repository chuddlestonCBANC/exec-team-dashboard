'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getCurrentWeekOf } from '@/lib/utils/formatting';

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  target_date: string;
  created_at: string;
  metric: {
    id: string;
    name: string;
    pillar: {
      name: string;
    };
  };
  executive: {
    id: string;
    name: string;
    headshotUrl: string;
  };
  updates: Array<{
    id: string;
    content: string;
    created_at: string;
    executive: {
      name: string;
    };
  }>;
}

export default function ActionPlansPage() {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOf());

  useEffect(() => {
    loadActionPlans();
  }, []);

  const loadActionPlans = async () => {
    try {
      const res = await fetch('/api/action-plans/timeline');
      if (res.ok) {
        const data = await res.json();
        setActionPlans(data.actionPlans);
      }
    } catch (error) {
      console.error('Failed to load action plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = actionPlans.filter(plan => {
    if (filter === 'all') return true;
    return plan.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'in_progress':
        return <Clock size={16} className="text-blue-600" />;
      default:
        return <Clock size={16} className="text-amber-600" />;
    }
  };

  const isOverdue = (targetDate: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(targetDate) < new Date();
  };

  const getDaysUntil = (targetDate: string) => {
    const days = Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days until due`;
  };

  if (loading) {
    return (
      <>
        <DashboardHeader
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          onRefresh={loadActionPlans}
          isRefreshing={loading}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--gray-500)]">Loading action plans...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        onRefresh={loadActionPlans}
        isRefreshing={loading}
      />
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[var(--gray-900)]">Team Action Plans</h1>
            <p className="text-[var(--gray-600)] mt-2">Timeline view of all active commitments and their progress</p>
          </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--gray-200)]">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--gray-600)] hover:text-[var(--gray-900)]'
            }`}
          >
            All ({actionPlans.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'pending'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--gray-600)] hover:text-[var(--gray-900)]'
            }`}
          >
            Pending ({actionPlans.filter(p => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'in_progress'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--gray-600)] hover:text-[var(--gray-900)]'
            }`}
          >
            In Progress ({actionPlans.filter(p => p.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'completed'
                ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--gray-600)] hover:text-[var(--gray-900)]'
            }`}
          >
            Completed ({actionPlans.filter(p => p.status === 'completed').length})
          </button>
        </div>

        {/* Timeline View */}
        <div className="space-y-4">
          {filteredPlans.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-[var(--gray-200)]">
              <p className="text-[var(--gray-500)]">No action plans found</p>
            </div>
          )}

          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-md ${
                isOverdue(plan.target_date, plan.status)
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-[var(--gray-200)]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="flex-shrink-0 text-center">
                  <div className="bg-[var(--gray-100)] rounded-lg px-3 py-2 min-w-[80px]">
                    <div className="text-2xl font-bold text-[var(--gray-900)]">
                      {new Date(plan.target_date).getDate()}
                    </div>
                    <div className="text-xs text-[var(--gray-600)] uppercase">
                      {new Date(plan.target_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className={`text-xs mt-2 font-medium ${
                    isOverdue(plan.target_date, plan.status) ? 'text-red-600' : 'text-[var(--gray-600)]'
                  }`}>
                    {getDaysUntil(plan.target_date)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--gray-900)]">{plan.title}</h3>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(plan.status)}`}>
                          {getStatusIcon(plan.status)}
                          <span className="capitalize">{plan.status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {/* Metric & Pillar */}
                      <Link
                        href={`/metric/${plan.metric.id}`}
                        className="inline-flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--primary)] mb-2"
                      >
                        <span>{plan.metric.pillar.name}</span>
                        <ArrowRight size={12} />
                        <span className="font-medium">{plan.metric.name}</span>
                      </Link>

                      {/* Description */}
                      {plan.description && (
                        <p className="text-sm text-[var(--gray-700)] mt-2">{plan.description}</p>
                      )}
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2 ml-4">
                      <Image
                        src={plan.executive.headshotUrl}
                        alt={plan.executive.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-[var(--gray-900)]">{plan.executive.name}</div>
                        <div className="text-xs text-[var(--gray-500)]">Owner</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Updates */}
                  {plan.updates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--gray-200)]">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={16} className="text-[var(--gray-500)]" />
                        <span className="text-sm font-medium text-[var(--gray-700)]">Recent Updates</span>
                      </div>
                      <div className="space-y-2">
                        {plan.updates.slice(0, 2).map((update) => (
                          <div key={update.id} className="bg-[var(--gray-50)] rounded-lg p-3">
                            <p className="text-sm text-[var(--gray-700)]">{update.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-[var(--gray-500)]">
                              <span>{update.executive.name}</span>
                              <span>•</span>
                              <span>{new Date(update.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        {plan.updates.length > 2 && (
                          <Link
                            href={`/metric/${plan.metric.id}`}
                            className="text-sm text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                          >
                            View all {plan.updates.length} updates
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
