/*
Apache header:

  Copyright 2020 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const path = require("path")
const { performance } = require("perf_hooks")
const readJson = require("r-json")
const { exec } = require("child_process")
const https = require("https")
const http = require("http")
const express = require("express")
const app = express()

var ips = readJson(path.resolve(__dirname, "ips.json"))
var config = readJson(path.resolve(__dirname, "config.json"))

var socketLocalhost = null

async function searchOnAllCells({title, videoId, description, isPublic, searchOnlyId}={}) {
    var promises = []
    for (const [cellName, ipscell] of Object.entries(ips)) {
        for (let i = 0; i < ipscell.length - 1; ++i) {
            let ip = "https://" + ipscell[i] + "/"

            promises.push(
                new Promise((resolve) => {
                    searchVideoByTitle({
                        title, 
                        videoId, 
                        description, 
                        ip, 
                        cellName, 
                        isPublic, 
                        startRequest: performance.now(), 
                        searchOnlyId
                    })
                        .then((data) => {
                            data = {
                                success: data[0],
                                time: data[1],
                                title,
                                description,
                                videoId,
                                ip,
                                cellName,
                                isPublic,
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

async function searchMultipleParameters(title, videoId, description="", isPublic=true, searchOnlyId=true) {
    searchOnAllCells({
        title, 
        videoId, 
        description, 
        isPublic, 
        searchOnlyId
    }).then((data) => {
        let any_errors = false
        for(let i = 0; i < data.length; ++i){
            if(data[i].success === false){
                // TODO: Alert
                console.error("ALERT", data[i])
                any_errors = true
            }
        }
        if(!any_errors){
            console.log("Everything is working!")
        }
    })
}

async function multipleDaysSearch(title, videoId) {
    var start = performance.now()
    var interval = window.setInterval(() => {
        if (performance.now() - start >= config.DAYS_OF_SEARCH_IN_MILLISECONDS) {
            window.clearInterval(interval)
        }
        searchMultipleParameters({
            title: title, 
            videoId: videoId,
            searchOnlyId: true,
        })
    }, config.INTERVAL_SEARCH_DAYS_IN_MILLISECONDS)
}

async function searchVideoByTitle({title, videoId, description, ip, cellName, isPublic, startRequest, searchOnlyId}={}) { 
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
                    let idFound = false
                    if (data.includes(videoId)) { // check if the id is inside the result found
                        idFound = true
                    }

                    if(searchOnlyId === true){
                        resolve([idFound, parseInt(performance.now() - startRequest)])
                    }

                    let ok = false
                    if(!isPublic && !idFound) ok = true
                    if(isPublic && idFound && data.includes(description)) ok = true

                    resolve([ok, parseInt(performance.now() - startRequest)])
                })
            }
        )
        .on("error", (error) => {
            reject(error.message)
        })
    })
        .then((data) => {
            if (data[0] === false) {
                let timeout
                if(searchOnlyId === true){
                    timeout = config.SEARCH_ID_TIMEOUT_IN_MILLISECONDS
                } else {
                    timeout = config.SEARCH_ID_AND_FEATURES_TIMEOUT_IN_MILLISECONDS
                }
                
                if (data[1] >= timeout) {
                    // exceeded the double of the average to find the id of the video
                    return data
                }
                return searchVideoByTitle({
                    title, 
                    videoId, 
                    description, 
                    ip, 
                    cellName, 
                    isPublic, 
                    startRequest,
                    searchOnlyId
                })
            } else {
                // query name, cellName, result search, 
                if (socketLocalhost !== null) {
                    console.log("send data to graphs\nCell name:", cellName, 
                        "\nDid it found the result:", data[0] === true, "\nTime from start to end of the request", data[1])
                    socketLocalhost.emit("update-graphs", cellName, data[0] === true, data[1])
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
        "Upload a random video and search it until all ips found it"
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

if ((argv._.length === 0 || argv._.length > 1) || 
    (argv._[0] !== "upload-basic" && argv._[0] !== "upload-days" && argv._[0] !== "upload-update")) {
    yargs.showHelp()
    return
}

if (argv.webserver) {
    var localServerio = http.createServer(app)
    var localServer = require("socket.io")(localServerio)

    localServer.on("connection", (socket) => {
        socketLocalhost = socket
    })

    localServerio.listen(config.CLIENT_WEBSERVER_PORT, () => {
        console.log("listening on port", config.CLIENT_WEBSERVER_PORT)
    })

    // TODO instead of yarn start, would be better to have a react build of it, and run it with express in some port
    var pathClient = path.resolve(__dirname, "client/")
    exec("cd " + pathClient + " && npm run start")
}

const io = require("socket.io-client")
const server = io.connect("http://localhost:"+config.SERVER_PORT)

server.on("connect", () => {
    if (argv._[0] === "upload-basic" || argv._[0] === "upload-days") {
        server.emit("upload-video")
    } else if(argv._[0] === "upload-update") {
        server.emit("upload-video-and-update")
    }

    server.on("upload-video-server", async (title, videoId) => {
        if (argv._[0] === "upload-basic") {
            searchMultipleParameters(title, videoId)
        } else if (argv._[0] === "upload-days") {
            multipleDaysSearch(title, videoId)
        }
    })

    server.on("upload-video-and-update-server", async (title, videoId, description, privacyStatus) => {
        if (argv._[0] === "upload-update") {
            searchMultipleParameters(title, videoId, description, privacyStatus, false)
        }
    })
})
