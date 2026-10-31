import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  calculateUsageHours,
  generateUsageCsv,
  generateIncidentsCsv,
  generateUsagePdfHtml,
  generateIncidentsPdfHtml,
} from './exportReports.js';
import { Booking, Incident, Resource } from '../types/index.js';

test('escapeCsvCell: handles clean string without quotes', () => {
  assert.equal(escapeCsvCell('Centrifuge 5424R'), 'Centrifuge 5424R');
  assert.equal(escapeCsvCell(123), '123');
  assert.equal(escapeCsvCell(null), '');
  assert.equal(escapeCsvCell(undefined), '');
});

test('escapeCsvCell: properly quotes and escapes commas, newlines, and internal quotes', () => {
  // Comma
  assert.equal(escapeCsvCell('Room 402, Building B'), '"Room 402, Building B"');
  // Quotes
  assert.equal(escapeCsvCell('Sample "A" tested'), '"Sample ""A"" tested"');
  // Newlines
  assert.equal(escapeCsvCell('Line 1\nLine 2'), '"Line 1\nLine 2"');
  // Mixed
  assert.equal(escapeCsvCell('Note: "Warning", proceed\nwith care'), '"Note: ""Warning"", proceed\nwith care"');
});

test('calculateUsageHours: calculates decimal hours accurately', () => {
  const start = '2026-11-01T10:00:00.000Z';
  const end = '2026-11-01T12:30:00.000Z'; // 2.5 hours
  assert.equal(calculateUsageHours(start, end), 2.5);

  const start2 = '2026-11-01T09:00:00.000Z';
  const end2 = '2026-11-01T10:45:00.000Z'; // 1.75 hours
  assert.equal(calculateUsageHours(start2, end2), 1.75);

  // Invalid or inverted
  assert.equal(calculateUsageHours('invalid', end), 0);
  assert.equal(calculateUsageHours(end, start), 0);
});

