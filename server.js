const express = require("express")
const http = require("http")
const app = express()

var server = http.createServer(app)
var io = require("socket.io")(server)

const MeasureUploadGoLiveDelay = require("./server/measure_upload_go_live_delay.js")

io.on("connection", function (socket) {
	socket.on("upload-video", () => {
		new MeasureUploadGoLiveDelay().run(socket, true)
	})

	socket.on("disconnect", () => {})
})
