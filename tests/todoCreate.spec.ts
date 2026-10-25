import { test, expect, testData } from '../fixtures/todoFixtures';

const { input } = testData;

test.use({ seedList: 'single' });

test('adds a new todo with Enter and clears the input', { tag: '@smoke' }, async ({ todoPage }) => {
    await todoPage.addTodo(input.newTitle);
    await expect(todoPage.todoLabels).toHaveText(['Buy groceries', input.newTitle]);
    await expect(todoPage.newTodoInput).toHaveValue('');
    await expect(todoPage.itemCounter).toHaveText('2 items left');
});

test('saves the new todo as active in storage', async ({ todoPage, todoStorage }) => {
    await todoPage.addTodo(input.newTitle);
    const stored = await todoStorage.read();
    expect(stored).toHaveLength(2);
    expect(stored[1]).toMatchObject({ title: input.newTitle, completed: false });
});

test('appends several todos in the order they were entered', async ({ todoPage }) => {
    await todoPage.addTodos([input.newTitle, input.secondTitle]);
    await expect(todoPage.todoLabels).toHaveText(['Buy groceries', input.newTitle, input.secondTitle]);
});

test('trims leading and trailing spaces', async ({ todoPage, todoStorage }) => {
    await todoPage.addTodo(input.titleWithSpaces);
    await expect(todoPage.todoLabels.last()).toHaveText(input.titleWithSpaces.trim());
    expect((await todoStorage.read())[1].title).toBe(input.titleWithSpaces.trim());
});

test('ignores empty and whitespace-only input', async ({ todoPage, todoStorage }) => {
    await todoPage.addTodo('');
    await todoPage.addTodo(input.whitespaceOnly);
    await expect(todoPage.todoItems).toHaveCount(1);
    expect(await todoStorage.read()).toHaveLength(1);
});

test('keeps special characters and non-Latin letters as entered', async ({ todoPage }) => {
    await todoPage.addTodo(input.specialCharacters);
    await expect(todoPage.item(input.specialCharacters)).toBeVisible();
});
