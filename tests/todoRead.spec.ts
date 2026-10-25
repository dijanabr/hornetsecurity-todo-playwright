import { test, expect, testData, ui } from '../fixtures/todoFixtures';

const { lists } = testData;

test.describe('Page elements', () => {
    test('shows all main elements of the app', { tag: '@smoke' }, async ({ todoPage }) => {
        await expect(todoPage.heading).toBeVisible();
        await expect(todoPage.newTodoInput).toBeVisible();
        await expect(todoPage.newTodoInput).toHaveAttribute('placeholder', ui.placeholder);
        await expect(todoPage.toggleAllCheckbox).toBeAttached();
        await expect(todoPage.todoList).toBeVisible();
        await expect(todoPage.itemCounter).toBeVisible();
        for (const name of ui.filters) {
            await expect(todoPage.filterLink(name as 'All')).toBeVisible();
        }
        await expect(todoPage.clearCompletedButton).toBeVisible();
        await expect(todoPage.editHint).toBeVisible();
    });

    test('focuses the new todo input on load', async ({ todoPage }) => {
        await expect(todoPage.newTodoInput).toBeFocused();
    });

    test('marks "All" as the selected filter by default', async ({ todoPage }) => {
        await expect(todoPage.filterLink('All')).toHaveClass('selected');
    });
});

test.describe('Read todos', () => {
    test('renders the stored todos with their completed state', { tag: '@smoke' }, async ({ todoPage }) => {
        await expect(todoPage.todoLabels).toHaveText(lists.mixed.map((todo) => todo.title));
        await expect(todoPage.item('Book dentist appointment')).toHaveClass(/completed/);
        await expect(todoPage.itemCheckbox('Book dentist appointment')).toBeChecked();
        await expect(todoPage.itemCheckbox('Buy groceries')).not.toBeChecked();
    });

    test('keeps todos and their state after a page reload', async ({ todoPage }) => {
        await todoPage.addTodo(testData.input.newTitle);
        await todoPage.toggleTodo('Buy groceries');
        await todoPage.reloadPage();
        await expect(todoPage.todoLabels).toHaveText([...lists.mixed.map((todo) => todo.title), testData.input.newTitle]);
        await expect(todoPage.itemCheckbox('Buy groceries')).toBeChecked();
    });

    test.describe('when storage is empty', () => {
        test.use({ seedList: 'none' });
        test('shows the two default todos', async ({ todoPage }) => {
            await expect(todoPage.todoLabels).toHaveText(testData.defaultTodos);
            await expect(todoPage.itemCounter).toHaveText('2 items left');
        });
    });
});

test.describe('Item counter', () => {
    test.use({ seedList: 'allActive' });

    test('uses correctly how items are counted', async ({ todoPage }) => {
        await expect(todoPage.itemCounter).toHaveText('2 items left');
        await todoPage.toggleTodo('Buy groceries');
        await expect(todoPage.itemCounter).toHaveText('1 item left');
        await todoPage.toggleTodo('Prepare QA report');
        await expect(todoPage.itemCounter).toHaveText('0 items left');
    });
});

test.describe('All todos completed', () => {
    test.use({ seedList: 'allCompleted' });

    test('shows every todo as completed and checks "Mark all as complete" on load', async ({ todoPage }) => {
        await expect(todoPage.toggleAllCheckbox).toBeChecked();
        await expect(todoPage.itemCounter).toHaveText('0 items left');
        await expect(todoPage.clearCompletedButton).toBeVisible();
        await todoPage.filterBy('Active');
        await expect(todoPage.todoItems).toHaveCount(0);
    });
});

test.describe('Filters', () => {
    test('"Active" shows only active todos', async ({ todoPage, page }) => {
        await todoPage.filterBy('Active');
        await expect(page).toHaveURL(/#\/active$/);
        await expect(todoPage.filterLink('Active')).toHaveClass('selected');
        await expect(todoPage.todoLabels).toHaveText(['Buy groceries', 'Prepare QA report']);
    });

    test('"Completed" shows only completed todos', async ({ todoPage, page }) => {
        await todoPage.filterBy('Completed');
        await expect(page).toHaveURL(/#\/completed$/);
        await expect(todoPage.todoLabels).toHaveText(['Book dentist appointment']);
    });

    test('"All" shows every todo again', async ({ todoPage }) => {
        await todoPage.filterBy('Completed');
        await todoPage.filterBy('All');
        await expect(todoPage.todoItems).toHaveCount(lists.mixed.length);
    });

    test('a completed todo disappears from the "Active" view', async ({ todoPage }) => {
        await todoPage.filterBy('Active');
        await todoPage.toggleTodo('Buy groceries');
        await expect(todoPage.todoLabels).toHaveText(['Prepare QA report']);
    });

    test('opening a filter URL directly applies the filter', async ({ todoPage, page }) => {
        await page.goto('/todo#/completed');
        await expect(todoPage.filterLink('Completed')).toHaveClass('selected');
        await expect(todoPage.todoLabels).toHaveText(['Book dentist appointment']);
    });

    test('the browser "Back" button returns to the previous filter', async ({ todoPage, page }) => {
        await todoPage.filterBy('Active');
        await todoPage.filterBy('Completed');
        await page.goBack();
        await expect(todoPage.filterLink('Active')).toHaveClass('selected');
        await expect(todoPage.todoItems).toHaveCount(2);
    });
});