test('generateUsageCsv: generates RFC-compliant CSV with equipment details and costs', () => {
  const mockResource: Resource = {
    id: 'res-microscope-1',
    name: 'Zeiss LSM 980 Confocal',
    model: 'LSM 980 with Airyscan 2',
    category: 'Microscopy',
    building: 'Bioengineering Hub',
    room: '304',
    department: 'Bioengineering',
    status: 'available',
    requiresApproval: true,
    requiredCertifications: ['Laser Safety Level 2'],
    hourlyRate: 85,
    maxConsecutiveHours: 6,
    specifications: {},
    imageUrl: '',
    createdBy: 'user-admin',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockBooking: Booking = {
    id: 'book-1001',
    resourceId: 'res-microscope-1',
    resourceName: 'Zeiss LSM 980 Confocal',
    userId: 'user-123',
    userName: 'Dr. Jane Doe',
    userEmail: 'jdoe@labshare.edu',
    userDepartment: 'Cell Biology',
    projectTitle: 'Synaptic Plasticity, Session 1',
    purpose: 'Multiphoton live cell imaging',
    startTime: '2026-11-01T10:00:00.000Z',
    endTime: '2026-11-01T12:00:00.000Z', // 2 hours
    status: 'returned',
    otpUsed: true,
    checkInCondition: {
      reportedBy: 'user-mgr',
      reportedByName: 'Lab Manager',
      timestamp: '2026-11-01T10:00:00.000Z',
      physicalCondition: 'excellent',
      cleanliness: 'clean',
      calibrationVerified: true,
      notes: 'Initial check passed',
    },
    returnCondition: {
      reportedBy: 'user-123',
      reportedByName: 'Dr. Jane Doe',
      timestamp: '2026-11-01T12:00:00.000Z',
      physicalCondition: 'good',
      cleanliness: 'clean',
      calibrationVerified: true,
      notes: 'Lens wiped with lens paper',
    },
    createdAt: '2026-10-30T10:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
  };

  const csv = generateUsageCsv([mockBooking], [mockResource]);
  const lines = csv.split('\r\n');

  assert.ok(lines.length >= 2, 'Should have header and data line');
  assert.ok(lines[0].startsWith('Booking ID,Equipment ID,Equipment Name'), 'Should contain standard headers');
  // Check that title with comma is quoted:
  assert.ok(lines[1].includes('"Synaptic Plasticity, Session 1"'), 'Title with comma must be quoted');
  // Check duration: 2.00, hourly rate: 85.00, cost: 170.00
  assert.ok(lines[1].includes('2.00,85.00,170.00'), 'Cost calculation must match hours * rate');
  assert.ok(lines[1].includes('YES'), 'OTP verified must be YES');
});

test('generateIncidentsCsv: generates proper CSV for incident log history', () => {
  const mockResource: Resource = {
    id: 'res-hplc-1',
    name: 'Agilent 1260 Infinity II HPLC',
    model: '1260 Infinity II',
    category: 'Chromatography',
    building: 'Chemistry Research Annex',
    room: '112',
    department: 'Analytical Chemistry',
    status: 'maintenance',
    requiresApproval: true,
    requiredCertifications: [],
    hourlyRate: 60,
    maxConsecutiveHours: 8,
    specifications: {},
    imageUrl: '',
    createdBy: 'user-admin',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockIncident: Incident = {
    id: 'inc-9001',
    resourceId: 'res-hplc-1',
    resourceName: 'Agilent 1260 Infinity II HPLC',
    reportedBy: 'user-200',
    reportedByName: 'Dr. John Watson',
    title: 'High Pressure Spike, Flow Blockage',
    description: 'Pressure exceeded 400 bar during isocratic run.',
    severity: 'critical',
    status: 'under_investigation',
    resolutionNotes: 'Purged column with acetonitrile; filter replaced.',
    resolvedBy: 'manager-1',
    resolvedAt: '2026-10-30T15:00:00Z',
    createdAt: '2026-10-30T14:00:00Z',
    updatedAt: '2026-10-30T15:00:00Z',
  };

  const csv = generateIncidentsCsv([mockIncident], [mockResource]);
  const lines = csv.split('\r\n');

  assert.ok(lines.length >= 2);
  assert.ok(lines[0].startsWith('Incident ID,Equipment ID,Equipment Name'));
  assert.ok(lines[1].includes('CRITICAL'));
  assert.ok(lines[1].includes('"High Pressure Spike, Flow Blockage"'));
  assert.ok(lines[1].includes('Dr. John Watson'));
});

test('generateUsagePdfHtml & generateIncidentsPdfHtml: generate rich printable documents', () => {
  const mockBooking: Booking = {
    id: 'book-2001',
    resourceId: 'res-1',
    resourceName: 'Centrifuge 5424R',
    userId: 'user-1',
    userName: 'Alice Smith',
    userEmail: 'asmith@labshare.edu',
    userDepartment: 'Biochemistry',
    projectTitle: 'Enzyme Purification',
    purpose: 'Spinning down lysates',
    startTime: '2026-11-02T10:00:00Z',
    endTime: '2026-11-02T12:00:00Z',
    status: 'returned',
    otpUsed: true,
    createdAt: '2026-10-30T00:00:00Z',
    updatedAt: '2026-11-02T12:00:00Z',
  };

  const usageHtml = generateUsagePdfHtml([mockBooking], [], {
    generatedBy: 'Lab Manager Marcus',
    role: 'manager',
  });
  assert.ok(usageHtml.includes('Equipment Usage & Operational Billing Report'));
  assert.ok(usageHtml.includes('Centrifuge 5424R'));
  assert.ok(usageHtml.includes('Lab Manager Marcus'));

  const mockIncident: Incident = {
    id: 'inc-3001',
    resourceId: 'res-1',
    resourceName: 'Centrifuge 5424R',
    reportedBy: 'user-1',
    reportedByName: 'Alice Smith',
    title: 'Rotor imbalance warning',
    description: 'Buzzer sounded at 14,000 RPM',
    severity: 'medium',
    status: 'resolved',
    createdAt: '2026-10-30T00:00:00Z',
    updatedAt: '2026-10-30T01:00:00Z',
  };

  const incidentHtml = generateIncidentsPdfHtml([mockIncident], [], {
    generatedBy: 'Lab Manager Marcus',
    role: 'manager',
  });
  assert.ok(incidentHtml.includes('Incident & Corrective Maintenance Report'));
  assert.ok(incidentHtml.includes('Rotor imbalance warning'));
  assert.ok(incidentHtml.includes('Lab Manager Marcus'));
});
