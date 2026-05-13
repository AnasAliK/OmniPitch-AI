const { chromium } = require('playwright');
const fs = require('fs');

async function getNextData() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto('https://www.fotmob.com/teams/8456/squad/', { waitUntil: 'domcontentloaded' });

  const nextDataStr = await page.evaluate(() => {
    const script = document.getElementById('__NEXT_DATA__');
    return script ? script.innerText : null;
  });

  if (nextDataStr) {
    fs.writeFileSync('scripts/next_data.json', nextDataStr);
    console.log("Saved next_data.json");
  } else {
    console.log("No NEXT DATA");
  }
  await browser.close();
}
getNextData();
