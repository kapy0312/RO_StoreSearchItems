const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');


//開起根目錄網頁
//=======================================
const server = http.createServer((req, res) => {

    const parsedUrl = url.parse(req.url);

    let filePath = '.' + req.url;
    if (filePath === './') {
        // filePath = './index.html';
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    //當收到網頁回傳資料
    //=======================================
    if (req.method === 'POST') {

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // 将请求数据拼接起来
        });

        req.on('end', async () => {
            const ClientData = JSON.parse(body); // 解析 JSON 格式的请求数据
            const DataArray = Object.values(ClientData);

            if (parsedUrl.pathname === '/DataQuery') {
                // const browser = await puppeteer.launch({ headless: false });
                // const RetrunData = await searchKeyword(browser, DataArray);

                //無痕
                //============================================================
                const browser = await puppeteer.launch({
                    headless: false,
                    args: ['--incognito'] // 启用无痕模式
                });

                // 无痕模式下的页面
                // const [page] = await browser.pages(); // 使用无痕模式的页面

                // 使用无痕模式的页面进行关键词搜索
                const RetrunData = await searchKeyword(browser, DataArray);

                // let allKeywordsData = {};

                // for (let keyword of DataArray) {
                //     console.log(`Searching for: ${keyword}`);
                //     const data = await searchKeyword(browser, keyword);
                //     allKeywordsData[keyword] = data;
                //     console.log(`Data for ${keyword}:\n`, data);
                // }

                await browser.close();
                console.log(`回傳資料:\n`, RetrunData);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(RetrunData));
            }

        });

    } else {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('404 Not Found');
                } else {
                    res.writeHead(500);
                    res.end('500 Internal Server Error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }

});

const port = process.env.PORT || 3000;
// const port = process.env.PORT || 80;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    //連線資料庫
    // client.connect();
    // console.log('成功連接到 MongoDB');
});


// 創建自定義等待函數
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchKeyword(browser, keywords) {
    let allQueryResultsData = [];

    const page = await browser.newPage();

    // 進入目標網站
    await page.goto('https://event.gnjoy.com.tw/Ro/RoShopSearch');

    // 等待網頁加載完成
    await wait(3000); // 等待3秒

    // 選擇伺服器為「波利」
    await page.click('#div_svr'); // 點擊伺服器選擇框
    await page.waitForSelector('li[value="4290"]'); // 等待伺服器選項出現
    await page.click('li[value="4290"]'); // 選擇「波利」

    // 選擇商店類型為「販售」
    await page.click('#div_storetype'); // 點擊商店類型選擇框
    await page.waitForSelector('li[value="0"]'); // 等待商店類型選項出現
    await page.click('li[value="0"]'); // 選擇「販售」


    //輸入多個關鍵字
    for (let keyword of keywords) {
        // 輸入關鍵字
        // 清空關鍵字輸入框
        await page.evaluate(() => {
            document.querySelector('#txb_KeyWord').value = '';
        });

        await page.type('#txb_KeyWord', keyword, { delay: 100 }); // 使用傳入的變數 keyword

        // 點擊搜尋按鈕
        await page.click('#searchBtn a'); // 點擊搜尋按鈕（a 標籤）

        await wait(2000); // 等待2秒

        // 獲取頁數
        var totalPages = await page.evaluate(() => {
            const pagination = document.querySelector('.pagination');
            if (pagination) {
                const pages = pagination.querySelectorAll('li a');
                if (pages.length > 3) {
                    return pages.length - 2; // 減去「上一頁」和「下一頁」
                }
            }
            return 1;
        });

        totalPages = 1; //暫時先讀取第一頁就好
        // 提取所有頁面的表格數據
        let QueryResults = [];

        for (let i = 1; i <= totalPages; i++) {
            if (i > 1) {
                // 點擊下一頁
                await page.click(`.pagination li a[onclick="javascript:goPage(${i})"]`);

                // 等待新頁面內容加載
                await wait(2000); // 等待2秒
            }

            // await wait(2000); // 等待2秒
            // 提取 <tbody id="_tbody"> 的內容
            const tableData = await page.evaluate(() => {
                let items = [];
                const rows = document.querySelectorAll('#_tbody tr');
                // 只取前三行
                for (let i = 0; i < Math.min(3, rows.length); i++) {
                    const cells = rows[i].querySelectorAll('td');
                    const rowData = Array.from(cells).map(cell => cell.innerText);
                    items.push(rowData);
                }
                // rows.forEach(row => {
                //     const cells = row.querySelectorAll('td');
                //     const rowData = Array.from(cells).map(cell => cell.innerText);
                //     items.push(rowData);
                // });
                return items;
            });

            QueryResults = QueryResults.concat(tableData);
            console.log(`Data for ${keyword}:\n`, QueryResults); // console.log 搜尋結果
        }
        allQueryResultsData.push({ keyword, data: QueryResults });
    }

    await page.close(); // 關閉當前頁面
    return allQueryResultsData;
}

// (async () => {
//     // 啟動 Puppeteer 並打開一個新頁面
//     const browser = await puppeteer.launch({ headless: false }); // headless: false 使瀏覽器可見
//     const page = await browser.newPage();

//     // 進入目標網站
//     await page.goto('https://event.gnjoy.com.tw/Ro/RoShopSearch');

//     // 等待網頁加載完成
//     await wait(3000); // 等待3秒

//     // 選擇伺服器為「波利」
//     await page.click('#div_svr'); // 點擊伺服器選擇框
//     await page.waitForSelector('li[value="4290"]'); // 等待伺服器選項出現
//     await page.click('li[value="4290"]'); // 選擇「波利」

//     // 選擇商店類型為「販售」
//     await page.click('#div_storetype'); // 點擊商店類型選擇框
//     await page.waitForSelector('li[value="0"]'); // 等待商店類型選項出現
//     await page.click('li[value="2"]'); // 選擇「販售」

//     // 輸入關鍵字「雪花」
//     await page.type('#txb_KeyWord', '乙太', { delay: 100 }); // 輸入關鍵字

//     // 點擊搜尋按鈕
//     await page.click('#searchBtn a'); // 點擊搜尋按鈕（a 標籤）

//     await wait(2000); // 等待2秒

//     // 獲取頁數
//     const totalPages = await page.evaluate(() => {
//         const pagination = document.querySelector('.pagination');
//         if (pagination) {
//             const pages = pagination.querySelectorAll('li a');
//             return pages.length - 2; // 減去「上一頁」和「下一頁」
//         }
//         return 1;
//     });

//     // 提取所有頁面的表格數據
//     let allTableData = [];

//     for (let i = 1; i <= totalPages; i++) {
//         if (i > 1) {
//             // 點擊下一頁
//             await page.click(`.pagination li a[onclick="javascript:goPage(${i})"]`);

//             // 等待新頁面內容加載
//             await wait(2000); // 等待2秒

//         }

//         // 提取 <tbody id="_tbody"> 的內容
//         const tableData = await page.evaluate(() => {
//             let items = [];
//             const rows = document.querySelectorAll('#_tbody tr');
//             rows.forEach(row => {
//                 const cells = row.querySelectorAll('td');
//                 const rowData = Array.from(cells).map(cell => cell.innerText);
//                 items.push(rowData);
//             });
//             return items;
//         });

//         allTableData = allTableData.concat(tableData);
//     }

//     // 顯示提取的數據
//     console.log('All Table Data:\n', allTableData);

//     // 關閉瀏覽器
//     await browser.close();
// })();
