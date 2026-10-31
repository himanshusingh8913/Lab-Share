import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOtpCode,
  createOtpPayload,
  verifyOtpCode,
} from './otpRules.js';

test('generateOtpCode: produces 6-digit numeric string', () => {
  const code = generateOtpCode(6);
  assert.equal(code.length, 6);
  assert.match(code, /^[0-9]{6}$/);
});

test('verifyOtpCode: allows valid unexpired unused code', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');
  const payload = createOtpPayload(15, now);

  const verification = verifyOtpCode({
    expectedCode: payload.code,
    providedCode: payload.code,
    expiresAt: payload.expiresAt,
    isUsed: false,
    currentTime: new Date('2026-11-01T12:05:00.000Z'),
  });

  assert.equal(verification.success, true);
  assert.equal(verification.errorCode, undefined);
});

test('verifyOtpCode: blocks already used code (prevents replay/reuse)', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');
  const payload = createOtpPayload(15, now);

  const verification = verifyOtpCode({
    expectedCode: payload.code,
    providedCode: payload.code,
    expiresAt: payload.expiresAt,
    isUsed: true, // already used!
    currentTime: new Date('2026-11-01T12:05:00.000Z'),
  });

  assert.equal(verification.success, false);
  assert.equal(verification.errorCode, 'ALREADY_USED');
  assert.match(verification.errorMessage || '', /already been redeemed/);
});

test('verifyOtpCode: blocks expired code', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');
  const payload = createOtpPayload(10, now); // expires at 12:10

  const verification = verifyOtpCode({
    expectedCode: payload.code,
    providedCode: payload.code,
    expiresAt: payload.expiresAt,
    isUsed: false,
    currentTime: new Date('2026-11-01T12:11:00.000Z'), // after 12:10
  });

  assert.equal(verification.success, false);
  assert.equal(verification.errorCode, 'EXPIRED');
  assert.match(verification.errorMessage || '', /expired/i);
});

test('verifyOtpCode: rejects incorrect code', () => {
  const now = new Date('2026-11-01T12:00:00.000Z');
  const payload = createOtpPayload(15, now);

  const verification = verifyOtpCode({
    expectedCode: payload.code,
    providedCode: '999999',
    expiresAt: payload.expiresAt,
    isUsed: false,
    currentTime: new Date('2026-11-01T12:01:00.000Z'),
  });

  assert.equal(verification.success, false);
  assert.equal(verification.errorCode, 'CODE_MISMATCH');
});
