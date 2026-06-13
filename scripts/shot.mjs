// Dev helper: screenshot the HUD and the setup screen. Not part of the game.
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5174';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 810 } })).newPage();

// in-match HUD
await page.goto(`${BASE}/?auto=1&map=dust2&team=order&char=dumbledore&squad=ginny,neville&foes=greyback,umbridge`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__game && window.__game.state, null, { timeout: 20000 });
await page.evaluate(() => {
  const g = window.__game;
  for (let i = 0; i < 12 / 0.025; i++) g.update(0.025); // into live round
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/hud.png' });

// buy menu
await page.evaluate(() => { window.__game.hud.openBuy(true); });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/buy.png' });
await page.evaluate(() => { window.__game.hud.openBuy(false); });

// scoreboard (freeze the HUD updater so Tab-up doesn't re-hide it)
await page.evaluate(() => {
  const hud = window.__game.hud;
  hud.update = () => {};
  hud.renderScoreboard();
  hud.scoreboardEl.classList.remove('hidden');
});
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/scoreboard.png' });

// setup screen (fresh page, no auto)
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.click('text=PLAY — CURSED RELIC');
await page.waitForTimeout(600);
await page.evaluate(() => {
  // scroll the lineup pickers into view
  const target = document.querySelector('.rosters');
  target?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/setup.png' });

await browser.close();
console.log('shots written to shots/');
