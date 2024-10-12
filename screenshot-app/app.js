import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const port = 9191;

app.use(express.json());

app.get('/healthz', async (req, res) => {
  res.status(200).json({});
});

app.post('/screenshot', async (req, res) => {
  const { url, height } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new"
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    if (height) {
      await page.setViewport({ width: 1200, height: parseInt(height, 10) });
    }

    const screenshot = await page.screenshot({ encoding: 'base64' });
    await browser.close();

    res.json({ image: screenshot });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ error: 'Error taking screenshot' });
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
