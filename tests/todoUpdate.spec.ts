import { test, expect, testData } from '../fixtures/todoFixtures';

const { input, lists } = testData;

test.describe('Edit todo items', () => {
    test('saves the new title with Enter', { tag: '@smoke' }, async ({ todoPage, todoStorage }) => {
        await todoPage.editTodo('Buy groceries', input.editedTitle);

        await expect(todoPage.item(input.editedTitle)).toBeVisible();
        await expect(todoPage.item('Buy groceries')).toHaveCount(0);
        expect((await todoStorage.read())[0].title).toBe(input.editedTitle);
    });

    test('shows the current title in the edit field', async ({ todoPage }) => {
        const editInput = await todoPage.startEditing('Buy groceries');

        await expect(editInput).toBeFocused();
        await expect(editInput).toHaveValue('Buy groceries');
    });

    test('saves the new title when the field loses focus', async ({ todoPage }) => {
        const editInput = await todoPage.startEditing('Buy groceries');
        await editInput.fill(input.editedTitle);
        await todoPage.heading.click();

        await expect(todoPage.item(input.editedTitle)).toBeVisible();
    });

    test('discards changes with Escape', async ({ todoPage, todoStorage }) => {
        const editInput = await todoPage.startEditing('Buy groceries');
        await editInput.fill(input.editedTitle);
        await editInput.press('Escape');

        await expect(todoPage.item('Buy groceries')).toBeVisible();
        await expect(editInput).toHaveCount(0);
        expect((await todoStorage.read())[0].title).toBe('Buy groceries');
    });

    test('trims spaces from the edited title', async ({ todoPage }) => {
        await todoPage.editTodo('Buy groceries', `   ${input.editedTitle}   `);

        await expect(todoPage.todoLabels.first()).toHaveText(input.editedTitle);
    });

    test('deletes the todo when the title is cleared', async ({ todoPage }) => {
        await todoPage.editTodo('Buy groceries', '');

        await expect(todoPage.item('Buy groceries')).toHaveCount(0);
        await expect(todoPage.todoItems).toHaveCount(lists.mixed.length - 1);
    });
});

test.describe('Complete todo', () => {
    test('marks an active todo as completed', { tag: '@smoke' }, async ({ todoPage, todoStorage }) => {
        await todoPage.toggleTodo('Buy groceries');

        await expect(todoPage.item('Buy groceries')).toHaveClass(/completed/);
        await expect(todoPage.itemCheckbox('Buy groceries')).toBeChecked();
        await expect(todoPage.itemCounter).toHaveText('1 item left');
        expect((await todoStorage.read())[0].completed).toBe(true);
    });

    test('marks a completed todo as active again', async ({ todoPage }) => {
        await todoPage.toggleTodo('Book dentist appointment');

        await expect(todoPage.item('Book dentist appointment')).not.toHaveClass(/completed/);
        await expect(todoPage.itemCounter).toHaveText('3 items left');
    });
});

test.describe('Toggle all', () => {
    test('marks all todos as completed, and makes them active again', async ({ todoPage }) => {
        await todoPage.toggleAll();

        for (const todo of lists.mixed) {
            await expect(todoPage.itemCheckbox(todo.title)).toBeChecked();
        }
        await expect(todoPage.itemCounter).toHaveText('0 items left');

        await todoPage.toggleAll();

        for (const todo of lists.mixed) {
            await expect(todoPage.itemCheckbox(todo.title)).not.toBeChecked();
        }
        await expect(todoPage.itemCounter).toHaveText('3 items left');
    });

    test('is checked automatically when every todo is completed one by one', async ({ todoPage }) => {
        await expect(todoPage.toggleAllCheckbox).not.toBeChecked();

        await todoPage.toggleTodo('Buy groceries');
        await todoPage.toggleTodo('Prepare QA report');

        await expect(todoPage.toggleAllCheckbox).toBeChecked();
    });
});
