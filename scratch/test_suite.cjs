const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runBrowserTests() {
  console.log('🚀 Starting Browser Automation Tests on http://localhost:5174 ...');

  const artifactDir = '/Users/milquu/.gemini/antigravity-ide/brain/0e7910f2-6af4-49ff-bc45-10fb16773839';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: [],
  };

  function assert(name, condition, details = '') {
    results.total++;
    if (condition) {
      results.passed++;
      results.tests.push({ name, status: 'PASSED', details });
      console.log(`✅ [PASS] ${name}`);
    } else {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', details });
      console.error(`❌ [FAIL] ${name} - ${details}`);
    }
  }

  try {
    // 1. Navigation Test
    console.log('Navigating to http://localhost:5174...');
    const response = await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 10000 });
    assert('Server Response 200', response.status() === 200, `Status code: ${response.status()}`);

    // Wait for the invoice paper to render
    await page.waitForSelector('.invoice-paper', { timeout: 5000 });
    assert('Invoice Paper Rendered', await page.isVisible('.invoice-paper'));

    // 2. Visual Header & Structure Checks
    const companyTitle = await page.textContent('.invoice-company-title');
    assert('Company Name Match', companyTitle.trim() === 'SWAMI KRUPA ROADLINES', `Got: "${companyTitle.trim()}"`);

    const companyTitleColor = await page.$eval('.invoice-company-title', el => getComputedStyle(el).color);
    assert('Company Red Color Match', companyTitleColor.includes('214, 0, 0') || companyTitleColor.includes('220, 38, 38') || companyTitleColor.includes('214'), `Color: ${companyTitleColor}`);

    const tagline = await page.textContent('.invoice-company-tagline');
    assert('Tagline Match', tagline.trim() === 'FLEET OWNERS & TRANSPORT CONTRACTORS', `Got: "${tagline.trim()}"`);

    const jurisdiction = await page.textContent('.invoice-top-jurisdiction');
    assert('Jurisdiction Match', jurisdiction.trim().includes('Subject To Navi Mumbai Jurisdiction'), `Got: "${jurisdiction.trim()}"`);

    const titleBar = await page.textContent('.invoice-title-bar');
    assert('Tax Invoice Title Match', titleBar.trim() === 'TAX INVOICE', `Got: "${titleBar.trim()}"`);

    // 3. Metadata & Party Checks
    const partyName = await page.textContent('.invoice-meta-left');
    assert('Party Name Match', partyName.includes('ADNISHA TRANSPORT'), `Got: "${partyName.trim()}"`);

    const billNo = await page.textContent('.invoice-meta-right');
    assert('Bill No Match', billNo.includes('122/ 2026-27'), `Got: "${billNo.trim()}"`);

    // 4. Table Grid Headers
    const headers = await page.$$eval('.invoice-table th', els => els.map(e => e.textContent.trim()));
    const expectedHeaders = ['S.N.', 'Date', 'Vehicle No.', 'Container No', 'P A R T I C U L A R S', 'Weight', 'Advance', 'Amount'];
    assert('Table 8 Columns Match', JSON.stringify(headers) === JSON.stringify(expectedHeaders), `Got: ${JSON.stringify(headers)}`);

    // 5. Totals & Words Check
    const billTotalVal = await page.$$eval('.invoice-amount-val', els => els.map(e => e.textContent.trim()));
    assert('Bill Total Amount Match', billTotalVal[0] === '23,800.00', `Got Total: ${billTotalVal[0]}`);
    assert('Balance Amount Match', billTotalVal[2] === '23,800.00', `Got Balance: ${billTotalVal[2]}`);

    const wordsRow = await page.textContent('.invoice-words-row');
    assert('Rupees In Words Match', wordsRow.includes('TWENTY THREE THOUSAND EIGHT HUNDRED RUPEES ONLY'), `Got: "${wordsRow.trim()}"`);

    const gstRow = await page.textContent('.invoice-gst-row');
    assert('GST Tax Payable Row Match', gstRow.includes('GST TAX PAYABLE BY ADNISHA TRANSPORT'), `Got: "${gstRow.trim()}"`);

    const bankDetails = await page.textContent('.invoice-bank-details');
    assert('Bank Name Match', bankDetails.includes('GS MAHANAGER CO BANK'), `Got bank: ${bankDetails}`);
    assert('Account No Match', bankDetails.includes('032011200000548'), `Got account: ${bankDetails}`);
    assert('IFSC Match', bankDetails.includes('MCBL0960032'), `Got IFSC: ${bankDetails}`);

    const forSign = await page.textContent('.invoice-for-company');
    assert('For Company Signature Match', forSign.trim() === 'For SWAMI KRUPA ROADLINES', `Got: "${forSign.trim()}"`);

    // 6. Screenshot 1: Default Invoice View
    const screenshot1Path = path.join(artifactDir, 'invoice_rendered_full.png');
    await page.screenshot({ path: screenshot1Path, fullPage: true });
    console.log(`📸 Saved screenshot to ${screenshot1Path}`);

    // 7. Interactive Test: Add Row via Preset & Calculate
    console.log('Testing interactive row addition and calculation...');
    const quickAddBtn = await page.locator('.preset-chip', { hasText: 'DETENTION CHARGES' });
    if (await quickAddBtn.isVisible()) {
      await quickAddBtn.click();
      await page.waitForTimeout(300);

      // Enter amount in the newly added row (last amount input)
      const amountInputs = await page.$$('.input-highlight');
      const lastAmountInput = amountInputs[amountInputs.length - 1];
      await lastAmountInput.fill('2500');
      await page.waitForTimeout(300);

      // Verify updated total (23800 + 2500 = 26300)
      const updatedTotal = await page.$eval('.invoice-amount-val', el => el.textContent.trim());
      assert('Dynamic Recalculation (+2500)', updatedTotal === '26,300.00', `Expected 26,300.00, Got: ${updatedTotal}`);

      const updatedWords = await page.textContent('.invoice-words-row');
      assert('Updated Words Calculation', updatedWords.includes('TWENTY SIX THOUSAND THREE HUNDRED RUPEES ONLY'), `Got: "${updatedWords.trim()}"`);
    }

    // 8. Test Modal Interactions: Directory Modal
    console.log('Testing Directory Modal...');
    await page.click('button:has-text("Directory")');
    await page.waitForSelector('.modal-backdrop', { timeout: 3000 });
    assert('Directory Modal Opens', await page.isVisible('.modal-content'));
    assert('Directory Tab Party Listed', await page.isVisible('h4:has-text("ADNISHA TRANSPORT")'));

    // Close Directory Modal
    await page.click('.modal-header .btn-icon');
    await page.waitForTimeout(300);

    // 9. Test Modal Interactions: Saved Invoices Modal
    console.log('Testing Saved Bills Modal...');
    await page.click('button:has-text("Bills")');
    await page.waitForSelector('.modal-backdrop', { timeout: 3000 });
    assert('Saved Bills Modal Opens', await page.isVisible('.modal-content'));

    // Close Saved Bills Modal
    await page.click('.modal-header .btn-icon');
    await page.waitForTimeout(300);

    // 10. Test Save Bill Action
    console.log('Testing Save Bill Toast...');
    await page.click('.btn-header-save');
    await page.waitForSelector('.toast-badge', { timeout: 3000 });
    assert('Save Toast Appears', await page.isVisible('.toast-badge'));

    // 11. Final Full Page Screenshot
    const finalScreenshot = path.join(artifactDir, 'invoice_test_final.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`📸 Saved final screenshot to ${finalScreenshot}`);

    console.log('\n========================================');
    console.log(`🎯 Test Summary: ${results.passed}/${results.total} PASSED (${results.failed} failed)`);
    console.log('========================================');

  } catch (err) {
    console.error('Test execution error:', err);
    assert('Test Suite Execution', false, err.message);
  } finally {
    await browser.close();
  }

  return results;
}

runBrowserTests();
