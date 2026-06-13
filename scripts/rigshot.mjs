// Dev helper: line up the new characters in front of the camera and shoot.
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5174';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 700 } })).newPage();

await page.goto(`${BASE}/?auto=1&map=hall&team=order&char=harry&squad=dumbledore,mcgonagall,ginny,neville&foes=lucius,greyback,umbridge,wormtail,bellatrix`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__game && window.__game.state, null, { timeout: 20000 });
await page.evaluate(() => {
  const g = window.__game;
  for (let i = 0; i < 6 / 0.025; i++) g.update(0.025);
  // freeze all brains and line everyone up facing the camera, mid-floor
  const order = ['dumbledore', 'mcgonagall', 'ginny', 'neville', 'lucius', 'greyback', 'umbridge', 'wormtail'];
  const h = g.human;
  const b = g.world.bounds;
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const gy = g.world.groundY(cx, cz, 5);
  for (const p of g.players) if (p.bot) { p.bot.update = () => {}; Object.assign(p.ctrl, { moveX: 0, moveZ: 0, castHeld: false, jump: false, crouch: false }); }
  order.forEach((id, i) => {
    const p = g.players.find((q) => q.charId === id);
    if (!p) return;
    p.alive = true; p.health = 100;
    p.pos.set(cx - 5.25 + i * 1.5, gy + 0.02, cz - 4);
    p.vel.set(0, 0, 0);
    p.yaw = Math.PI; // face the camera spot
  });
  h.pos.set(cx, gy + 0.02, cz + 1.2);
  h.yaw = 0; h.pitch = -0.02;
  for (let i = 0; i < 40; i++) {
    for (const p of g.players) p.vel.set(0, Math.min(0, p.vel.y), 0); // stand still
    g.update(0.016); // settle rigs/anims
  }
  g.hud.el.style.display = 'none'; // clean portrait
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/rigs.png' });
await browser.close();
console.log('rig lineup written to shots/rigs.png');
