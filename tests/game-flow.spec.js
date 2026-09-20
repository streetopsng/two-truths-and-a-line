import { test, expect } from '@playwright/test';

test.describe('Host Spectator Flow', () => {
  test('host sets the game up and spectates while bots play', async ({ page }) => {
    // 1. Home
    await page.goto('/');
    await expect(page.getByText('2 Truths &')).toBeVisible();

    // 2. Create a game — the host never gets a "write statements" step
    await page.getByRole('button', { name: 'Create a game' }).click();
    await expect(page.getByText("You're hosting")).toBeVisible();
    await expect(page.getByRole('button', { name: /Write my statements/i })).toHaveCount(0);

    // 3. Mock bots are pre-submitted, so the host can start immediately
    const startButton = page.getByRole('button', { name: 'Start game' });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // 4. Question round — the host spectates: live scoreboard is visible and
    //    every statement card is disabled (hosts don't vote)
    await expect(page.getByText(/Round 1 of/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Live scores')).toBeVisible();
    const statementCards = page.locator('button', { hasText: 'Statement' });
    await expect(statementCards).toHaveCount(3);
    await expect(statementCards.first()).toBeDisabled();

    // 5. Bots vote after ~5s, which triggers the host-side reveal
    await expect(page.getByText('THE LIE', { exact: true })).toBeVisible({ timeout: 15000 });

    // 6. Reveal leads to the reaction screen; the host skips the bot's reaction
    await expect(page.getByText(/Waiting for .*'s reaction/)).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Skip waiting (Host)' }).click();

    // 7. Host controls the flow between rounds
    await expect(page.getByText(/That was/)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Next round →' }).click();
    await expect(page.getByText(/Round 2 of/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Live scores')).toBeVisible();
  });
});

