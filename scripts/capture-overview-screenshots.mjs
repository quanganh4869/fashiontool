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
    ['--filter', '@trendmotion/web', 'preview', '--port', '4174'],
    {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
    }
  );

  await wait(3000);

  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const baseUrl = 'http://localhost:4174';

  try {
    // 1. Desktop 1440x900 - Real Disconnected / Empty API State
    console.log('1. Capturing Overview 1440x900 (Real API - Disconnected/Empty State)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/overview`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'overview_1440x900_real_empty_state.png'),
    });

    // 2. Desktop 1440x900 - Development Fixture Preview (Full Rich Data)
    console.log('2. Capturing Overview 1440x900 (Fixture Preview - Full Content)...');
    await page.goto(`${baseUrl}/overview?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'overview_1440x900_fixture_preview.png'),
    });

    // 3. Laptop 1366x768 - Fixture Preview
    console.log('3. Capturing Overview 1366x768 (Laptop)...');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(`${baseUrl}/overview?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'overview_1366x768_laptop.png'),
    });

    // 4. Tablet Landscape 1024x768
    console.log('4. Capturing Overview 1024x768 (Tablet Landscape)...');
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/overview?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'overview_1024x768_tablet_landscape.png'),
    });

    // 5. Tablet Portrait 768x1024
    console.log('5. Capturing Overview 768x1024 (Tablet Portrait)...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${baseUrl}/overview?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'overview_768x1024_tablet_portrait.png'),
    });

    // 6. Mobile 390x844
    console.log('6. Capturing Overview 390x844 (Mobile iPhone)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${baseUrl}/overview?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'overview_390x844_mobile.png'),
    });

    // 7. Video Player Dialog Open (Desktop 1440x900)
    console.log('7. Capturing Video Player Dialog...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/overview?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);

    // Click the first completed video card
    const videoCard = await page.$('button[aria-label^="Xem video"]');
    if (videoCard) {
      await videoCard.click();
      await wait(800);
      await page.screenshot({
        path: path.join(outputDir, 'overview_1440x900_video_dialog_open.png'),
      });
    }

    console.log('All overview screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    previewProcess.kill();
  }
}

main();
