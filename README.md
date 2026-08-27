# Todo

A Notion-style task manager, built for the ShopBack AI-assisted engineering take-home.

Tasks live in databases you create. Every task has a built-in **Name** and **Done**, plus any number of properties you define yourself, each with its own type. Each database can be viewed as a table or as a kanban board.

**Repository:** https://github.com/visrutsuresh/Todo

---

## Sign-in details

The app creates a demo account for you, already filled with data:

| Email | Password |
|---|---|
| `demo@shopback.test` | `hunter2hunter2` |

You can also create your own account from the sign-up page. Any email works and nothing is sent anywhere.

---

## How to run it

There are two ways. **Docker is the safer one** and needs nothing installed except Docker itself.

### Option A: Docker (recommended)

**Step 1.** Make sure Docker Desktop is open and running.

**Step 2.** Open a terminal in the project folder (the one containing this README) and run:

```bash
docker compose up
```

The first build takes a minute or two. Wait until the terminal prints:

```
Seeded. Sign in at http://localhost:3000 as demo@shopback.test / hunter2hunter2
```

**Step 3.** Open http://localhost:3000 in your browser.

**Step 4.** Sign in with the details in the table above.

To stop it, press `Ctrl+C`. To remove it completely, run `docker compose down -v`.

### Option B: Node directly

**Step 1.** Check your Node version:

```bash
node -v
```

**You need Node 24 or newer.** This is a hard requirement, because the app uses the SQLite database that is built into Node itself. On older versions it does not exist and the app cannot start. If your version is older, use Option A instead.

**Step 2.** Go into the code folder and install:

```bash
cd Codebase
npm install
```

**Step 3.** Create the demo account and its sample data:

```bash
npm run seed
```

**Step 4.** Start the app:

```bash
npm run dev
```

**Step 5.** Open http://localhost:3000 and sign in with the details above.

To stop it, press `Ctrl+C`.

---

## What to try once you are in

The demo account opens on **Sprint Board**, which has five tasks and one property of every supported type.

1. **Tick a checkbox** in the Done column to complete a task. The title goes struck through.
2. **Click a task title** and type to rename it. It saves when you click away.
3. **Click "New task"** at the bottom. A row appears with the placeholder already selected, so just start typing.
4. **Click the "+"** at the right-hand end of the header row to add a property. Give it a name and pick a type. Select properties take a comma-separated list of options.
5. **Click any column heading** to rename it, sort by it, hide it, or delete it. Types can only be changed while a column is empty.
6. **Click the sliders icon** at the top right to open View settings, where you can switch between Table and Board, hide properties, and sort.
7. **Switch to Board** in View settings, then drag a card between columns. It groups by whichever select property you choose.
8. **Right-click a database** in the left sidebar to rename or delete it. Double-clicking also renames it.
9. **Click your name** at the bottom left to sign out.
10. **Switch to Personal** in the sidebar to see that databases are completely independent, with their own properties.

---

## What it does

- Add, edit and delete tasks
- Mark tasks complete
- Everything saves to disk and is still there when you restart
- Multiple databases, each with its own set of properties
- Properties you define yourself, in five types: text, number, select, date and checkbox
- Table and board views of the same data
- Sort by any column, hide any column
- Accounts with email and password, where each person only ever sees their own data

---

## Running the tests

```bash
cd Codebase
npm test
```

25 tests, covering password hashing, the database rules, and the property type system.

---

## What is in the folder

```
Todo/
├── README.md            this file
├── prompt.md            every AI prompt, exactly as it was sent
├── reflection.md        the AI usage write-up
├── CORRECTIONS.md       a log of what the AI got wrong, written as it happened
├── docker-compose.yml   the Docker setup
├── Screenshots/         the working app
└── Codebase/            the application itself
    ├── PRD.md           requirements and the decisions behind them
    ├── app/             pages, API routes and components
    ├── lib/             database, sign-in, property types and data access
    └── scripts/seed.mjs creates the demo account and sample data
```

---

## Things worth knowing

**Passwords** are hashed with a random per-user salt using Node's built-in `scrypt`, and sessions are random tokens in a cookie the browser cannot read from JavaScript. Signing in is limited to five failed attempts every fifteen minutes, and gives the same message whether or not the email exists, so nobody can use it to find out who has an account.

**A property's type can only be changed while its column is empty.** This is checked on the server, not just hidden in the menu. Changing the type of a column that already holds values would leave those values meaningless.

**Left out on purpose:** a calendar view, and links between databases. Both were designed and then cut when time ran short, rather than forgotten. Notion's Filter and Group menus were also left out rather than shown as buttons that do nothing.

**No configuration is needed.** No `.env` file, no API keys, no accounts, no external services. The database is a single file created on first run.
