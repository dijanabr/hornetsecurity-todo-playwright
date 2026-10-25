import { test, expect, testData, knownIssues } from '../fixtures/todoFixtures';

test.use({ screenshot: 'on', video: 'on', trace: 'on' });

// Expected to fail while the linked bug is open (see README → Known defects).
test.describe('Known issues', { tag: '@known-issue' }, () => {
    test.describe('when storage is empty', () => {
        test.use({ seedList: 'none' });

        test.fail('toggling the second default todo changes only that todo',
            {
                annotation: [
                    { type: 'issue', description: knownIssues.duplicateIds },
                    { type: 'bug', description: 'Toggling the second default todo changes the first one' },
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
                    { type: 'bug', description: 'Deleted default todos reappear after reload' },
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
                { type: 'bug', description: 'Unknown route shows an empty list and a Console error' },
            ],
        },
        async ({ todoPage, page }) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto('/todo#/unknown');
            await todoPage.reloadPage();
            await expect(todoPage.todoItems).toHaveCount(testData.lists.mixed.length);
            expect(errors).toEqual([]);
        },
    );

    test.fail('a wrongly-cased route keeps the filter navigation working',
        {
            annotation: [
                { type: 'issue', description: knownIssues.unvalidatedRoute },
                { type: 'bug', description: 'Wrongly-cased route breaks the filter highlight' },
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
