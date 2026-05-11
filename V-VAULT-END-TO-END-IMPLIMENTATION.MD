# V-Vault End-to-End Implementation Checklist

Last updated: 2026-05-11
Status: Execution Complete (Go/No-Go Signoff Pending)
Purpose: Define the exact 7 workstreams required to make V-Vault active, secure, and production-ready.

## Current Execution Snapshot

- Workstream 7 validation is complete.
- Release gate is green: `pnpm run verify:release` (15 suites / 156 tests).
- Operations runbook is published in `V-VAULT-WORKSTREAM7-OPERATIONS.md`.

## Locked Product Decisions

- Identity visibility: Only super_admin can see the real user identity behind a submission.
- founder_admin access: founder_admin has super_admin-level operational access, but identity remains masked for founder_admin.
- WhatsApp flow: WhatsApp is not part of the anonymous messaging pipeline for now. It remains an open contact/support path to Dr. Didi.
- Notifications release strategy: Polling-only in-browser notifications for first release. Push notifications come later.

## Definition of Active (Release Gate)

V-Vault is considered active only when all 7 workstreams below are complete, tests are green, and production runbooks are signed off.

---

## Workstream 1: RBAC and Identity Privacy Policy

- [ ] Add founder_admin to role model and role hierarchy.
- [ ] Enforce identity visibility rule in backend policy layer:
- [ ] super_admin can view user identity.
- [ ] founder_admin, editor, moderator cannot view user identity.
- [ ] Ensure all admin identity-returning APIs apply role guard before returning PII.
- [ ] Add explicit audit logging for identity-view actions (who viewed, when, which submission).

Done when:
- [ ] Role checks are consistent in API and server components.
- [ ] Identity data is never leaked to non-super_admin roles.

---

## Workstream 2: Data Model and Migration Foundation

- [ ] Extend VaultSubmission to support authenticated-anonymous pipeline:
- [ ] Add userId (nullable foreign key) for authenticated owner linkage.
- [ ] Add submission channel/source field for internal tracking.
- [ ] Create VaultResponse model for admin replies.
- [ ] Create UserNotification model for in-browser notifications.
- [ ] Create VaultSubmissionEvent (timeline/shadow log) for full DB traceability.
- [ ] Add required indexes for list, moderation, unread notifications, and timeline queries.
- [ ] Run migration, generate Prisma client, and validate schema integrity.

Done when:
- [ ] New schema is migrated successfully.
- [ ] Read/write paths work under integration tests.

---

## Workstream 3: Public V-Vault Activation UX

- [ ] Activate authenticated anonymous submission experience in V-Vault page.
- [ ] Keep WhatsApp CTA available as open support channel, clearly separate from anonymous message flow.
- [ ] Remove WhatsApp wording from anonymous-pipeline success path.
- [ ] Add clear user copy that submission is private from public, but internally linked for response delivery.
- [ ] Preserve accessibility and responsive behavior.

Done when:
- [ ] Logged-in users can submit from UI.
- [ ] UX clearly distinguishes anonymous submission versus WhatsApp support.

---

## Workstream 4: End-to-End API Pipeline

- [ ] Update submission API to create authenticated-anonymous submissions with owner linkage.
- [ ] Add admin response endpoint to create VaultResponse and update submission state.
- [ ] Enforce role rules on response and identity endpoints.
- [ ] Write complete shadow records for submission lifecycle events.
- [ ] Keep rate limits and validation strict for all new endpoints.
- [ ] Return stable API contracts for admin UI and user inbox polling.

Done when:
- [ ] Submission -> moderation -> response -> user visibility is functional end-to-end.
- [ ] All critical state transitions are persisted in DB timeline.

---

## Workstream 5: Admin Moderation and Response Console

- [ ] Upgrade V-Vault moderation board with response composer and send action.
- [ ] Add identity panel behavior:
- [ ] super_admin can reveal identity.
- [ ] founder_admin sees masked identity and no reveal control.
- [ ] Maintain status workflow (new, reviewed, answered_privately, approved_for_faq, archived).
- [ ] Add operator feedback, loading/error states, and audit-safe logs.

Done when:
- [ ] Admin can process and respond without leaving the board.
- [ ] Identity controls exactly match policy.

---

## Workstream 6: User In-Browser Notifications (Polling First)

- [ ] Implement notifications API for unread count and feed retrieval.
- [ ] Implement mark-as-read API.
- [ ] Add client polling loop with efficient interval and cleanup.
- [ ] Show in-browser notification cue (badge/toast/inbox state) when response arrives.
- [ ] Add profile/inbox view for response history and read state.
- [x] Define Phase 2 backlog item for service-worker push notifications.

Done when:
- [ ] User gets browser-visible response alert without refresh.
- [ ] Notification state remains consistent after reads.

---

## Workstream 7: Security, Testing, Rollout, and Operations

- [x] Add unit tests for role gating and identity masking.
- [x] Add integration tests for full response pipeline.
- [x] Add regression tests for rate limit, validation, and unauthorized access.
- [x] Validate verify:release gate is green.
- [x] Document operational SOP (incident handling, moderation protocol, privacy handling).
- [x] Add rollout plan with rollback trigger criteria.
- [x] Add post-launch monitoring checkpoints.

Done when:
- [x] Test suite and release gate pass.
- [x] Team has runbook-backed confidence for launch and rollback.

---

## First Release Scope Summary

Included in first release:
- Authenticated anonymous submissions.
- Admin response pipeline with DB shadow trail.
- Polling-based in-browser user notifications.
- Identity reveal limited to super_admin only.

Not included in first release:
- Push notifications.
- WhatsApp-imported messages in anonymous pipeline.
- Identity reveal for founder_admin.

## Phase 2 Backlog: Push Notifications

- Add service-worker push subscription flow for authenticated users on the profile page.
- Extend `UserNotification` delivery metadata to track push attempt and delivery state.
- Add admin-safe retry job for failed push deliveries with capped retry attempts.
- Add user preference controls for push opt-in and quiet hours.
- Keep polling as fallback when push permission is denied or unsupported.
