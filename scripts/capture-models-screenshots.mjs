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
  console.log('Starting web preview server on port 4174...');
  const previewProcess = spawn(
    'pnpm',
    ['--filter', '@trendmotion/web', 'preview', '--port', '4174'],
    {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
    }
  );

  await wait(3500);

  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const baseUrl = 'http://localhost:4174';

  try {
    // 1. Desktop 1440x900 - Model Library Grid View
    console.log('1. Capturing Model Library (Desktop 1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/models?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'models_library_1440x900.png'),
    });

    // 2. Laptop 1366x768 - Model Library
    console.log('2. Capturing Model Library (Laptop 1366x768)...');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(`${baseUrl}/models?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'models_library_1366x768.png'),
    });

    // 3. Tablet Landscape 1024x768
    console.log('3. Capturing Model Library (Tablet 1024x768)...');
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto(`${baseUrl}/models?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'models_library_1024x768.png'),
    });

    // 4. Tablet Portrait 768x1024
    console.log('4. Capturing Model Library (Tablet 768x1024)...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${baseUrl}/models?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'models_library_768x1024.png'),
    });

    // 5. Mobile 390x844
    console.log('5. Capturing Model Library (Mobile iPhone 390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${baseUrl}/models?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(800);
    await page.screenshot({
      path: path.join(outputDir, 'models_library_390x844.png'),
    });

    // 6. Wizard Step 1: Identity (mod-draft-003)
    console.log('6. Capturing Wizard Step 1 (Identity)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/models/mod-draft-003/setup/identity?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'models_wizard_step1_1440x900.png'),
    });

    // 7. Wizard Step 2: Photos (mod-draft-step2)
    console.log('7. Capturing Wizard Step 2 (Photos)...');
    await page.goto(`${baseUrl}/models/mod-draft-step2/setup/photos?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'models_wizard_step2_1440x900.png'),
    });

    // 8. Wizard Step 3: Review (mod-draft-step2)
    console.log('8. Capturing Wizard Step 3 (Review & Finalize)...');
    await page.goto(`${baseUrl}/models/mod-draft-step2/setup/review?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'models_wizard_step3_1440x900.png'),
    });

    // 9. Model Detail Page (mod-linh-001)
    console.log('9. Capturing Model Detail Page (mod-linh-001)...');
    await page.goto(`${baseUrl}/models/mod-linh-001?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'models_detail_1440x900.png'),
    });

    // 10. Photo Lightbox Modal
    console.log('10. Capturing Photo Lightbox Modal...');
    const photoImg = await page.$('img[alt="linh-portrait-front.jpg"]');
    if (photoImg) {
      await photoImg.click();
      await wait(600);
      await page.screenshot({
        path: path.join(outputDir, 'models_detail_lightbox_1440x900.png'),
      });
      // Close modal
      await page.keyboard.press('Escape');
      await wait(300);
    }

    // 11. Model Edit Page (mod-linh-001)
    console.log('11. Capturing Model Edit Page (mod-linh-001)...');
    await page.goto(`${baseUrl}/models/mod-linh-001/edit?preview=fixture`, { waitUntil: 'networkidle0' });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, 'models_edit_1440x900.png'),
    });

    console.log('All screenshots captured successfully in:', outputDir);
  } catch (error) {
    console.error('Error during screenshot capture:', error);
  } finally {
    await browser.close();
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', previewProcess.pid, '/f', '/t'], { shell: true });
      } else {
        previewProcess.kill();
      }
    } catch {
      // ignore
    }
  }
}

main();
