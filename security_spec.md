# Security Specification: LabShare RBAC & Data Invariants

## 1. Core Invariants
- **Identity Invariant**: Only authenticated users with `email_verified == true` can issue mutations. The author UID must strictly match `request.auth.uid`.
- **Role Tiering Invariant**: Researchers can only view and manage their own bookings. Managers can approve/reject bookings, verify OTPs, and update resources. Admins have system-wide authority.
- **Audit Log Immutability Invariant**: No user (including administrators) may mutate or delete existing `auditLogs` documents. Only backend system functions or server scripts may append logs.
- **OTP Single-Use & Expiry Invariant**: An OTP cannot be verified if `otpUsed == true` or `request.time > otpExpiresAt`.
- **Resource Protection Invariant**: Only Managers and Admins can create or update equipment records.

## 2. The "Dirty Dozen" Threat Payloads
1. **Self-Promoted Admin**: A researcher sends `{ role: 'admin' }` during profile registration. Expected: `PERMISSION_DENIED`.
2. **Ghost Field Injection**: Adding an undocumented `_bypassApproval: true` into a booking creation payload. Expected: `PERMISSION_DENIED` via `hasOnly()`.
3. **Cross-Tenant Booking Snooping**: User A attempts to list or query User B's bookings. Expected: `PERMISSION_DENIED`.
4. **Audit Log Tampering**: Malicious user attempts `deleteDoc(doc(db, 'auditLogs', 'log-1'))`. Expected: `PERMISSION_DENIED`.
5. **Audit Log Modification**: User attempts to update the timestamp or actor of an audit log. Expected: `PERMISSION_DENIED`.
6. **Self-Approval Bypass**: Researcher sends `updateDoc` directly setting `status: 'approved'`. Expected: `PERMISSION_DENIED`.
7. **Replay Used OTP**: Researcher attempts to check in with an OTP where `otpUsed: true`. Expected: `PERMISSION_DENIED`.
8. **Expired OTP Presentation**: Presenting an OTP whose `otpExpiresAt` is in the past. Expected: `PERMISSION_DENIED`.
9. **Uncertified Booking Attempt**: Bypassing eligibility check to reserve a high-hazard Class 4 laser without certification. Expected: `PERMISSION_DENIED`.
10. **Resource Hijack**: Researcher attempts to delete or take an instrument out of service without manager role. Expected: `PERMISSION_DENIED`.
11. **ID Poisoning Attack**: Passing a 2KB garbage string as `{bookingId}`. Expected: `PERMISSION_DENIED` via `isValidId()`.
12. **Incident Closure by Student**: Unauthorized student resolves an open incident without manager investigation notes. Expected: `PERMISSION_DENIED`.
