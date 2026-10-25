# Quality Findings – ToDo App

Findings from exploratory testing of the ToDo app (`/todo`), served locally with `npm run start:app`.
No requirements were provided, so the [TodoMVC app specification](https://github.com/tastejs/todomvc/blob/master/app-spec.md) is used as the expected behaviour (the app is a fork of TodoMVC).

## Summary

| # | Finding | Type | Severity | Issue |
| --- | --- | --- | --- | --- |
| 1 | Duplicate todo IDs – toggling or deleting one todo changes another | Bug | High | [#1](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/1) |
| 2 | Unknown or wrongly-cased route in URL throws errors and breaks filter navigation | Bug | Medium | [#2](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/2) |
| 3 | Deleted default todos reappear after reload | Bug | Low | [#3](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/3) |
| 4 | No maximum length on todo text – very long text breaks the layout | Bug | Medium | – |
| 5 | New todo is created when the input loses focus, not only on Enter | Question for PO | – | – |
| 6 | Few stable locators (missing `data-test` attributes) | Testability | – | – |
| 7 | Default todos get time-based IDs, so the start state is not predictable | Testability | – | – |
| ✔ | HTML / script input is shown as text (no XSS) | Verified OK | – | – |

---

## Defects

### 1. Duplicate todo IDs – toggling or deleting one todo changes another
The two default todos sometimes get the same `id` in Local Storage. Then clicking the checkbox or ✕ of **"Walk the dog"** changes **"Pay electric bill"** instead, and "Walk the dog" can no longer be changed. Intermittent – reproduced on the second attempt of clearing storage and reloading.
Details, screenshots and videos: [#1](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/1).

### 2. Unknown or wrongly-cased route in URL throws errors
- `#/foo` + F5 → empty list (todos are still in Local Storage) and a `TypeError` in the Console.
- `#/Active`, `#/Completed`, `#/All` → the list is shown, but no filter is highlighted and the Console shows a `TypeError`. After that, every click on a filter link throws an error until the page is reloaded.

Details and screenshots: [#2](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/2).

### 3. Deleted default todos reappear after reload
Deleting all todos (with ✕ or **Clear completed**) and pressing F5 brings back "Pay electric bill" and "Walk the dog". The defaults look like intentional demo data, but bringing them back after the user deleted them is unexpected – to be confirmed with the product owner.
Details: [#3](https://github.com/dijanabr/hornetsecurity-todo-playwright/issues/3).

### 4. No maximum length on todo text
A text of 10,000+ characters (lorem ipsum) is accepted. The item becomes extremely tall: the checkbox and ✕ are only reachable in the middle of the item, and the items below are pushed out of view.
**Expected:** a maximum length, or long text kept readable within the item.

---

## Question for the product owner

### 5. New todo is created when the input loses focus, not only on Enter
Typing a text and clicking anywhere else on the page creates the todo. The TodoMVC spec says a todo is created with Enter. This can create todos by accident. **Is this intended?**

---

## Testability

### 6. Few stable locators
Only the "What needs to be done?" input has a `data-test` attribute. The list, items, counter and footer must be located with CSS classes, so a design change can break the tests even when the app works.

### 7. Unpredictable start state
On every first load the app adds two default todos, and their IDs depend on timing (see #1). Tests that rely on this data would be flaky, so the test suite writes its own todos into Local Storage before the app loads.

---

## Verified OK

HTML and script input (`<b>bold</b>`, `<img src=x onerror=alert(1)>`, `<script>…</script>`) is shown as plain text when a todo is created, edited and after reload – no script runs. Kept as a regression test (`tests/todoSecurity.spec.ts`), because this is important for a security product.
