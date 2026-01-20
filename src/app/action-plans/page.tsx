'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  Send,
  AlertCircle,
} from 'lucide-react';
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

interface Metric {
  id: string;
  name: string;
  pillar: { name: string };
}

interface Executive {
  id: string;
  name: string;
  headshotUrl: string;
}

export default function ActionPlansPage() {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOf());

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    metricId: '',
    executiveId: '',
  });
  const [updateContent, setUpdateContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/action-plans/timeline');
      if (res.ok) {
        const data = await res.json();
        setActionPlans(data.actionPlans || []);

        // Extract unique metrics and executives from action plans
        const uniqueMetrics = new Map<string, Metric>();
        const uniqueExecs = new Map<string, Executive>();

        (data.actionPlans || []).forEach((plan: ActionPlan) => {
          if (plan.metric) {
            uniqueMetrics.set(plan.metric.id, plan.metric);
          }
          if (plan.executive) {
            uniqueExecs.set(plan.executive.id, plan.executive);
          }
        });

        setMetrics(Array.from(uniqueMetrics.values()));
        setExecutives(Array.from(uniqueExecs.values()));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all metrics and executives for the add form
  const loadMetricsAndExecutives = async () => {
    try {
      const res = await fetch('/api/test-db');
      if (res.ok) {
        const data = await res.json();
        if (data.pillars) {
          const allMetrics: Metric[] = [];
          data.pillars.forEach((pillar: any) => {
            (pillar.metrics || []).forEach((metric: any) => {
              allMetrics.push({
                id: metric.id,
                name: metric.name,
                pillar: { name: pillar.name },
              });
            });
          });
          setMetrics(allMetrics);
        }
        if (data.executives) {
          setExecutives(data.executives);
        }
      }
    } catch (error) {
      console.error('Failed to load metrics/executives:', error);
    }
  };

  const filteredPlans = actionPlans.filter((plan) => {
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

  const isOverdue = (targetDate: string, status: string) => {
    if (status === 'completed') return false;
    return new Date(targetDate) < new Date();
  };

  const getDaysUntil = (targetDate: string) => {
    const days = Math.ceil(
      (new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days until due`;
  };

  // Status change handler
  const handleStatusChange = async (plan: ActionPlan, newStatus: string) => {
    try {
      const res = await fetch(`/api/metrics/${plan.metric.id}/commitments/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActionPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, status: newStatus as any } : p))
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Delete handler
  const handleDelete = async (plan: ActionPlan) => {
    if (!confirm(`Are you sure you want to delete "${plan.title}"?`)) return;

    try {
      const res = await fetch(`/api/metrics/${plan.metric.id}/commitments/${plan.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setActionPlans((prev) => prev.filter((p) => p.id !== plan.id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Edit handler
  const openEditModal = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      targetDate: plan.target_date?.split('T')[0] || '',
      metricId: plan.metric.id,
      executiveId: plan.executive.id,
    });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editingPlan) return;
    setSaving(true);

    try {
      const res = await fetch(
        `/api/metrics/${editingPlan.metric.id}/commitments/${editingPlan.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            targetDate: formData.targetDate,
          }),
        }
      );

      if (res.ok) {
        await loadData();
        setShowEditModal(false);
        setEditingPlan(null);
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add new action plan
  const openAddModal = () => {
    loadMetricsAndExecutives();
    setFormData({
      title: '',
      description: '',
      targetDate: '',
      metricId: '',
      executiveId: '',
    });
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!formData.title || !formData.metricId || !formData.executiveId) {
      alert('Please fill in all required fields');
      return;
    }
    setSaving(true);

    try {
      const res = await fetch(`/api/metrics/${formData.metricId}/commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          targetDate: formData.targetDate || null,
          executiveId: formData.executiveId,
        }),
      });

      if (res.ok) {
        await loadData();
        setShowAddModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create action plan');
      }
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add progress update
  const handleAddUpdate = async (plan: ActionPlan) => {
    const content = updateContent[plan.id];
    if (!content?.trim()) return;

    try {
      const res = await fetch(`/api/commitments/${plan.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          executiveId: plan.executive.id,
        }),
      });

      if (res.ok) {
        setUpdateContent((prev) => ({ ...prev, [plan.id]: '' }));
        await loadData();
      }
    } catch (error) {
      console.error('Failed to add update:', error);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardHeader
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          onRefresh={loadData}
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
        onRefresh={loadData}
        isRefreshing={loading}
      />
      <div className="min-h-screen bg-[var(--background)] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--gray-900)]">Team Action Plans</h1>
              <p className="text-[var(--gray-600)] mt-2">
                Timeline view of all active commitments and their progress
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
            >
              <Plus size={18} />
              Add Action Plan
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[var(--gray-200)]">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 font-medium transition-colors ${
                  filter === status
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                    : 'text-[var(--gray-600)] hover:text-[var(--gray-900)]'
                }`}
              >
                {status === 'all'
                  ? `All (${actionPlans.length})`
                  : status === 'in_progress'
                  ? `In Progress (${actionPlans.filter((p) => p.status === 'in_progress').length})`
                  : `${status.charAt(0).toUpperCase() + status.slice(1)} (${
                      actionPlans.filter((p) => p.status === status).length
                    })`}
              </button>
            ))}
          </div>

          {/* Timeline View */}
          <div className="space-y-4">
            {filteredPlans.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-[var(--gray-200)]">
                <AlertCircle size={48} className="mx-auto text-[var(--gray-300)] mb-4" />
                <p className="text-[var(--gray-500)]">No action plans found</p>
                <button
                  onClick={openAddModal}
                  className="mt-4 text-[var(--primary)] hover:underline"
                >
                  Create your first action plan
                </button>
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
                    <div
                      className={`text-xs mt-2 font-medium ${
                        isOverdue(plan.target_date, plan.status)
                          ? 'text-red-600'
                          : 'text-[var(--gray-600)]'
                      }`}
                    >
                      {getDaysUntil(plan.target_date)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--gray-900)]">
                            {plan.title}
                          </h3>

                          {/* Status Dropdown */}
                          <div className="relative">
                            <select
                              value={plan.status}
                              onChange={(e) => handleStatusChange(plan, e.target.value)}
                              className={`appearance-none cursor-pointer flex items-center gap-1 pl-2 pr-7 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                                plan.status
                              )}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            />
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

                      {/* Owner & Actions */}
                      <div className="flex items-start gap-3 ml-4">
                        <div className="flex items-center gap-2">
                          <Image
                            src={plan.executive.headshotUrl}
                            alt={plan.executive.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-medium text-[var(--gray-900)]">
                              {plan.executive.name}
                            </div>
                            <div className="text-xs text-[var(--gray-500)]">Owner</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(plan)}
                            className="p-2 text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-[var(--gray-50)] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(plan)}
                            className="p-2 text-[var(--gray-400)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Updates Section */}
                    <div className="mt-4 pt-4 border-t border-[var(--gray-200)]">
                      <button
                        onClick={() =>
                          setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)
                        }
                        className="flex items-center gap-2 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--primary)]"
                      >
                        <MessageSquare size={16} className="text-[var(--gray-500)]" />
                        <span>Progress Updates ({plan.updates.length})</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            expandedPlanId === plan.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedPlanId === plan.id && (
                        <div className="mt-3 space-y-3">
                          {/* Add Update Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={updateContent[plan.id] || ''}
                              onChange={(e) =>
                                setUpdateContent((prev) => ({
                                  ...prev,
                                  [plan.id]: e.target.value,
                                }))
                              }
                              placeholder="Add a progress update..."
                              className="flex-1 px-3 py-2 text-sm border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddUpdate(plan);
                              }}
                            />
                            <button
                              onClick={() => handleAddUpdate(plan)}
                              disabled={!updateContent[plan.id]?.trim()}
                              className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send size={16} />
                            </button>
                          </div>

                          {/* Updates List */}
                          {plan.updates.length > 0 ? (
                            <div className="space-y-2">
                              {plan.updates.map((update) => (
                                <div
                                  key={update.id}
                                  className="bg-[var(--gray-50)] rounded-lg p-3"
                                >
                                  <p className="text-sm text-[var(--gray-700)]">{update.content}</p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--gray-500)]">
                                    <span>{update.executive.name}</span>
                                    <span>•</span>
                                    <span>{new Date(update.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-[var(--gray-500)] italic">
                              No updates yet. Add the first one!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--gray-200)]">
              <h2 className="text-lg font-semibold text-[var(--gray-900)]">New Action Plan</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-[var(--gray-100)] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  placeholder="Add more details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Related Metric *
                </label>
                <select
                  value={formData.metricId}
                  onChange={(e) => setFormData({ ...formData, metricId: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="">Select a metric...</option>
                  {metrics.map((metric) => (
                    <option key={metric.id} value={metric.id}>
                      {metric.pillar.name} → {metric.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Owner *
                </label>
                <select
                  value={formData.executiveId}
                  onChange={(e) => setFormData({ ...formData, executiveId: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="">Select an owner...</option>
                  {executives.map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--gray-200)]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !formData.title || !formData.metricId || !formData.executiveId}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Action Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--gray-200)]">
              <h2 className="text-lg font-semibold text-[var(--gray-900)]">Edit Action Plan</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-[var(--gray-100)] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--gray-200)]">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving || !formData.title}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
