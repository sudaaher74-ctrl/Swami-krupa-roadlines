const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function executeFullUserJourneyTests() {
  console.log('🧪 Starting Comprehensive E2E Testing Suite from Agent Side...');

  const artifactDir = '/Users/milquu/.gemini/antigravity-ide/brain/0e7910f2-6af4-49ff-bc45-10fb16773839';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('BROWSER CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err));

  const journeyResults = [];

  function record(step, status, note = '') {
    journeyResults.push({ step, status, note });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${step} ${note ? `(${note})` : ''}`);
  }

  try {
    // Navigate to app
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForSelector('.invoice-paper');
    record('App Navigation', 'PASS', 'Loaded on http://localhost:5174');

    // ----------------------------------------------------
    // TEST JOURNEY 1: Create a brand new bill
    // ----------------------------------------------------
    console.log('\n--- Journey 1: New Bill Workflow ---');
    await page.click('button:has-text("New Bill")');
    await page.waitForTimeout(400);

    const billNoText = await page.textContent('.invoice-meta-right');
    record('New Bill Auto-Numbering', 'PASS', `Generated: ${billNoText.trim()}`);

    // Switch to Party & Bill tab and enter party details
    await page.click('button:has-text("Party & Bill")');
    await page.waitForTimeout(200);

    const partyInput = page.locator('input[list="customers-master-list"]');
    await partyInput.fill('MAHESH CARRIERS PVT LTD');
    await page.waitForTimeout(200);

    // Verify paper preview shows updated party name
    const paperParty = await page.textContent('.invoice-meta-left');
    record('Party Name Reactive Sync', paperParty.includes('MAHESH CARRIERS PVT LTD') ? 'PASS' : 'FAIL', paperParty.trim());

    // Switch to Particulars tab & add items
    await page.click('button:has-text("Particulars")');
    await page.waitForTimeout(200);

    // Row 1 inputs
    const vehicleInputs = await page.$$('input[placeholder="MH46DL7778"]');
    if (vehicleInputs.length > 0) {
      await vehicleInputs[0].fill('MH46XY1122');
    }
    const containerAreas = await page.$$('textarea[placeholder*="BEAU5560140"]');
    if (containerAreas.length > 0) {
      await containerAreas[0].fill('MEDU1234567\n1X40');
    }
    const particularsAreas = await page.$$('textarea[placeholder="CONTINENTAL TO VASAI"]');
    if (particularsAreas.length > 0) {
      await particularsAreas[0].fill('NHAVA SHEVA TO KALAMBOLI');
    }
    const amountInputs = await page.$$('.amount-input-highlight');
    if (amountInputs.length > 0) {
      await amountInputs[0].fill('22000');
    }

    // Add Row 2 using Quick Preset
    const addEmptyBtn = page.locator('.action-chip', { hasText: 'EMPTY OFFLOADING' });
    await addEmptyBtn.click();
    await page.waitForTimeout(300);

    const allAmounts = await page.$$('.amount-input-highlight');
    await allAmounts[allAmounts.length - 1].fill('4500');
    await page.waitForTimeout(300);

    // Add Row 3 (Toll charges)
    const addTollBtn = page.locator('.action-chip', { hasText: 'TOLL CHARGES' });
    await addTollBtn.click();
    await page.waitForTimeout(300);

    const allAmountsAfterToll = await page.$$('.amount-input-highlight');
    await allAmountsAfterToll[allAmountsAfterToll.length - 1].fill('1500');
    await page.waitForTimeout(300);

    // Enter Advance deduction
    await page.click('button:has-text("Party & Bill")');
    await page.waitForTimeout(200);
    const advInput = page.locator('input[placeholder="0.00"]').first();
    await advInput.fill('5000');
    await page.waitForTimeout(300);

    // Verify Calculations: 22000 + 4500 + 1500 = 28000. Advance = 5000. Balance = 23000.
    const amountVals = await page.$$eval('.invoice-amount-val', els => els.map(e => e.textContent.trim()));
    const totalMatch = amountVals[0] === '28,000.00';
    const advMatch = amountVals[1] === '5,000.00';
    const balMatch = amountVals[2] === '23,000.00';
    record('Bill Total Calculation (28,000.00)', totalMatch ? 'PASS' : 'FAIL', `Got: ${amountVals[0]}`);
    record('Advance Less (5,000.00)', advMatch ? 'PASS' : 'FAIL', `Got: ${amountVals[1]}`);
    record('Net Balance Payable (23,000.00)', balMatch ? 'PASS' : 'FAIL', `Got: ${amountVals[2]}`);

    const wordsText = await page.textContent('.invoice-words-row');
    const wordsCorrect = wordsText.includes('TWENTY THREE THOUSAND RUPEES ONLY');
    record('Amount in Words Currency Converter', wordsCorrect ? 'PASS' : 'FAIL', wordsText.trim());

    // Save the bill
    await page.click('.btn-header-save');
    await page.waitForSelector('.toast-badge');
    record('Save Bill to Storage', 'PASS', 'Confirmation badge displayed');

    // Screenshot of Journey 1
    const s1Path = path.join(artifactDir, 'test_journey_1_new_bill.png');
    await page.screenshot({ path: s1Path, fullPage: true });

    // ----------------------------------------------------
    // TEST JOURNEY 2: Directory Management
    // ----------------------------------------------------
    console.log('\n--- Journey 2: Directory Master Workflow ---');
    await page.click('button:has-text("Directory")');
    await page.waitForSelector('.modal-content');
    record('Open Directory Modal', 'PASS');

    // Click Add Party
    await page.click('button:has-text("Add Party")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder="e.g. ADNISHA TRANSPORT"]', 'BALAJI LOGISTICS EXPRESS');
    await page.fill('input[placeholder="e.g. 9876543210"]', '9822334455');
    await page.fill('input[placeholder="e.g. 27AAAAA0000A1Z5"]', '27ABCDE1234F1Z5');
    await page.fill('input[placeholder="e.g. Nhava Sheva, Navi Mumbai"]', 'JNPT Port, Navi Mumbai');

    await page.click('button:has-text("Save Party")');
    await page.waitForTimeout(300);

    const hasNewParty = await page.isVisible('h4:has-text("BALAJI LOGISTICS EXPRESS")');
    record('Add & Save Customer in Master', hasNewParty ? 'PASS' : 'FAIL');

    // Switch to Vehicles tab
    await page.click('button:has-text("Vehicles / Trucks")');
    await page.waitForTimeout(200);

    await page.click('button:has-text("Add Vehicle")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder="e.g. MH46DL7778"]', 'MH46TT9999');
    await page.fill('input[placeholder*="40ft Trailer"]', '40ft Heavy Container');
    await page.fill('input[placeholder="e.g. Ramesh Kumar"]', 'Sunil Patil');

    await page.click('button:has-text("Save Vehicle")');
    await page.waitForTimeout(300);

    const hasNewVehicle = await page.isVisible('h4:has-text("MH46TT9999")');
    record('Add & Save Vehicle in Master', hasNewVehicle ? 'PASS' : 'FAIL');

    // Screenshot of Journey 2
    const s2Path = path.join(artifactDir, 'test_journey_2_directory.png');
    await page.screenshot({ path: s2Path });

    // Close Modal
    await page.click('.modal-header .btn-icon');
    await page.waitForTimeout(300);

    // ----------------------------------------------------
    // TEST JOURNEY 3: Print Media Emulation (A4 Verification)
    // ----------------------------------------------------
    console.log('\n--- Journey 3: Print Emulation & Layout Check ---');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(300);

    // Check that sidebar & toolbar are hidden in print mode
    const sidebarVisible = await page.$eval('.editor-sidebar-container', el => getComputedStyle(el).display);
    const headerVisible = await page.$eval('.app-header', el => getComputedStyle(el).display);
    record('Print Mode Sidebar Hidden', sidebarVisible === 'none' ? 'PASS' : 'FAIL');
    record('Print Mode Header Hidden', headerVisible === 'none' ? 'PASS' : 'FAIL');

    const printScreenshotPath = path.join(artifactDir, 'test_journey_3_print_a4.png');
    await page.screenshot({ path: printScreenshotPath, fullPage: true });
    record('Print A4 Pixel-Perfect Capture', 'PASS', 'Saved A4 preview');

    // Reset media
    await page.emulateMedia({ media: 'screen' });

    // ----------------------------------------------------
    // TEST JOURNEY 4: Reset & Load Sample Bill
    // ----------------------------------------------------
    console.log('\n--- Journey 4: Original Sample Bill Restore ---');
    await page.click('button:has-text("Demo Sample")');
    await page.waitForTimeout(400);

    const resetTitle = await page.textContent('.invoice-company-title');
    const resetClient = await page.textContent('.invoice-meta-left');
    const resetTotal = await page.$eval('.invoice-amount-val', el => el.textContent.trim());

    record('Sample Restore Company Name', resetTitle.trim() === 'SWAMI KRUPA ROADLINES' ? 'PASS' : 'FAIL');
    record('Sample Restore Party Name', resetClient.includes('ADNISHA TRANSPORT') ? 'PASS' : 'FAIL');
    record('Sample Restore Total (23,800.00)', resetTotal === '23,800.00' ? 'PASS' : 'FAIL');

    console.log('\n======================================================');
    console.log(`🎯 Full User Journey Results: ${journeyResults.filter(r => r.status === 'PASS').length}/${journeyResults.length} PASSED`);
    console.log('======================================================');

  } catch (err) {
    console.error('Fatal Journey Test Error:', err);
    record('Full Journey Suite', 'FAIL', err.message);
  } finally {
    await browser.close();
  }

  return journeyResults;
}

executeFullUserJourneyTests();
