# V-Vault Workstream 7 Operations Runbook

Last updated: 2026-05-11
Owner: Platform + Moderation + Security
Scope: Security, testing, rollout, and operational readiness for V-Vault launch.

## 1) Operational SOP

### 1.1 Incident Handling

Severity definitions:
- Sev 1: Privacy exposure, unauthorized identity reveal, data loss, or sustained platform outage.
- Sev 2: Submission or response pipeline degraded, notification delays, or repeated 5xx spikes.
- Sev 3: Non-blocking defects, UI inconsistencies, or isolated validation/rate-limit issues.

Response workflow:
1. Acknowledge incident within 15 minutes in ops channel.
2. Assign incident commander and scribe.
3. Freeze non-emergency deploys until incident status is stable.
4. Capture scope: affected routes, actors, submissions, and first-seen timestamp.
5. Apply containment:
- toggle VAULT_SUBMISSIONS_ENABLED=false for severe pipeline/privacy risks
- disable identity reveal controls in admin UI if identity policy is at risk
6. Recover service with smallest safe change.
7. Publish incident summary and action items within 24 hours.

Escalation matrix:
- Sev 1: Engineering lead + Security lead + Product owner immediately.
- Sev 2: Engineering on-call + Moderation lead within 30 minutes.
- Sev 3: Triage in next business-cycle sprint.

### 1.2 Moderation Protocol

Queue handling:
1. Super admin reviews new submissions in moderation board.
2. Set status to reviewed if triage complete and response drafting begins.
3. Send private response using in-board composer.
4. Status transitions:
- new -> reviewed
- reviewed -> answered_privately
- answered_privately -> approved_for_faq or archived

Content safety and triage notes:
- Do not include identifying information in public FAQ drafts.
- Mark urgent risk cases in moderation notes and escalate to duty clinician.
- Archive spam/abusive submissions with rationale in moderation notes.
- For admin content workflows, use media-first upload via the media pipeline; do not rely on manual media URL entry.

Audit expectations:
- Any identity reveal must produce vault_submission.identity_viewed audit events.
- Response actions must produce vault_submission.responded audit events.

### 1.3 Privacy Handling SOP

Identity access policy:
- super_admin may reveal linked identity only when operationally required.
- founder_admin, editor, moderator must never receive identity PII in UI or API responses.

PII handling rules:
- Never copy linked email/displayName into public FAQ content.
- Never export raw identity-linked records outside approved admin surfaces.
- Use masked mode by default in moderation board.

Retention and evidence:
- Preserve vault submission events and audit logs for investigation timelines.
- Include request IDs and timestamps in incident records.

## 2) Rollout Plan and Rollback Triggers

### 2.1 Rollout Phases

Phase 0: Preflight
1. Confirm pnpm run verify:release passes on main.
2. Confirm database migrations are applied.
3. Confirm super_admin and founder_admin access behavior in staging.

Phase 1: Canary (10%)
1. Enable V-Vault features for limited traffic window.
2. Monitor API error rates and notification lag for 30-60 minutes.

Phase 2: Partial (50%)
1. Expand rollout after canary SLOs stay within thresholds.
2. Validate moderation turnaround and unread notification consistency.

Phase 3: Full (100%)
1. Enable for all traffic.
2. Keep heightened monitoring for 48 hours.

### 2.2 Rollback Trigger Criteria

Immediate rollback if any condition is met:
- Any confirmed unauthorized identity exposure.
- Admin identity reveal access available to non-super_admin role.
- Sustained >=2% 5xx rate for /api/vault, /api/admin/vault/*, /api/users/notifications over 10 minutes.
- Response pipeline failure rate >=5% for submission->response->notification chain over 15 minutes.
- Notification unread/read state divergence >1% in sampled checks.

Rollback actions:
1. Set VAULT_SUBMISSIONS_ENABLED=false.
2. Revert latest rollout commit or deployment.
3. Run smoke tests for login, admin moderation, and profile inbox.
4. Publish incident and rollback notice to stakeholders.

## 3) Post-Launch Monitoring Checkpoints

Checkpoint schedule:
- T+15 minutes
- T+1 hour
- T+6 hours
- T+24 hours
- T+48 hours
- Day 7

Metrics to track:
- Submission success rate and median latency for /api/vault.
- Admin response success rate for /api/admin/vault/[id]/respond.
- Notification poll success and unread count consistency for /api/users/notifications.
- Mark-as-read success for /api/users/notifications/[id]/read.
- Unauthorized access attempts and 403/401 trendlines.
- Identity reveal audit volume and actor-role distribution.

Operational checks per checkpoint:
1. Verify no privacy-policy violations in audit logs.
2. Verify queue throughput and moderation backlog size.
3. Verify no alerting thresholds breached.
4. Record actions and notes in launch log.

## 4) Required Commands Before Go/No-Go

1. pnpm exec tsc --noEmit
2. pnpm test -- --runInBand src/__tests__/admin-rbac-policy.test.ts src/__tests__/integration/vault-security-regression.integration.test.ts src/__tests__/integration/vault-response-notification.integration.test.ts
3. pnpm run verify:release
