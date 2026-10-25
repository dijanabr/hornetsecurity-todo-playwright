import { test, expect, testData, knownIssues } from '../fixtures/todoFixtures';

// Each test is expected to fail while its bug is open. Once the bug is fixed the run reports
// "Expected to fail, but passed" - then change `test.fail(` to `test(` and move it to the regular suite.
test.describe('Known issues', { tag: '@known-issue' }, () => {
    test.describe('when storage is empty', () => {
        test.use({ seedList: 'none' });

        test.fail('toggling the second default todo changes only that todo',
            {
                annotation: [
                    { type: 'issue', description: knownIssues.duplicateIds },
                    { type: 'bug', description: 'Duplicate ids: todos created in the same millisecond share an id' },
                ],
            },
            async ({ todoPage, page, todoStorage }) => {
                // Freeze time so both default todos get the same id - makes the intermittent bug reproducible.
                await page.clock.setFixedTime(new Date('2026-10-25T10:00:00Z'));
                await todoStorage.clearAndReload();

                await todoPage.toggleTodo('Walk the dog');

                await expect(todoPage.itemCheckbox('Walk the dog')).toBeChecked();
                await expect(todoPage.itemCheckbox('Pay electric bill')).not.toBeChecked();
            },
        );

        test.fail('deleted default todos stay deleted after reload',
            {
                annotation: [
                    { type: 'issue', description: knownIssues.defaultTodosReappear },
                    { type: 'bug', description: 'The app re-seeds the default todos whenever the list is empty' },
                ],
            },
            async ({ todoPage }) => {
                for (const title of testData.defaultTodos) {
                    await todoPage.deleteTodo(title);
                }
                await todoPage.reloadPage();

                await expect(todoPage.todoItems).toHaveCount(0);
            },
        );
    });

    test.fail('an unknown route falls back to "All" without errors',
        {
            annotation: [
                { type: 'issue', description: knownIssues.unvalidatedRoute },
                { type: 'bug', description: 'Unvalidated route in URL hash throws TypeError' },
            ],
        },
        async ({ todoPage, page }) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(error.message));

            await page.goto('/todo#/unknown');

            await expect(todoPage.todoItems).toHaveCount(testData.lists.mixed.length);
            expect(errors).toEqual([]);
        },
    );

    test.fail('a wrongly-cased route keeps the filter navigation working',
        {
            annotation: [
                { type: 'issue', description: knownIssues.unvalidatedRoute },
                { type: 'bug', description: 'Route "#/Active" throws in view.js and breaks the filter highlight' },
            ],
        },
        async ({ todoPage, page }) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(error.message));

            await page.goto('/todo#/Active');
            await todoPage.filterBy('Completed');

            await expect(todoPage.filterLink('Completed')).toHaveClass('selected');
            expect(errors).toEqual([]);
        },
    );
});
