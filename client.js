const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');
const readJson = require("r-json");
// const shell = require('shelljs');
const { exec } = require("child_process");
const https = require('https');
const http = require('http');
const express = require('express');
const app = express();


var ips = readJson("./ips.json")

var start = 0
var finished = 0
var socket_localhost = null

async function searchByCountries(title, id_video, public = true) {
    start = performance.now()
    
    for (const [cell, ipscell] of Object.entries(ips)) {
        for (let a = 0; a < ipscell.length-1; ++a) {
            let ip = "https://" + ipscell[a] + "/"
            let country = cell

            search(title, id_video, ip, country, public, start, performance.now())
        }
    }

    if(socket_localhost !== null){
        socket_localhost.emit("update-graphs-finished")
    }
}

async function search(title, id_video, ip, country, public, start, start_request, num_callback=0) {
    return new Promise((resolve, reject) => {
        https.get(ip + 'results?search_query=' + title, {
            headers: { host: 'www.youtube.com' }
        }, res => {
            res.setEncoding('utf8')
            var data = ''
            res.on('data', function(chunk) {
                data += chunk
            })
            res.on('end', function() {
                let public_ok, private_ok, ok

                let found_title = false
                if(data.includes(id_video)){ // check if the id is inside the result found
                    found_title = true
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
                // console.log(ok === false ? "Failed" : "", parseInt(t1 - start_request), country)
                
                resolve([ok, parseInt(t1 - start_request)])
            })
        }).on('error', error => {
            reject(error.message)
        })
    }).then(data =>{
        if(data[0] === false) {
            return search(title, id_video, ip, country, public, start, start_request, num_callback+1)
        } else {
            console.log(data[1], country, num_callback)
            // query name, country, result search, time from start to end of the request, time from start function call to end request
            if(socket_localhost !== null){
                socket_localhost.emit("update-graphs", country, data[0] === true, data[1], parseInt(performance.now() - start))
            }
            return data
        }
    }).catch(err =>{
        console.error(err)
    })
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

    // TODO instead of yarn start, would be better to have a react build of it, and run it with express in some port
    exec('cd client && yarn start')
}

const io = require('socket.io-client');
const server = io.connect('https://youtube.sebastienbiollo.com')

server.on("connect", () => {
    if(argv._.includes("upload")){
        server.emit("upload-video")
    }

    server.on("upload-video-server", async (title, id_video) => {
        searchByCountries(title, id_video, true)
    })

    server.on("my-videos-server", () => {
        // TODO idk if i can use this
    })

    // TODO socket.on privacy-status-server
    // TODO socket.on live-stream-server
})