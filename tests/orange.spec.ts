import { expect, test } from '@playwright/test';
import { Page } from '@playwright/test';
import { login } from '../helpers/auth';

/**
 * Referências oficiais das APIs usadas neste arquivo:
 * - Testes, fixtures e `page`: https://playwright.dev/docs/writing-tests
 * - Locators (`getByRole`, `getByText`, `locator` e `filter`): https://playwright.dev/docs/locators
 * - Ações (`click`, `fill`, `clear`, `reload`): https://playwright.dev/docs/input
 * - Navegação (`goto` e `waitForURL`): https://playwright.dev/docs/navigations
 * - Assertions (`toBeVisible`, `toHaveURL`, `toHaveValue`, `toHaveClass`): https://playwright.dev/docs/test-assertions
 */

test.describe('Login e autenticação do OrangeHRM', () => {
  test('Exibe corretamente a tela de login', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('Permite login válido e acesso ao dashboard', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Bloqueia credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill('usuario');
    await page.getByRole('textbox', { name: 'Password' }).fill('senha');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Valida os campos obrigatórios', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Required', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveClass(/oxd-input--error/);
    await expect(page.getByText('Required', { exact: true }).last()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toHaveClass(/oxd-input--error/);
  });

  test('Mantém a sessão após atualizar a página', async ({ page }) => {
    await login(page);
    await page.reload();

    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('Redireciona URL protegida para o login sem autenticação', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});

test.describe('Recuperação de senha do OrangeHRM', () => {
  test('Acessa a tela de recuperação de senha', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Forgot your password?').click();

    await expect(page).toHaveURL(/\/auth\/requestPasswordResetCode/);
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    await expect(page.locator('.orangehrm-forgot-password-card-note .oxd-text--p')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
  });

  test('Retorna à tela de login pelo botão Cancel', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/requestPasswordResetCode');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Valida o campo username obrigatório', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/requestPasswordResetCode');
    await page.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Required', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveClass(/oxd-input--error/);
  });
});

test.describe('PIM - Funcionários do OrangeHRM', () => {
  const employeeNameInput = (page: Page) =>
    page.locator('input[placeholder="Type for hints..."]').first();
  const employeeIdInput = (page: Page) =>
    page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).locator('input').first();

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'PIM' }).click();
    await page.waitForURL(/\/pim\/viewEmployeeList/);
  });

  test('Pesquisa funcionário por nome e ID', async ({ page }) => {
    const firstRow = page.locator('.oxd-table-body .oxd-table-row').first();
    const employeeId = await firstRow.locator('.oxd-table-cell').nth(1).innerText();
    await employeeIdInput(page).fill(employeeId);
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('.oxd-table-body')).toContainText(employeeId);

    await page.getByRole('button', { name: 'Reset' }).click();

    const employeeName = await firstRow.locator('.oxd-table-cell').nth(2).innerText();
    await employeeNameInput(page).fill(employeeName);
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('.oxd-table-body')).toContainText(employeeName);
  });

  test('Valida os campos obrigatórios do cadastro de funcionário', async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForURL(/\/pim\/addEmployee/);

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Required', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'First Name' })).toHaveClass(/oxd-input--error/);
    
    await expect(page.getByText('Required', { exact: true }).last()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Last Name' })).toHaveClass(/oxd-input--error/);
  });

  test('Cadastra funcionário e valida dados', async ({ page }) => {
    const firstName = `Name${Date.now()}`;
    const id = `${Date.now()}`.slice(-10);
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForURL(/\/pim\/addEmployee/);

    await page.getByRole('textbox', { name: 'First Name' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Last Name' }).fill('Playwright');
    await employeeIdInput(page).fill(id);

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Successfully Saved')).toBeVisible();
    await expect(page).toHaveURL(/\/pim\/viewPersonalDetails/);
    await expect(page.getByRole('textbox', { name: 'First Name' })).toHaveValue(firstName);
    await expect(page.getByRole('textbox', { name: 'Last Name' })).toHaveValue('Playwright');
    await expect(employeeIdInput(page)).toHaveValue(id);
  });

  test('Edita dados pessoais do funcionário', async ({ page }) => {
    await page.locator('.oxd-table-body .oxd-table-row').first().click();
    await page.waitForURL(/\/pim\/viewPersonalDetails/);

    const firstName = page.locator('.oxd-input-group').filter({ hasText: 'Employee Full Name' }).locator('input').first();
    await firstName.clear();
    await firstName.fill('Admin');
    await page.getByRole('button', { name: 'Save' }).first().click();

    await expect(page.getByText('Successfully Updated')).toBeVisible();
  });

  test('Confirma e cancela exclusão de funcionário', async ({ page }) => {
    const firstName = `Name${Date.now()}`;
    const id = `${Date.now()}`.slice(-10);

    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'First Name' }).fill(firstName);
    await page.getByRole('textbox', { name: 'Last Name' }).fill('Playwright');
    await employeeIdInput(page).fill(id);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();

    await page.getByRole('link', { name: 'Employee List' }).click();

    await employeeIdInput(page).fill(id);
    await page.getByRole('button', { name: 'Search' }).click();

    const employeeRow = page.locator('.oxd-table-body .oxd-table-row').first();
    await employeeRow.getByRole('button').last().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'No, Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    await employeeRow.getByRole('button').last().click();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();

    await expect(page.getByText('Successfully Deleted')).toBeVisible();
  });
});