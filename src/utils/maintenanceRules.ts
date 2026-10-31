/**
 * Pure logic for equipment maintenance and calibration scheduling alerts.
 */

export interface MaintenanceAlertResult {
  hasAlert: boolean;
  alertType: 'overdue' | 'imminent' | 'upcoming' | 'none';
  category: 'maintenance' | 'calibration' | 'none';
  daysRemaining: number;
  badgeText: string;
  urgencyLevel: 'critical' | 'warning' | 'info' | 'none';
}

/**
 * Calculates calendar days remaining until target date from a reference date.
 */
export function calculateDaysRemaining(targetDateISO: string, referenceDate: Date = new Date()): number {
  const target = new Date(targetDateISO);
  if (isNaN(target.getTime())) return 999;

  // Compare in midnight UTC to avoid hour/minute drift
  const msPerDay = 1000 * 60 * 60 * 24;
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const refUtc = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());

  return Math.round((targetUtc - refUtc) / msPerDay);
}

/**
 * Determines maintenance and calibration urgency badge metadata for equipment.
 * Overdue: < 0 days (critical)
 * Imminent: 0 to 3 days (warning/high)
 * Upcoming: 4 to 14 days (advisory)
 */
export function getMaintenanceAlert(
  resource: { nextMaintenanceDate?: string; nextCalibrationDate?: string },
  referenceDate: Date = new Date()
): MaintenanceAlertResult {
  let mostUrgent: MaintenanceAlertResult = {
    hasAlert: false,
    alertType: 'none',
    category: 'none',
    daysRemaining: 999,
    badgeText: '',
    urgencyLevel: 'none',
  };

  const checks: { dateStr?: string; category: 'calibration' | 'maintenance' }[] = [
    { dateStr: resource.nextCalibrationDate, category: 'calibration' },
    { dateStr: resource.nextMaintenanceDate, category: 'maintenance' },
  ];

  for (const { dateStr, category } of checks) {
    if (!dateStr) continue;

    const days = calculateDaysRemaining(dateStr, referenceDate);
    const categoryName = category === 'calibration' ? 'Calibration' : 'Maintenance';

    if (days < 0) {
      const overdueDays = Math.abs(days);
      const result: MaintenanceAlertResult = {
        hasAlert: true,
        alertType: 'overdue',
        category,
        daysRemaining: days,
        badgeText: `${categoryName} Overdue (${overdueDays}d ago)`,
        urgencyLevel: 'critical',
      };
      // Overdue is highest priority
      return result;
    }

    if (days <= 3) {
      const result: MaintenanceAlertResult = {
        hasAlert: true,
        alertType: 'imminent',
        category,
        daysRemaining: days,
        badgeText: days === 0 ? `${categoryName} Due Today` : `${categoryName} Due in ${days}d`,
        urgencyLevel: 'critical',
      };
      // Imminent is more urgent than upcoming
      if (mostUrgent.alertType !== 'overdue') {
        mostUrgent = result;
      }
    } else if (days <= 14) {
      const result: MaintenanceAlertResult = {
        hasAlert: true,
        alertType: 'upcoming',
        category,
        daysRemaining: days,
        badgeText: `${categoryName} in ${days}d`,
        urgencyLevel: 'warning',
      };
      if (mostUrgent.alertType === 'none') {
        mostUrgent = result;
      }
    }
  }

  return mostUrgent;
}
