'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getDashboardData, getExecutives } from '@/lib/data/mockData';
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
} from 'lucide-react';

type AdminTab = 'pillars' | 'metrics' | 'executives' | 'integrations' | 'periods';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('pillars');
  const data = getDashboardData();
  const executives = getExecutives();

  const tabs = [
    { id: 'pillars' as AdminTab, label: 'Pillars', icon: BarChart3 },
    { id: 'metrics' as AdminTab, label: 'Metrics', icon: BarChart3 },
    { id: 'executives' as AdminTab, label: 'Executives', icon: Users },
    { id: 'integrations' as AdminTab, label: 'Integrations', icon: Link2 },
    { id: 'periods' as AdminTab, label: 'Review Periods', icon: Calendar },
  ];

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
              {tabs.map((tab) => (
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
            {activeTab === 'pillars' && <PillarsConfig pillars={data.pillars} />}
            {activeTab === 'metrics' && <MetricsConfig pillars={data.pillars} />}
            {activeTab === 'executives' && <ExecutivesConfig executives={executives} />}
            {activeTab === 'integrations' && <IntegrationsConfig />}
            {activeTab === 'periods' && <PeriodsConfig />}
          </main>
        </div>
      </div>
    </div>
  );
}

function PillarsConfig({ pillars }: { pillars: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--gray-800)]">Strategic Pillars</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
          <Plus size={16} />
          Add Pillar
        </button>
      </div>

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
                <span>Green: {pillar.colorThresholds.green}%+</span>
                <span>Yellow: {pillar.colorThresholds.yellow}%+</span>
                <span>Red: &lt;{pillar.colorThresholds.yellow}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors">
                <Edit2 size={16} />
              </button>
              <button className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsConfig({ pillars }: { pillars: any[] }) {
  const [selectedPillar, setSelectedPillar] = useState(pillars[0]?.id || '');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const currentPillar = pillars.find((p) => p.id === selectedPillar);
  const metrics = currentPillar?.metrics || [];

  const comparisonModeLabels: Record<string, { label: string; description: string }> = {
    on_track: {
      label: 'On Track to Goal',
      description: 'Cumulative progress toward end-of-period goal (e.g., "15 new customers by EOQ")',
    },
    at_or_above: {
      label: 'At or Above Target',
      description: 'Value should stay at or above target (e.g., "95% retention rate")',
    },
    at_or_below: {
      label: 'At or Below Target',
      description: 'Value should stay at or below target (e.g., "< 3 day resolution time")',
    },
    exact: {
      label: 'Exactly at Target',
      description: 'Value should be exactly at target (rare, for specific SLAs)',
    },
  };

  const cadenceLabels: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--gray-800)]">Metrics Configuration</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
          <Plus size={16} />
          Add Metric
        </button>
      </div>

      {/* Pillar Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
          Filter by Pillar
        </label>
        <select
          value={selectedPillar}
          onChange={(e) => setSelectedPillar(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
        >
          {pillars.map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
              {pillar.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {metrics.map((metric: any) => (
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
                  <span className="px-2 py-0.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded">
                    {metric.metricType}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {cadenceLabels[metric.cadence] || 'Monthly'}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    {comparisonModeLabels[metric.comparisonMode]?.label || 'At or Above'}
                  </span>
                </div>
                <p className="text-sm text-[var(--gray-500)] mt-1">{metric.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <svg
                  className={`w-5 h-5 text-[var(--gray-400)] transition-transform ${
                    expandedMetric === metric.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedMetric === metric.id && (
              <div className="px-4 pb-4 border-t border-[var(--gray-200)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">Basic Settings</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--gray-500)]">Data Source</span>
                        <span className="text-[var(--gray-800)] font-medium capitalize">{metric.dataSource}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--gray-500)]">Format</span>
                        <span className="text-[var(--gray-800)] font-medium capitalize">{metric.format}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--gray-500)]">Current Value</span>
                        <span className="text-[var(--gray-800)] font-medium">{metric.currentValue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Mode */}
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">Comparison Mode</h4>
                    <div className="bg-white p-3 rounded-lg border border-[var(--gray-200)]">
                      <p className="text-sm font-medium text-[var(--gray-800)]">
                        {comparisonModeLabels[metric.comparisonMode]?.label || 'At or Above Target'}
                      </p>
                      <p className="text-xs text-[var(--gray-500)] mt-1">
                        {comparisonModeLabels[metric.comparisonMode]?.description || ''}
                      </p>
                    </div>
                  </div>

                  {/* Target Configuration */}
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">Period Targets</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['weekly', 'monthly', 'quarterly', 'annual'].map((period) => {
                        const isActivePeriod = metric.cadence === period;
                        const periodTarget = metric.targets?.[period];
                        return (
                          <div
                            key={period}
                            className={`p-3 rounded-lg border ${
                              isActivePeriod
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--gray-200)] bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold uppercase ${
                                isActivePeriod ? 'text-[var(--primary)]' : 'text-[var(--gray-500)]'
                              }`}>
                                {cadenceLabels[period]}
                              </span>
                              {isActivePeriod && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-[var(--primary)] text-white rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-lg font-bold text-[var(--gray-800)]">
                              {periodTarget?.target ?? (isActivePeriod ? metric.targetValue : '—')}
                            </div>
                            {periodTarget && (
                              <div className="text-xs text-[var(--gray-500)] mt-1">
                                Warning: {periodTarget.warningThreshold ?? 70}% | Critical: {periodTarget.criticalThreshold ?? 50}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutivesConfig({ executives }: { executives: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--gray-800)]">Executive Team</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors">
          <Plus size={16} />
          Add Executive
        </button>
      </div>

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
              <button className="p-2 text-[var(--gray-500)] hover:text-[var(--primary)] hover:bg-white rounded-lg transition-colors">
                <Edit2 size={16} />
              </button>
              <button className="p-2 text-[var(--gray-500)] hover:text-[var(--danger)] hover:bg-white rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  integration.status === 'connected'
                    ? 'bg-[var(--success-bg)] text-[var(--success)]'
                    : 'bg-[var(--gray-100)] text-[var(--gray-500)]'
                }`}
              >
                {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
              </span>
              <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors text-sm">
                {integration.status === 'connected' ? 'Configure' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[var(--warning-bg)] rounded-lg border border-[var(--warning)]">
        <p className="text-sm text-[var(--warning)]">
          <strong>Note:</strong> Integration credentials are stored securely and never exposed in the
          client. Connect integrations to enable automatic data sync.
        </p>
      </div>
    </div>
  );
}

function PeriodsConfig() {
  const periods = [
    { type: 'Weekly', description: 'Week-over-week tracking and executive reports', enabled: true },
    { type: 'Monthly', description: 'Monthly roll-ups and trend analysis', enabled: true },
    { type: 'Quarterly', description: 'Quarterly reviews and OKR tracking', enabled: true },
    { type: 'Annual', description: 'Annual goals and year-over-year comparisons', enabled: false },
  ];

  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6">
      <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-6">Review Periods</h2>

      <p className="text-[var(--gray-500)] mb-6">
        Configure which review periods are enabled and how metrics roll up across time frames.
      </p>

      <div className="space-y-4">
        {periods.map((period) => (
          <div
            key={period.type}
            className="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg"
          >
            <div>
              <h3 className="font-medium text-[var(--gray-800)]">{period.type} Reviews</h3>
              <p className="text-sm text-[var(--gray-500)]">{period.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={period.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--gray-200)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-[var(--gray-200)] pt-6">
        <h3 className="font-medium text-[var(--gray-800)] mb-4">Snapshot Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
              Weekly Snapshot Day
            </label>
            <select className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]">
              <option>Monday</option>
              <option>Friday</option>
              <option>Sunday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
              Snapshot Time
            </label>
            <select className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]">
              <option>6:00 AM</option>
              <option>9:00 AM</option>
              <option>12:00 PM</option>
              <option>6:00 PM</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
