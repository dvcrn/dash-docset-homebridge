const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const fs = require('fs');
const mhtml2html = require('mhtml2html');
const { JSDOM } = require('jsdom');

const SITEMAP_URL = 'https://developers.homebridge.io/sitemap.txt';

const createNameFromURL = (url) => {
    const spl = url.split('https://developers.homebridge.io/#/');
    let name = 'index';

    if (spl.length === 1) {
        return name;
    }

    if (spl[1].length > 0) {
        name = spl[1];
    }

    return name.replaceAll('/', '_');
};

/**
 * Cleans HTML from things we don't want in the docset
 *
 * @param      {JSDOM}  html    The html
 */
const cleanHtml = (html) => {
    const document = html.window.document;

    // remove sidebar
    document.querySelector('app-sidebar').remove();

    // adjust margin to account for removed sidebar
    document.querySelector('.docs-content').setAttribute('style', 'margin-left:0 !important;');

    // remove header/footer
    document.querySelector('.header').remove();
    document.querySelector('.footer').remove();

    // Make container 100% width
    document.querySelectorAll('.container').forEach((e) => e.setAttribute('style', 'max-width:100% !important'));

    // remove 'base' tag since it's messing with urls
    document.querySelectorAll('base').forEach((e) => e.remove());

    // replace all URLs to point to internal documents instead
    for (const link of document.querySelectorAll('a[href*="https://developers.homebridge.io/#/"]')) {
        link.setAttribute('href', './' + createNameFromURL(link.getAttribute('href')) + '.html');
    }

    return html;
};

const downloadPage = async (browser, url, output) => {
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: '/tmp/screenshot.png' });

    const html = await page.content();

    const cdp = await page.target().createCDPSession();
    const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });

    const htmlDoc = mhtml2html.convert(data, { parseDOM: (html) => new JSDOM(html) });
    const parsedHtml = cleanHtml(htmlDoc);

    fs.writeFileSync(`docs/${output}.html`, parsedHtml.serialize(), 'utf-8');

    await page.close();

    return;
};

const parseSitemap = async (res) => {
    const browser = await puppeteer.launch();
    const resText = await res.text();
    for (const el of resText.split('\n')) {
        console.log(`${el} => docs/${createNameFromURL(el)}.html`);
        await downloadPage(browser, el, createNameFromURL(el));
    }
    await browser.close();
};

fetch(SITEMAP_URL).then(parseSitemap);
