const fs = require('fs')
const express = require('express')
const http = require('http')
var cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const readJson = require("r-json");
const path = require("path");
const Youtube = require("youtube-api");

const CREDENTIALS = readJson(`${__dirname}/credentials.json`)

var server = http.createServer(app);
var io = require('socket.io')(server);

app.use(cors())
app.use(bodyParser.json())

if(process.env.NODE_ENV === 'production'){
	app.use(express.static(__dirname+"/server/build"))
	app.get("*", (req, res, next) => {
		res.sendFile(path.join(__dirname+"/server/build/index.html"))
	})
}
app.set('port', (process.env.PORT || 9001))


function randomStringGen(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

var authentications = Youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: process.env.NODE_ENV === 'production' ? CREDENTIALS.web.redirect_uris[0] : CREDENTIALS.web.redirect_uris[1]
})

app.post("/token", (req, res) => {
    let token = req.body.token
    authentications.getToken(token, (err, tokens) => {
        if (err) return console.log(err)
        console.log("credential set")
        authentications.setCredentials(tokens)
        res.send({})
    })
})


io.on('connection', function(socket){
    socket.on('my-videos', () => {
        Youtube.channels.list({
            part: 'snippet,contentDetails,statistics',
            mine: true
        }, (err, channel) => {
            if (err) return console.log(err)
            const playlistId = channel.items[0].contentDetails.relatedPlaylists.uploads
            
            Youtube.playlistItems.list({
                playlistId: playlistId,
                part: 'snippet',
                maxResults: 10
            }, (err, data) => {
                if (err) return console.log(err)
                socket.emit("my-videos", data.items)
            })
        })
    })

    socket.on('upload-video', () => {
        let title = randomStringGen(20)
        Youtube.videos.insert({
            resource: {
                snippet: {
                    title: title,
                    description: title
                },
                status: {
                    privacyStatus: "public"
                }
            },
            part: "id,snippet,status",
            media: {
                body: fs.createReadStream("video.mp4") // TODO crea video random
            }
        }, (err, data) => {
            if (err) return console.log(err)

            socket.emit("upload-video-server", title)
        })
    })

    socket.on('search', (title, privacyStatus) => {
        // myPuppeteer.searchByCountries(socket, title, 50, privacyStatus === "public")
    })

    socket.on('save-and-search', (title, privacyStatus, idVideo) => {
        Youtube.videos.update({
            part: ["snippet,status"],
            resource: {
                id: idVideo,
                snippet: {
                    categoryId: 22,
                    title: title,
                    description: title,
                },
                status: {
                    privacyStatus: privacyStatus // "public", "private"
                },
            }
        }, (err, data) => {
            if (err) return console.log(err)

            // myPuppeteer.searchByCountries(socket, title, 50, privacyStatus === "public")
        })
	})
    
	socket.on('disconnect', () => {
		
	})
});


server.listen(app.get('port'), () => {
	console.log("listening on", app.get('port'))
})