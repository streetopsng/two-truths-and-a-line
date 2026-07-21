import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('single player flow with mock bots', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/');
    
    // Check title
    await expect(page.getByText('2 Truths &')).toBeVisible();

    // 2. Click create game
    await page.getByRole('button', { name: 'Create a game' }).click();

    // 3. We are in the lobby, click write my statements
    await expect(page.getByText("You're in the Lobby")).toBeVisible();
    await page.getByRole('button', { name: 'Write my statements' }).click();

    // 4. Fill in statements
    await expect(page.getByText('Write your statements')).toBeVisible();
    
    // Fill textareas
    const textareas = page.locator('textarea');
    await expect(textareas).toHaveCount(3);
    await textareas.nth(0).fill('I am a statement 1');
    await textareas.nth(1).fill('I am a statement 2');
    await textareas.nth(2).fill('I am a statement 3');

    // Pick lie (Statement 2)
    const lieChecks = page.getByText('This is the lie');
    await lieChecks.nth(1).click();

    // Lock in
    await page.getByRole('button', { name: 'Lock in my statements' }).click();

    // Wait screen should appear after submission
    await expect(page.getByText("You're in.")).toBeVisible();

    // Click back to lobby to see the Start Game button
    await page.getByRole('button', { name: '← Back to lobby' }).click();

    // In mock mode, bots auto-submit so we instantly see "✓ Statements submitted" in Lobby
    await expect(page.getByRole('button', { name: '✓ Statements submitted' })).toBeVisible();

    // 5. Start game
    await page.getByRole('button', { name: 'Start game' }).click();

    // 6. Verify Question Screen starts
    // Either it's our turn or a bot's turn. 
    // The screen says either "Which one is the lie?" or "It's your round!"
    const questionText = page.getByText(/Which one is the lie\?|It's your round!/);
    await expect(questionText).toBeVisible({ timeout: 10000 });

    // For full automated flow, we could script answering, but since order is random,
    // we would need conditionals. For a basic test, verifying we reached the question screen is sufficient.
    // Let's check that the timer is counting down or the round indicator is visible.
    await expect(page.getByText(/Round 1 of/).first()).toBeVisible();
    
    // To ensure the game doesn't crash on reveal, let's wait a bit. 
    // The mock mode auto-votes for bots after 5 seconds.
    // If it's our turn, bots vote and we can't do anything until reveal.
    // If it's a bot's turn, we must vote to trigger reveal early, or wait 30s.
    
    // We'll just verify the test reaches the question screen successfully for now.
  });
});
