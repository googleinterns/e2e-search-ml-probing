const puppeteer = require("puppeteer")
const { performance } = require("perf_hooks")
const readJson = require("r-json")
const { exec } = require("child_process")
const https = require("https")
const http = require("http")
const express = require("express")
const app = express()

var ips = readJson("./ips.json")

var socket_localhost = null

async function basicSearch(title, id_video, public = true) {
    var start = performance.now()
    var promises = []
    for (const [cell, ipscell] of Object.entries(ips)) {
        for (let a = 0; a < ipscell.length - 1; ++a) {
            let ip = "https://" + ipscell[a] + "/"
            let country = cell

            promises.push(
                new Promise((resolve) => {
                    searchId(
                        title,
                        id_video,
                        ip,
                        country,
                        public,
                        start,
                        performance.now()
                    )
                        .then((data) => {
                            data = {
                                success: data[0],
                                time: data[1],
                                num_callbacks: data[2],
                                title,
                                id_video,
                                ip,
                                country,
                            }
                            resolve(data)
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            )
        }
    }
    return Promise.all(promises)
}

async function mutilpleDaySearch(title, id_video, public = true) {
    var start = performance.now()
    var interval = window.setInterval(() => {
        if (performance.now() - start >= 86400000 * 3) { // 3 days
            window.clearInterval(interval)
        }
        basicSearch(title, id_video, public).then((data) => { })
    }, 3600000) // hourly
}

async function searchMultipleParameters(title, id_video, public = true) { }

async function searchId(
    title,
    id_video,
    ip,
    country,
    public,
    start,
    start_request,
    num_callback = 0
) {
    return new Promise((resolve, reject) => {
        https
            .get(
                ip + "results?search_query=" + title,
                {
                    headers: { host: "www.youtube.com" },
                },
                (res) => {
                    res.setEncoding("utf8")
                    var data = ""
                    res.on("data", function (chunk) {
                        data += chunk
                    })
                    res.on("end", function () {
                        let public_ok, private_ok, ok

                        let found_title = false
                        if (data.includes(id_video)) {
                            // check if the id is inside the result found
                            found_title = true
                        }

                        if (found_title === true) {
                            public_ok = true
                            private_ok = false
                        } else {
                            public_ok = false
                            private_ok = true
                        }

                        if (
                            (public === true && public_ok === true) ||
                            (public === false && private_ok === true)
                        ) {
                            ok = true
                        } else {
                            ok = false
                        }

                        var t1 = performance.now()
                        // console.log(ok === false ? "Failed" : "", parseInt(t1 - start_request), country)

                        resolve([
                            ok,
                            parseInt(t1 - start_request),
                            num_callback,
                        ])
                    })
                }
            )
            .on("error", (error) => {
                reject(error.message)
            })
    })
        .then((data) => {
            if (data[0] === false) {
                if (performance.now() - start_request >= 2000) { // 2 minutes 120000
                    // TODO: ALERT
                    return data
                }

                return searchId(
                    title,
                    id_video,
                    ip,
                    country,
                    public,
                    start,
                    start_request,
                    num_callback + 1
                )
            } else {
                console.log(data[1], country, num_callback)
                // query name, country, result search, time from start to end of the request, time from start function call to end request
                if (socket_localhost !== null) {
                    socket_localhost.emit(
                        "update-graphs",
                        country,
                        data[0] === true,
                        data[1],
                        parseInt(performance.now() - start)
                    )
                }
                return data
            }
        })
        .catch((err) => {
            console.error(err)
        })
}

const yargs = require("yargs")
const argv = yargs
    .command(
        "upload-basic",
        "Upload a random video and search it unitl all ips found it"
    )
    .command(
        "upload-update",
        "Upload a random video, wait for the upload, update the video and then search it"
    )
    .command(
        "upload-days",
        "Upload a random video and keep searching for it for 3 days"
    )
    // .command('live', 'Create a live stream')
    // .command('privacy', 'Change privacy of a video by id', {
    //     id: {
    //         description: 'The id of the video',
    //         alias: 'id',
    //     },
    //     status: {
    //         description: 'Choose public or private',
    //         alias: 's',
    //     }
    // })
    .option("webserver", {
        alias: "ws",
        type: "boolean",
        description:
            "Run local web server to show graphs of the data collected",
    })
    .help()
    .alias("help", "h").argv

if (argv.webserver) {
    var localServerio = http.createServer(app)
    var localServer = require("socket.io")(localServerio)

    localServer.on("connection", (socket) => {
        socket_localhost = socket
    })

    localServerio.listen(9001, () => {
        console.log("listening on localhost:9001")
    })

    // TODO instead of yarn start, would be better to have a react build of it, and run it with express in some port
    exec("cd client && yarn start")
}

const io = require("socket.io-client")
const server = io.connect("https://youtube.sebastienbiollo.com")

server.on("connect", () => {
    if (
        argv._.includes("upload-basic") ||
        argv._.includes("upload-update") ||
        argv._.includes("upload-days")
    ) {
        server.emit("upload-video")
    }

    server.on("upload-video-server", async (title, id_video) => {
        console.log(title, id_video)

        if (argv._.includes("upload-basic")) {
            basicSearch(title, id_video, true)
        } else if (argv._.includes("upload-update")) {
            searchMultipleParameters(title, id_video, true)
        } else if (argv._.includes("upload-days")) {
            mutilpleDaySearch(title, id_video, true)
        }
    })
})
