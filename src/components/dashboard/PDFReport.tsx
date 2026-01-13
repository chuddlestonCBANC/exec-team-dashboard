'use client';

import { DashboardDataExtended, MetricWithDetails } from '@/types';
import { format, parseISO } from 'date-fns';

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
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const { overview, pillars } = data;

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

  // Helper to check if we need a new page
  const checkNewPage = (neededSpace: number): void => {
    if (yPos + neededSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
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
    yPos = addWrappedText(paragraph, margin, yPos, contentWidth, 10, darkGray);
    yPos += 5;
  }
  yPos += 5;

  // Stats row
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
      yPos = addWrappedText(`• ${concern}`, margin, yPos, contentWidth, 10);
      yPos += 2;
    });
  }

  // Footer for page 1
  doc.setFontSize(9);
  doc.setTextColor(lightGray);
  doc.text('Hapax Executive Dashboard', margin, doc.internal.pageSize.getHeight() - 10);
  doc.text('Page 1', pageWidth - margin - 15, doc.internal.pageSize.getHeight() - 10);

  // === PAGE 2: PILLARS AND METRICS ===
  doc.addPage();
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
  doc.text('Detailed breakdown by pillar', margin, yPos);
  yPos += 5;

  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Pillars
  pillars.forEach((pillar) => {
    const pillarHeight = 15 + pillar.metrics.length * 8;
    checkNewPage(pillarHeight);

    // Pillar header
    doc.setFontSize(12);
    doc.setTextColor(darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(pillar.name, margin, yPos);

    // Pillar score badge
    const scoreText = `${pillar.score}%`;
    const scoreWidth = doc.getTextWidth(scoreText) + 8;
    const scoreX = pageWidth - margin - scoreWidth;

    // Badge background
    let badgeColor: string;
    switch (pillar.status) {
      case 'green':
        badgeColor = '#dcfce7';
        doc.setTextColor('#166534');
        break;
      case 'yellow':
        badgeColor = '#fef3c7';
        doc.setTextColor('#92400e');
        break;
      case 'red':
        badgeColor = '#fee2e2';
        doc.setTextColor('#991b1b');
        break;
      default:
        badgeColor = '#f3f4f6';
        doc.setTextColor(darkGray);
    }

    doc.setFillColor(badgeColor);
    doc.roundedRect(scoreX - 2, yPos - 5, scoreWidth + 4, 8, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(scoreText, scoreX, yPos);
    yPos += 8;

    // Metric headers
    const colWidths = [contentWidth * 0.45, contentWidth * 0.18, contentWidth * 0.18, contentWidth * 0.15];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    doc.setFontSize(9);
    doc.setTextColor(mediumGray);
    doc.setFont('helvetica', 'bold');
    doc.text('Metric', colX[0], yPos);
    doc.text('Current', colX[1], yPos);
    doc.text('Target', colX[2], yPos);
    doc.text('Status', colX[3], yPos);
    yPos += 2;

    doc.setDrawColor('#d1d5db');
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Metrics
    doc.setFont('helvetica', 'normal');
    pillar.metrics.forEach((metric) => {
      doc.setFontSize(9);
      doc.setTextColor(darkGray);
      doc.text(metric.name.substring(0, 35), colX[0], yPos);
      doc.text(formatMetricValue(metric), colX[1], yPos);
      doc.setTextColor(mediumGray);
      doc.text(formatTargetValue(metric), colX[2], yPos);

      // Status badge
      let statusColor: string;
      let statusBg: string;
      switch (metric.status) {
        case 'green':
          statusBg = '#dcfce7';
          statusColor = '#166534';
          break;
        case 'yellow':
          statusBg = '#fef3c7';
          statusColor = '#92400e';
          break;
        case 'red':
          statusBg = '#fee2e2';
          statusColor = '#991b1b';
          break;
        default:
          statusBg = '#f3f4f6';
          statusColor = darkGray;
      }

      doc.setFillColor(statusBg);
      doc.roundedRect(colX[3] - 1, yPos - 3.5, 20, 5, 1, 1, 'F');
      doc.setTextColor(statusColor);
      doc.setFontSize(7);
      doc.text(metric.status.toUpperCase(), colX[3] + 2, yPos);

      yPos += 7;
    });

    yPos += 8;
  });

  // Footer for page 2
  doc.setFontSize(9);
  doc.setTextColor(lightGray);
  doc.text('Hapax Executive Dashboard', margin, doc.internal.pageSize.getHeight() - 10);
  doc.text('Page 2', pageWidth - margin - 15, doc.internal.pageSize.getHeight() - 10);

  // Save the PDF
  doc.save(`hapax-dashboard-report-${weekOf}.pdf`);
}
