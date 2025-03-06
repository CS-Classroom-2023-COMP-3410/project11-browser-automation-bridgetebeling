const puppeteer = require('puppeteer');
const fs = require('fs');

const CREDENTIALS_PATH = './credentials.json';
const REPO_LIST = [
    'cheeriojs/cheerio',
    'axios/axios',
    'puppeteer/puppeteer'
];
const STARRED_LIST_NAME = "Node Libraries";
const STARRED_LIST_DESCRIPTION = "A collection of useful Node.js libraries.";

(async () => {
    console.log("🚀 Script started...");

    // Read credentials
    console.log("🔍 Reading credentials...");
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error("❌ ERROR: credentials.json file not found!");
        process.exit(1);
    }
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

    console.log("🟢 Launching browser...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setDefaultTimeout(20000);

    console.log("🌍 Navigating to GitHub login...");
    await page.goto('https://github.com/login', { waitUntil: 'networkidle2' });

    console.log("✏️ Logging in...");
    await page.type('#login_field', credentials.username, { delay: 50 });
    await page.type('#password', credentials.password, { delay: 50 });
    await page.click('[name="commit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const starsPage = `https://github.com/${credentials.username}?tab=stars`;
    console.log("🌟 Navigating to starred repositories page...");
    await page.goto(starsPage, { waitUntil: 'networkidle2' });

    console.log("➕ Clicking 'Create list' button...");
    await page.waitForSelector('summary.btn-primary');
    await page.click('summary.btn-primary');

    console.log("✏️ Typing new list name...");
    await page.waitForSelector('input[name="user_list[name]"]');
    await page.type('input[name="user_list[name]"]', STARRED_LIST_NAME, { delay: 100 });

    // Explicitly trigger GitHub validation event
    await page.evaluate(() => {
        const input = document.querySelector('input[name="user_list[name]"]');
        input.value += ' ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.value = input.value.trim();
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    console.log("📝 Adding list description...");
    await page.waitForSelector('textarea[name="user_list[description]"]');
    await page.type('textarea[name="user_list[description]"]', STARRED_LIST_DESCRIPTION, { delay: 50 });

    console.log("⏳ Ensuring the 'Create' button is enabled...");
    await page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"].Button--primary.Button--medium');
        return btn && !btn.disabled;
    }, { timeout: 10000 });

    console.log("✅ Submitting form by pressing Enter key...");
    await page.focus('input[name="user_list[name]"]');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(3000); // Give time for GitHub to process

    console.log(`🎉 List \"${STARRED_LIST_NAME}\" created successfully!`);

    await browser.close();
})();