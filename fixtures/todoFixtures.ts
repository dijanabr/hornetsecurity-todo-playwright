import { test as base, Page, expect } from '@playwright/test';
import TodoPage from '../pages/todoPage';
import testData from '../data/todos.json';
import ui from '../data/ui.json';
import knownIssues from '../data/knownIssues.json';

const STORAGE_KEY = 'todos-vanillajs';

export type TodoSeed = { title: string; completed: boolean };
export type StoredTodo = TodoSeed & { id: number };
export type SeedList = keyof typeof testData.lists | 'none';

export type TodoStorage = {
    read: () => Promise<StoredTodo[]>;
    clearAndReload: () => Promise<void>;
};

type Options = {
    seedList: SeedList;
};

type Fixtures = {
    todoPage: TodoPage;
    todoStorage: TodoStorage;
};

async function seedTodos(page: Page, todos: TodoSeed[]) {
    const stored: StoredTodo[] = todos.map((todo, index) => ({ ...todo, id: 1000 + index }));
    await page.addInitScript(
        ({ key, value }) => {
            if (!window.sessionStorage.getItem('__seeded')) {
                window.localStorage.setItem(key, value);
                window.sessionStorage.setItem('__seeded', 'true');
            }
        },
        { key: STORAGE_KEY, value: JSON.stringify(stored) },
    );
}

export const test = base.extend<Options & Fixtures>({
    seedList: ['mixed', { option: true }],

    todoPage: async ({ page, seedList }, use) => {
        if (seedList !== 'none') {
            await seedTodos(page, testData.lists[seedList]);
        }
        const todoPage = new TodoPage(page);
        await todoPage.open();
        await use(todoPage);
    },

    todoStorage: async ({ page }, use) => {
        await use({
            read: async () =>
                page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '[]'), STORAGE_KEY),
            clearAndReload: async () => {
                await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);
                await page.reload();
            },
        });
    },
});

export { expect, testData, ui, knownIssues };
