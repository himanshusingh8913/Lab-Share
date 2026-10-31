/**
 * Pure logic for booking validation, overlapping detection, and eligibility checks.
 */

export interface BookingInterval {
  id?: string;
  startTime: string;
  endTime: string;
  status: string;
}

/**
 * Checks if a requested timeframe conflicts with any existing active/approved booking.
 * Timeframes overlap if (startA < endB) and (endA > startB).
 * Cancelled and rejected bookings are ignored.
 */
export function checkBookingOverlap(
  newStartISO: string,
  newEndISO: string,
  existingBookings: BookingInterval[],
  excludeBookingId?: string
): { hasConflict: boolean; conflictingBooking?: BookingInterval } {
  const newStart = new Date(newStartISO).getTime();
  const newEnd = new Date(newEndISO).getTime();

  if (isNaN(newStart) || isNaN(newEnd)) {
    return { hasConflict: true };
  }

  if (newStart >= newEnd) {
    return { hasConflict: true };
  }

  // Active statuses that occupy the resource
  const blockingStatuses = new Set(['approved', 'checked_out', 'pending_approval']);

  for (const b of existingBookings) {
    if (excludeBookingId && b.id === excludeBookingId) {
      continue;
    }
    if (!blockingStatuses.has(b.status)) {
      continue;
    }

    const existStart = new Date(b.startTime).getTime();
    const existEnd = new Date(b.endTime).getTime();

    if (isNaN(existStart) || isNaN(existEnd)) {
      continue;
    }

    // Standard interval overlap condition
    if (newStart < existEnd && newEnd > existStart) {
      return {
        hasConflict: true,
        conflictingBooking: b,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Validates whether the user's acquired certificates satisfy all required equipment certifications.
 */
export function verifyUserEligibility(
  userCertifications: string[] = [],
  requiredCertifications: string[] = []
): { eligible: boolean; missing: string[] } {
  if (!requiredCertifications || requiredCertifications.length === 0) {
    return { eligible: true, missing: [] };
  }

  const normalizedUserCerts = new Set(
    userCertifications.map((c) => c.trim().toLowerCase())
  );

  const missing: string[] = [];
  for (const req of requiredCertifications) {
    if (!normalizedUserCerts.has(req.trim().toLowerCase())) {
      missing.push(req);
    }
  }

  return {
    eligible: missing.length === 0,
    missing,
  };
}

/**
 * Validates booking duration against maximum allowed consecutive hours.
 */
export function validateBookingDuration(
  startTimeISO: string,
  endTimeISO: string,
  maxConsecutiveHours: number = 24
): { valid: boolean; error?: string } {
  const start = new Date(startTimeISO).getTime();
  const end = new Date(endTimeISO).getTime();

  if (isNaN(start) || isNaN(end)) {
    return { valid: false, error: 'Invalid date/time format' };
  }

  if (start >= end) {
    return { valid: false, error: 'End time must be after start time' };
  }

  const durationHours = (end - start) / (1000 * 60 * 60);

  if (durationHours > maxConsecutiveHours) {
    return {
      valid: false,
      error: `Booking exceeds maximum allowed time (${maxConsecutiveHours} hours)`,
    };
  }

  return { valid: true };
}
