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
  console.log('Starting dev server on port 5174 for Design Preview capture...');
  const devProcess = spawn(
    'pnpm',
    ['--filter', '@trendmotion/web', 'dev', '--port', '5174'],
    {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      stdio: 'pipe',
    }
  );

  await wait(4000);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1440, height: 1600 });
    console.log('Navigating to http://localhost:5174/__design-preview ...');
    await page.goto('http://localhost:5174/__design-preview', {
      waitUntil: 'networkidle0',
    });
    await wait(1000);
    await page.screenshot({
      path: path.join(outputDir, '10_design_system_preview_playground.png'),
      fullPage: true,
    });
    console.log('Design Preview screenshot captured successfully!');
  } catch (err) {
    console.error('Error capturing design preview:', err);
  } finally {
    await browser.close();
    devProcess.kill();
  }
}

main().catch(console.error);
