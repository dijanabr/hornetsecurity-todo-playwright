# ToDo App – Playwright E2E Test Suite

Automated end-to-end tests for the ToDo application from [cypress-example-kitchensink](https://github.com/cypress-io/cypress-example-kitchensink), written in **Playwright + TypeScript**, packaged in **Docker** and run in **GitHub Actions** with an **Allure** report that keeps history and trends.

- **Live test report (Allure):** https://dijanabr.github.io/hornetsecurity-todo-playwright/
- **Reported defects:** [GitHub Issues](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues)

---

## Contents

1. [Test approach](#test-approach)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Setup and execution](#setup-and-execution)
5. [Docker](#docker)
6. [CI – GitHub Actions](#ci--github-actions)
7. [Reporting](#reporting)
8. [Test data and isolation](#test-data-and-isolation)
9. [Conventions and standards](#conventions-and-standards)
10. [Quality findings](#quality-findings)
11. [What I would improve with more time](#what-i-would-improve-with-more-time)

---

## Test approach

**Application under test.** A vanilla-JS fork of TodoMVC (`app/todo.html`). There is no backend: all data is stored in the browser's `localStorage`. On first visit the app adds two default todos.

**Priorities (risk-based).** Core user flows first, then edge cases, then security:

| Priority | Area | Covered by |
| --- | --- | --- |
| P1 | Create, read, update (edit, complete), delete todos | `todoCreate`, `todoRead`, `todoUpdate`, `todoDelete` |
| P1 | Filters (All / Active / Completed), URL routing, Back button | `todoRead` |
| P1 | Persistence after reload, item counter, toggle all, clear completed | `todoRead`, `todoUpdate`, `todoDelete` |
| P2 | Input edge cases: trimming, empty / whitespace-only input, special characters, non-Latin text | `todoCreate`, `todoUpdate` |
| P2 | All UI elements present, focus on load, default filter | `todoRead` |
| P2 | HTML / script input rendered as text (XSS regression) | `todoSecurity` |
| – | Reported defects (expected behaviour, marked `test.fail`) | `knownIssues` |

**Assumptions.**
- No requirements were provided. The [TodoMVC app specification](https://github.com/tastejs/todomvc/blob/master/app-spec.md) is used as the expected-behaviour baseline, because the app is a declared fork of TodoMVC.
- The app is tested exactly as published: `app/` is copied unchanged from the source repository (see [Source of the application](#source-of-the-application)).

**Scope.** The ToDo page (`/todo`) on Chromium, Firefox, WebKit and mobile Chrome (Pixel 7).

**Out of scope.**
- Other kitchensink pages and the existing Cypress tests.
- API and contract tests – the app has no backend or network calls.
- Visual regression, performance and load testing.
- A full accessibility audit (accessibility issues found manually are listed in [Quality findings](#quality-findings)).
- Very long text input – there is no defined maximum length, so it is reported as a finding for the product owner, not asserted in a test.

---

## Tech stack

| Tool | Purpose |
| --- | --- |
| Playwright Test + TypeScript | test runner, browser automation, assertions |
| `serve` | static web server for the app (started by Playwright `webServer`) |
| Docker (`mcr.microsoft.com/playwright`) | one image with the app, the tests and all dependencies |
| GitHub Actions | CI pipeline |
| Allure Report (`allure-playwright`) | main report with history and trends, published to GitHub Pages |
| Playwright HTML report | secondary report, uploaded as a CI artifact |

---

## Project structure

```text
app/                       ToDo application under test (copied unchanged)
data/
  todos.json               test data: lists used for seeding, input values, default todos
  ui.json                  expected UI texts (heading, placeholder, buttons, filters)
  knownIssues.json         links to GitHub issues for known defects
pages/
  basePage.ts              shared page actions (navigate, reload, click, fill)
  todoPage.ts              locators and actions of the ToDo page (extends BasePage)
fixtures/
  todoFixtures.ts          custom fixtures: seedList option, todoPage, todoStorage
tests/
  todoCreate.spec.ts       create
  todoRead.spec.ts         page elements, rendering, reload, counter, filters, routing
  todoUpdate.spec.ts       edit, complete, toggle all
  todoDelete.spec.ts       delete, clear completed
  todoSecurity.spec.ts     HTML / script input shown as text
  knownIssues.spec.ts      reported defects (test.fail)
.github/workflows/
  playwright.yml           CI pipeline
Dockerfile, .dockerignore  Docker image
playwright.config.ts       Playwright configuration
tsconfig.json              TypeScript configuration
```

---

## Setup and execution

### Prerequisites

- Node.js 20 or later
- Git
- Docker Desktop (only for running in Docker)

### Install

```bash
git clone https://github.com/dijanabr/hornetsecurity-todo-playwright.git
cd hornetsecurity-todo-playwright
npm ci
npx playwright install --with-deps
```

### Run

Playwright starts the app automatically on `http://localhost:8080` (`webServer` in the config). No separate step is needed.

```bash
npm test                    # all tests, all projects
npm run test:chromium       # Chromium only (fastest for local work)
npm run test:smoke          # only @smoke tests
npm run report              # open the Playwright HTML report
```

To open the app manually: `npm run start:app`, then http://localhost:8080/todo.

### npm scripts

| Script | What it runs |
| --- | --- |
| `npm test` | all tests on all projects |
| `npm run test:chromium` | all tests on Chromium only |
| `npm run test:headed` | Chromium with a visible browser (debugging) |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:smoke` | tests tagged `@smoke` |
| `npm run test:known-issues` | tests tagged `@known-issue` |
| `npm run test:regression` | everything except `@known-issue` |
| `npm run test:create` / `test:read` / `test:update` / `test:delete` / `test:security` | one spec file |
| `npm run report` | open the last Playwright HTML report |
| `npm run docker:build` / `npm run docker:test` | build / run the Docker image |
| `npm run start:app` | serve the app on port 8080 |

Extra Playwright options go after `--`, e.g. `npm run test:smoke -- --project=firefox`.

---

## Docker

The image contains the application, the tests and all dependencies. It is based on the official Playwright image, so browsers and their system libraries are preinstalled.

```bash
docker build -t todo-playwright .
docker run --rm --init --ipc=host todo-playwright
```

- The image tag in the `Dockerfile` must match the `@playwright/test` version in `package.json`.
- The code is copied at **build** time – rebuild the image after changing tests.
- `ENV CI=true` in the image makes the run behave like CI (retries, fixed workers, fresh app server).
- `--init` and `--ipc=host` are recommended by Playwright for running browsers in Docker.

Run a subset (the command after the image name replaces the default one):

```bash
docker run --rm --init --ipc=host todo-playwright npx playwright test --grep @smoke
```

Keep the reports on the host (PowerShell):

```powershell
docker run --rm --init --ipc=host `
  -v ${PWD}/allure-results:/app/allure-results `
  -v ${PWD}/playwright-report:/app/playwright-report `
  -v ${PWD}/test-results:/app/test-results `
  todo-playwright
```

---

## CI – GitHub Actions

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)

**Triggers:** push to `main`, pull requests, manual run (`workflow_dispatch`).

**Steps:**
1. Build the Docker image (the same image as locally).
2. Run the tests in the container; results are mounted back to the runner.
3. Load the previous report history from the `gh-pages` branch.
4. Generate the Allure report and merge the history (trends).
5. Publish the report to GitHub Pages (only for `main`).
6. Upload `allure-results`, the Playwright HTML report and `test-results` (screenshots, videos, traces) as an artifact for 14 days.

Report steps run with `if: always()`, so a report is produced when tests fail too.

**One-time repository setup:**
1. Settings → Actions → General → Workflow permissions → **Read and write permissions**.
2. After the first run: Settings → Pages → Deploy from a branch → **`gh-pages`** / `/ (root)`.

Trend charts appear from the second run onwards.

---

## Reporting

**Allure** is the main report. It was chosen because it covers every reporting requirement without running a server:

| Requirement | How Allure covers it |
| --- | --- |
| Results, steps and failures easy to understand | tests grouped by suite and file, every action as a step, error message and stack trace |
| Useful evidence on failure | screenshot, video and Playwright trace attached to the failed test |
| Execution history | each run is kept in the `gh-pages` branch |
| Trends over time | pass/fail and duration trends, flaky detection (passed on retry) |
| Generated and available from CI | published to GitHub Pages + raw results as an artifact |

Alternatives considered: Monocart (good, weaker history), ReportPortal (strong history, needs its own server), Currents (paid SaaS), GitHub job summary from JUnit (no trends).

The Playwright `list` reporter is kept for readable console and CI logs, and the HTML report is kept as a secondary artifact with the trace viewer.

---

## Test data and isolation

- **Every test is independent.** Each test gets a new browser context, so it has its own `localStorage`. Nothing is shared between tests, which makes the suite safe to run in parallel (`fullyParallel: true`) and repeatedly.
- **Known start state.** Before the app loads, the `todoPage` fixture writes a list from `data/todos.json` into `localStorage` (`page.addInitScript`). The app then skips its own default todos, and ids are assigned by the test (unique), not by the app.
- **Selecting data.** The default list is `mixed`. A file or `describe` block selects another list by name:
  ```ts
  test.use({ seedList: 'allActive' });   // 'mixed' | 'allActive' | 'allCompleted' | 'single' | 'none'
  ```
  `'none'` starts the app like a first visit (with its two default todos).
- **Reloads keep changes.** The seed runs only on the first load of a test (a `sessionStorage` flag), so `reloadPage()` keeps what the test changed – needed for persistence tests.
- **Reading storage.** Tests check saved data through the `todoStorage` fixture (`read()`, `clearAndReload()`); they never access `localStorage` directly.
- **No cleanup script.** There is no shared database: data lives in the test's own browser context and is discarded with it after the test.

---

## Conventions and standards

### Naming
- Files and folders start with a lowercase letter (camelCase): `basePage.ts`, `todoCreate.spec.ts`.
- Classes use PascalCase: `class BasePage`, `class TodoPage`.
- Test titles describe the expected behaviour: `'the "Clear completed" button removes only the completed todos'`.

### Page objects
- `BasePage` holds actions shared by every page: `navigateTo(url)`, `reloadPage()`, `clickElement()`, `fillValue()`.
- Each page extends `BasePage` and adds only its own locators and actions.
- Page objects contain no assertions – tests decide what the correct result is.
- Locators that tests assert on are `public`.
- Everything about `localStorage` (storage key, seeding, reading) lives in the fixtures, not in page objects.

### Locators
- Prefer user-facing locators in this order: `getByRole` → `getByLabel` → `getByPlaceholder` / `getByText` → `getByTestId`.
- Use CSS only when the markup offers nothing better, and add a comment with the reason.
- Find a todo by its exact title: `item(title)` uses `getByText(title, { exact: true })`.

### Test attributes
- Elements are marked for testing with `data-test="..."`.
- `testIdAttribute: 'data-test'` is set once in `playwright.config.ts`, so locators use `getByTestId('...')`. If the attribute name changes, only that line changes.

### Test data
- Test data is never hard-coded in tests; it comes from `data/`:
  - `todos.json` – data the tests enter or seed
  - `ui.json` – texts the tests expect to see
  - `knownIssues.json` – issue links

### Assertions and waiting
- Use web-first assertions (`await expect(locator).toHaveText(...)`), which wait and retry automatically.
- No fixed waits (`waitForTimeout`).

### Tags
- `@smoke` – the main flows; quick confidence check.
- `@known-issue` – tests for reported defects.

### Known defects
- A test for a reported defect describes the **expected** behaviour and is declared with `test.fail(title, details, body)`, with an `issue` annotation linking to the GitHub issue.
- While the defect exists, the test fails as expected and the suite stays green. When the defect is fixed, the test passes and Playwright reports it as an error – remove `test.fail` and keep the test as a normal regression test.
- `test.skip` / `test.fixme` are not used for defects, because a skipped test never signals that a fix happened.

### Configuration
- Locally: no retries (flaky tests are not hidden), workers = half of the CPU cores.
- CI and Docker (`CI=true`): 1 retry, 2 workers, `forbidOnly` (a forgotten `test.only` fails the run).
- Evidence on failure: `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.

### Adding a new test
1. Put new locators and actions in the page object (`pages/`).
2. Put new data in `data/`.
3. Write the test in the matching spec file, using `test` and `expect` from `fixtures/todoFixtures.ts`.
4. Choose the start data with `test.use({ seedList: '...' })` if `mixed` does not fit.
5. Run it on all projects before pushing: `npm test -- tests/<file>.spec.ts`.

---

## Quality findings

| # | Finding | Type | Severity | Issue |
| --- | --- | --- | --- | --- |
| 1 | Duplicate todo IDs – IDs come from `Date.getTime()`, so todos created in the same millisecond (e.g. the two default todos, about half of fresh loads) share an ID, and toggling or deleting the second one changes the first one instead. | Defect | High | [#1](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/1) |
| 2 | Unvalidated route in the URL hash – unknown or wrongly-cased routes (`#/foo`, `#/Active`) throw errors, can show an empty list, and leave the filter navigation broken until reload. | Defect | Medium | [#2](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/2) |
| 3 | Deleted default todos reappear after reload – the app re-seeds whenever the list is empty, so a user cannot keep an empty list. | Defect | Medium | [#3](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/3) |
| 4 | No maximum length on todo text – very long text (10,000+ characters) makes the item extremely tall, so the toggle and delete controls are hard to find and items below are pushed out of view. | Defect | Medium | – |
| 5 | New todo is created on blur, not only on Enter – differs from the TodoMVC spec and may create accidental todos. | Unclear behaviour (question for PO) | – | – |
| 6 | Missing test hooks – only the new-todo input has a `data-test` attribute; other elements must be located by CSS classes. | Testability | – | – |
| 7 | Todo checkboxes have no accessible name and are visually hidden, so screen readers and role-based locators cannot identify them by name. | Accessibility / testability | – | – |
| 8 | Delete button is visible only on hover, which is hard to discover on touch devices. | Accessibility / UX | Low | – |
| 9 | Non-deterministic default data – default todos are added on load with time-based IDs, so tests must control `localStorage` to stay stable. | Testability | – | – |
| ✔ | HTML / script input is escaped correctly (no XSS) on create, edit and reload. | Verified OK | – | – |

---

## What I would improve with more time

- **Test hooks:** agree with the developers on `data-test` attributes for every interactive element and accessible names for the checkboxes, then replace the remaining CSS locators.
- **Accessibility:** add automated checks with `@axe-core/playwright`.
- **Visual regression:** screenshot comparisons for the main states (empty, mixed, all completed).
- **Faster CI:** shard the suite across parallel jobs (`--shard`) as it grows.
- **Docker Compose:** run the app and the tests as separate services, closer to a real deployment.
- **Code quality:** ESLint with the Playwright plugin and a type-check step (`tsc --noEmit`) in CI.
- **If the app had a backend:** API tests with Playwright's `request` fixture, data seeding through the API, `page.route()` to mock errors and slow responses, and contract tests.
- **Pin GitHub Actions** to release tags or commit SHAs.

---

## Source of the application

`app/` is copied unchanged from [cypress-io/cypress-example-kitchensink](https://github.com/cypress-io/cypress-example-kitchensink) at commit [`e8ba753`](https://github.com/cypress-io/cypress-example-kitchensink/commit/e8ba75305f519919ea5abf71c90b7f18edd529ee), under the MIT license (`app/LICENSE`).
