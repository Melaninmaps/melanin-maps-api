#!/usr/bin/env node
import { chromium } from "playwright";

const baseUrl = (process.env.KINFOLK_PREVIEW_BASE_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});

const failures = [];
const labels = [];

function fail(label, detail) {
  failures.push(`${label}: ${detail}`);
}

async function createPage(path) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(`${baseUrl}/kinfolk-preview/${path}`, { waitUntil: "networkidle" });
  return page;
}

async function visibleInsidePhone(page, locator, label) {
  const result = await locator.evaluate((control) => {
    const app = control.closest(".app, .device-screen");
    if (!app) return { ok: false, reason: "no containing in-phone app surface" };
    const style = getComputedStyle(control);
    const rect = control.getBoundingClientRect();
    const appRect = app.getBoundingClientRect();
    const visible = style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0;
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    const centeredInside = rect.width > 0 && rect.height > 0
      && centerX >= appRect.left && centerX <= appRect.right
      && centerY >= appRect.top && centerY <= appRect.bottom;
    const viewportVisible = centerY >= 0 && centerY <= window.innerHeight;
    const hit = document.elementFromPoint(centerX, centerY);
    const receivesPointer = Boolean(hit && (hit === control || control.contains(hit)));
    return {
      ok: visible && centeredInside && viewportVisible && receivesPointer,
      reason: `visible=${visible}; centered=${centeredInside}; viewport=${viewportVisible}; pointer=${receivesPointer}; control=${Math.round(rect.left)},${Math.round(rect.top)}-${Math.round(rect.right)},${Math.round(rect.bottom)}; app=${Math.round(appRect.left)},${Math.round(appRect.top)}-${Math.round(appRect.right)},${Math.round(appRect.bottom)}`,
    };
  });
  if (!result.ok) fail(label, result.reason);
}

async function tapPhoneControl(page, locator, label) {
  const box = await locator.boundingBox();
  if (!box) {
    fail(label, "the continuation control has no tappable bounds");
    return;
  }
  await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
}

async function advanceStory(page, rootSelector, label) {
  const root = page.locator(rootSelector);
  await root.locator(".app, .device-screen").first().scrollIntoViewIfNeeded();
  let phoneScrollY = await page.evaluate(() => window.scrollY);
  const allScreens = await root.locator("[data-screen]").evaluateAll((screens) => screens.map((screen) => screen.dataset.screen));
  const visited = new Set();

  for (let hop = 0; hop <= allScreens.length; hop += 1) {
    const active = root.locator("[data-screen].active, [data-screen].is-active");
    const key = await active.getAttribute("data-screen");
    if (!key) {
      fail(label, "no active in-phone screen");
      return;
    }
    if (visited.has(key)) break;
    visited.add(key);

    const continuation = active.locator("button[data-next], button[data-screen-next], button[data-restart]").first();
    if (await continuation.count() === 0) {
      fail(`${label} · ${key}`, "no in-phone next or restart control");
      break;
    }
    await visibleInsidePhone(page, continuation, `${label} · ${key}`);
    labels.push(`${label} · ${key}`);

    if (await continuation.getAttribute("data-restart")) break;
    await tapPhoneControl(page, continuation, `${label} · ${key}`);
    await page.waitForTimeout(40);
    const nextScrollY = await page.evaluate(() => window.scrollY);
    if (Math.abs(nextScrollY - phoneScrollY) > 1) {
      fail(`${label} · ${key}`, "the continuation tap scrolled the page instead of keeping the member in the phone");
    }
    phoneScrollY = nextScrollY;
  }

  const missing = allScreens.filter((screen) => !visited.has(screen));
  if (missing.length) {
    fail(label, `unreached in-phone screens: ${missing.join(", ")}`);
  }
}

try {
  const everyday = await createPage("preview-one-problem-whole-day.html");
  await advanceStory(everyday, "[data-demo]", "Everyday Life");
  await everyday.close();

  const stories = await createPage("preview-everyday-stories.html");
  await advanceStory(stories, '[data-story="member"]', "Travel");
  await advanceStory(stories, '[data-story="owner"]', "Business Owners");
  await stories.close();

  const safety = await createPage("preview-safety-peace-of-mind.html");
  await advanceStory(safety, "[data-safety-demo]", "Safety");
  await safety.close();

  const explore = await createPage("preview-explore-your-way.html");
  const stage = explore.locator("[data-explore-app]");
  await stage.locator(".app").scrollIntoViewIfNeeded();
  let exploreScrollY = await explore.evaluate(() => window.scrollY);
  const routes = await stage.locator(".bottom-nav [data-route]").evaluateAll((buttons) => buttons.map((button) => button.dataset.route));
  for (const route of routes) {
    const control = stage.locator(`.bottom-nav [data-route="${route}"]`);
    await visibleInsidePhone(explore, control, `Explore · ${route} tab`);
    await tapPhoneControl(explore, control, `Explore · ${route} tab`);
    await explore.waitForTimeout(30);
    const nextScrollY = await explore.evaluate(() => window.scrollY);
    if (Math.abs(nextScrollY - exploreScrollY) > 1) {
      fail(`Explore · ${route} tab`, "the in-phone tab scrolled the page instead of changing the app screen");
    }
    exploreScrollY = nextScrollY;
    const active = stage.locator(`.view.active[data-view="${route}"]`);
    if (await active.count() !== 1) fail(`Explore · ${route}`, "route did not become active in the phone");
    labels.push(`Explore · ${route} tab`);
  }
  await visibleInsidePhone(explore, stage.locator("[data-next-route]"), "Explore · direct next route");
  labels.push("Explore · direct next route");
  await explore.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("Mobile in-phone preview audit failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Mobile in-phone preview audit passed (${labels.length} reachable controls):\n- ${labels.join("\n- ")}`);
