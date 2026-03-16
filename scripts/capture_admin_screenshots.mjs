#!/usr/bin/env node
/**
 * 访问运营后台各页面并截图
 * 用法: node scripts/capture_admin_screenshots.mjs
 * 需要: npm install -D playwright && npx playwright install chromium
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const BASE = "http://localhost:5174";
const OUTPUT = join(process.cwd(), "output", "playwright", "admin-pages");

const PAGES = [
  { path: "/login", name: "01-login" },
  { path: "/dashboard", name: "02-dashboard" },
  { path: "/reviews", name: "03-reviews" },
  { path: "/companies", name: "04-companies" },
  { path: "/articles", name: "05-articles" },
  { path: "/crawl", name: "06-crawl" },
  { path: "/runs", name: "07-runs" },
];

async function main() {
  if (!existsSync(OUTPUT)) mkdirSync(OUTPUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. 登录页
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: join(OUTPUT, "01-login.png"), fullPage: true });
    console.log("✓ 01-login");

    // 2. 登录 (使用默认账号，生产环境可能不同)
    await page.fill('input[type="text"], input:not([type])', "admin");
    await page.fill('input[type="password"]', "admin123456");
    await page.click('button[type="submit"], button.primary-button');
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 5000 }).catch(() => {});

    // 3. 各需登录的页面
    for (const { path, name } of PAGES) {
      if (path === "/login") continue;
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 10000 });
      await page.waitForTimeout(800);
      const filename = `${name}.png`;
      await page.screenshot({ path: join(OUTPUT, filename), fullPage: true });
      console.log(`✓ ${filename}`);
    }

    // 4. 若有审核/运行详情，尝试访问第一条
    try {
      await page.goto(`${BASE}/reviews`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const viewBtn = await page.$('button.secondary-button');
      if (viewBtn) {
        await viewBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: join(OUTPUT, "08-review-detail.png"), fullPage: true });
        console.log("✓ 08-review-detail");
      }
    } catch (_) {}

    try {
      await page.goto(`${BASE}/runs`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const viewBtn = await page.$('tbody button.secondary-button');
      if (viewBtn) {
        await viewBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: join(OUTPUT, "09-run-detail.png"), fullPage: true });
        console.log("✓ 09-run-detail");
      }
    } catch (_) {}

    console.log(`\n截图已保存到 ${OUTPUT}`);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

main();
