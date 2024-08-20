const puppeteer = require('puppeteer');

// 創建自定義等待函數
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    // 啟動 Puppeteer 並打開一個新頁面
    const browser = await puppeteer.launch({ headless: false }); // headless: false 使瀏覽器可見
    const page = await browser.newPage();

    // 進入 Google 首頁
    await page.goto('https://www.google.com');

    // 增加額外的等待時間以確保頁面加載
    await wait(3000); // 等待3秒
    // await page.waitForTimeout(3000);
    // await page.W

    // 確認搜尋框的存在，更新為新的選擇器
    let searchBox = await page.$('textarea[name="q"]');
    if (!searchBox) {
        console.error('搜尋框未找到。請檢查選擇器。');
        await browser.close();
        return;
    }

    // 清空搜尋框，然後輸入關鍵字
    await searchBox.click({ clickCount: 3 }); // 選擇並清空搜尋框內容
    await searchBox.type('Puppeteer', { delay: 100 }); // 輸入關鍵字，模擬打字延遲

    // 模擬按下 Enter 鍵進行搜尋
    await page.keyboard.press('Enter');

    // 等待搜尋結果頁面加載完成
    await page.waitForSelector('h3', { timeout: 10000 });

    // 截圖搜尋結果頁面
    await page.screenshot({ path: 'search_results.png' });

    // 打印搜尋結果標題
    const results = await page.evaluate(() => {
        let items = [];
        let results = document.querySelectorAll('h3');
        results.forEach((result, index) => {
            if (index < 10) {  // 只取前10個結果
                items.push(result.innerText);
            }
        });
        return items;
    });
    console.log(results);

    // 關閉瀏覽器
    await browser.close();
})();
