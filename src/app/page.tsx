'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { OverviewSummary } from '@/components/dashboard/OverviewSummary';
import { PillarGrid } from '@/components/dashboard/PillarGrid';
import { ExecutiveGrid } from '@/components/executives/ExecutiveGrid';
import { TalkingItems } from '@/components/dashboard/TalkingItems';
import { MetricsToReview } from '@/components/dashboard/MetricsToReview';
import { MeetingNotes } from '@/components/dashboard/MeetingNotes';
import { generatePDFReport } from '@/components/dashboard/PDFReport';
import { getDashboardDataExtended, getDashboardDataForWeek } from '@/lib/data/mockData';
import { getCurrentWeekOf } from '@/lib/utils/formatting';
import { DashboardDataExtended, DashboardTab, TalkingItem, MetricReviewItem, MeetingNotes as MeetingNotesType } from '@/types';
import { LayoutDashboard, MessageSquare, AlertTriangle, FileText } from 'lucide-react';

export default function DashboardPage() {
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekOf());
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [data, setData] = useState<DashboardDataExtended | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Local state for talking items and metrics to review (would be persisted to DB in production)
  const [talkingItems, setTalkingItems] = useState<TalkingItem[]>([]);
  const [metricsToReview, setMetricsToReview] = useState<MetricReviewItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotesType | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const currentWeek = getCurrentWeekOf();
  const isPastWeek = selectedWeek < currentWeek;

  useEffect(() => {
    // Load data based on selected week
    const dashboardData = isPastWeek
      ? getDashboardDataForWeek(selectedWeek)
      : getDashboardDataExtended();
    setData(dashboardData);
    setTalkingItems(dashboardData.talkingItems);
    setMetricsToReview(dashboardData.metricsToReview);
    setMeetingNotes(dashboardData.meetingNotes);

    // If switching to current week and viewing meeting notes, switch to overview
    if (!isPastWeek && activeTab === 'meeting-notes') {
      setActiveTab('overview');
    }
  }, [selectedWeek, isPastWeek, activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const dashboardData = getDashboardDataExtended();
    setData(dashboardData);
    // Don't reset talking items and metrics to review on refresh (preserve user changes)
    setIsRefreshing(false);
  };

  // Talking Items handlers
  const handleAddTalkingItem = (item: Omit<TalkingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: TalkingItem = {
      ...item,
      id: `talk-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTalkingItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateTalkingItem = (id: string, updates: Partial<TalkingItem>) => {
    setTalkingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const handleDeleteTalkingItem = (id: string) => {
    setTalkingItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Metrics to Review handlers
  const handleUpdateMetricReview = (id: string, updates: Partial<MetricReviewItem>) => {
    setMetricsToReview((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const handleAddCommitment = (
    metricId: string,
    commitment: { title: string; description: string; executiveId: string; targetDate?: string }
  ) => {
    // In production, this would create a commitment in the database
    console.log('Adding commitment for metric:', metricId, commitment);
    // For now, just log it - the metric review status will be updated by the parent handler
  };

  const handleExportPDF = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await generatePDFReport(data, selectedWeek);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  const pendingReviewCount = metricsToReview.filter(
    (m) => m.status === 'pending'
  ).length;
  const openTalkingItemsCount = talkingItems.filter(
    (t) => t.status === 'open'
  ).length;

  const tabs = [
    {
      id: 'overview' as DashboardTab,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    // Meeting Notes tab only shows for past weeks
    ...(isPastWeek
      ? [
          {
            id: 'meeting-notes' as DashboardTab,
            label: 'Meeting Notes',
            icon: FileText,
          },
        ]
      : []),
    {
      id: 'talking-items' as DashboardTab,
      label: 'Talking Items',
      icon: MessageSquare,
      badge: openTalkingItemsCount > 0 ? openTalkingItemsCount : undefined,
    },
    {
      id: 'to-review' as DashboardTab,
      label: 'To Review',
      icon: AlertTriangle,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      badgeColor: 'red' as const,
    },
  ];

  return (
    <div className="min-h-screen">
      <DashboardHeader
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        lastRefreshed={data.lastRefreshed}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-8 border-b border-[var(--gray-200)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--gray-500)] hover:text-[var(--gray-700)] hover:border-[var(--gray-300)]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
                    tab.badgeColor === 'red'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Overview Summary */}
            {data.overview && (
              <section className="mb-8">
                <OverviewSummary overview={data.overview} />
              </section>
            )}

            {/* Strategic Pillars */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--gray-900)]">
                    Strategic Pillars
                  </h2>
                  <p className="text-[var(--gray-500)] mt-1">
                    Click on a pillar to view detailed metrics and trends
                  </p>
                </div>
              </div>
              <PillarGrid pillars={data.pillars} />
            </section>

            {/* Executive Reports */}
            <section>
              <ExecutiveGrid executives={data.executives} />
            </section>
          </>
        )}

        {activeTab === 'talking-items' && (
          <TalkingItems
            items={talkingItems}
            executives={data.executives}
            onAddItem={handleAddTalkingItem}
            onUpdateItem={handleUpdateTalkingItem}
            onDeleteItem={handleDeleteTalkingItem}
          />
        )}

        {activeTab === 'to-review' && (
          <MetricsToReview
            items={metricsToReview}
            executives={data.executives}
            onUpdateItem={handleUpdateMetricReview}
            onAddCommitment={handleAddCommitment}
          />
        )}

        {activeTab === 'meeting-notes' && meetingNotes && (
          <MeetingNotes notes={meetingNotes} />
        )}
      </main>
    </div>
  );
}
