const fs = require('fs')
const express = require('express')
const http = require('http')
var cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const readJson = require("r-json");
const path = require("path");
const Youtube = require("youtube-api");
const {spawn} = require('child_process');

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

const MeasureUploadGoLiveDelay = require("./server-requests/measure_upload_go_live_delay.js")

io.on('connection', function(socket){

    socket.on('upload-video', () => {
        new MeasureUploadGoLiveDelay().run(socket);
    })

    socket.on('search', (title, privacyStatus) => {
        // myPuppeteer.searchByCountries(socket, title, 50, privacyStatus === "public")
    })
    
	socket.on('disconnect', () => {
		
	})
});


server.listen(app.get('port'), () => {
	console.log("listening on", app.get('port'))
})