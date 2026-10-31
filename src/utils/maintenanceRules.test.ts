import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysRemaining,
  getMaintenanceAlert,
} from './maintenanceRules.js';

test('calculateDaysRemaining: calculates precise calendar days', () => {
  const ref = new Date('2026-10-30T09:00:00Z');

  // Tomorrow (+1)
  assert.equal(calculateDaysRemaining('2026-10-31T00:00:00Z', ref), 1);

  // In 3 days (+3)
  assert.equal(calculateDaysRemaining('2026-11-02T00:00:00Z', ref), 3);

  // Yesterday (-1, overdue)
  assert.equal(calculateDaysRemaining('2026-10-29T00:00:00Z', ref), -1);

  // Today (0)
  assert.equal(calculateDaysRemaining('2026-10-30T00:00:00Z', ref), 0);
});

test('getMaintenanceAlert: flags overdue calibration as critical alert', () => {
  const ref = new Date('2026-10-30T09:00:00Z');
  const res = {
    nextCalibrationDate: '2026-10-28T00:00:00Z', // 2 days ago
    nextMaintenanceDate: '2026-11-20T00:00:00Z', // 21 days out
  };

  const alert = getMaintenanceAlert(res, ref);
  assert.equal(alert.hasAlert, true);
  assert.equal(alert.alertType, 'overdue');
  assert.equal(alert.category, 'calibration');
  assert.equal(alert.urgencyLevel, 'critical');
  assert.match(alert.badgeText, /Calibration Overdue/);
});

test('getMaintenanceAlert: flags imminent calibration due in 2 days', () => {
  const ref = new Date('2026-10-30T09:00:00Z');
  const res = {
    nextCalibrationDate: '2026-11-01T00:00:00Z', // 2 days
  };

  const alert = getMaintenanceAlert(res, ref);
  assert.equal(alert.hasAlert, true);
  assert.equal(alert.alertType, 'imminent');
  assert.equal(alert.urgencyLevel, 'critical');
  assert.equal(alert.badgeText, 'Calibration Due in 2d');
});

test('getMaintenanceAlert: flags upcoming maintenance due in 6 days', () => {
  const ref = new Date('2026-10-30T09:00:00Z');
  const res = {
    nextMaintenanceDate: '2026-11-05T00:00:00Z', // 6 days
  };

  const alert = getMaintenanceAlert(res, ref);
  assert.equal(alert.hasAlert, true);
  assert.equal(alert.alertType, 'upcoming');
  assert.equal(alert.urgencyLevel, 'warning');
  assert.equal(alert.badgeText, 'Maintenance in 6d');
});

test('getMaintenanceAlert: returns none when dates are far out', () => {
  const ref = new Date('2026-10-30T09:00:00Z');
  const res = {
    nextMaintenanceDate: '2026-12-15T00:00:00Z',
    nextCalibrationDate: '2026-12-01T00:00:00Z',
  };

  const alert = getMaintenanceAlert(res, ref);
  assert.equal(alert.hasAlert, false);
  assert.equal(alert.alertType, 'none');
  assert.equal(alert.urgencyLevel, 'none');
});
