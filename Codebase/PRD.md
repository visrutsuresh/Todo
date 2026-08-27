# Todo — Product Requirements Document

A Notion-style task manager built for the ShopBack Engineering AI-fluency take-home.

Status: design locked, implementation not started.

---

## 1. Context

### What is being built

A task manager where tasks live in user-created databases. Every task has a locked Title and Done field plus any number of user-defined typed properties. Each database renders in three views over the same data: Table, Board and Calendar.

### Why it exists

This is a take-home assignment for an Engineering role at ShopBack, graded on AI fluency. The assignment is explicit that it is **not** grading whether the app is impressive, whether the code is perfect, or which AI tool was used. It grades three things:

1. How you think before you prompt.
2. How you course-correct when the AI produces garbage.
3. Whether you understand what you shipped.

The practical consequence drives every decision in this document: `prompt.md` and `reflection.md` carry more weight than the application, and the single pass/fail bar for the app itself is **does it run on the reviewer's machine**. Every trade-off below resolves in favour of "runs cleanly for a stranger" over "demonstrates more".

### Who it is for

The ShopBack reviewer running it locally, and Visrut afterwards as a portfolio piece.

### Hard requirements from the assignment

- Add, edit, delete tasks
- Mark tasks as complete
- Basic persistence
- Submitted as a ZIP containing the codebase, `README.md`, `prompt.md`, a `Screenshots/` folder, and `reflection.md` under 500 words

### Constraints

- Roughly 2h20m of build time remaining at the point this document was written
- No paid services, no accounts the reviewer must create
- No `.env` may be required to run the app
- Total submission under 50MB

### Explicit non-goals

Relations between databases (stretch only). Multi-select and URL property types. Changing a property's type after creation. Password reset, email verification, social login. Deployment. Mobile-specific layouts. Real-time collaboration. Undo.

---

## 2. Assumptions

These were agreed explicitly rather than inherited silently.

| # | Assumption |
|---|---|
| 1 | Scale is one user at a time, tens of databases, hundreds of tasks. No pagination, no indexes beyond primary keys, no caching. |
| 2 | Views render client-side from a single fetch per database. No list virtualisation. |
| 3 | Security covers password hashing, httpOnly cookies, and server-side ownership scoping on every query. It deliberately omits CSRF tokens, rate limiting and HSTS. These omissions are named honestly in `reflection.md` rather than hidden. |
| 4 | Persistence is a SQLite file on disk. No backups, no migrations framework. Schema is created on first run. |
| 5 | Deleting a property deletes its values from every task in that database. No undo. Guarded by a confirmation modal. |
| 6 | Deleting a database deletes its tasks. Guarded by a confirmation modal. |
| 7 | A property's type cannot be changed after creation. The user deletes and recreates. |
| 8 | `reflection.md` is written by hand, unaided by AI. This is itself the answer to rubric question 3. |

---

## 3. Decision log

### D1 — Scope of the Notion database model

**Decided:** full user-defined properties. Users create properties and choose their type.

**Alternatives considered:** a fixed schema with Notion-like columns and multiple views, which was recommended on time grounds; and multiple databases with relations between them, which was rejected as a multi-week project.

**Why:** the CEO wants the real property model, accepted the schedule risk knowingly, and multiple databases arrived free as a side effect of D4. Relations remain a stretch goal.

**Risk accepted:** this is the largest single driver of schedule risk in the project. Mitigated by D7.

### D2 — Tech stack

**Decided:** Next.js with TypeScript, and `node:sqlite`, the SQLite module built into Node 24.

**Alternatives considered:** FastAPI with a SQLite backend and a separate React frontend; and React with `localStorage` and no backend at all.

**Why:** one repo, one language, one command. Next API routes provide a genuine backend so this is not merely a frontend exercise. `node:sqlite` is built into the runtime, so the database costs zero dependencies and zero native compilation, removing the most common reason a take-home fails to start on a stranger's machine. TypeScript earns its place specifically because user-defined property *types* are the core domain concept, and TS catches type-dispatch mistakes that would otherwise surface as runtime bugs late in the build.

**Rejected because:** the Python option needs two runtimes, two installs, two dev servers and CORS, all of which is friction at the one bar that actually fails you. The `localStorage` option satisfies the spec but leaves an Engineering reviewer with no backend to read.

### D3 — System properties and property types

**Decided:** Title and Done are real columns on the tasks table and cannot be deleted or renamed. All other properties are user-defined. Five types are supported: Text, Number, Select, Date, Checkbox.

**Alternatives considered:** locking Status as well, which was rejected for creating two competing notions of completion; locking Title only, which was rejected because a user deleting the completion property would break a graded requirement.

**Why:** this is the smallest lock that protects both graded requirements while leaving the user-defined layer genuinely open. Add, edit, delete and complete all work on a database with zero custom properties. The five chosen types each map to a native HTML input, so four of them cost almost no custom UI. Only Select needs an options editor.

### D4 — Authentication

