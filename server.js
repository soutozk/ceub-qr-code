const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/qrcode', async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto('https://ea.uniceub.br/', { waitUntil: 'networkidle2' });

    await page.type('#coAcesso', process.env.CEUB_USER);
    await page.type('#coSenha', process.env.CEUB_PASS);
    await page.click('#btn-login');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const qrData = await page.evaluate(async () => {
      const r = await fetch('/Home/GetQrCode');
      return await r.json();
    });

    if (!qrData || !qrData.QRCode) throw new Error('QR Code não retornado');

    res.json({ qrcode: qrData.QRCode });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
