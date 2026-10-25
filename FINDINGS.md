# Quality Findings – ToDo App

Findings from exploratory testing and test automation of the ToDo application (`/todo`).
Expected behaviour is based on the [TodoMVC app specification](https://github.com/tastejs/todomvc/blob/master/app-spec.md), since the app is a declared fork of TodoMVC and no other requirements were provided.

**Environment:** app served locally from `app/` (`npm run start:app`, http://localhost:8080/todo); Chrome, Firefox, WebKit (Playwright) and Chrome on Windows.

## Summary

| # | Finding | Type | Severity | Priority (proposed) | Issue | Automated test |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Duplicate todo IDs make actions on one todo change another | Defect | High | High | [#1](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/1) | `knownIssues.spec.ts` |
| 2 | Unvalidated route in the URL hash breaks the view and filter navigation | Defect | Medium | Medium | [#2](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/2) | `knownIssues.spec.ts` |
| 3 | Deleted default todos reappear after reload | Defect | Medium | Low–Medium | [#3](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/3) | `knownIssues.spec.ts` |
| 4 | No maximum length on todo text breaks the list layout | Defect | Medium | Low | – | – |
| 5 | New todo is created on blur, not only on Enter | Unclear behaviour | – | – | – | – |
| 6 | Missing test hooks (`data-test`) | Testability | – | – | – | – |
| 7 | Todo checkboxes have no accessible name | Accessibility / testability | Low | – | – | – |
| 8 | Delete button visible only on hover | Accessibility / UX | Low | – | – | – |
| 9 | Non-deterministic default data | Testability | – | – | – | – |
| ✔ | HTML / script input is escaped correctly | Verified OK | – | – | – | `todoSecurity.spec.ts` |

Severity = impact on the user. Priority = proposed order of fixing; the final decision is the product owner's.

---

## 1. Duplicate todo IDs make actions on one todo change another

**Type:** Defect · **Severity:** High · **Priority:** High

**Summary.** Todo IDs are generated with `new Date().getTime()`. Todos created in the same millisecond get the same ID. The app then always finds the *first* todo with that ID, so toggling or deleting the second todo changes the first one, and the second todo can no longer be changed.

**Steps to reproduce**
1. Open http://localhost:8080/todo.
2. In DevTools → Console, run `localStorage.removeItem('todos-vanillajs'); location.reload()`.
3. In DevTools → Application → Local Storage, check `todos-vanillajs`. Repeat step 2 until both default todos have the same `id` (about every second attempt).
4. Click the checkbox of **"Walk the dog"**.
5. Click the delete button (✕) of **"Walk the dog"**.

**Deterministic reproduction** (DevTools Console – two todos in the same millisecond):
```js
const i = document.querySelector('.new-todo');
['Buy milk', 'Call mom'].forEach(t => { i.value = t; i.dispatchEvent(new Event('change')) });
```
Then click the checkbox of "Call mom".

**Expected:** only "Walk the dog" is completed (step 4) / deleted (step 5).
**Actual:** "Pay electric bill" is completed (step 4) / deleted (step 5); "Walk the dog" is unchanged.

**Frequency:** about 50% of fresh loads for the default todos; 100% for any two todos created in the same millisecond.

**Impact:** the user changes or deletes the wrong todo (data loss) and cannot change the affected todo at all. The app's own start-up code triggers it, so it happens to real users on first visit.

**Root cause:** `app/assets/js/todo/store.js` – `Store.prototype.save()` sets `updateData.id = new Date().getTime()`. `find`, `save(id)` and `remove` stop at the first match, and `view.js` uses `querySelector('[data-id="…"]')`, which also returns the first element.

**Suggested fix:** generate unique IDs (e.g. `crypto.randomUUID()` or an incrementing counter stored with the list).

**Automated test:** `tests/knownIssues.spec.ts` – *"toggling the second default todo changes only that todo"*. The test freezes the browser clock (`page.clock.setFixedTime`) so both default todos always get the same ID, which makes the intermittent defect reproducible on every run.

---

## 2. Unvalidated route in the URL hash breaks the view and filter navigation

**Type:** Defect · **Severity:** Medium · **Priority:** Medium

**Summary.** Only `#/`, `#/active` and `#/completed` are handled. Any other hash is used directly as a function name and as a CSS selector, without validation or a fallback to "All".

**Steps to reproduce**

*A – unknown route*
1. Open http://localhost:8080/todo#/foo and press F5.
2. Open DevTools → Console.

*B – wrongly-cased route*
1. Open http://localhost:8080/todo#/Active and press Enter.
2. Click the **Completed** filter link in the footer, then **All**.

**Expected:** an unknown route falls back to "All"; route names are case-insensitive or fall back; no errors; filter links keep working.
**Actual:**
- A: empty list (todos are still in `localStorage`); `TypeError: this[activeRoute] is not a function` at `controller.js:264`.
- B: the list is filtered but no filter link is highlighted; `TypeError: Cannot set properties of null (setting 'className')` at `view.js:52`. After that, **every** click on a valid filter link throws at `view.js:51`, and the highlight stays broken until the page is reloaded.

**Impact:** a bookmarked or mistyped link shows an empty app (the user may think the data is lost), and one bad route breaks the filter navigation for the rest of the session.

**Root cause:** `controller.js` – `_filter()` calls `this['show' + route]()` for any route; `view.js` – `_setFilter()` assumes a link for the route always exists.

**Suggested fix:** validate the route against the known values and fall back to `''` (All).

**Automated tests:** `tests/knownIssues.spec.ts` – *"an unknown route falls back to "All" without errors"*, *"a wrongly-cased route keeps the filter navigation working"*.

---

## 3. Deleted default todos reappear after reload

**Type:** Defect · **Severity:** Medium · **Priority:** Low–Medium

**Summary.** On every load, if the stored list is empty, the app adds the two default todos again. A user who deletes all todos cannot keep an empty list.

**Steps to reproduce**
1. Open http://localhost:8080/todo.
2. Delete all todos (with ✕ or with **Clear completed**).
3. Press F5.

**Expected:** the list stays empty.
**Actual:** "Pay electric bill" and "Walk the dog" appear again.

**Impact:** the user's explicit action is silently undone; deleted data comes back.

**Root cause:** `app/assets/js/todo/app.js` – `init()` seeds when `!data.length` ("list is empty") instead of only on the first visit.

**Suggested fix:** seed only when the storage key does not exist yet (first visit), not when the list is empty.

**Automated test:** `tests/knownIssues.spec.ts` – *"deleted default todos stay deleted after reload"*.

---

## 4. No maximum length on todo text breaks the list layout

**Type:** Defect · **Severity:** Medium · **Priority:** Low

**Steps to reproduce**
1. Paste a very long text (e.g. 10,000 characters of lorem ipsum) into "What needs to be done?" and press Enter.

**Expected:** a maximum length is enforced, or long text is truncated / scrollable within the item.
**Actual:** the text is accepted; the item becomes extremely tall; the toggle icon is drawn only in the vertical middle of the item and the delete button is hard to find; the items below are pushed far out of view.

**Note on security:** no direct security impact today, because data is stored only in the user's own browser. Very long entries can fill the `localStorage` quota (about 5 MB), after which new todos are silently not saved. A limit must also be enforced server-side if a backend is added.

---

## 5. New todo is created on blur, not only on Enter

**Type:** Unclear behaviour – question for the product owner

Typing text in "What needs to be done?" and clicking anywhere else creates the todo (the input listens to the `change` event). The TodoMVC spec says pressing Enter creates the todo; it does not mention blur. This may create accidental todos.

**Question:** is creating on blur intended? If not, create only on Enter.

---

## 6. Missing test hooks

**Type:** Testability

Only the new-todo input has a `data-test` attribute. The todo list, items, counter and footer must be located by CSS classes, so a styling refactor can break tests although the functionality works.

**Suggestion:** add `data-test` attributes to all interactive elements and key containers.

---

## 7. Todo checkboxes have no accessible name

**Type:** Accessibility / testability · **Severity:** Low

The checkbox of each todo (`<input class="toggle">`) has no label or `aria-label`, and it is visually hidden (`opacity: 0`). Screen readers announce only "checkbox" without saying which todo it belongs to, and tests cannot use `getByRole('checkbox', { name })`. The "Mark all as complete" checkbox, by contrast, has a proper `<label>`.

**Suggestion:** give each checkbox an accessible name, e.g. `aria-label="Mark <title> as complete"`.

---

## 8. Delete button visible only on hover

**Type:** Accessibility / UX · **Severity:** Low

The delete button (✕) is hidden until the item is hovered. On touch devices the first tap reveals it, which is hard to discover. Keyboard users cannot see it either. This follows the original TodoMVC design, so it is reported as a UX observation, not a defect.

---

## 9. Non-deterministic default data

**Type:** Testability

The default todos are added on load with time-based IDs (see finding 1), so the start state differs between runs. Tests that rely on the default data would be flaky. The suite therefore writes its own data into `localStorage` before the app loads.

---

## ✔ Verified: HTML / script input is escaped correctly

Inputs such as `<img src=x onerror=alert(1)>`, `<script>…</script>` and `<b>bold</b>` are shown as plain text on create, after editing and after reload; no script runs and no HTML element is created. Covered by `tests/todoSecurity.spec.ts` as a regression guard, because the app renders titles with string templates (in two different code paths), where a future change could open an injection.
