import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkBookingOverlap,
  verifyUserEligibility,
  validateBookingDuration,
} from './bookingRules.js';

test('checkBookingOverlap: identifies overlapping time intervals', () => {
  const existingBookings = [
    {
      id: 'book-1',
      startTime: '2026-11-01T10:00:00.000Z',
      endTime: '2026-11-01T12:00:00.000Z',
      status: 'approved',
    },
    {
      id: 'book-2',
      startTime: '2026-11-01T14:00:00.000Z',
      endTime: '2026-11-01T16:00:00.000Z',
      status: 'approved',
    },
  ];

  // Overlap 1: inside book-1
  const result1 = checkBookingOverlap(
    '2026-11-01T10:30:00.000Z',
    '2026-11-01T11:30:00.000Z',
    existingBookings
  );
  assert.equal(result1.hasConflict, true);
  assert.equal(result1.conflictingBooking?.id, 'book-1');

  // Overlap 2: spans across book-1 end
  const result2 = checkBookingOverlap(
    '2026-11-01T11:30:00.000Z',
    '2026-11-01T13:00:00.000Z',
    existingBookings
  );
  assert.equal(result2.hasConflict, true);

  // Non-overlap: right in between slots (12:00 to 14:00)
  const result3 = checkBookingOverlap(
    '2026-11-01T12:00:00.000Z',
    '2026-11-01T14:00:00.000Z',
    existingBookings
  );
  assert.equal(result3.hasConflict, false);

  // Ignored status (e.g. cancelled)
  const withCancelled = [
    {
      id: 'book-cancelled',
      startTime: '2026-11-01T12:00:00.000Z',
      endTime: '2026-11-01T14:00:00.000Z',
      status: 'cancelled',
    },
  ];
  const result4 = checkBookingOverlap(
    '2026-11-01T12:30:00.000Z',
    '2026-11-01T13:30:00.000Z',
    withCancelled
  );
  assert.equal(result4.hasConflict, false);
});

test('verifyUserEligibility: accurately matches required laboratory certifications', () => {
  const userCerts = ['Biosafety Level 2', 'Laser Safety Level 3'];

  // Needs both and user has both
  const res1 = verifyUserEligibility(userCerts, ['Biosafety Level 2']);
  assert.equal(res1.eligible, true);
  assert.deepEqual(res1.missing, []);

  // Needs one that user does NOT have
  const res2 = verifyUserEligibility(userCerts, ['Biosafety Level 2', 'Cleanroom Class 100']);
  assert.equal(res2.eligible, false);
  assert.deepEqual(res2.missing, ['Cleanroom Class 100']);

  // Case insensitivity & trimming
  const res3 = verifyUserEligibility(userCerts, ['  laser safety level 3  ']);
  assert.equal(res3.eligible, true);
});

test('validateBookingDuration: enforces maximum duration limits', () => {
  const valid = validateBookingDuration(
    '2026-11-01T08:00:00.000Z',
    '2026-11-01T12:00:00.000Z',
    6
  );
  assert.equal(valid.valid, true);

  const tooLong = validateBookingDuration(
    '2026-11-01T08:00:00.000Z',
    '2026-11-01T18:00:00.000Z',
    4
  );
  assert.equal(tooLong.valid, false);
  assert.match(tooLong.error || '', /maximum allowed time/);

  const negativeTime = validateBookingDuration(
    '2026-11-01T12:00:00.000Z',
    '2026-11-01T10:00:00.000Z',
    4
  );
  assert.equal(negativeTime.valid, false);
});
