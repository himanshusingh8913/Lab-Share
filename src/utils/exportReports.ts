/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, Incident, Resource } from '../types/index.js';

/**
 * Escapes a cell value for RFC 4180 CSV compliance:
 * - Wraps with quotes if value contains commas, quotes, or newlines
 * - Replaces any inner quotes with double quotes
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Calculates duration in hours between two ISO timestamps
 */
export function calculateUsageHours(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) {
    return 0;
  }
  const diffHours = (end - start) / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

/**
 * Generates RFC 4180 CSV string for Equipment Usage reports
 */
export function generateUsageCsv(bookings: Booking[], resources: Resource[] = []): string {
  const resourceMap = new Map<string, Resource>();
  for (const r of resources) {
    resourceMap.set(r.id, r);
  }

  const headers = [
    'Booking ID',
    'Equipment ID',
    'Equipment Name',
    'Model',
    'Facility Building',
    'Room',
    'Department',
    'Researcher Name',
    'Researcher Email',
    'Project Title',
    'Booking Status',
    'Start Time',
    'End Time',
    'Usage Hours',
    'Hourly Rate ($)',
    'Total Estimated Cost ($)',
    'OTP Verified',
    'Check-in Condition',
    'Return Condition',
    'Return Notes',
    'Created At',
  ];

  const rows = bookings.map((b) => {
    const res = resourceMap.get(b.resourceId);
    const hours = calculateUsageHours(b.startTime, b.endTime);
    const hourlyRate = res?.hourlyRate ?? 50;
    const totalCost = Math.round(hours * hourlyRate * 100) / 100;

    return [
      escapeCsvCell(b.id),
      escapeCsvCell(b.resourceId),
      escapeCsvCell(b.resourceName),
      escapeCsvCell(res?.model || 'N/A'),
      escapeCsvCell(res?.building || 'Core Facilities'),
      escapeCsvCell(res?.room || 'Main Lab'),
      escapeCsvCell(b.userDepartment || res?.department || 'Research'),
      escapeCsvCell(b.userName),
      escapeCsvCell(b.userEmail),
      escapeCsvCell(b.projectTitle),
      escapeCsvCell(b.status),
      escapeCsvCell(b.startTime),
      escapeCsvCell(b.endTime),
      escapeCsvCell(hours.toFixed(2)),
      escapeCsvCell(hourlyRate.toFixed(2)),
      escapeCsvCell(totalCost.toFixed(2)),
      escapeCsvCell(b.otpUsed ? 'YES' : 'NO'),
      escapeCsvCell(b.checkInCondition?.physicalCondition || 'N/A'),
      escapeCsvCell(b.returnCondition?.physicalCondition || 'N/A'),
      escapeCsvCell(b.returnCondition?.notes || ''),
      escapeCsvCell(b.createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates RFC 4180 CSV string for Incident reports
 */
export function generateIncidentsCsv(incidents: Incident[], resources: Resource[] = []): string {
  const resourceMap = new Map<string, Resource>();
  for (const r of resources) {
    resourceMap.set(r.id, r);
  }

  const headers = [
    'Incident ID',
    'Equipment ID',
    'Equipment Name',
    'Category',
    'Location',
    'Severity',
    'Status',
    'Title',
    'Description',
    'Reported By',
    'Reported At',
    'Resolution Notes',
    'Resolved By',
    'Resolved At',
    'Last Updated',
  ];

  const rows = incidents.map((inc) => {
    const res = resourceMap.get(inc.resourceId);
    const location = res ? `${res.building} Rm ${res.room}` : 'Main Facility';

    return [
      escapeCsvCell(inc.id),
      escapeCsvCell(inc.resourceId),
      escapeCsvCell(inc.resourceName),
      escapeCsvCell(res?.category || 'Scientific Instrument'),
      escapeCsvCell(location),
      escapeCsvCell(inc.severity.toUpperCase()),
      escapeCsvCell(inc.status.toUpperCase()),
      escapeCsvCell(inc.title),
      escapeCsvCell(inc.description),
      escapeCsvCell(inc.reportedByName),
      escapeCsvCell(inc.createdAt),
      escapeCsvCell(inc.resolutionNotes || ''),
      escapeCsvCell(inc.resolvedBy || ''),
      escapeCsvCell(inc.resolvedAt || ''),
      escapeCsvCell(inc.updatedAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates styled HTML document string ready for printing / Save as PDF
 */
export function generateUsagePdfHtml(
  bookings: Booking[],
  resources: Resource[] = [],
  metadata: {
    generatedBy: string;
    role: string;
    filterDate?: string;
  }
): string {
  const totalHours = bookings.reduce((sum, b) => sum + calculateUsageHours(b.startTime, b.endTime), 0);
  const resourceMap = new Map<string, Resource>();
  for (const r of resources) {
    resourceMap.set(r.id, r);
  }
  const totalCost = bookings.reduce((sum, b) => {
    const res = resourceMap.get(b.resourceId);
    const rate = res?.hourlyRate ?? 50;
    return sum + calculateUsageHours(b.startTime, b.endTime) * rate;
  }, 0);

  const tableRows = bookings
    .map((b) => {
      const res = resourceMap.get(b.resourceId);
      const hours = calculateUsageHours(b.startTime, b.endTime);
      const rate = res?.hourlyRate ?? 50;
      const cost = hours * rate;

      return `
      <tr>
        <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; border-bottom: 1px solid #CBCBCB;">${b.id}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #4A4A4A; border-bottom: 1px solid #CBCBCB;">
          ${b.resourceName}
          <div style="font-size: 10px; color: #6D8196; font-family: monospace;">${res?.model || 'Equipment'} • ${res?.building || 'Core'} ${res?.room || ''}</div>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #CBCBCB;">
          <div>${b.userName}</div>
          <div style="font-size: 10px; color: #6D8196;">${b.userDepartment || 'Research'}</div>
        </td>
        <td style="padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #CBCBCB;">
          <div>${new Date(b.startTime).toLocaleDateString()} ${new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div style="color: #6D8196; font-size: 10px;">to ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${hours.toFixed(1)} hrs)</div>
        </td>
        <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; text-align: right; border-bottom: 1px solid #CBCBCB;">
          $${cost.toFixed(2)}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #CBCBCB; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-family: monospace; text-transform: uppercase; border: 1px solid #4A4A4A; background: #FFFFE3;">
            ${b.status}
          </span>
        </td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LabShare - Equipment Usage Ledger Report</title>
  <style>
    @page { size: letter landscape; margin: 15mm; }
    body { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; color: #283347; background: #FFFFFF; margin: 0; padding: 20px; }
    .header-box { border-bottom: 2px solid #0866E8; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-family: 'DM Serif Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #283347; margin: 0 0 4px 0; }
    .subtitle { font-size: 11px; color: #0866E8; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
    .meta-card { font-family: monospace; font-size: 11px; text-align: right; color: #687386; }
    .summary-grid { display: flex; gap: 16px; margin-bottom: 20px; }
    .summary-box { flex: 1; border: 1px solid #E1E5EF; background: #F7F8FC; padding: 12px; border-radius: 2px; }
    .summary-label { font-size: 10px; font-family: monospace; text-transform: uppercase; color: #687386; margin-bottom: 4px; }
    .summary-val { font-size: 20px; font-weight: 700; color: #0866E8; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    th { background: #ECEEFA; color: #283347; font-family: monospace; font-size: 10px; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #CED4E2; border-top: 1px solid #CED4E2; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #E1E5EF; display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: #687386; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="subtitle">Official Core Facilities Audit Ledger</div>
      <h1 class="title">Equipment Usage & Operational Billing Report</h1>
      <div style="font-size: 12px; color: #4A4A4A; margin-top: 4px;">Verified Instrument Access Records & Utilization Analysis</div>
    </div>
    <div class="meta-card">
      <div>Report ID: REP-${Date.now().toString().slice(-6)}</div>
      <div>Generated: ${new Date().toLocaleString()}</div>
      <div>Authorized By: ${metadata.generatedBy} (${metadata.role.toUpperCase()})</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="summary-label">Total Completed Bookings</div>
      <div class="summary-val">${bookings.length}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Total Instrument Hours</div>
      <div class="summary-val">${totalHours.toFixed(1)} hrs</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Total Core Facility Billing</div>
      <div class="summary-val">$${totalCost.toFixed(2)}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Checked-In / Returned Rate</div>
      <div class="summary-val">${
        bookings.length > 0
          ? Math.round(
              (bookings.filter((b) => b.status === 'returned' || b.status === 'checked_out').length /
                bookings.length) *
                100
            )
          : 0
      }%</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Booking Ref</th>
        <th>Equipment & Location</th>
        <th>Researcher</th>
        <th>Scheduled Period</th>
        <th style="text-align: right;">Total Cost</th>
        <th style="text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>LabShare Scientific Core Network • Verified Compliance Document • Confidential</div>
    <div>Page 1 of 1 • Tamper-Evident Institutional Record</div>
  </div>
</body>
</html>`;
}

/**
 * Generates styled HTML document string for Incident Reports ready for printing / Save as PDF
 */
export function generateIncidentsPdfHtml(
  incidents: Incident[],
  resources: Resource[] = [],
  metadata: {
    generatedBy: string;
    role: string;
  }
): string {
  const resourceMap = new Map<string, Resource>();
  for (const r of resources) {
    resourceMap.set(r.id, r);
  }

  const criticalCount = incidents.filter((i) => i.severity === 'critical' || i.severity === 'high').length;
  const openCount = incidents.filter((i) => i.status !== 'resolved').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  const tableRows = incidents
    .map((inc) => {
      const res = resourceMap.get(inc.resourceId);
      const isCritical = inc.severity === 'critical' || inc.severity === 'high';

      return `
      <tr>
        <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; border-bottom: 1px solid #CBCBCB;">${inc.id}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #4A4A4A; border-bottom: 1px solid #CBCBCB;">
          ${inc.resourceName}
          <div style="font-size: 10px; color: #6D8196; font-family: monospace;">${res?.building || 'Facility'} Rm ${res?.room || 'Main'}</div>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #CBCBCB;">
          <div style="font-weight: 600;">${inc.title}</div>
          <div style="font-size: 11px; color: #4A4A4A; margin-top: 2px;">${inc.description}</div>
          ${
            inc.resolutionNotes
              ? `<div style="font-size: 10px; color: #6D8196; font-style: italic; margin-top: 4px;">Resolution: ${inc.resolutionNotes}</div>`
              : ''
          }
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #CBCBCB; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-family: monospace; text-transform: uppercase; border: 1px solid ${
            isCritical ? '#A64B3B' : '#4A4A4A'
          }; color: ${isCritical ? '#A64B3B' : '#4A4A4A'}; background: #FFFFE3;">
            ${inc.severity}
          </span>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #CBCBCB; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-family: monospace; text-transform: uppercase; border: 1px solid ${
            inc.status === 'resolved' ? '#6D8196' : '#4A4A4A'
          }; color: ${inc.status === 'resolved' ? '#6D8196' : '#4A4A4A'}; background: #FFFFE3;">
            ${inc.status}
          </span>
        </td>
        <td style="padding: 8px 10px; font-size: 11px; font-family: monospace; border-bottom: 1px solid #CBCBCB;">
          <div>${new Date(inc.createdAt).toLocaleDateString()}</div>
          <div style="font-size: 10px; color: #6D8196;">by ${inc.reportedByName}</div>
        </td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LabShare - Incident & Corrective Maintenance Report</title>
  <style>
    @page { size: letter landscape; margin: 15mm; }
    body { font-family: 'DM Sans', system-ui, -apple-system, sans-serif; color: #283347; background: #FFFFFF; margin: 0; padding: 20px; }
    .header-box { border-bottom: 2px solid #0866E8; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-family: 'DM Serif Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #283347; margin: 0 0 4px 0; }
    .subtitle { font-size: 11px; color: #0866E8; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
    .meta-card { font-family: monospace; font-size: 11px; text-align: right; color: #687386; }
    .summary-grid { display: flex; gap: 16px; margin-bottom: 20px; }
    .summary-box { flex: 1; border: 1px solid #E1E5EF; background: #F7F8FC; padding: 12px; border-radius: 2px; }
    .summary-label { font-size: 10px; font-family: monospace; text-transform: uppercase; color: #687386; margin-bottom: 4px; }
    .summary-val { font-size: 20px; font-weight: 700; color: #0866E8; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    th { background: #ECEEFA; color: #283347; font-family: monospace; font-size: 10px; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #CED4E2; border-top: 1px solid #CED4E2; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #E1E5EF; display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: #687386; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="subtitle">Laboratory Safety & Quality Assurance Ledger</div>
      <h1 class="title">Incident & Corrective Maintenance Report</h1>
      <div style="font-size: 12px; color: #4A4A4A; margin-top: 4px;">Hardware Anomalies, Lockout Audits, and Resolution Records</div>
    </div>
    <div class="meta-card">
      <div>Report ID: INC-REP-${Date.now().toString().slice(-6)}</div>
      <div>Generated: ${new Date().toLocaleString()}</div>
      <div>Audited By: ${metadata.generatedBy} (${metadata.role.toUpperCase()})</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <div class="summary-label">Total Logged Incidents</div>
      <div class="summary-val">${incidents.length}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">High / Critical Alerts</div>
      <div class="summary-val" style="color: ${criticalCount > 0 ? '#A64B3B' : '#4A4A4A'};">${criticalCount}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Open / Under Investigation</div>
      <div class="summary-val">${openCount}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Resolved & Operational</div>
      <div class="summary-val" style="color: #6D8196;">${resolvedCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Incident Ref</th>
        <th>Instrument</th>
        <th>Incident Description & Resolution</th>
        <th style="text-align: center;">Severity</th>
        <th style="text-align: center;">Status</th>
        <th>Reported On</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>Facility Safety Protocol Standard 102 • Equipment QA Certification</div>
    <div>Page 1 of 1 • Certified Institutional Record</div>
  </div>
</body>
</html>`;
}

/**
 * Client-side utility to download a string or blob as a local file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Client-side utility to open printable HTML and trigger print dialog
 */
export function printHtmlDocument(htmlContent: string, windowTitle: string): void {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popup blocked, create an iframe to print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.document.title = windowTitle;

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
}
