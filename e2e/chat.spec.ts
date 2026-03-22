import { expect, test } from "@playwright/test";

test("should complete the full chat room happy path", async ({ browser }) => {
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  // Step 1: Navigate to / — Create Room form is visible
  await page1.goto("/");
  await expect(page1.getByLabel("Room name")).toBeVisible();
  await expect(page1.getByLabel("Your name")).toBeVisible();

  // Step 2: Fill roomName and displayName, submit → redirect to /r/<id>
  await page1.getByLabel("Room name").fill("Test Room");
  await page1.getByLabel("Your name").fill("Alice");
  await page1.getByRole("button", { name: "Create a Room" }).click();

  await page1.waitForURL(/\/r\/.+/);
  const roomUrl = page1.url();

  // Step 3: Room header shows the correct room name
  await expect(page1.getByRole("heading", { level: 1 })).toContainText(
    "Test Room",
  );

  // Step 4: Send a plain text message → TextMessage component renders
  await page1.getByPlaceholder("Send anything...").fill("Hello world");
  await page1.getByRole("button", { name: "Send" }).click();
  await expect(page1.getByText("Hello world")).toBeVisible();

  // Step 5: Send a GitHub URL → RepoCard component renders (AI-classified)
  await page1
    .getByPlaceholder("Send anything...")
    .fill("https://github.com/vercel/next.js");
  await page1.getByRole("button", { name: "Send" }).click();
  await expect(page1.getByText(/vercel\/next\.js/i)).toBeVisible({
    timeout: 15_000,
  });

  // Step 6: Open a second browser context at the same URL → displayName prompt shown
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  await page2.goto(roomUrl);
  await expect(page2.getByText("Join the room")).toBeVisible();

  // Step 7: Second context enters display name and joins → first context sees updated participant list
  await page2.getByLabel("Your name").fill("Bob");
  await page2.getByRole("button", { name: "Enter Room" }).click();
  await expect(
    page1.getByRole("listitem").filter({ hasText: "Bob" }),
  ).toBeVisible({ timeout: 10_000 });

  // Step 8: Second context sends a message → first context receives and renders it
  await page2.getByPlaceholder("Send anything...").fill("Hi from Bob");
  await page2.getByRole("button", { name: "Send" }).click();
  await expect(page1.getByText("Hi from Bob")).toBeVisible({
    timeout: 10_000,
  });

  // Step 9: Second context clicks Exit Room → first context sees the participant leave
  await page2.getByRole("button", { name: "Exit Room" }).click();
  await expect(page2).toHaveURL("/");
  await expect(
    page1.getByRole("listitem").filter({ hasText: "Bob" }),
  ).not.toBeVisible({ timeout: 10_000 });

  // Step 10: First context clicks Exit Room → navigating back to /r/<id> redirects to /
  await page1.getByRole("button", { name: "Exit Room" }).click();
  await expect(page1).toHaveURL("/");
  await page1.goto(roomUrl);
  await expect(page1).toHaveURL("/");

  await context1.close();
  await context2.close();
});
