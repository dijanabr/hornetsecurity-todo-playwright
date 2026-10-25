import { test, expect, testData } from '../fixtures/todoFixtures';

const { xssPayloads } = testData.input;

test.describe('HTML and script input is shown as text', () => {
    for (const payload of xssPayloads) {
        test(`when created: ${payload}`, async ({ todoPage, page }) => {
            await todoPage.addTodo(payload);

            await expect(todoPage.item(payload)).toBeVisible();
            await expect(todoPage.todoList.locator('img, script, b')).toHaveCount(0);
            expect(await page.evaluate(() => (window as Window & { __xss?: boolean }).__xss)).toBeUndefined();
        });
    }

    test('when edited and after reload', async ({ todoPage, page }) => {
        const payload = xssPayloads[0];

        await todoPage.editTodo('Buy groceries', payload);
        await expect(todoPage.item(payload)).toBeVisible();

        await todoPage.reloadPage();

        await expect(todoPage.item(payload)).toBeVisible();
        await expect(todoPage.todoList.locator('img')).toHaveCount(0);
        expect(await page.evaluate(() => (window as Window & { __xss?: boolean }).__xss)).toBeUndefined();
    });
});
