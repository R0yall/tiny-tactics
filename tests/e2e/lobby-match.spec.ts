import { test, expect } from '@playwright/test';

test('Two players create lobby, ready up, and start match in real-time', async ({ browser }) => {
  // Context 1: Alice (Host)
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await page1.goto('http://localhost:3000');

  // Fill in Alice's name and create lobby
  const nameInput1 = page1.locator('input[placeholder="Enter your name"]');
  await nameInput1.fill('Alice');
  await page1.click('button:has-text("Create New Lobby")');

  // Wait for lobby code
  const codeLocator = page1.locator('span.font-mono.font-black.tracking-widest.text-amber-400');
  await expect(codeLocator).toBeVisible({ timeout: 10000 });
  const roomCode = (await codeLocator.textContent())?.trim();
  expect(roomCode).toBeTruthy();

  // Context 2: Bob (Guest)
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await page2.goto('http://localhost:3000');

  const nameInput2 = page2.locator('input[placeholder="Enter your name"]');
  await nameInput2.fill('Bob');

  const joinInput = page2.locator('input[placeholder="ROOM CODE"]');
  await joinInput.fill(roomCode!);
  await page2.click('button:has-text("Join Code")');

  // Verify both players see each other in the lobby
  await expect(page1.locator('text=Bob')).toBeVisible({ timeout: 5000 });
  await expect(page2.locator('text=Alice')).toBeVisible({ timeout: 5000 });

  // Bob readies up
  await page2.click('button:has-text("Ready Up")');
  await expect(page2.locator('button:has-text("Ready (Click to unready)")')).toBeVisible();

  // Alice starts the match
  const startButton = page1.locator('button:has-text("Start Match")');
  await expect(startButton).toBeEnabled({ timeout: 5000 });
  await startButton.click();

  // Both players transition to active game
  await expect(page1.locator('text=PREPARATION')).toBeVisible({ timeout: 10000 });
  await expect(page2.locator('text=PREPARATION')).toBeVisible({ timeout: 10000 });

  // Both see Round #1
  await expect(page1.locator('text=#1')).toBeVisible();
  await expect(page2.locator('text=#1')).toBeVisible();

  await context1.close();
  await context2.close();
});
