const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
var fs = require('fs');
const ProxyList = require('free-proxy');
const proxyList = new ProxyList()
const request = require("request");

const options = {
    url: "http://2404:6800:4003:c00::be",
    method: "GET",
    // proxy: "http://89.38.97.224:5836"
}

var t0 = performance.now()
request(options, function (error, response, html) {
    if (error) {
        console.log(error)
    }
    if (!error && response.statusCode == 200) {
        console.log(response)
        var t1 = performance.now()
        console.log(parseInt(t1 - t0))
    }
})

// async function search(proxy_server) {    
//     const browser = await puppeteer.launch({
//         headless: false,
//         ignoreHTTPSErrors: true,
//         args: ['--no-sandbox', `--proxy-server=${proxy_server}`]
//     }) // { headless: false }
//     const page = await browser.newPage()

//     await page.goto('http://www.freeproxylists.net/?pr=HTTPS&a[]=0&s=u&page=2', { waitUntil: ['domcontentloaded'], timeout: 60000000 })

//     let bodyHTML = await page.evaluate(() => document.body.innerHTML)
//     console.log(bodyHTML)
// }

// search(options.proxy)

// const https = require('https');

// https.get('https://74.125.24.190', {
//     headers: { host: 'www.youtube.com' }
// }, res => {
//     res.setEncoding('utf8');
//     res.on('data', function (chunk) {
//         console.log('BODY: ' + chunk);
//     });
// }).on('error', e => {
//     console.log('E', e.message);
// });