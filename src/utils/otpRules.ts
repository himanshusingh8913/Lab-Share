/**
 * Pure logic for secure OTP generation, expiration verification, and single-use enforcement.
 */

export interface OtpVerificationInput {
  expectedCode?: string;
  providedCode?: string;
  expiresAt?: string;
  isUsed?: boolean;
  currentTime?: Date;
}

export interface OtpVerificationResult {
  success: boolean;
  errorCode?: 'MISSING_OTP' | 'CODE_MISMATCH' | 'EXPIRED' | 'ALREADY_USED';
  errorMessage?: string;
}

/**
 * Generates a clean 6-digit cryptographic-quality or random numerical OTP code.
 */
export function generateOtpCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Creates an OTP payload with an expiration time in minutes (default: 15 minutes).
 */
export function createOtpPayload(
  validityMinutes: number = 15,
  now: Date = new Date()
): { code: string; expiresAt: string; used: boolean } {
  const code = generateOtpCode(6);
  const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000).toISOString();

  return {
    code,
    expiresAt,
    used: false,
  };
}

/**
 * Verifies that the provided OTP matches, has not expired, and has not already been used.
 */
export function verifyOtpCode(input: OtpVerificationInput): OtpVerificationResult {
  const { expectedCode, providedCode, expiresAt, isUsed, currentTime = new Date() } = input;

  if (!expectedCode || !providedCode) {
    return {
      success: false,
      errorCode: 'MISSING_OTP',
      errorMessage: 'OTP code is required',
    };
  }

  // Check reuse first
  if (isUsed) {
    return {
      success: false,
      errorCode: 'ALREADY_USED',
      errorMessage: 'Security violation: This pickup OTP has already been redeemed and cannot be reused',
    };
  }

  // Check mismatch
  const cleanExpected = expectedCode.trim();
  const cleanProvided = providedCode.trim();

  if (cleanExpected !== cleanProvided) {
    return {
      success: false,
      errorCode: 'CODE_MISMATCH',
      errorMessage: 'Invalid verification code. Please check and try again.',
    };
  }

  // Check expiration
  if (expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    if (isNaN(expiryTime) || currentTime.getTime() > expiryTime) {
      return {
        success: false,
        errorCode: 'EXPIRED',
        errorMessage: 'OTP expired. Please request an authorized re-issuance from the lab manager.',
      };
    }
  }

  return {
    success: true,
  };
}
