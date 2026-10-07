# Playwright TypeScript Framework (UI + API, POM, Docker)

A production-ready test automation framework built on **Playwright Test** and **TypeScript**:

- **UI tests** using the **Page Object Model**, run on **Chromium, Firefox and WebKit**
- **API tests** using Playwright's `APIRequestContext` (full CRUD), run **once** (no browser)
- **Hybrid tests** where API calls set up, verify and tear down state around a UI flow
- Custom **fixtures** inject page objects and API clients, so specs stay short
- **dotenv** for environment configuration, **HTML + JSON** reports
- Fully **containerised** on the official `mcr.microsoft.com/playwright` image

Applications under test (public demo sites):

| Suite | Target | Notes |
|-------|--------|-------|
| UI    | https://www.saucedemo.com | Login + e-commerce flow |
| API   | https://restful-booker.herokuapp.com | Booking CRUD with token auth |

---

## Project structure

```
playwright-framework/
├── tests/
│   ├── ui/
│   │   ├── login.spec.ts            # Login / logout / error cases
│   │   ├── checkout.spec.ts         # Sort, cart, end-to-end purchase
│   │   └── hybrid-ui-api.spec.ts    # API setup/verify around UI flows
│   └── api/
│       └── booking-crud.spec.ts     # Create / Read / Update / Patch / Delete + negatives
├── pages/
│   ├── BasePage.ts                  # Shared navigation & helpers
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── index.ts
├── fixtures/
│   └── test-fixtures.ts             # Extended `test` with page objects & API client
├── utils/
│   ├── env.ts                       # Typed env access (dotenv)
│   ├── test-data.ts                 # Unique test data builders
│   └── booking-api.ts               # API request wrapper
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .dockerignore
└── .gitignore
```

## How the projects are split

`playwright.config.ts` defines four projects:

| Project    | Test dir      | Runs on |
|------------|---------------|---------|
| `api`      | `tests/api`   | No browser, `baseURL = API_BASE_URL` |
| `chromium` | `tests/ui`    | Desktop Chrome |
| `firefox`  | `tests/ui`    | Desktop Firefox |
| `webkit`   | `tests/ui`    | Desktop Safari |

A plain `npx playwright test` runs **all of them together**: API once, UI × 3 browsers.

Execution settings:
- `fullyParallel: true`; workers are configurable via `WORKERS` and default to 4 on CI
- `retries: 2` on CI (`CI=true`), 0 locally
- `trace: on-first-retry`, screenshots and video kept on failure
- Reporters: `list` (console), `html` → `reports/html`, `json` → `reports/json/results.json`

---

## Run locally

### Prerequisites
- Node.js 20+ (LTS)

### Setup
```bash
npm install
```
```bash
npx playwright install --with-deps
```
```bash
cp .env.example .env
```

### Run tests
```bash
npm test
```
| Command | What it runs |
|---------|--------------|
| `npm test` | Everything (API + UI on 3 browsers) |
| `npm run test:api` | API suite only |
| `npm run test:ui` | UI suite on all 3 browsers |
| `npm run test:chromium` / `test:firefox` / `test:webkit` | UI on one browser |
| `npm run test:headed` | UI on Chromium, headed |
| `npm run test:debug` | Playwright Inspector |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | TypeScript type check |

Filter by test title:
```bash
npx playwright test -g "end-to-end"
```

---

## Run in Docker

### Prerequisites
- Docker Desktop / Docker Engine with Compose v2.24+

### One command: build and run the whole suite
```bash
docker compose up --build --abort-on-container-exit --exit-code-from tests
```
(Also available as `npm run docker:test`.) The container's exit code matches the test result, so this works as-is in CI.

Reports appear on the host in `./reports/html`, `./reports/json/results.json` and `./test-results` (traces, screenshots, videos).

### Run a subset
```bash
docker compose run --rm tests --project=api
```
```bash
docker compose run --rm tests --project=firefox -g "login"
```

### View the HTML report from a container
```bash
docker compose --profile report up report
```
Then open http://localhost:9323.

### Plain Docker (without Compose)
```bash
docker build -t playwright-framework .
```
```bash
docker run --rm --ipc=host -v "$(pwd)/reports:/app/reports" playwright-framework
```

### Image notes
- Base image: `mcr.microsoft.com/playwright:v<version>-noble`, which ships Node and all three browsers with their OS dependencies.
- Multi-stage build: the `deps` stage installs `node_modules` (cached unless `package.json`/lockfile change), and the `runner` stage copies in the source and type-checks it at build time.
- **Keep versions in sync:** the Docker tag (`PLAYWRIGHT_VERSION` in `Dockerfile` and `docker-compose.yml`) must equal the `@playwright/test` version in `package.json`. To upgrade, bump all three.
- Commit `package-lock.json` once it's generated (`npm install`). The Dockerfile then uses `npm ci` for reproducible installs.
- `ipc: host` and `init: true` follow Playwright's recommendations for running browsers in containers.

---

## CI: GitHub Actions

`.github/workflows/playwright.yml` runs the same Docker setup on GitHub:

- **Triggers:** push to `main`/`master`, pull requests, manual (**Actions → Playwright Tests → Run workflow**), and nightly at 02:00 UTC
- **Parallel jobs:** one per project (`api`, `chromium`, `firefox`, `webkit`), with `fail-fast: false` so one browser failing doesn't cancel the others
- **Build cache:** Docker layers are cached between runs (GitHub Actions cache)
- **Results:** a pass/fail table in each run's summary page, the HTML/JSON report uploaded as an artifact per project, and traces/screenshots/videos uploaded when a job fails

Optional overrides go under **Settings → Secrets and variables → Actions**: variables `BASE_URL` and `API_BASE_URL`, and secrets `UI_USERNAME`, `UI_PASSWORD`, `API_USERNAME` and `API_PASSWORD`. Anything left unset falls back to the demo defaults.

---

## Configuration

All settings come from environment variables. A `.env` file is loaded via dotenv, and variables already set in the environment (CI, Docker) take precedence.

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `https://www.saucedemo.com` | UI base URL |
| `UI_USERNAME` / `UI_PASSWORD` | `standard_user` / `secret_sauce` | UI login |
| `API_BASE_URL` | `https://restful-booker.herokuapp.com` | API base URL |
| `API_USERNAME` / `API_PASSWORD` | `admin` / `password123` | API auth |
| `WORKERS` | auto (4 on CI) | Parallel workers |
| `HEADLESS` | `true` | Set to `false` for headed runs |
| `CI` | unset | Enables retries and `forbidOnly` |

The defaults are the public credentials of the demo sites. For real systems, inject secrets through your CI secret store and never commit `.env`.

---

## Writing tests: conventions

1. **Import `test`/`expect` from `fixtures/test-fixtures.ts`**, not from `@playwright/test`, to get the page objects and API client fixtures.
2. **Page objects** extend `BasePage`, declare a `path` and locators, and expose *actions* (`login`, `addToCart`) and *assertions* (`expectCartCount`). Specs shouldn't contain raw selectors.
3. **Locators** use `getByTestId` (mapped to the app's `data-test` attribute via `testIdAttribute`) or role/text locators.
4. **API wrappers** live in `utils/` and return either parsed bodies (happy-path helpers) or raw `APIResponse` objects, so tests can assert on status codes.
5. **Data isolation:** build unique data with `utils/test-data.ts` and clean up in `afterEach`/`finally`, so tests stay parallel-safe.
6. **Fast auth:** `loggedInInventoryPage` seeds the session cookie and skips the login form. With a real app, swap in an auth API call plus `storageState` in a setup project.
