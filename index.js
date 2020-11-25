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
 * { function_description }
 *
 * @param      {JSDOM}  html    The html
 */
const parseHTML = (html) => {
    const document = html.window.document;

    // remove sidebar
    document.querySelector('app-sidebar').remove();

    // adjust margin to account for removed sidebar
    document.querySelector('.docs-content').setAttribute('style', 'margin-left:0 !important;');

    // remove top bar
    document.querySelector('.header').remove();

    // remove 'base' tag since it's messing with urls
    document.querySelectorAll('base').forEach((e) => e.remove());

    // replace all URLs to point to internal documents instead
    for (const link of document.querySelectorAll('a[href*="https://developers.homebridge.io/#/"]')) {
        link.setAttribute('href', './' + createNameFromURL(link.getAttribute('href')) + '.html');
    }

    return html;
};

const downloadPage = async (url, output) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'load' });

    const title = await page.title();
    console.log(title);

    const html = await page.content();

    const cdp = await page.target().createCDPSession();
    const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });

    const htmlDoc = mhtml2html.convert(data, { parseDOM: (html) => new JSDOM(html) });
    const parsedHtml = parseHTML(htmlDoc);

    fs.writeFileSync(`docs/${output}.html`, parsedHtml.serialize(), 'utf-8');

    await browser.close();
    return;
};

const parseSitemap = async (res) => {
    const resText = await res.text();
    for (const el of resText.split('\n')) {
        console.log(`${el} => dist/${createNameFromURL(el)}.html`);
        await downloadPage(el, createNameFromURL(el));
    }
};

fetch(SITEMAP_URL).then(parseSitemap);
