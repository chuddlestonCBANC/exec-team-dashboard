'use client';

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { DashboardDataExtended, PillarWithScore, MetricWithDetails, OverviewSummary } from '@/types';
import { format, parseISO } from 'date-fns';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#6941C6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  overviewBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#6941C6',
  },
  overviewScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6941C6',
    marginBottom: 5,
  },
  overviewLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 10,
  },
  narrative: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  pillarCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pillarName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  pillarScore: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  greenBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  yellowBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  redBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  metricName: {
    fontSize: 10,
    color: '#374151',
    flex: 1,
  },
  metricValue: {
    fontSize: 10,
    color: '#1f2937',
    width: 80,
    textAlign: 'right',
  },
  metricTarget: {
    fontSize: 10,
    color: '#6b7280',
    width: 80,
    textAlign: 'right',
  },
  metricStatus: {
    fontSize: 9,
    width: 50,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
  },
});

// Helper to get badge style based on status
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'green':
      return styles.greenBadge;
    case 'yellow':
      return styles.yellowBadge;
    case 'red':
      return styles.redBadge;
    default:
      return {};
  }
};

// Format metric value based on format type
const formatMetricValue = (metric: MetricWithDetails): string => {
  const value = metric.currentValue;
  switch (metric.format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    default:
      return value.toLocaleString();
  }
};

const formatTargetValue = (metric: MetricWithDetails): string => {
  const value = metric.targetValue;
  switch (metric.format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    default:
      return value.toLocaleString();
  }
};

// PDF Document Component
interface PDFReportDocumentProps {
  data: DashboardDataExtended;
  weekOf: string;
}

function PDFReportDocument({ data, weekOf }: PDFReportDocumentProps) {
  const { overview, pillars } = data;

  return (
    <Document>
      {/* Page 1: Overview */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Executive Dashboard Report</Text>
          <Text style={styles.subtitle}>
            Week of {format(parseISO(weekOf), 'MMMM d, yyyy')} • Generated {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Summary</Text>
          <View style={styles.overviewBox}>
            <Text style={styles.overviewScore}>{overview.overallScore}%</Text>
            <Text style={styles.overviewLabel}>Overall Performance Score</Text>
            {overview.narrative.split('\n\n').map((paragraph, index) => (
              <Text key={index} style={styles.narrative}>
                {paragraph}
              </Text>
            ))}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{overview.pillarsOnTrack}</Text>
                <Text style={styles.statLabel}>On Track</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{overview.pillarsAtRisk}</Text>
                <Text style={styles.statLabel}>At Risk</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{overview.pillarsOffTrack}</Text>
                <Text style={styles.statLabel}>Off Track</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{overview.activeCommitments}</Text>
                <Text style={styles.statLabel}>Active Commitments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{overview.metricsImproved}</Text>
                <Text style={styles.statLabel}>Improving</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Highlights & Concerns */}
        {(overview.highlights.length > 0 || overview.concerns.length > 0) && (
          <View style={styles.section}>
            {overview.highlights.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#166534', marginBottom: 5 }}>
                  Highlights
                </Text>
                {overview.highlights.map((highlight, index) => (
                  <Text key={index} style={{ fontSize: 10, color: '#374151', marginBottom: 3 }}>
                    • {highlight}
                  </Text>
                ))}
              </View>
            )}
            {overview.concerns.length > 0 && (
              <View>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#991b1b', marginBottom: 5 }}>
                  Concerns
                </Text>
                {overview.concerns.map((concern, index) => (
                  <Text key={index} style={{ fontSize: 10, color: '#374151', marginBottom: 3 }}>
                    • {concern}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={styles.footer}>Hapax Executive Dashboard</Text>
        <Text style={styles.pageNumber}>Page 1</Text>
      </Page>

      {/* Page 2+: Pillars and Metrics */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Strategic Pillars & Metrics</Text>
          <Text style={styles.subtitle}>Detailed breakdown by pillar</Text>
        </View>

        {pillars.map((pillar, pillarIndex) => (
          <View key={pillar.id} style={styles.pillarCard} wrap={false}>
            <View style={styles.pillarHeader}>
              <Text style={styles.pillarName}>{pillar.name}</Text>
              <Text style={[styles.pillarScore, getStatusStyle(pillar.status)]}>
                {pillar.score}%
              </Text>
            </View>

            {/* Metric Headers */}
            <View style={[styles.metricRow, { borderBottomColor: '#d1d5db' }]}>
              <Text style={[styles.metricName, { fontWeight: 'bold', fontSize: 9 }]}>Metric</Text>
              <Text style={[styles.metricValue, { fontWeight: 'bold', fontSize: 9 }]}>Current</Text>
              <Text style={[styles.metricTarget, { fontWeight: 'bold', fontSize: 9 }]}>Target</Text>
              <Text style={[styles.metricStatus, { fontWeight: 'bold', fontSize: 9 }]}>Status</Text>
            </View>

            {/* Metrics */}
            {pillar.metrics.map((metric) => (
              <View key={metric.id} style={styles.metricRow}>
                <Text style={styles.metricName}>{metric.name}</Text>
                <Text style={styles.metricValue}>{formatMetricValue(metric)}</Text>
                <Text style={styles.metricTarget}>{formatTargetValue(metric)}</Text>
                <Text style={[styles.metricStatus, getStatusStyle(metric.status)]}>
                  {metric.status.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footer}>Hapax Executive Dashboard</Text>
        <Text style={styles.pageNumber}>Page 2</Text>
      </Page>
    </Document>
  );
}

// Export function to generate and download PDF
export async function generatePDFReport(data: DashboardDataExtended, weekOf: string): Promise<void> {
  const blob = await pdf(<PDFReportDocument data={data} weekOf={weekOf} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hapax-dashboard-report-${weekOf}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
