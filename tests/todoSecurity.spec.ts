import { test, expect, testData } from '../fixtures/todoFixtures';

const payload = testData.input.xssPayload;

test.describe('HTML input is shown as text', () => {

    test('when a todo is created', async ({ todoPage, page }) => {
        await todoPage.addTodo(payload);
        await expect(todoPage.item(payload)).toBeVisible();
        await expect(todoPage.todoList.locator('img')).toHaveCount(0);
        expect(await page.evaluate(() => (window as Window & { __xss?: boolean }).__xss)).toBeUndefined();
    });

    test('when a todo is edited and after reload', async ({ todoPage, page }) => {
        await todoPage.editTodo('Buy groceries', payload);
        await todoPage.reloadPage();
        await expect(todoPage.item(payload)).toBeVisible();
        await expect(todoPage.todoList.locator('img')).toHaveCount(0);
        expect(await page.evaluate(() => (window as Window & { __xss?: boolean }).__xss)).toBeUndefined();
    });
});
