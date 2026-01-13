'use client';

import { DashboardDataExtended, MetricWithDetails, PillarWithScore } from '@/types';
import { format, parseISO } from 'date-fns';
import { getPillarById } from '@/lib/data/mockData';

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

// Export function to generate and download PDF
export async function generatePDFReport(data: DashboardDataExtended, weekOf: string): Promise<void> {
  // Dynamically import jspdf to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;
  let pageNumber = 1;

  const { overview, pillars, executives } = data;

  // Colors
  const primaryColor = '#6941C6';
  const darkGray = '#1f2937';
  const mediumGray = '#6b7280';
  const lightGray = '#9ca3af';

  // Helper function to add text with wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, color: string = darkGray): number => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * (fontSize * 0.4);
  };

  // Helper to add footer
  const addFooter = () => {
    doc.setFontSize(9);
    doc.setTextColor(lightGray);
    doc.text('Hapax Executive Dashboard', margin, pageHeight - 10);
    doc.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 10);
  };

  // Helper to check if we need a new page
  const checkNewPage = (neededSpace: number): void => {
    if (yPos + neededSpace > pageHeight - margin - 15) {
      addFooter();
      doc.addPage();
      pageNumber++;
      yPos = margin;
    }
  };

  // Helper to get status colors
  const getStatusColors = (status: string): { bg: string; text: string } => {
    switch (status) {
      case 'green':
        return { bg: '#dcfce7', text: '#166534' };
      case 'yellow':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'red':
        return { bg: '#fee2e2', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', text: darkGray };
    }
  };

  // === PAGE 1: OVERVIEW ===

  // Header
  doc.setFontSize(22);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Dashboard Report', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Week of ${format(parseISO(weekOf), 'MMMM d, yyyy')} • Generated ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
    margin,
    yPos
  );
  yPos += 5;

  // Header line
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Weekly Summary Section
  doc.setFontSize(14);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Summary', margin, yPos);
  yPos += 10;

  // Overall Score
  doc.setFontSize(36);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overview.overallScore}%`, margin, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setTextColor(mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Overall Performance Score', margin, yPos);
  yPos += 10;

  // Narrative paragraphs
  const paragraphs = overview.narrative.split('\n\n');
  for (const paragraph of paragraphs) {
    checkNewPage(20);
    yPos = addWrappedText(paragraph, margin, yPos, contentWidth, 10, darkGray);
    yPos += 5;
  }
  yPos += 5;

  // Stats row
  checkNewPage(25);
  const statsWidth = contentWidth / 5;
  const stats = [
    { value: overview.pillarsOnTrack, label: 'On Track' },
    { value: overview.pillarsAtRisk, label: 'At Risk' },
    { value: overview.pillarsOffTrack, label: 'Off Track' },
    { value: overview.activeCommitments, label: 'Commitments' },
    { value: overview.metricsImproved, label: 'Improving' },
  ];

  doc.setDrawColor('#e5e7eb');
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  stats.forEach((stat, index) => {
    const xPos = margin + index * statsWidth;
    doc.setFontSize(16);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stat.value), xPos, yPos);

    doc.setFontSize(8);
    doc.setTextColor(mediumGray);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xPos, yPos + 5);
  });
  yPos += 15;

  // Highlights
  if (overview.highlights.length > 0) {
    checkNewPage(30);
    doc.setFontSize(11);
    doc.setTextColor('#166534');
    doc.setFont('helvetica', 'bold');
    doc.text('Highlights', margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray);
    doc.setFontSize(10);
    overview.highlights.forEach((highlight) => {
      checkNewPage(10);
      yPos = addWrappedText(`• ${highlight}`, margin, yPos, contentWidth, 10);
      yPos += 2;
    });
    yPos += 5;
  }

  // Concerns
  if (overview.concerns.length > 0) {
    checkNewPage(30);
    doc.setFontSize(11);
    doc.setTextColor('#991b1b');
    doc.setFont('helvetica', 'bold');
    doc.text('Concerns', margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray);
    doc.setFontSize(10);
    overview.concerns.forEach((concern) => {
      checkNewPage(10);
      yPos = addWrappedText(`• ${concern}`, margin, yPos, contentWidth, 10);
      yPos += 2;
    });
  }

  addFooter();

  // === EXECUTIVE REPORTS SECTION ===
  doc.addPage();
  pageNumber++;
  yPos = margin;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Reports', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Weekly updates from the leadership team', margin, yPos);
  yPos += 5;

  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Executive Reports
  executives.forEach((exec) => {
    if (!exec.report) return;

    // Check if we need a new page (estimate space needed)
    const reportLines = doc.splitTextToSize(exec.report.content, contentWidth);
    const estimatedHeight = 20 + reportLines.length * 4;
    checkNewPage(Math.min(estimatedHeight, 80));

    // Executive name and title
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(exec.name, margin, yPos);

    doc.setFontSize(9);
    doc.setTextColor(mediumGray);
    doc.setFont('helvetica', 'normal');
    doc.text(exec.title, margin + doc.getTextWidth(exec.name) + 5, yPos);
    yPos += 8;

    // Report content - split into paragraphs
    doc.setFontSize(9);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'normal');

    const reportParagraphs = exec.report.content.split('\n\n');
    reportParagraphs.forEach((para) => {
      checkNewPage(15);
      yPos = addWrappedText(para, margin, yPos, contentWidth, 9, darkGray);
      yPos += 3;
    });

    yPos += 10;

    // Divider between executives
    if (yPos < pageHeight - 40) {
      doc.setDrawColor('#e5e7eb');
      doc.setLineWidth(0.2);
      doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    }
  });

  addFooter();

  // === PILLARS AND METRICS WITH DRILL-DOWN ===
  doc.addPage();
  pageNumber++;
  yPos = margin;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategic Pillars & Metrics', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Detailed breakdown with drill-down metrics', margin, yPos);
  yPos += 5;

  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Column widths for metrics table
  const colWidths = [contentWidth * 0.42, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.13, contentWidth * 0.12];
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  ];

  // Function to render a metric row
  const renderMetricRow = (metric: MetricWithDetails, indent: number = 0) => {
    checkNewPage(8);

    const colors = getStatusColors(metric.status);
    const xOffset = indent * 5;

    doc.setFontSize(9);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'normal');

    // Metric name with indent
    const metricName = metric.name.substring(0, 30 - indent * 2);
    doc.text((indent > 0 ? '└ ' : '') + metricName, colX[0] + xOffset, yPos);

    // Type badge
    const typeText = metric.metricType === 'key_result' ? 'KR' : metric.metricType === 'leading_indicator' ? 'LI' : 'Q';
    doc.setFontSize(7);
    doc.setTextColor(mediumGray);
    doc.text(typeText, colX[1], yPos);

    // Current value
    doc.setFontSize(9);
    doc.setTextColor(darkGray);
    doc.text(formatMetricValue(metric), colX[2], yPos);

    // Target value
    doc.setTextColor(mediumGray);
    doc.text(formatTargetValue(metric), colX[3], yPos);

    // Status badge
    doc.setFillColor(colors.bg);
    doc.roundedRect(colX[4] - 1, yPos - 3.5, 18, 5, 1, 1, 'F');
    doc.setTextColor(colors.text);
    doc.setFontSize(7);
    doc.text(metric.status.toUpperCase(), colX[4] + 1, yPos);

    yPos += 7;

    // Render child metrics (leading indicators and quality metrics)
    if (metric.childMetrics && metric.childMetrics.length > 0) {
      metric.childMetrics.forEach((child) => {
        renderMetricRow(child, indent + 1);
      });
    }
  };

  // Iterate through pillars
  pillars.forEach((pillar) => {
    // Get full pillar data with all metrics (including drill-down)
    const fullPillar = getPillarById(pillar.id);
    const pillarData = fullPillar || pillar;

    // Estimate space needed
    const metricsCount = pillarData.metrics.reduce((count, m) => {
      return count + 1 + (m.childMetrics?.length || 0);
    }, 0);
    const pillarHeight = 25 + metricsCount * 8;
    checkNewPage(Math.min(pillarHeight, 60));

    // Pillar header
    doc.setFontSize(13);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(pillar.name, margin, yPos);

    // Pillar score badge
    const colors = getStatusColors(pillar.status);
    const scoreText = `${pillar.score}%`;
    const scoreWidth = doc.getTextWidth(scoreText) + 8;
    const scoreX = pageWidth - margin - scoreWidth;

    doc.setFillColor(colors.bg);
    doc.roundedRect(scoreX - 2, yPos - 5, scoreWidth + 4, 8, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(colors.text);
    doc.setFont('helvetica', 'bold');
    doc.text(scoreText, scoreX, yPos);
    yPos += 10;

    // Metric headers
    doc.setFontSize(8);
    doc.setTextColor(mediumGray);
    doc.setFont('helvetica', 'bold');
    doc.text('Metric', colX[0], yPos);
    doc.text('Type', colX[1], yPos);
    doc.text('Current', colX[2], yPos);
    doc.text('Target', colX[3], yPos);
    doc.text('Status', colX[4], yPos);
    yPos += 2;

    doc.setDrawColor('#d1d5db');
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Render all metrics for this pillar
    pillarData.metrics.forEach((metric) => {
      renderMetricRow(metric, 0);
    });

    yPos += 10;
  });

  addFooter();

  // Save the PDF
  doc.save(`hapax-dashboard-report-${weekOf}.pdf`);
}
