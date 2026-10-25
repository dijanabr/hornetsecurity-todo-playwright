import { Locator, Page } from '@playwright/test';

export default class BasePage {
    public page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    public async navigateTo(url: string) {
        await this.page.goto(url);
    }

    public async reloadPage() {
        await this.page.reload();
    }

    public async clickElement(element: Locator) {
        await element.click();
    }

    public async fillValue(element: Locator, value: string) {
        await element.fill(value);
    }
}