**Decided:** email and password, implemented directly. Passwords hashed with Node's built-in `crypto.scrypt` using a per-user salt. Sessions are random tokens in httpOnly cookies, stored in SQLite.

**Alternatives considered:** no auth and a single user, which was recommended; HTTP Basic Auth, which gates the app but gives no real user model; and a managed provider such as Clerk or Supabase, which is the correct real-world answer.

**Why:** the CEO wants real per-user data. The managed provider is genuinely better practice, but it requires the reviewer to hold API keys, which breaks the "no `.env` needed to run" constraint. The chosen approach is fully self-contained, costs no dependencies, and the reviewer signs up in seconds with any fake email.

**Risk accepted:** rolling your own login is exactly what the project's own build guide advises against. This is a deliberate, documented exception justified by the runs-for-a-stranger constraint, and `reflection.md` should state plainly that a real product would use a managed provider.

### D5 — Multiple databases

**Decided:** in scope. Users create multiple named databases, each with its own property set.

**Why:** not chosen for its own sake. D4 requires tasks to be scoped to a user, and once a scoping table exists, making it a user-visible database costs roughly fifteen minutes. This delivers most of the original stretch goal for almost nothing. Relations between databases remain out.

### D6 — Views

**Decided:** Table, Board and Calendar.

**Alternatives considered:** Table alone; and Table plus Board, which was recommended.

**Why:** the CEO chose all three. Table is the core and demonstrates the property system on its own. Board reuses the same data with no new backend work. Calendar is the most expensive view per unit of grading value, which is why D7 places it last.

### D7 — Build order and cut line

**Decided:** strict priority order with a shippable checkpoint at every stage. The clock cuts from the bottom, never from the middle.

**Why:** the locked scope exceeds the remaining time. Rather than cutting the CEO's ambition up front, the schedule risk is neutralised by guaranteeing that whatever exists when time runs out is a complete, working, submittable app. The governing rule is that all graded minimum features must be working and screenshot-able before view number two begins.

### D8 — Gate procedure

**Decided:** the contrarian plan review ran once on the scaffolding, returned FAIL with six objections, all of which were resolved. The CEO then ordered the loop-2 re-review skipped for speed. Recorded for auditability.

---

## 4. Data model

Schema is created on first run if absent. No migrations framework.

```sql
users
  id        TEXT PRIMARY KEY
  email     TEXT UNIQUE NOT NULL
  pw_hash   TEXT NOT NULL
  pw_salt   TEXT NOT NULL
  created   TEXT NOT NULL

sessions
  token     TEXT PRIMARY KEY
  user_id   TEXT NOT NULL REFERENCES users(id)
  expires   TEXT NOT NULL

databases
  id        TEXT PRIMARY KEY
  user_id   TEXT NOT NULL REFERENCES users(id)
  name      TEXT NOT NULL
  created   TEXT NOT NULL

properties
  id        TEXT PRIMARY KEY
  db_id     TEXT NOT NULL REFERENCES databases(id)
  name      TEXT NOT NULL
  type      TEXT NOT NULL   -- text | number | select | date | checkbox
  options   TEXT            -- JSON array of strings, select only
  position  INTEGER NOT NULL

tasks
  id        TEXT PRIMARY KEY
  db_id     TEXT NOT NULL REFERENCES databases(id)
  title     TEXT NOT NULL   -- system, undeletable
  done      INTEGER NOT NULL DEFAULT 0   -- system, undeletable
  props     TEXT NOT NULL DEFAULT '{}'   -- JSON, keyed by property id
  position  INTEGER NOT NULL
  created   TEXT NOT NULL
```

### Why property values are a JSON column

The obvious alternative is an entity-attribute-value design: a separate values table with one row per task per property, and a column per supported type. That is the textbook relational answer and it is the wrong answer here.

At this scale a JSON column means every task is a single row, a task read is one query with no joins, and adding a property type touches only the type-dispatch code rather than the schema. The EAV design would mean joins on every read, a wider values table, and materially more code for no benefit at hundreds of tasks.

The cost of the JSON choice is real and accepted: values cannot be queried or sorted in SQL, so filtering and sorting happen in application code. Given assumption 1, that is correct. If this ever needed to serve thousands of tasks per database, the JSON column is the first thing that would have to change.

### Type storage

Inside `props`, keyed by property id: `text` stores a string, `number` a JSON number, `select` a string that must be one of the property's options, `date` an ISO `YYYY-MM-DD` string, `checkbox` a boolean. Values are validated against the property's declared type on write, server-side. A missing key means the property is unset, which is distinct from empty.

---

## 5. API

