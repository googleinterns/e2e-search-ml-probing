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

async function _basicSearch(title, id_video) {
    var start = performance.now()
    var promises = []
    for (const [cell, ipscell] of Object.entries(ips)) {
        for (let a = 0; a < ipscell.length - 1; ++a) {
            let ip = "https://" + ipscell[a] + "/"
            let country = cell

            promises.push(
                new Promise((resolve) => {
                    searchId(title, id_video, ip, country, start, performance.now())
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

async function basicSearch(title, id_video) {
    _basicSearch(title, id_video).then((data) => {
        for(let a = 0; a < data.length; ++a){
            if(data[a].success === false){
                // TODO: Alert
                console.error("ALERT", data[a])
            }
        }
    })
}

async function mutilpleDaySearch(title, id_video) {
    var start = performance.now()
    var interval = window.setInterval(() => {
        if (performance.now() - start >= 86400000 * 3) { // 3 days
            window.clearInterval(interval)
        }
        basicSearch(title, id_video)
    }, 3600000) // hourly
}

async function _searchMultipleParameters(title, id_video, description, is_public) {
    var start = performance.now()
    var promises = []
    for (const [cell, ipscell] of Object.entries(ips)) {
        for (let a = 0; a < ipscell.length - 1; ++a) {
            let ip = "https://" + ipscell[a] + "/"
            let country = cell

            promises.push(
                new Promise((resolve) => {
                    searchIdAndFeatures(title, id_video, description, ip, country, is_public, start, performance.now())
                        .then((data) => {
                            data = {
                                success: data[0],
                                time: data[1],
                                num_callbacks: data[2],
                                title,
                                description,
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

async function searchMultipleParameters(title, id_video, description, is_public = true) {
    _searchMultipleParameters(title, id_video, description, is_public).then((data) => {
        for(let a = 0; a < data.length; ++a){
            if(data[a].success === false){
                // TODO: Alert
                console.error("ALERT", data[a])
            }
        }
    })
}

async function searchIdAndFeatures(title, id_video, description, ip, country, is_public, start, start_request, num_callback = 0) { 
    return new Promise((resolve, reject) => {
        https.get(ip + "results?search_query=" + title,
            { headers: { host: "www.youtube.com" } },
            (res) => {
                res.setEncoding("utf8")
                var data = ""
                res.on("data", function (chunk) {
                    data += chunk
                })
                res.on("end", function () {
                    let public_ok, private_ok, ok

                    let id_found = false
                    if (data.includes(id_video)) { // check if the id is inside the result found
                        id_found = true
                    }

                    if (id_found === true) {
                        public_ok = true
                        private_ok = false
                    } else {
                        public_ok = false
                        private_ok = true
                    }

                    if((is_public === false && private_ok === true)) { // if it's private and doesn't find the video id is ok
                        ok = true
                    } else if((is_public === true && public_ok === true)) { // if it's public and find the video id
                        if(data.includes(description)) { // it must also contain the description to be ok
                            ok = true
                        } else { // otherwise no
                            ok = false
                        }
                    } else { // if is not the previous 2 cases it means is not correct
                        ok = false
                    }

                    var t1 = performance.now()
                    resolve([ok, parseInt(t1 - start_request), num_callback])
                })
            }
        )
        .on("error", (error) => {
            reject(error.message)
        })
    })
        .then((data) => {
            if (data[0] === false) {
                if (performance.now() - start_request >= 300000) { // 5 minutes 
                    // exceeded the double of the average to find the id of the video
                    return data
                }
                return searchIdAndFeatures(title, id_video, description, ip, country, is_public, start, start_request, num_callback + 1)
            } else {
                // query name, country, result search, time from start to end of the request, time from start function call to end request
                if (socket_localhost !== null) {
                    socket_localhost.emit("update-graphs", country, data[0] === true, data[1], parseInt(performance.now() - start))
                }
                return data
            }
        })
        .catch((err) => {
            console.error(err)
        })
}

async function searchId(title, id_video, ip, country, start, start_request, num_callback = 0) {
    return new Promise((resolve, reject) => {
        https.get(ip + "results?search_query=" + title,
            { headers: { host: "www.youtube.com" } },
            (res) => {
                res.setEncoding("utf8")
                var data = ""
                res.on("data", function (chunk) {
                    data += chunk
                })
                res.on("end", function () {
                    let id_found = false
                    if (data.includes(id_video)) { // check if the id is inside the result found
                        id_found = true
                    }
                    var t1 = performance.now()
                    resolve([id_found, parseInt(t1 - start_request), num_callback])
                })
            }
        )
        .on("error", (error) => {
            reject(error.message)
        })
    })
        .then((data) => {
            if (data[0] === false) {
                if (performance.now() - start_request >= 120000) { // 2 minutes 
                    // exceeded the double of the average to find the id of the video
                    return data
                }
                return searchId(title, id_video, ip, country, start, start_request, num_callback + 1)
            } else {
                // query name, country, result search, time from start to end of the request, time from start function call to end request
                if (socket_localhost !== null) {
                    socket_localhost.emit("update-graphs", country, data[0] === true, data[1], parseInt(performance.now() - start))
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
        "Upload a random video, wait for the upload, update the video (change title, description etc.) and then search it"
    )
    .command(
        "upload-days",
        "Upload a random video and keep searching for it for 3 days"
    )
    .option("webserver", {
        alias: "ws",
        type: "boolean",
        description: "Run local web server to show graphs of the data collected",
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
    if (argv._.includes("upload-basic") || argv._.includes("upload-days")) {
        server.emit("upload-video")
    }

    if(argv._.includes("upload-update")) {
        server.emit("upload-video-and-update")
    }

    server.on("upload-video-server", async (title, id_video) => {
        console.log(title, id_video)

        if (argv._.includes("upload-basic")) {
            basicSearch(title, id_video, true)
        } else if (argv._.includes("upload-days")) {
            mutilpleDaySearch(title, id_video, true)
        }
    })

    server.on("upload-video-and-update-server", async (title, id_video, description, privacyStatus) => {
        console.log(title, id_video, description, privacyStatus)

        if (argv._.includes("upload-update")) {
            searchMultipleParameters(title, id_video, description, privacyStatus)
        }
    })
})
