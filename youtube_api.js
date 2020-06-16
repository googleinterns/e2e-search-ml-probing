const Youtube = require("youtube-api");
const fs = require("fs");
const readJson = require("r-json");
const opn = require("opn");
const myPuppeteer = require("./puppeteer_youtube");
const { performance } = require('perf_hooks');
const fetch = require('node-fetch')
const bodyParser = require('body-parser')

const CREDENTIALS = readJson(`${__dirname}/credentials.json`)

const express = require('express')
const app = express()

app.use(bodyParser.json())

var currVideoId = ""
var currVideoTitle = ""

app.get("/", (req, res) => {
    console.log(req.body)
    console.log(req.query)
    console.log(req.query.code)
    oauth.getToken(req.query.code, (err, tokens) => {
        if (err) return console.log(err)
        oauth.setCredentials(tokens)
        res.send({})
    })
})

app.get("/upload", (req, res) => {
    uploadVideo("public", "video.mp4")
    res.send({})
})

// Example: /privacystatus?status=public or /privacystatus?status=private
app.get("/privacystatus", (req, res) => {
    changePrivacyStatus(currVideoId, req.query.status)
    res.send({})
})

// Example: /search?word=hello
app.get("/search", (req, res) => {
    searchVideoByKeyword(req.query.word)
    res.send({})
})

app.get("/search2", (req, res) => {
    loopSearchVideoByKeyword()
    res.send({})
})

app.get("/live", (req, res) => {
    liveStreaming()
    res.send({})
})

function randomStringGen(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function uploadVideo(privacystatus, source) {
    let title = randomStringGen(20)
    Youtube.videos.insert({
        resource: {
            snippet: {
                title: title,
                description: title
            },
            status: {
                privacyStatus: privacystatus
            }
        },
        part: "id,snippet,status",
        media: {
            body: fs.createReadStream(source)
        }
    }, (err, data) => {
        if (err) return console.log(err)
        currVideoId = data.id
        currVideoTitle = title

        loopSearchVideoByKeyword()

        myPuppeteer.searchByCountries(currVideoTitle, 50, privacystatus === "public")
    })
}

function changePrivacyStatus(id, status) {
    Youtube.videos.update({
        part: ["snippet,status"],
        resource: {
            id: id,
            snippet: {
                categoryId: 22,
                // description: "This description is in English.",
                // title: "I'm being changed."
            },
            status: {
                privacyStatus: status // "public", "private"
            },
        }
    }, (err, data) => {
        if (err) return console.log(err)
        myPuppeteer.searchByCountries(currVideoTitle, 50, status === "public")
    })
}

var resSearchVideoByKeyword = null
function loopSearchVideoByKeyword() {
    var start = performance.now()
    var search = setInterval(() => {
        searchVideoByKeyword(currVideoTitle)
        if (resSearchVideoByKeyword !== null && resSearchVideoByKeyword.length > 0) {
            for (let a = 0; a < resSearchVideoByKeyword.length; ++a) {
                if (resSearchVideoByKeyword[a].snippet !== undefined && resSearchVideoByKeyword[a].snippet.title === currVideoTitle) {
                    var end = performance.now()
                    console.log("Search done. Time required", (end - start))

                    clearInterval(search)
                    break
                }
            }
        }
    }, 1000)
}

function searchVideoById(id) {
    Youtube.videos.list({
        part: "snippet,contentDetails,statistics",
        id: id
    }, (err, data) => {
        if (err) return console.log(err)
        console.log(data)
    })
}

// https://developers.google.com/youtube/v3/docs/search/list
function searchVideoByKeyword(word) {
    Youtube.search.list({
        part: ["id,snippet"],
        maxResults: 5,
        q: word
    }, (err, data) => {
        if (err) return console.log(err)
        resSearchVideoByKeyword = data.items
    })
}

function liveStreaming() {
    let title = randomStringGen(20)
    Youtube.liveBroadcasts.insert({
        part: ["id,snippet,status"],
        resource: {
            snippet: {
                title: title,
                scheduledStartTime: '2020-06-11T10:21:00.0Z'
            },
            status: {
                privacyStatus: "public",
            }
        },
    }, (err, liveBroadcast) => {
        if (err) return console.log(err)

        currVideoId = liveBroadcast.id
        currVideoTitle = title
        loopSearchVideoByKeyword()

        /*Youtube.liveStreams.insert({
            part: ["id,snippet,cdn"],
            resource: {
                snippet: {
                    title: "test livestream",
                },
                cdn: {
                    frameRate: "30fps",
                    ingestionType: "rtmp",
                    resolution: "1080p",
                }
            },
            media: {
                body: fs.createReadStream("video.mp4")
            }
        }, (err, liveStreams) => {
            if (err) return console.log(err)
            console.log("liveStreams", liveStreams)
    

            Youtube.liveBroadcasts.bind({
                id: liveBroadcast.id,
                part: ["id,snippet"],
                streamId: liveStreams.id
            }, (err, data) => {
                if (err) return console.log(err)
                console.log("bind", data)
            })

        })*/
    })
}

app.listen(5000, () => {
    console.log("listening on http://localhost:5000")
})

let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: CREDENTIALS.web.redirect_uris[0]
})

// opn(oauth.generateAuthUrl({
//     access_type: "offline",
//     scope: ["https://www.googleapis.com/auth/youtube.upload",
//         "https://www.googleapis.com/auth/youtube"]
// }))