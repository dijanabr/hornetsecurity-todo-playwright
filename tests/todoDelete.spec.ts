import { test, expect } from '../fixtures/todoFixtures';

test.describe('Delete todo items', () => {
    test('delete button removes a todo list item', { tag: '@smoke' }, async ({ todoPage, todoStorage }) => {
        await todoPage.deleteTodo('Prepare QA report');

        await expect(todoPage.todoLabels).toHaveText(['Buy groceries', 'Book dentist appointment']);
        await expect(todoPage.itemCounter).toHaveText('1 item left');
        expect((await todoStorage.read()).map((todo) => todo.title)).not.toContain('Prepare QA report');
    });

    test('delete button shows only on hover', async ({ todoPage }) => {
        await expect(todoPage.itemDeleteButton('Buy groceries')).toBeHidden();

        await todoPage.item('Buy groceries').hover();

        await expect(todoPage.itemDeleteButton('Buy groceries')).toBeVisible();
    });

    test.describe('with a single todo', () => {
        test.use({ seedList: 'single' });

        test('delete button hides the list and footer after the last todo is deleted', async ({ todoPage }) => {
            await todoPage.deleteTodo('Buy groceries');

            await expect(todoPage.todoItems).toHaveCount(0);
            await expect(todoPage.footer).toBeHidden();
            await expect(todoPage.toggleAllCheckbox).toBeHidden();
        });
    });
});

test.describe('Clear completed todo items', () => {
    test('the "Clear completed" button removes only the completed todos', { tag: '@smoke' }, async ({ todoPage, todoStorage }) => {
        await todoPage.clearCompleted();

        await expect(todoPage.todoLabels).toHaveText(['Buy groceries', 'Prepare QA report']);
        expect((await todoStorage.read()).every((todo) => !todo.completed)).toBe(true);
    });

    test('the "Clear completed" button is hidden when all completed todos are cleared', async ({ todoPage }) => {
        await todoPage.clearCompleted();

        await expect(todoPage.clearCompletedButton).toBeHidden();
    });

    test.describe('with no completed todos', () => {
        test.use({ seedList: 'allActive' });

        test('the "Clear completed" button is hidden when nothing is completed', async ({ todoPage }) => {
            await expect(todoPage.clearCompletedButton).toBeHidden();
        });
    });
});
