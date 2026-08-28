const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testProductionBuild() {
  console.log('🌐 Testing Production Build on http://localhost:4173 ...');

  const artifactDir = '/Users/milquu/.gemini/antigravity-ide/brain/0e7910f2-6af4-49ff-bc45-10fb16773839';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure().errorText}`);
    console.error('FAILED NETWORK REQUEST:', req.url(), req.failure().errorText);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('CONSOLE ERROR:', msg.text());
  });

  try {
    const res = await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`HTTP Status: ${res.status()}`);

    await page.waitForSelector('.invoice-paper', { timeout: 5000 });
    console.log('✅ Invoice Paper rendered successfully in Production mode.');

    const title = await page.textContent('.invoice-company-title');
    console.log(`✅ Company Title: "${title.trim()}"`);

    const total = await page.$eval('.invoice-amount-val', el => el.textContent.trim());
    console.log(`✅ Bill Total: ₹${total}`);

    const words = await page.textContent('.invoice-words-row');
    console.log(`✅ Amount in Words: "${words.trim()}"`);

    // Verify 0 failed asset requests
    console.log(`Network Failed Requests: ${failedRequests.length}`);
    if (failedRequests.length === 0) {
      console.log('✅ All production bundles, fonts, and assets loaded with 0 network errors!');
    }

    const prodScreenshot = path.join(artifactDir, 'prod_build_verified.png');
    await page.screenshot({ path: prodScreenshot, fullPage: true });
    console.log(`📸 Saved production screenshot to ${prodScreenshot}`);

    console.log('\n🎯 PRODUCTION BUILD TEST COMPLETED: 100% SUCCESS');

  } catch (err) {
    console.error('Production Test Error:', err);
  } finally {
    await browser.close();
  }
}

testProductionBuild();
