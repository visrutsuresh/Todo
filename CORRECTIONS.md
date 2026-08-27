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

## C2 — Stage 2 — AI wrote a regex transpiler instead of checking what the runtime already did

**What the AI did.** Needed to unit-test `lib/props.ts`, which is plain TypeScript. Assumed a `.mjs` test file could not import a `.ts` file, so it wrote a chain of roughly a dozen regular expressions to strip type annotations out of the source, wrote the result to a temp file, and dynamically imported that.

**What went wrong.** The regexes did not cover every annotation in the file and the import failed. More importantly, even if they had worked, the test would have been running against a mangled copy of the source rather than the source itself, so a bug introduced by the stripping would look like a bug in the code.

**Root cause.** Reflex reach for a clever workaround without first checking whether the runtime already solved it. Node 24 strips TypeScript types natively; `import ... from './props.ts'` just works. The AI had already chosen Node 24 for its built-in SQLite and still did not consider its built-in type stripping.

**Fix.** Deleted all of it. The test now has a three-line header importing the real source directly. Roughly 20 lines of machinery removed.

**Lesson carried forward.** When an AI produces something clever, that is the signal to stop and ask what the boring version would be. Cleverness in generated code is usually a workaround for a constraint that does not exist. This was caught only because the hack failed loudly; had the regexes happened to work, a fragile fake transpiler would have shipped and nobody would have looked at it again.

## C3 — Stage 2 — half-built feature shipped, and the missing half hid a data bug

**What the AI did.** Built the property system with create and delete in the UI, but no rename and no way to edit a select's options, even though the API already supported both. It then reported this as a known gap rather than fixing it.

**What I said.** Fix it first, before moving on to new features.

**What the fix exposed.** Building the options editor surfaced a bug that had been invisible while the feature was missing. Editing a select's options only rewrote the options list. Any task already holding a value that was no longer in the list kept that value in the database, but the dropdown had no matching `<option>`, so it rendered blank. The value was invisible on screen and still present in storage: the two disagreed silently, and nothing errored.

**Fix.** `updateProperty` now clears newly-invalid values inside the same transaction as the options update and returns how many tasks were affected. The UI warns before removing an in-use option and reports the count afterwards. Renaming onto another property's name now returns 409 instead of creating two identically-labelled columns. Verified: removing an option used by 2 of 3 tasks cleared exactly those 2 and left the third untouched.

**Lesson carried forward.** An AI will happily build the easy half of a feature and describe the missing half as a limitation. The gap is not just incomplete work; the unbuilt half is where the untested paths hide. Delete-and-recreate would have masked this bug indefinitely, because nobody exercises the edit path that does not exist.

## C4 — Design pass — 500 on login, caused by null-prototype rows crossing the server boundary

**What the AI did.** `lib/store.ts` returned rows straight from `node:sqlite` for databases, and the page passed that array into the client `Sidebar` component.

**What I said.** I logged in and got a server error.

**What went wrong.** `node:sqlite` returns rows with a **null prototype**. React refuses to serialize a null-prototype object across the Server Component to Client Component boundary, so every authenticated page threw `Only plain objects, and a few built-ins, can be passed to Client Components`.

**Why every test missed it.** 25 unit tests and about 40 API assertions all passed, because `JSON.stringify` does not care about prototypes: every API route returned correct JSON the whole time. The bug only exists at the React boundary, which no API-level test touches. `toTask` and `toProperty` happened to be safe because they used object spread, which produces a plain object. `listDatabases` returned raw rows, so it was the only unsafe path, and it was the one the new sidebar used.

**Fix.** Added an explicit `toDatabase` mapper alongside the existing ones, so every row that can reach the client is normalised in exactly one place.

**Lesson carried forward.** Two separate ones. First, a green test suite proves the paths you tested, not the app: I had never once loaded a page in a browser, and the first time a human did, it broke immediately. Second, testing at the API layer cannot catch a bug that lives at a framework boundary the API layer does not cross.

## C5 — Design pass — unicode glyphs used as icons, rendered as tofu squares

**What the AI did.** Used characters like the box-drawing glyph for the logo, sidebar items, view tabs and the five property-type icons.

**What I said.** "What is the random square on the top of the login page."

**What went wrong.** Geist Mono has no glyph for those code points, so the browser rendered the missing-character box. The AI picked characters that look right in its own output and never verified the chosen font actually ships them.

**Fix.** Replaced all of them with hand-written inline SVG in `app/Icons.tsx`, including one per property type. Verified 0 of those code points remain in the rendered HTML on any page.

**Lesson carried forward.** An icon you cannot guarantee the font ships is not an icon. This is only visible by looking at the running app, which is exactly the check that had been skipped.
