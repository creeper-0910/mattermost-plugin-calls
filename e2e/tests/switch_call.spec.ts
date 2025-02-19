import {test, expect, chromium} from '@playwright/test';

import PlaywrightDevPage from '../page';
import {userState} from '../constants';
import {getUserIdxForTest} from '../utils';

const userIdx = getUserIdxForTest();

test.beforeEach(async ({page, context}) => {
    const devPage = new PlaywrightDevPage(page);
    await devPage.goto();
});

test.describe('switch call', () => {
    test.use({storageState: userState.users[userIdx].storageStatePath});

    test('exit modal - cancel button', async ({page}) => {
        const devPage = new PlaywrightDevPage(page);
        await devPage.startCall();

        await page.locator(`#sidebarItem_calls${userIdx + 1}`).click();

        const startCallButton = page.locator('[aria-label="channel header region"] button:has-text("Start call")');
        await expect(startCallButton).toBeVisible();
        await startCallButton.click();
        await expect(page.locator('#calls-switch-call-modal')).toBeVisible();

        await page.locator('button.switch-call-modal-cancel').click();
        await expect(page.locator('#calls-switch-call-modal')).toBeHidden();

        await devPage.leaveCall();
    });

    test('exit modal - close icon', async ({page}) => {
        const devPage = new PlaywrightDevPage(page);
        await devPage.startCall();

        await page.locator(`#sidebarItem_calls${userIdx + 1}`).click();

        const startCallButton = page.locator('[aria-label="channel header region"] button:has-text("Start call")');
        await expect(startCallButton).toBeVisible();
        await startCallButton.click();
        await expect(page.locator('#calls-switch-call-modal')).toBeVisible();

        await page.locator('button.switch-call-modal-close').click();
        await expect(page.locator('#calls-switch-call-modal')).toBeHidden();

        await devPage.leaveCall();
    });

    test('exit modal - esc key', async ({page}) => {
        const devPage = new PlaywrightDevPage(page);
        await devPage.startCall();

        await page.locator(`#sidebarItem_calls${userIdx + 1}`).click();

        const startCallButton = page.locator('[aria-label="channel header region"] button:has-text("Start call")');
        await expect(startCallButton).toBeVisible();
        await startCallButton.click();
        await expect(page.locator('#calls-switch-call-modal')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.locator('#calls-switch-call-modal')).toBeHidden();

        await devPage.leaveCall();
    });

    test('exit modal - click outside', async ({page}) => {
        const devPage = new PlaywrightDevPage(page);
        await devPage.startCall();

        await page.locator(`#sidebarItem_calls${userIdx + 1}`).click();

        const startCallButton = page.locator('[aria-label="channel header region"] button:has-text("Start call")');
        await expect(startCallButton).toBeVisible();
        await startCallButton.click();
        await expect(page.locator('#calls-switch-call-modal')).toBeVisible();

        await page.mouse.click(0, 0);
        await expect(page.locator('#calls-switch-call-modal')).toBeHidden();

        await devPage.leaveCall();
    });

    test('join call', async ({page}) => {
        const devPage = new PlaywrightDevPage(page);
        await devPage.startCall();

        await page.locator(`#sidebarItem_calls${userIdx + 1}`).click();

        const startCallButton = page.locator('[aria-label="channel header region"] button:has-text("Start call")');
        await expect(startCallButton).toBeVisible();
        await startCallButton.click();
        await expect(page.locator('#calls-switch-call-modal')).toBeVisible();

        await page.locator('button.switch-call-modal-join').click();
        await expect(page.locator('#calls-switch-call-modal')).toBeHidden();

        await devPage.leaveCall();
    });
});
