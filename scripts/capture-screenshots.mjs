import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('../apps/web/node_modules/puppeteer');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../docs/design/screenshots');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting preview server...');
  const previewProcess = spawn(
    'pnpm',
    ['--filter', '@trendmotion/web', 'preview', '--port', '4173'],
    {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
    }
  );

  previewProcess.stdout.on('data', (data) => {
    // console.log(`[Preview]: ${data}`);
  });

  // Wait for server to start
  await wait(3000);

  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const baseUrl = 'http://localhost:4173';

  try {
    // 1. Desktop 1440x900 - Overview with Sidebar Expanded
    console.log('Capturing 1: Desktop 1440x900 (Overview - Sidebar Expanded)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/overview`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.screenshot({
      path: path.join(outputDir, '01_desktop_1440x900_sidebar_expanded.png'),
    });

    // 2. Desktop 1440x900 - Product Research Page
    console.log('Capturing 2: Desktop 1440x900 (Product Research)...');
    await page.goto(`${baseUrl}/products`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.screenshot({
      path: path.join(outputDir, '02_desktop_1440x900_product_research.png'),
    });

    // 3. Desktop 1440x900 - Sidebar Collapsed
    console.log('Capturing 3: Desktop 1440x900 (Sidebar Collapsed)...');
    // Click collapse button
    const collapseBtn = await page.$('button[aria-label="Thu gọn thanh bên"]');
    if (collapseBtn) {
      await collapseBtn.click();
      await wait(500);
    }
    await page.screenshot({
      path: path.join(outputDir, '03_desktop_1440x900_sidebar_collapsed.png'),
    });

    // 4. Standard Desktop 1366x768 - Studio Page
    console.log('Capturing 4: Standard Desktop 1366x768 (Studio)...');
    await page.setViewport({ width: 1366, height: 768 });
    // Expand sidebar back
    const expandBtn = await page.$('button[aria-label="Mở rộng thanh bên"]');
    if (expandBtn) {
      await expandBtn.click();
      await wait(500);
    }
    await page.goto(`${baseUrl}/studio`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.screenshot({
      path: path.join(outputDir, '04_desktop_1366x768_studio.png'),
    });

    // 5. Tablet Landscape 1024x768 - Models Page
    console.log('Capturing 5: Tablet Landscape 1024x768 (Models)...');
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/models`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.screenshot({
      path: path.join(outputDir, '05_tablet_1024x768_models.png'),
    });

    // 6. Tablet Portrait 768x1024 - Mobile Drawer Open
    console.log('Capturing 6: Tablet Portrait 768x1024 (Drawer Open)...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${baseUrl}/overview`, { waitUntil: 'networkidle0' });
    await wait(500);
    const menuBtn = await page.$('button[aria-label="Mở menu điều hướng"]');
    if (menuBtn) {
      await menuBtn.click();
      await wait(500);
    }
    await page.screenshot({
      path: path.join(outputDir, '06_tablet_768x1024_drawer_open.png'),
    });

    // 7. Mobile Phone 390x844 - Wallet Page
    console.log('Capturing 7: Mobile Phone 390x844 (Wallet)...');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/wallet`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.screenshot({
      path: path.join(outputDir, '07_mobile_390x844_wallet.png'),
    });

    // 8. Desktop 1440x900 - 404 Not Found Page
    console.log('Capturing 8: 404 Not Found Page...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/non-existing-route`, { waitUntil: 'networkidle0' });
    await wait(500);
    await page.screenshot({
      path: path.join(outputDir, '08_desktop_404_not_found.png'),
    });

    // 9. Desktop 1440x900 - Topbar Avatar Dropdown Open
    console.log('Capturing 9: Topbar Avatar Dropdown Open...');
    await page.goto(`${baseUrl}/overview`, { waitUntil: 'networkidle0' });
    await wait(500);
    const avatarBtn = await page.$('button[aria-label="Mở menu tài khoản"]');
    if (avatarBtn) {
      await avatarBtn.click();
      await wait(500);
    }
    await page.screenshot({
      path: path.join(outputDir, '09_desktop_topbar_avatar_dropdown.png'),
    });

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error taking screenshots:', err);
  } finally {
    await browser.close();
    previewProcess.kill();
  }
}

main().catch(console.error);
