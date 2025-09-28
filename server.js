// server.js

import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3000;

// JSONボディをパースするためにミドルウェアを設定
app.use(express.json());

// 💡 CORS (Cross-Origin Resource Sharing) を有効にする
// クライアントのHTMLファイルからのリクエストを許可するために必要
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Puppeteerの起動オプション (ヘッドレスモード推奨)
const PUPPETEER_LAUNCH_OPTIONS = {
  headless: true, // GUIなし（本番環境/サーバー環境で推奨）
  args: [
    '--no-sandbox', 
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ],
};

/**
 * 指定されたURLをスクレイピングし、ページ全体のテキストを取得する関数
 * @param {string} url - スクレイピング対象のURL
 * @returns {Promise<string>} ページから抽出されたすべてのテキスト
 */
async function scrapeUrl(url) {
  let browser;
  try {
    // ブラウザを起動
    browser = await puppeteer.launch(PUPPETEER_LAUNCH_OPTIONS);
    const page = await browser.newPage();

    // ネットワークアイドルまで待機
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 }); // タイムアウトを30秒に設定

    // <body>要素内のすべてのテキストコンテンツを取得
    const fullText = await page.evaluate(() => {
      const body = document.body;
      if (!body) return '';
      // 要素内のテキストを結合して返す
      return body.innerText;
    });

    return fullText;

  } catch (error) {
    console.error(`[Puppeteer Error] URL: ${url} -> ${error.message}`);
    // エラーメッセージをクライアントに返すために例外をスロー
    throw new Error(`スクレイピング処理中にエラーが発生しました: ${error.message}`);
  } finally {
    // ブラウザを必ず閉じる
    if (browser) {
      await browser.close();
    }
  }
}

// スクレイピングリクエストを受け付けるエンドポイント
app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ error: '有効なURL (httpまたはhttpsで始まる) が指定されていません。' });
  }

  console.log(`[Request] Scrape target: ${url}`);

  try {
    const scrapedText = await scrapeUrl(url);
    
    // 取得した全行のテキストをクライアントに返す
    res.status(200).send(scrapedText);
    
  } catch (error) {
    // スクレイピング関数からのエラーをクライアントに返す
    res.status(500).json({ error: error.message });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーは http://localhost:${PORT} で起動しました。`);
  console.log(`サーバーを実行した後、client.htmlをブラウザで開いてください。`);
});
