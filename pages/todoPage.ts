import type { Locator, Page } from '@playwright/test';
import BasePage from './basePage';
import ui from '../data/ui.json';

export type FilterName = 'All' | 'Active' | 'Completed';

export class TodoPage extends BasePage {
    public heading: Locator;
    public newTodoInput: Locator;
    public toggleAllCheckbox: Locator;
    public toggleAllArrow: Locator;
    public todoList: Locator;
    public todoItems: Locator;
    public todoLabels: Locator;
    public footer: Locator;
    public itemCounter: Locator;
    public clearCompletedButton: Locator;
    public editHint: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = page.getByRole('heading', { name: ui.heading });
        this.newTodoInput = page.getByTestId('new-todo');
        this.toggleAllCheckbox = page.getByLabel(ui.toggleAllLabel);
        this.toggleAllArrow = page.locator('label[for="toggle-all"]');
        this.todoList = page.locator('.todo-list');
        this.todoItems = this.todoList.getByRole('listitem');
        this.todoLabels = this.todoItems.locator('label');
        this.footer = page.locator('footer.footer');
        this.itemCounter = this.footer.locator('.todo-count');
        this.clearCompletedButton = page.getByRole('button', { name: ui.clearCompleted });
        this.editHint = page.getByText(ui.editHint);
    }

    public item(title: string): Locator {
        return this.todoItems.filter({ has: this.page.getByText(title, { exact: true }) });
    }

    public itemCheckbox(title: string): Locator {
        return this.item(title).getByRole('checkbox');
    }

    public itemDeleteButton(title: string): Locator {
        return this.item(title).getByRole('button');
    }

    public itemEditInput(title: string): Locator {
        return this.item(title).getByRole('textbox');
    }

    public filterLink(name: FilterName): Locator {
        return this.footer.getByRole('link', { name, exact: true });
    }

    // ---------- Actions ----------
    public async open() {
        await this.navigateTo('/todo');
    }

    public async addTodo(title: string) {
        await this.fillValue(this.newTodoInput, title);
        await this.newTodoInput.press('Enter');
    }

    public async addTodos(titles: string[]) {
        for (const title of titles) {
            await this.addTodo(title);
        }
    }

    public async toggleTodo(title: string) {
        await this.clickElement(this.itemCheckbox(title));
    }

    public async toggleAll() {
        await this.clickElement(this.toggleAllArrow);
    }

    public async deleteTodo(title: string) {
        await this.item(title).hover();
        await this.clickElement(this.itemDeleteButton(title));
    }

    public async startEditing(title: string): Promise<Locator> {
        await this.item(title).locator('label').dblclick();
        return this.itemEditInput(title);
    }

    public async editTodo(title: string, newTitle: string) {
        const editInput = await this.startEditing(title);
        await this.fillValue(editInput, newTitle);
        await editInput.press('Enter');
    }

    public async clearCompleted() {
        await this.clickElement(this.clearCompletedButton);
    }

    public async filterBy(name: FilterName) {
        await this.clickElement(this.filterLink(name));
    }

}
