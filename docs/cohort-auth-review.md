# Cohort auth review — Supabase dashboard settings

Use this checklist when preparing Anovia for a short cohort review window. Adjust settings in the [Supabase Dashboard](https://supabase.com/dashboard) for your project, then **revert them after the review**.

Anovia does **not** disable email confirmation in application code. All changes below are dashboard-only and temporary.

---

## 1. Email confirmation

**Path:** **Authentication → Providers → Email** (expand the Email provider)

| Setting | Review window | Production default |
|---------|---------------|-------------------|
| **Confirm email** | **Off** — new sign-ups receive a session immediately and can sign in without clicking a confirmation link | **On** — users must confirm email before first sign-in |

**After toggling off:** New sign-ups through `signUp()` can sign in right away. Existing users created while confirmation was **on** may still have `email_confirmed_at = null` and see `email_not_confirmed` until you confirm them manually (see below).

**Manual confirm (without disabling confirmation):** **Authentication → Users** → select user → confirm email / mark as confirmed.

**Site URL / redirect allow list:** **Authentication → URL Configuration**

- **Site URL:** your deployed origin (e.g. `https://your-app.vercel.app`)
- **Redirect URLs:** include `https://your-app.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local testing)

Anovia passes `emailRedirectTo: ${origin}/auth/callback` on sign-up.

---

## 2. Sign-up / sign-in rate limits

**Path:** **Authentication → Rate Limits**

Supabase uses token-bucket limits per IP for many auth endpoints. Failed sign-in attempts to `/auth/v1/token?grant_type=password` count toward these limits and can return `over_request_rate_limit` (HTTP 429).

| Setting | Purpose | Review suggestion |
|---------|---------|-------------------|
| **Rate limit for sign-ups and sign-ins** (`rate_limit_otp` / OTP-related quotas in API) | Throttles repeated auth attempts | Increase cautiously if many reviewers share one office IP |
| **Rate limit for token refresh** | `/auth/v1/token` refresh traffic | Usually fine at default; sign-in shares this endpoint family |
| **Rate limit for email / phone verifications** (`rate_limit_verify`) | Verification endpoints | Increase only if testers hit limits during confirm-link flows |
| **IP Address Forwarding** | Uses end-user IP behind proxies (e.g. Vercel) | Enable if reviewers appear rate-limited by server IP instead of client IP |

**Management API** (optional bulk change): `PATCH /v1/projects/{ref}/config/auth` with `rate_limit_*` fields — see [Supabase rate limits docs](https://supabase.com/docs/guides/auth/rate-limits).

**Note:** Password sign-in burst limits are not fully customizable in the dashboard; the main lever is reducing failed retries (Anovia’s duplicate-submit guard) and avoiding shared-IP retry storms.

---

## 3. Email sending limits

**Path:** **Authentication → Rate Limits** (email send quotas) and **Project Settings → Authentication → SMTP**

| Provider | Limit | Review suggestion |
|----------|-------|-------------------|
| **Built-in Supabase email** | ~**2 emails per hour** project-wide (signup, recovery, etc.) | Easy to exhaust with many sign-ups; prefer **custom SMTP** for cohorts |
| **Custom SMTP** | Configurable; `rate_limit_email_sent` becomes adjustable | Recommended for review windows with 10+ sign-ups |

**Path for SMTP:** **Project Settings → Authentication → SMTP Settings** — configure provider, then raise **Rate limit for emails sent** under **Authentication → Rate Limits**.

---

## 4. Attack protection

**Path:** **Authentication → Attack Protection** (or **Bot and Abuse Protection** depending on dashboard version)

| Setting | Review window | Production default |
|---------|---------------|-------------------|
| **Enable CAPTCHA protection** | **Off** unless Anovia’s sign-up/sign-in forms send a `captcha_token` | **On** (recommended) when using hCaptcha or Turnstile |

Anovia’s auth form does **not** currently pass CAPTCHA tokens. Leaving CAPTCHA enabled without frontend integration will block sign-up/sign-in.

Other abuse settings (if shown): keep defaults unless you know reviewers are blocked by a specific rule.

---

## Is temporarily disabling email confirmation safe?

**For a short, trusted cohort review:** Acceptable if you understand the trade-offs and revert after the window.

| Risk | Detail |
|------|--------|
| Unverified email ownership | Anyone can register with an email they do not control |
| Account squatting | A reviewer could claim another person’s email before the real owner signs up |
| Weaker audit trail | Harder to prove the user controls the email address |

**Safer alternatives for review:**

1. Keep **Confirm email** on and manually confirm cohort accounts in **Authentication → Users**
2. Use **custom SMTP** so confirmation emails are delivered reliably
3. Share a test account instead of mass sign-up during the review hour

**Required dashboard change to disable confirmation:** **Authentication → Providers → Email → Confirm email → Off → Save**

Do **not** change Anovia application code or RLS for this; re-enable confirmation when the cohort review ends.

---

## Revert checklist (after review)

- [ ] **Confirm email** → **On**
- [ ] Restore original **Rate Limits** values
- [ ] Re-enable **CAPTCHA** if used in production
- [ ] Remove temporary redirect URLs if added only for review
