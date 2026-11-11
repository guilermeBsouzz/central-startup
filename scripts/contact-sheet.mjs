// Monta uma folha de contato com capturas de qa/redesign para revisão lado a lado.
import {chromium} from '@playwright/test';import {readFile} from 'node:fs/promises';
const [, , out, width, height, ...names] = process.argv, dir = 'qa/redesign/';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
const images = await Promise.all(names.map(async name => `<img src="data:image/png;base64,${(await readFile(dir + name)).toString('base64')}">`));
await page.setContent(`<body style="margin:0;background:#333;display:flex;gap:12px;align-items:flex-start">${images.join('')}</body>`);
await page.addStyleTag({ content: `img{width:calc((100% - ${(names.length - 1) * 12}px)/${names.length});display:block}` });
await page.waitForTimeout(500); await page.screenshot({ path: dir + out }); await browser.close();
