const express = require("express")
const http = require("http")
const app = express()

var server = http.createServer(app)
var io = require("socket.io")(server)

const MeasureUploadGoLiveDelay = require("./server/measure_upload_go_live_delay.js")
const MeasureUploadAndUpdateDelay = require("./server/measure_upload_and_update_delay.js")

const headless = process.env.HEADLESS || false

io.on("connection", function (socket) {
	socket.on("upload-video", () => {
		new MeasureUploadGoLiveDelay().run(socket, headless)
	})

	socket.on("upload-video-and-update", () => {
		new MeasureUploadAndUpdateDelay().run(socket, headless)
	})

	socket.on("disconnect", () => {})
})
