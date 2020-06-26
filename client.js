const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
const readJson = require("r-json");
// const shell = require('shelljs');
const { exec } = require("child_process");
const http = require('http');
const express = require('express');
const app = express();


var ips = readJson("./ips.json")

var start = 0
var finished = 0
var cap = 0
var socket_localhost = null

async function searchByCountries(title, public = true) {
    start = performance.now()
    
    for (const [cell, ipscell] of Object.entries(ips)) {
        for (let a = 0; a < ipscell.length-1; ++a) {
            let ip = "http://" + ipscell[a] + "/"
            let country = cell

            let res = await search(title, ip, country, public)
            let EndRequest = performance.now()

            if (res[0] === true && finished === 0) {
                finished = performance.now()
                // console.log("########", parseInt(finished - start), "ms from start to the first country correct ########")
            }

            // query name, country, result search, time from start to end of the request, time from start function call to end request
            if(socket_localhost !== null){
                socket_localhost.emit("update-graphs", country, res[0] === true, res[1], parseInt(EndRequest - start))
            }
        }
    }

    if(socket_localhost !== null){
        socket_localhost.emit("update-graphs-finished")
    }
}

async function search(title, ip, country, public = true) {
    return new Promise((resolve, reject) => {
        var t0 = performance.now()

        http.get(ip + 'results?search_query=' + title, {
            headers: { host: 'www.youtube.com' }
        }, res => {
            res.setEncoding('utf8')
            var data = ''
            res.on('data', function(chunk) {
                data += chunk
            })
            res.on('end', function() {
                let public_ok, private_ok, ok
                
                data = data.split("\n")
                let found_title = false
                for (let a = 0; a < data.length; ++a) {
                    if (data[a].includes(title)) { // check if the title is inside the result found
                        found_title = true
                        break
                    }
                }

                if (found_title === true) {
                    public_ok = true
                    private_ok = false
                } else {
                    public_ok = false
                    private_ok = true
                }

                if ((public === true && public_ok === true) || (public === false && private_ok === true)) {
                    ok = true
                } else {
                    ok = false
                }

                var t1 = performance.now()
                console.log(ok === false ? "Failed" : "", parseInt(t1 - t0), country)
                
                resolve([ok, parseInt(t1 - t0)])
            })
        }).on('error', error => {
            reject(error.message)
        })
    }).then(data =>{
        return data
    }).catch(err =>{
        console.error(err)
    })
}

async function search_puppeteer(title, ip, country, public = true) {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        // args: ['--no-sandbox' ]
    }) // { headless: false }

    const page = await browser.newPage()

    var t0 = performance.now()

    // TODO aggiungi host paramenter

    // await page.setExtraHTTPHeaders({ 'Host': "www.youtube.com", "host": "www.youtube.com" })

    await page.setRequestInterception(true)
    page.on('request', request => {
        if (!request.isNavigationRequest()) {
            request.continue()
            return
        }
        const headers = request.headers()
        headers['host'] = "www.youtube.com"
        request.continue({ headers })
    })
    await page.goto(ip, { waitUntil: ['domcontentloaded'] })

    await page.evaluate((title) => {
        document.querySelector('input#search').value = title
    }, title)

    var counter = 0
    while (true) {
        await page.click("#search-icon-legacy")
        await page.waitForNavigation({ waitUntil: ['domcontentloaded'], timeout: 60000000 })

        try {
            var data = await page.evaluate(() => document.querySelector('#video-title').outerHTML)
            let public_ok, private_ok

            if (data === null || data === undefined) { // if doesn't find anything
                public_ok = false
                private_ok = true
            } else { // if find something
                data = data.split("\n")
                let found_title = false
                for (let a = 0; a < data.length; ++a) {
                    if (data[a].includes(title)) { // check if the title is inside the result found
                        found_title = true
                        break
                    }
                }

                if (found_title === true) {
                    public_ok = true
                    private_ok = false
                } else {
                    public_ok = false
                    private_ok = true
                }
            }

            if ((public === true && public_ok === true) || (public === false && private_ok === true)) {
                break
            }
        } catch (e) {
            if (public === false) { // "Cannot read property 'outerHTML' of null" so it mean that didn't found any results, and if it's private is correct
                break
            }
        }

        counter++
        if (counter > cap) {
            break
        }
    }

    var t1 = performance.now()
    console.log(counter > cap ? "Failed" : "", parseInt(t1 - t0), country, counter)

    await browser.close()

    if (counter <= cap) {
        return [true, parseInt(t1 - t0)]
    }
    return [false, parseInt(t1 - t0)]
}

const yargs = require('yargs');
const argv = yargs
    .command('upload', 'Upload a random video')
    .command('live', 'Create a live stream')
    .command('privacy', 'Change privacy of a video by id', {
        id: {
            description: 'The id of the video',
            alias: 'id',
        },
        status: {
            description: 'Choose public or private',
            alias: 's',
        }
    })
    .option('webserver', {
        alias: 'ws',
        type: 'boolean',
        description: 'Run local web server to show graphs of the data collected'
    })
    .help()
    .alias('help', 'h')
    .argv


if(argv.webserver) {
    var localServerio = http.createServer(app)
    var localServer = require('socket.io')(localServerio)

    localServer.on('connection', (socket) => {
        socket_localhost = socket
    })

    localServerio.listen(9001, () => {
        console.log("listening on localhost:9001")
    })

    // 10 sec timeout because react is slow to start
    setTimeout(() => {
        searchByCountries("test", true)
    }, 10000)


    // TODO instead of yarn start, would be better to have a react build of it, and run it with express in some port
    exec('cd client && yarn start')
}

const io = require('socket.io-client');
const server = io('https://youtube.sebastienbiollo.com')
server.on('connection', (socket) => {
    
    if(argv._.includes("upload")){
        socket.emit("upload-video")
    }

    socket.on("upload-video-server", async (title) => {
        searchByCountries(title, true)
    })

    socket.on("my-videos-server", () => {
        // TODO non so se serve
    })

    // TODO socket.on privacy-status-server
    // TODO socket.on live-stream-server
})
server.on('disconnect', () => {})