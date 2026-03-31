/**
 * scraper.js — PawBoost 拾獲寵物爬蟲（全美）
 * 將資料（照片、品種、地點）存入 Google Sheets
 *
 * npm install axios puppeteer-extra puppeteer-extra-plugin-stealth googleapis dotenv
 * node scraper.js
 *
 * 環境變數：
 *   PAWBOOST_STATE       州代碼，e.g. CA / NY / TX（留空 = 全國，但較慢）
 *   PAWBOOST_TYPE        dog | cat（留空 = 全部）
 *   GOOGLE_SHEET_ID      Google Sheets 試算表 ID
 *   GOOGLE_CREDENTIALS   service account JSON 字串
 */

require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const Stealth   = require('puppeteer-extra-plugin-stealth');
const { google } = require('googleapis');

puppeteer.use(Stealth());


// PawBoost 拾獲動物列表頁
function buildUrl() {
  const city = process.env.PAWBOOST_CITY || 'los-angeles-ca-90001';
  return `https://www.pawboost.com/lost-found-pets/${city}/all-found-pets/page-1`;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── 爬蟲 ──────────────────────────────────────────────────────────────────────
async function scrapePawBoost() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
      || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 900 });

  // 偽造 GPS 為洛杉磯（繞過 IP 地理鎖定）
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.pawboost.com', ['geolocation']);
  await page.setGeolocation({ latitude: 34.0522, longitude: -118.2437 }); // LA

  const url = buildUrl();
  console.log(`🌐 前往 ${url}`);
  // 攔截所有 XHR/fetch 找 API 端點
  const apiResponses = [];
  page.on('response', async response => {
    const u = response.url();
    const ct = response.headers()['content-type'] || '';
    if (ct.includes('application/json') && u.includes('pawboost')) {
      try {
        const json = await response.json();
        apiResponses.push({ url: u, data: json });
        console.log('[API intercepted]', u);
      } catch {}
    }
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(3000);
  await page.evaluate(() => window.scrollBy(0, 800));
  await delay(2000);

  if (apiResponses.length > 0) {
    console.log('[API data sample]', JSON.stringify(apiResponses[0], null, 2).slice(0, 1000));
  } else {
    console.log('[No API calls intercepted, checking DOM...]');
  }

  await page.screenshot({ path: 'debug.png' });

  const pets = await page.evaluate(() => {
    // PawBoost 卡片選擇器（若改版請對應調整）
    const cards = Array.from(
      document.querySelectorAll('.lost-pet-card, .pet-card, [class*="petCard"], article[class*="pet"]')
    );

    return cards.slice(0, 50).map(card => {
      const img      = card.querySelector('img');
      const nameEl   = card.querySelector('[class*="name"], h2, h3');
      const breedEl  = card.querySelector('[class*="breed"], [class*="type"]');
      const locationEl = card.querySelector('[class*="location"], [class*="city"], address');
      const linkEl   = card.querySelector('a');
      const dateEl   = card.querySelector('[class*="date"], time');

      return {
        name:     nameEl?.innerText?.trim()     || 'Unknown',
        breed:    breedEl?.innerText?.trim()    || '',
        location: locationEl?.innerText?.trim() || '',
        photo:    img?.src || img?.dataset?.src || '',
        url:      linkEl?.href || '',
        date:     dateEl?.innerText?.trim() || '',
        scraped:  new Date().toISOString(),
      };
    }).filter(p => p.photo); // 只保留有照片的
  });

  await browser.close();
  console.log(`✅ 抓到 ${pets.length} 筆（含照片）`);
  return pets;
}

// ─── 寫入 Google Sheets ────────────────────────────────────────────────────────
async function writeToSheets(pets) {
  if (!process.env.GOOGLE_SHEET_ID) {
    console.log('⚠️  未設定 GOOGLE_SHEET_ID，輸出 JSON：');
    console.log(JSON.stringify(pets, null, 2));
    return;
  }

  const credJson = process.env.GOOGLE_CREDENTIALS
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : require('./credentials.json');

  const auth   = new google.auth.GoogleAuth({ credentials: credJson, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const COLS   = ['name', 'breed', 'location', 'photo', 'url', 'date', 'scraped'];

  await sheets.spreadsheets.values.update({
    spreadsheetId:    process.env.GOOGLE_SHEET_ID,
    range:            '工作表1!A1',
    valueInputOption: 'RAW',
    requestBody:      { values: [COLS, ...pets.map(p => COLS.map(k => p[k]))] },
  });

  console.log(`📊 已寫入 Google Sheets（${pets.length} 筆）`);
}

// ─── Entry ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const pets = await scrapePawBoost();
    await writeToSheets(pets);
  } catch (err) {
    console.error('❌', err.response?.data || err.message);
    process.exit(1);
  }
})();
