const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
var fs = require('fs');
var countries = JSON.parse(fs.readFileSync('countries.json', 'utf8'))

function shuffle(a) {
    var j, x, i
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1))
        x = a[i]
        a[i] = a[j]
        a[j] = x
    }
    return a
}

var start = 0
var finished = 0
var cap = 0

async function searchByCountries(socket, title, threshold = 50, public = true) {
    console.log("start searchByCountries")

    start = performance.now()
    shuffle(countries)
    for (let a = 0; a < countries.length; ++a) {
        let coords = countries[a]['latlng']
        let country = countries[a]['name']

        let res = await search(title, coords[0], coords[1], country, public)
        let EndRequest = performance.now()

        if (res[0] === true && finished === 0) {
            finished = performance.now()
            console.log("########", parseInt(finished - start), "ms from start to the first country correct ########")
        }

        // query name, country, result search, time from start to end of the request, time from start function call to end request
        socket.emit("update-graphs", country, res[0] === true, res[1], parseInt(EndRequest - start))

        if (a > threshold) {
            break
        }
    }
    console.log("Finished")

    socket.emit("update-graphs-finished")
}

async function search(title, latitude, longitude, country, public = true) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
     }) // { headless: false }
    const page = await browser.newPage()

    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.youtube.com/", [
        'geolocation'
    ])

    await page.goto('https://www.youtube.com/', { waitUntil: ['domcontentloaded'] })

    await page.setGeolocation({
        latitude: latitude,
        longitude: longitude,
        accuracy: 100,
    })
    // await page.setExtraHTTPHeaders({'Accept-Language': 'bn'});

    var t0 = performance.now()

    await page.evaluate((title) => {
        document.querySelector('input#search').value = title
    }, title)

    var counter = 0
    while (true) {
        await page.click("#search-icon-legacy")
        await page.waitForNavigation({ waitUntil: ['domcontentloaded'] })

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

module.exports.searchByCountries = searchByCountries