All routes require a valid session cookie except signup and login. Every query is scoped by `user_id` on the server, so a crafted request carrying another user's database id returns 404 rather than data.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create user, start session |
| POST | `/api/auth/login` | Start session |
| POST | `/api/auth/logout` | End session |
| GET | `/api/databases` | List the user's databases |
| POST | `/api/databases` | Create a database |
| PATCH | `/api/databases/[id]` | Rename |
| DELETE | `/api/databases/[id]` | Delete, cascading to properties and tasks |
| GET | `/api/databases/[id]` | Database with its properties and tasks, one fetch per view |
| POST | `/api/databases/[id]/properties` | Add a property |
| PATCH | `/api/properties/[id]` | Rename, or edit select options |
| DELETE | `/api/properties/[id]` | Delete, stripping its key from every task |
| POST | `/api/databases/[id]/tasks` | Add a task |
| PATCH | `/api/tasks/[id]` | Edit title, done, props, or position |
| DELETE | `/api/tasks/[id]` | Delete a task |

Errors return a JSON body with a `message` field. Login failure returns a generic message that never reveals whether an email is registered.

---

## 6. Pages

| Route | Who sees it | What they see |
|---|---|---|
| `/login` | Signed out | Email, password, submit, link to signup. Generic error on failure. |
| `/signup` | Signed out | Email, password, submit. Creates the user, logs in, redirects to `/`. |
| `/` | Signed in | Redirects to the most recent database, or an empty state offering to create the first one. |
| `/db/[id]?view=table\|board\|calendar` | Signed in, owner only | Sidebar listing the user's databases with a new-database button and sign out. Top bar with the database name, the view switcher and an add-task button. Main area renders the selected view. |

Two surfaces are overlays rather than routes:

- **Task drawer.** Opens from any view. Title, Done, and every property rendered with its typed control. Delete button with confirmation.
- **Property editor.** Modal. Name, type picker, and the option list for Select. Edits and deletes existing properties, with a confirmation warning that deletion strips values from every task.

### View behaviour

**Table.** A grid with columns for Title, Done, then one per property in `position` order, then an add-property button in the header. Cells edit inline using the control for their type. Clicking a row opens the drawer.

**Board.** Kanban columns generated from the options of a Select property the user picks. Dragging a card between columns writes that property's value. If the database has no Select property, the view shows an empty state explaining how to create one rather than rendering nothing.

**Calendar.** A month grid placing tasks on a chosen Date property. Tasks with no value for that property are not shown. If the database has no Date property, the same style of empty state applies.

---

## 7. Build plan

Every numbered stage below leaves the application in a runnable state. Whatever the clock cuts, what remains is submittable.

| Stage | Work | Budget | Checkpoint |
|---|---|---|---|
| 1 | Schema, db module, auth, login and signup pages | 40m | Sign up, log in, log out |
| 2 | CRUD, Table view, property rendering | 55m | **All graded requirements met and screenshot-able** |
| 3 | Property editor across all five types | 25m | **Full Notion property model working** |
| 4 | Multiple databases and the sidebar | 15m | Create, rename, switch, delete |
| 5 | Board view with drag | 35m | **Preferred screenshot point** |
| 6 | Calendar view | 45m | Three views live |
| 7 | Relations between databases | stretch | Only if 6 lands early |

**Hard stop at T minus 35 minutes regardless of stage reached.** The remaining time goes to capturing `Screenshots/`, appending the build prompt verbatim to `prompt.md`, handwriting `reflection.md`, writing real run instructions into `README.md`, and building the ZIP.

---

## 8. Testing

Per the build guide, each stage gets a test written alongside it and the suite runs before the stage is considered done. Reading the diff alone does not catch a regression three stages later.

Priority order, because the clock may not allow all of it:

1. Property value validation. Each of the five types accepts valid input and rejects invalid input. This is the highest-value test because type dispatch is the core domain logic and the most likely source of subtle bugs.
2. Ownership scoping. A request for another user's database id returns 404, not data. This is a security test and it is not optional.
3. Property deletion strips the key from every task in that database.
4. Task CRUD round-trips through the database.

Manual checks before packaging: walk every page, deliberately try to break each one, confirm the app runs from a clean clone with `npm install && npm run dev` and no `.env`.

---

## 9. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Scope exceeds remaining clock | High | D7 build order. Every stage ships. The cut comes from the bottom. |
| Self-implemented auth has a flaw | Medium | Scoped ownership checks server-side on every query, a test for it, and honest disclosure in `reflection.md`. Non-negotiable given no real user data is at stake. |
| Calendar view left half-built | Medium | It is last by design. If it is not finished it is removed entirely rather than shipped broken, and the view switcher drops to two options. |
| App does not run for the reviewer | Critical | Zero dependencies for the database, no `.env`, one install command. Verified from a clean clone before packaging. |
| `.git` or the assignment spec ends up in the ZIP | Medium | Explicit exclusion step in the packaging checklist. The spec screenshots live only in the vault and were never committed. |

---

## 10. Definition of done

- The app runs from a clean clone with `npm install && npm run dev` and no `.env` file
- Add, edit, delete, complete and persist all demonstrably work
- `Screenshots/` shows the working UI and each main feature
- `prompt.md` contains every prompt verbatim, in order, unedited
- `reflection.md` answers all four questions in under 500 words, handwritten
- `README.md` gives working run instructions pointing into `Codebase/`
- No secrets anywhere, and nothing secret in frontend code
- ZIP is under 50MB, not password protected, and excludes `.git/`
