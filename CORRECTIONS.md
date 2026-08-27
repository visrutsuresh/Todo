# Corrections log

A running record of what the AI got wrong during this build and how it was corrected. Entries are appended as they happen, not reconstructed afterwards. This is the raw material for `reflection.md` question 2.

Format: what the AI did, what I said, what changed.

---

## C1 — Stage 1 — outdated Next.js pinned from memory (caught by tooling, not by me)

**What the AI did.** Hand-wrote `package.json` pinning `next@15.5.4`, a version recalled from training data rather than looked up.

**What went wrong.** `npm install` reported 3 vulnerabilities, 2 high and 1 critical. `npm audit` showed the whole `9.3.4-canary.0` to `16.3.0-preview.10` range carries a critical RCE advisory in the React flight protocol (GHSA-9qr9-h5gf-34mp), plus roughly 25 other advisories covering middleware bypass, cache poisoning and SSRF.

**Root cause.** An AI writing dependency versions from memory will pin whatever was current at training time. It has no way to know what shipped since, and it will state the stale version with complete confidence.

**Fix.** Queried the registry for the real current version (`npm view next version`, 16.3.3), upgraded Next and React, re-ran audit. Now 0 vulnerabilities.

**Lesson carried forward.** Never accept an AI-written dependency version without checking the registry. This one was caught because `npm install` prints the warning unprompted. A version that is merely outdated rather than vulnerable would have printed nothing and shipped silently.
