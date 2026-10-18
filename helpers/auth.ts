import { Page } from "@playwright/test";
import { CREDENTIALS } from "./constants";

export async function login(page:Page, user = CREDENTIALS.standard){
    await page.goto("/");

    await page.getByRole('textbox', { name: 'Username' }).fill(user.user);
    await page.getByRole('textbox', { name: 'Password' }).fill(user.pass);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/\/dashboard\/index/);
} 