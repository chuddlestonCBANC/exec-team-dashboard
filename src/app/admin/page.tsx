'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getDashboardData,
  getExecutives,
  createMetric,
  updateMetric,
  deleteMetric,
  updateMetricValue,
  addMetricOwner,
  removeMetricOwner,
  createPillar,
  updatePillar,
  deletePillar,
  saveMetricTarget,
  getApprovedUsers,
  createApprovedUser,
  updateApprovedUser,
  deleteApprovedUser,
  createExecutive,
  updateExecutive,
  deleteExecutive,
  ApprovedUser,
  UserRole,
} from '@/lib/supabase/queries';
import { useAuth } from '@/components/providers/AuthProvider';
import { DashboardData, Executive, Metric } from '@/types';
import {
  ArrowLeft,
  Settings,
  Users,
  BarChart3,
  Link2,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Mail,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

type AdminTab = 'pillars' | 'metrics' | 'executives' | 'users' | 'integrations';

export default function AdminPage() {
  const { isAdmin, approvedUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('metrics');
  const [data, setData] = useState<DashboardData | null>(null);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, execData, usersData] = await Promise.all([
        getDashboardData(),
        getExecutives(),
        getApprovedUsers(),
      ]);
      setData(dashboardData);
      setExecutives(execData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tabs = [
    { id: 'pillars' as AdminTab, label: 'Pillars', icon: BarChart3 },
    { id: 'metrics' as AdminTab, label: 'Metrics', icon: BarChart3 },
    { id: 'executives' as AdminTab, label: 'Executives', icon: Users },
    { id: 'users' as AdminTab, label: 'Users', icon: Shield, adminOnly: true },
    { id: 'integrations' as AdminTab, label: 'Integrations', icon: Link2 },
  ];

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-100)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-[var(--gray-200)]" />
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-[var(--primary)]" />
                <h1 className="text-lg font-semibold text-[var(--gray-800)]">
                  Admin Configuration
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[var(--gray-200)] p-2">
              {tabs.filter(tab => !tab.adminOnly || isAdmin).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--gray-600)] hover:bg-[var(--gray-50)]'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1">
            {activeTab === 'pillars' && <PillarsConfig pillars={data.pillars} onRefresh={loadData} />}
            {activeTab === 'metrics' && <MetricsConfig pillars={data.pillars} executives={executives} onRefresh={loadData} />}
            {activeTab === 'executives' && <ExecutivesConfig executives={executives} onRefresh={loadData} />}
            {activeTab === 'users' && isAdmin && <UsersConfig users={users} executives={executives} onRefresh={loadData} />}
            {activeTab === 'integrations' && <IntegrationsConfig />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ============ PILLARS CONFIG ============

function PillarsConfig({ pillars, onRefresh }: { pillars: any[]; onRefresh: () => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    greenThreshold: 90,
    yellowThreshold: 70,
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', greenThreshold: 90, yellowThreshold: 70 });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createPillar({
        name: formData.name,
        description: formData.description,
        colorThresholds: { green: formData.greenThreshold, yellow: formData.yellowThreshold },
      });
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create pillar:', error);
      alert('Failed to create pillar');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await updatePillar(id, {
        name: formData.name,
        description: formData.description,
        colorThresholds: { green: formData.greenThreshold, yellow: formData.yellowThreshold },
      });
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update pillar:', error);
      alert('Failed to update pillar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pillar? All associated metrics will also be deleted.')) return;
    try {
      await deletePillar(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete pillar:', error);
      alert('Failed to delete pillar');
    }
  };

  const startEdit = (pillar: any) => {
    setFormData({
      name: pillar.name,
      description: pillar.description || '',
      greenThreshold: pillar.colorThresholds?.green || 90,
      yellowThreshold: pillar.colorThresholds?.yellow || 70,
    });
    setEditingId(pillar.id);
    setIsCreating(false);
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--gray-800)]">Strategic Pillars</h2>
        {!isCreating && !editingId && (
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            <Plus size={16} />
            Add Pillar
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-4 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)]">
          <h3 className="font-medium text-[var(--gray-800)] mb-4">
            {isCreating ? 'Create New Pillar' : 'Edit Pillar'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="e.g., Revenue Growth"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Green Threshold (%)</label>
              <input
                type="number"
                value={formData.greenThreshold}
                onChange={(e) => setFormData({ ...formData, greenThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Yellow Threshold (%)</label>
              <input
                type="number"
                value={formData.yellowThreshold}
                onChange={(e) => setFormData({ ...formData, yellowThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isCreating ? handleCreate() : handleUpdate(editingId!)}
              disabled={saving || !formData.name}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.id}
            className="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg"
          >
            <div>
              <h3 className="font-medium text-[var(--gray-800)]">{pillar.name}</h3>
              <p className="text-sm text-[var(--gray-500)]">{pillar.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-[var(--gray-500)]">
                <span>Green: {pillar.colorThresholds?.green || 90}%+</span>
                <span>Yellow: {pillar.colorThresholds?.yellow || 70}%+</span>
                <span>Red: &lt;{pillar.colorThresholds?.yellow || 70}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(pillar)}
                className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(pillar.id)}
                className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ METRICS CONFIG ============

function MetricsConfig({ pillars, executives, onRefresh }: { pillars: any[]; executives: Executive[]; onRefresh: () => void }) {
  const [selectedPillar, setSelectedPillar] = useState(pillars[0]?.id || '');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const defaultFormData = {
    name: '',
    description: '',
    metricType: 'key_result',
    dataSource: 'manual',
    format: 'number',
    unit: '',
    cadence: 'monthly',
    comparisonMode: 'at_or_above',
    targetValue: 0,
    currentValue: 0,
    warningThreshold: 70,
    criticalThreshold: 50,
    parentMetricId: '',
    ownerIds: [] as string[],
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [targetValues, setTargetValues] = useState<Record<string, string>>({});

  const currentPillar = pillars.find((p) => p.id === selectedPillar);
  const metrics = currentPillar?.metrics || [];

  const metricTypeOptions = [
    { value: 'key_result', label: 'Key Result' },
    { value: 'leading_indicator', label: 'Leading Indicator' },
    { value: 'quality', label: 'Quality Metric' },
  ];

  const formatOptions = [
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency ($)' },
    { value: 'percentage', label: 'Percentage (%)' },
  ];

  const cadenceOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
  ];

  const comparisonModeOptions = [
    { value: 'at_or_above', label: 'At or Above Target', description: 'Higher is better (e.g., revenue)' },
    { value: 'at_or_below', label: 'At or Below Target', description: 'Lower is better (e.g., churn)' },
    { value: 'on_track', label: 'On Track to Goal', description: 'Cumulative progress toward goal' },
    { value: 'exact', label: 'Exactly at Target', description: 'Must be exact (rare)' },
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

  const resetForm = () => {
    setFormData(defaultFormData);
    setTargetValues({});
    setIsCreating(false);
    setEditingId(null);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (metric: any) => {
    setFormData({
      name: metric.name,
      description: metric.description || '',
      metricType: metric.metricType || 'key_result',
      dataSource: metric.dataSource || 'manual',
      format: metric.format || 'number',
      unit: metric.unit || '',
      cadence: metric.cadence || 'monthly',
      comparisonMode: metric.comparisonMode || 'at_or_above',
      targetValue: metric.targetValue || 0,
      currentValue: metric.currentValue || 0,
      warningThreshold: metric.warningThreshold || 70,
      criticalThreshold: metric.criticalThreshold || 50,
      parentMetricId: metric.parentMetricId || '',
      ownerIds: metric.owners?.map((o: any) => o.id) || [],
    });
    initializeTargetValues(metric);
    setEditingId(metric.id);
    setIsCreating(false);
  };

  const initializeTargetValues = (metric: any) => {
    const values: Record<string, string> = {};
    const cadence = metric.cadence || 'monthly';

    if (cadence === 'annual') {
      values['annual'] = String(metric.targetValue || 0);
    } else if (cadence === 'quarterly') {
      const quarterlyDefault = metric.comparisonMode === 'on_track'
        ? Math.round(metric.targetValue / 4)
        : metric.targetValue;
      for (let q = 1; q <= 4; q++) {
        values[`quarterly_${q}`] = String(quarterlyDefault || 0);
      }
    } else if (cadence === 'monthly') {
      const monthlyDefault = metric.comparisonMode === 'on_track'
        ? Math.round(metric.targetValue / 12)
        : metric.targetValue;
      for (let m = 1; m <= 12; m++) {
        values[`monthly_${m}`] = String(monthlyDefault || 0);
      }
    }

    setTargetValues(values);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const newMetric = await createMetric({
        pillarId: selectedPillar,
        name: formData.name,
        description: formData.description,
        metricType: formData.metricType,
        dataSource: formData.dataSource,
        format: formData.format,
        unit: formData.unit || undefined,
        cadence: formData.cadence,
        comparisonMode: formData.comparisonMode,
        targetValue: formData.targetValue,
        currentValue: formData.currentValue,
        warningThreshold: formData.warningThreshold,
        criticalThreshold: formData.criticalThreshold,
        parentMetricId: formData.parentMetricId || undefined,
      });

      // Add owners
      for (const ownerId of formData.ownerIds) {
        await addMetricOwner(newMetric.id, ownerId);
      }

      // Save period targets
      await savePeriodTargets(newMetric.id, formData.cadence);

      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create metric:', error);
      alert('Failed to create metric');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, metric: any) => {
    setSaving(true);
    try {
      await updateMetric(id, {
        name: formData.name,
        description: formData.description,
        metricType: formData.metricType,
        dataSource: formData.dataSource,
        format: formData.format,
        unit: formData.unit || undefined,
        cadence: formData.cadence,
        comparisonMode: formData.comparisonMode,
        targetValue: formData.targetValue,
        currentValue: formData.currentValue,
        warningThreshold: formData.warningThreshold,
        criticalThreshold: formData.criticalThreshold,
        parentMetricId: formData.parentMetricId || null,
      });

      // Update owners - remove old, add new
      const currentOwnerIds = metric.owners?.map((o: any) => o.id) || [];
      const toRemove = currentOwnerIds.filter((id: string) => !formData.ownerIds.includes(id));
      const toAdd = formData.ownerIds.filter((id: string) => !currentOwnerIds.includes(id));

      for (const ownerId of toRemove) {
        await removeMetricOwner(id, ownerId);
      }
      for (const ownerId of toAdd) {
        await addMetricOwner(id, ownerId);
      }

      // Save period targets
      await savePeriodTargets(id, formData.cadence);

      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update metric:', error);
      alert('Failed to update metric');
    } finally {
      setSaving(false);
    }
  };

  const savePeriodTargets = async (metricId: string, cadence: string) => {
    if (cadence === 'annual' && targetValues['annual']) {
      await saveMetricTarget(metricId, 'annual', selectedYear, null, parseFloat(targetValues['annual']));
    } else if (cadence === 'quarterly') {
      for (let q = 1; q <= 4; q++) {
        const key = `quarterly_${q}`;
        if (targetValues[key]) {
          await saveMetricTarget(metricId, 'quarterly', selectedYear, q, parseFloat(targetValues[key]));
        }
      }
    } else if (cadence === 'monthly') {
      for (let m = 1; m <= 12; m++) {
        const key = `monthly_${m}`;
        if (targetValues[key]) {
          await saveMetricTarget(metricId, 'monthly', selectedYear, m, parseFloat(targetValues[key]));
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;
    try {
      await deleteMetric(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete metric:', error);
      alert('Failed to delete metric');
    }
  };

  const handleUpdateValue = async (id: string) => {
    const newValue = prompt('Enter new current value:');
    if (newValue === null) return;
    try {
      await updateMetricValue(id, parseFloat(newValue));
      onRefresh();
    } catch (error) {
      console.error('Failed to update value:', error);
      alert('Failed to update value');
    }
  };

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') return `$${value.toLocaleString()}`;
    if (format === 'percentage') return `${value}%`;
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--gray-800)]">Metrics Configuration</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--gray-600)]">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-[var(--gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {!isCreating && !editingId && (
            <button
              onClick={startCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
            >
              <Plus size={16} />
              Add Metric
            </button>
          )}
        </div>
      </div>

      {/* Pillar Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
          Filter by Pillar
        </label>
        <select
          value={selectedPillar}
          onChange={(e) => setSelectedPillar(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
        >
          {pillars.map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
              {pillar.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-4 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)]">
          <h3 className="font-medium text-[var(--gray-800)] mb-4">
            {isCreating ? 'Create New Metric' : 'Edit Metric'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="e.g., Monthly Revenue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Type</label>
              <select
                value={formData.metricType}
                onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              >
                {metricTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="Brief description of what this metric measures"
              />
            </div>

            {/* Format & Display */}
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              >
                {formatOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Unit (optional)</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="e.g., customers, hours, deals"
              />
            </div>

            {/* Tracking Settings */}
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Tracking Cadence</label>
              <select
                value={formData.cadence}
                onChange={(e) => {
                  const newCadence = e.target.value;
                  setFormData({ ...formData, cadence: newCadence });
                  // Reset target values when cadence changes
                  const newTargets: Record<string, string> = {};
                  if (newCadence === 'annual') {
                    newTargets['annual'] = String(formData.targetValue);
                  } else if (newCadence === 'quarterly') {
                    const def = formData.comparisonMode === 'on_track' ? Math.round(formData.targetValue / 4) : formData.targetValue;
                    for (let q = 1; q <= 4; q++) newTargets[`quarterly_${q}`] = String(def);
                  } else if (newCadence === 'monthly') {
                    const def = formData.comparisonMode === 'on_track' ? Math.round(formData.targetValue / 12) : formData.targetValue;
                    for (let m = 1; m <= 12; m++) newTargets[`monthly_${m}`] = String(def);
                  }
                  setTargetValues(newTargets);
                }}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              >
                {cadenceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Comparison Mode</label>
              <select
                value={formData.comparisonMode}
                onChange={(e) => setFormData({ ...formData, comparisonMode: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              >
                {comparisonModeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-[var(--gray-500)] mt-1">
                {comparisonModeOptions.find((o) => o.value === formData.comparisonMode)?.description}
              </p>
            </div>

            {/* Values & Thresholds */}
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Target Value *</label>
              <input
                type="number"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Current Value</label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Warning Threshold (%)</label>
              <input
                type="number"
                value={formData.warningThreshold}
                onChange={(e) => setFormData({ ...formData, warningThreshold: parseInt(e.target.value) || 70 })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
              <p className="text-xs text-[var(--gray-500)] mt-1">Below this = Yellow</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Critical Threshold (%)</label>
              <input
                type="number"
                value={formData.criticalThreshold}
                onChange={(e) => setFormData({ ...formData, criticalThreshold: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              />
              <p className="text-xs text-[var(--gray-500)] mt-1">Below this = Red</p>
            </div>

            {/* Owners */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">Owners</label>
              <div className="flex flex-wrap gap-2">
                {executives.map((exec) => (
                  <button
                    key={exec.id}
                    type="button"
                    onClick={() => {
                      const newOwnerIds = formData.ownerIds.includes(exec.id)
                        ? formData.ownerIds.filter((id) => id !== exec.id)
                        : [...formData.ownerIds, exec.id];
                      setFormData({ ...formData, ownerIds: newOwnerIds });
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                      formData.ownerIds.includes(exec.id)
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {formData.ownerIds.includes(exec.id) && <Check size={14} />}
                    {exec.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Period Targets */}
            <div className="md:col-span-2 mt-4 pt-4 border-t border-[var(--gray-200)]">
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">
                Period Targets for {selectedYear}
              </h4>

              {formData.cadence === 'annual' && (
                <div>
                  <label className="block text-xs text-[var(--gray-500)] mb-1">Annual Target</label>
                  <input
                    type="number"
                    value={targetValues['annual'] || ''}
                    onChange={(e) => setTargetValues({ ...targetValues, annual: e.target.value })}
                    className="w-full max-w-xs px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}

              {formData.cadence === 'quarterly' && (
                <div className="grid grid-cols-4 gap-3">
                  {quarterNames.map((q, idx) => (
                    <div key={q}>
                      <label className="block text-xs text-[var(--gray-500)] mb-1">{q}</label>
                      <input
                        type="number"
                        value={targetValues[`quarterly_${idx + 1}`] || ''}
                        onChange={(e) => setTargetValues({ ...targetValues, [`quarterly_${idx + 1}`]: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {formData.cadence === 'monthly' && (
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {monthNames.map((m, idx) => (
                    <div key={m}>
                      <label className="block text-xs text-[var(--gray-500)] mb-1 text-center">{m}</label>
                      <input
                        type="number"
                        value={targetValues[`monthly_${idx + 1}`] || ''}
                        onChange={(e) => setTargetValues({ ...targetValues, [`monthly_${idx + 1}`]: e.target.value })}
                        className="w-full px-2 py-1.5 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-sm text-center"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isCreating
                ? handleCreate()
                : handleUpdate(editingId!, metrics.find((m: any) => m.id === editingId))
              }
              disabled={saving || !formData.name || !formData.targetValue}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Metric'}
            </button>
          </div>
        </div>
      )}

      {/* Metrics List */}
      <div className="space-y-4">
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-[var(--gray-500)]">
            No metrics in this pillar yet. Click "Add Metric" to create one.
          </div>
        ) : (
          metrics.map((metric: any) => (
            <div
              key={metric.id}
              className="bg-[var(--gray-50)] rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--gray-100)] transition-colors"
                onClick={() => setExpandedMetric(expandedMetric === metric.id ? null : metric.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-[var(--gray-800)]">{metric.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      metric.status === 'green' ? 'bg-[var(--success-bg)] text-[var(--success)]' :
                      metric.status === 'yellow' ? 'bg-[var(--warning-bg)] text-[var(--warning)]' :
                      'bg-[var(--danger-bg)] text-[var(--danger)]'
                    }`}>
                      {formatValue(metric.currentValue, metric.format)} / {formatValue(metric.targetValue, metric.format)}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded">
                      {metric.metricType}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      {cadenceOptions.find((o) => o.value === metric.cadence)?.label || 'Monthly'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--gray-500)] mt-1">{metric.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateValue(metric.id); }}
                    className="px-3 py-1.5 text-xs text-[var(--primary)] hover:bg-white rounded-lg transition-colors"
                    title="Update current value"
                  >
                    Update Value
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(metric); }}
                    className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(metric.id); }}
                    className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedMetric === metric.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMetric === metric.id && (
                <div className="px-4 pb-4 border-t border-[var(--gray-200)]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-[var(--gray-500)]">Data Source</p>
                      <p className="text-sm font-medium text-[var(--gray-800)] capitalize">{metric.dataSource}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--gray-500)]">Format</p>
                      <p className="text-sm font-medium text-[var(--gray-800)] capitalize">{metric.format}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--gray-500)]">Warning Threshold</p>
                      <p className="text-sm font-medium text-[var(--gray-800)]">{metric.warningThreshold}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--gray-500)]">Critical Threshold</p>
                      <p className="text-sm font-medium text-[var(--gray-800)]">{metric.criticalThreshold}%</p>
                    </div>
                  </div>
                  {metric.owners && metric.owners.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-[var(--gray-500)] mb-2">Owners</p>
                      <div className="flex flex-wrap gap-2">
                        {metric.owners.map((owner: any) => (
                          <span
                            key={owner.id}
                            className="px-2 py-1 text-xs bg-white border border-[var(--gray-200)] rounded"
                          >
                            {owner.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ EXECUTIVES CONFIG ============

function ExecutivesConfig({ executives, onRefresh }: { executives: Executive[]; onRefresh: () => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    headshotUrl: '',
  });

  const resetForm = () => {
    setFormData({ name: '', title: '', email: '', headshotUrl: '' });
    setIsCreating(false);
    setEditingId(null);
  };

  const startEdit = (exec: Executive) => {
    setFormData({
      name: exec.name,
      title: exec.title,
      email: exec.email || '',
      headshotUrl: exec.headshotUrl,
    });
    setEditingId(exec.id);
    setIsCreating(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createExecutive({
        name: formData.name,
        title: formData.title,
        email: formData.email,
        headshotUrl: formData.headshotUrl || 'https://via.placeholder.com/100',
      });
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create executive:', error);
      alert('Failed to create executive');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await updateExecutive(id, {
        name: formData.name,
        title: formData.title,
        email: formData.email,
        headshotUrl: formData.headshotUrl,
      });
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update executive:', error);
      alert('Failed to update executive');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this executive? This will also remove their metric ownership.')) return;
    try {
      await deleteExecutive(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete executive:', error);
      alert('Failed to delete executive');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--gray-800)]">Executive Team</h2>
        {!isCreating && !editingId && (
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            <Plus size={16} />
            Add Executive
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-4 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)]">
          <h3 className="font-medium text-[var(--gray-800)] mb-4">
            {isCreating ? 'Add New Executive' : 'Edit Executive'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="e.g., Chief Technology Officer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="john@askhapax.ai"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Headshot URL</label>
              <input
                type="url"
                value={formData.headshotUrl}
                onChange={(e) => setFormData({ ...formData, headshotUrl: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isCreating ? handleCreate() : handleUpdate(editingId!)}
              disabled={saving || !formData.name || !formData.title || !formData.email}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {executives.map((exec) => (
          <div
            key={exec.id}
            className="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg"
          >
            <div className="flex items-center gap-4">
              <Image
                src={exec.headshotUrl}
                alt={exec.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <h3 className="font-medium text-[var(--gray-800)]">{exec.name}</h3>
                <p className="text-sm text-[var(--gray-500)]">{exec.title}</p>
                <p className="text-xs text-[var(--gray-400)]">{exec.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(exec)}
                className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(exec.id)}
                className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ USERS CONFIG ============

function UsersConfig({ users, executives, onRefresh }: { users: ApprovedUser[]; executives: Executive[]; onRefresh: () => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'viewer' as UserRole,
    executiveId: '',
  });

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features including user management' },
    { value: 'executive', label: 'Executive', description: 'Can view dashboard and manage their own metrics' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access to the dashboard' },
  ];

  const resetForm = () => {
    setFormData({ email: '', role: 'viewer', executiveId: '' });
    setIsCreating(false);
    setEditingId(null);
  };

  const startEdit = (user: ApprovedUser) => {
    setFormData({
      email: user.email,
      role: user.role,
      executiveId: user.executiveId || '',
    });
    setEditingId(user.id);
    setIsCreating(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createApprovedUser({
        email: formData.email.toLowerCase(),
        role: formData.role,
        executiveId: formData.executiveId || undefined,
      });
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Make sure the email is not already registered.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await updateApprovedUser(id, {
        role: formData.role,
        executiveId: formData.executiveId || null,
      });
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user? They will no longer be able to access the dashboard.')) return;
    try {
      await deleteApprovedUser(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleActive = async (user: ApprovedUser) => {
    try {
      await updateApprovedUser(user.id, { isActive: !user.isActive });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'executive': return 'bg-blue-100 text-blue-700';
      case 'viewer': return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--gray-800)]">User Management</h2>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Only users added here can access the dashboard
          </p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
          >
            <UserPlus size={16} />
            Add User
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Access Control:</strong> Users must be added to this list before they can log in.
          When you add an executive, they are automatically added as a user with the "Executive" role.
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-4 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)]">
          <h3 className="font-medium text-[var(--gray-800)] mb-4">
            {isCreating ? 'Add New User' : 'Edit User'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingId}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] disabled:bg-[var(--gray-100)] disabled:cursor-not-allowed"
                placeholder="user@askhapax.ai"
              />
              {editingId && (
                <p className="text-xs text-[var(--gray-500)] mt-1">Email cannot be changed after creation</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-[var(--gray-500)] mt-1">
                {roleOptions.find((o) => o.value === formData.role)?.description}
              </p>
            </div>
            {formData.role === 'executive' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Link to Executive Profile</label>
                <select
                  value={formData.executiveId}
                  onChange={(e) => setFormData({ ...formData, executiveId: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="">No linked profile</option>
                  {executives.map((exec) => (
                    <option key={exec.id} value={exec.id}>{exec.name} - {exec.title}</option>
                  ))}
                </select>
                <p className="text-xs text-[var(--gray-500)] mt-1">
                  Linking to an executive profile allows personalized dashboard features
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isCreating ? handleCreate() : handleUpdate(editingId!)}
              disabled={saving || !formData.email || !formData.role}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-8 text-[var(--gray-500)]">
            No users added yet. Click "Add User" to allow someone to access the dashboard.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg ${
                user.isActive ? 'bg-[var(--gray-50)]' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user.isActive ? 'bg-[var(--primary)]/10' : 'bg-red-100'
                }`}>
                  <Mail size={18} className={user.isActive ? 'text-[var(--primary)]' : 'text-red-500'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--gray-800)]">{user.email}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--gray-500)] mt-1">
                    {user.executive && (
                      <span>Linked to: {user.executive.name}</span>
                    )}
                    {user.firstLoginAt && (
                      <span>First login: {new Date(user.firstLoginAt).toLocaleDateString()}</span>
                    )}
                    {user.lastLoginAt && (
                      <span>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                    )}
                    {!user.firstLoginAt && (
                      <span className="text-amber-600">Never logged in</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(user)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    user.isActive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => startEdit(user)}
                  className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ INTEGRATIONS CONFIG ============

function IntegrationsConfig() {
  const integrations = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM and sales pipeline data',
      status: 'disconnected',
      icon: '🔶',
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Engineering velocity and issue tracking',
      status: 'disconnected',
      icon: '🔷',
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      description: 'Manual data entry and imports',
      status: 'disconnected',
      icon: '📊',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-6">Data Integrations</h2>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{integration.icon}</span>
              <div>
                <h3 className="font-medium text-[var(--gray-800)]">{integration.name}</h3>
                <p className="text-sm text-[var(--gray-500)]">{integration.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-sm bg-[var(--gray-100)] text-[var(--gray-500)] rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[var(--warning-bg)] rounded-lg border border-[var(--warning)]">
        <p className="text-sm text-[var(--warning)]">
          <strong>Note:</strong> Integration support is planned for a future release. For now, use
          manual data entry to update metric values.
        </p>
      </div>
    </div>
  );
}
